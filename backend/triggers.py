"""
Parametric Trigger Polling Engine for GigGuard.

Every 15 minutes (called from scheduler.tick()), this module:
  1. Fetches live weather/AQI for all active worker cities
  2. Fetches live traffic TTI (TomTom) for all cities
  3. Evaluates curfew/unrest risk (GDELT + NLP) for all cities
  4. Evaluates each trigger via the FUZZY SEVERITY ENGINE directly
     (not boolean ON/OFF flags) so partial disruptions produce
     proportional payouts, eliminating basis risk.
  5. If fuzzy severity ≥ MIN_SEVERITY_THRESHOLD → creates a disruption_event
  6. For each disruption → auto-initiates claims for affected workers

Fuzzy Calibration (entry → ceiling):
  T-01: Heavy Rainfall       — 20mm  → 100mm  (combined rain signal)
  T-02: Extreme Heat         — 39.5°C → 45°C
  T-03: Severe AQI           — 300   → 450    (India NAQI scale)
  T-04: Flood Risk           — 64.5mm → 150mm (rain_3h)
  T-05: Traffic Congestion   — TTI 2.5 → 3.5  (+ consecutive-cycle gate)
  T-06: Curfew / Unrest      — 0.80  → 0.95   (GDELT+NLP confidence)
"""

import logging
import uuid
import asyncio
from datetime import date, datetime

from db import supabase, PLATFORM_TABLES
from ml.weather import fetch_weather
from ml.traffic import fetch_traffic_tti
from ml.curfew import evaluate_curfew_risk
from claims import (
    get_worker_daily_wage,
    compute_payout,
    check_cross_platform_activity,
)
from gps import validate_gps_proximity
from ml.fraud_model import build_fraud_features, compute_fraud_score
from fuzzy import compute_trigger_severity

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Fuzzy-first evaluation threshold
# ---------------------------------------------------------------------------
# Minimum fuzzy severity score to fire a trigger and create a disruption event.
# Below this threshold, the disruption is too minor to warrant claim processing.
# Set to 0.10 (10%) to filter out trivial environmental noise.
MIN_SEVERITY_THRESHOLD = 0.10


# ---------------------------------------------------------------------------
# T-05 consecutive-cycle state tracking
# ---------------------------------------------------------------------------
# Stores the previous cycle's TTI per city.  T-05 only fires when TTI > 2.5
# for 2 CONSECUTIVE 15-minute polling cycles.
# Key: city name → previous cycle TTI (float)
_previous_tti: dict[str, float] = {}


# ---------------------------------------------------------------------------
# Trigger rule definitions
# ---------------------------------------------------------------------------

# T-05 check needs the previous TTI, which is injected at poll-time
def _check_traffic(ctx: dict) -> bool:
    """T-05 fires if TTI > 2.5 for 2 consecutive cycles."""
    current_tti = ctx.get("tti", 1.0)
    prev_tti = ctx.get("_prev_tti", 1.0)
    return current_tti > 2.5 and prev_tti > 2.5


def _check_curfew(ctx: dict) -> bool:
    """T-06 fires if combined GDELT+NLP confidence ≥ 0.8."""
    return ctx.get("curfew_confidence", 0.0) >= 0.8


TRIGGER_RULES: list[dict] = [
    {
        "trigger_id": "T-01",
        "trigger_type": "heavy_rain",
        "description": "Heavy Rainfall — Red Alert threshold",
        "check": lambda w: w.get("is_heavy_rain", False),
        "severity": lambda w: "extreme" if w.get("rain_3h", 0) > 100 else "severe",
    },
    {
        "trigger_id": "T-02",
        "trigger_type": "extreme_heat",
        "description": "Extreme Heat — temperature > 45°C",
        "check": lambda w: w.get("is_extreme_heat", False),
        "severity": lambda _: "severe",
    },
    {
        "trigger_id": "T-03",
        "trigger_type": "severe_aqi",
        "description": "Severe Air Pollution — AQI ≥ 400",
        "check": lambda w: w.get("is_severe_aqi", False),
        "severity": lambda w: "extreme" if w.get("aqi_index", 0) >= 450 else "severe",
    },
    {
        "trigger_id": "T-04",
        "trigger_type": "flood",
        "description": "Flood / Waterlogging — rain_3h > 100mm",
        "check": lambda w: w.get("is_flood_risk", False),
        "severity": lambda _: "extreme",
    },
    {
        "trigger_id": "T-05",
        "trigger_type": "traffic_congestion",
        "description": "Severe Traffic Congestion — TTI > 2.5 for 2 consecutive cycles",
        "check": _check_traffic,
        "severity": lambda w: "extreme" if w.get("tti", 1.0) > 3.5 else "severe",
    },
    {
        "trigger_id": "T-06",
        "trigger_type": "curfew",
        "description": "Curfew / Civil Unrest — GDELT + NLP confidence ≥ 0.8",
        "check": _check_curfew,
        "severity": lambda w: "extreme" if w.get("curfew_confidence", 0) >= 0.95 else "severe",
    },
]

# Cities to monitor (same as weather.py active set)
MONITORED_CITIES = ["Chennai", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune"]


# ---------------------------------------------------------------------------
# Main polling function
# ---------------------------------------------------------------------------

async def poll_triggers() -> dict:
    """Poll weather, traffic, and curfew data for all cities and evaluate trigger rules.

    Returns a summary dict: {city: [list of fired trigger_ids]}
    """
    logger.info("[triggers] Polling weather, traffic & curfew for %d cities...", len(MONITORED_CITIES))
    today = date.today().isoformat()
    summary: dict[str, list[str]] = {}

    for city in MONITORED_CITIES:
        # --- Gather all data sources concurrently ---
        # curfew_task is wrapped in wait_for so a slow NLP run (model loading,
        # large RSS feed) can't stall the entire polling loop indefinitely.
        weather_task = asyncio.to_thread(fetch_weather, city)
        traffic_task = fetch_traffic_tti(city)
        curfew_task = asyncio.wait_for(evaluate_curfew_risk(city), timeout=60.0)

        weather, traffic, curfew = await asyncio.gather(
            weather_task, traffic_task, curfew_task,
            return_exceptions=True,
        )

        # Safe fallbacks if any gather branch raised
        if isinstance(weather, Exception):
            logger.error("[triggers] Weather fetch failed for %s: %s", city, weather)
            weather = {}
        if isinstance(traffic, Exception):
            logger.error("[triggers] Traffic fetch failed for %s: %s", city, traffic)
            traffic = {"tti": 1.0, "current_speed_kmh": 30.0}
        if isinstance(curfew, Exception):
            logger.error("[triggers] Curfew eval failed for %s: %s", city, curfew)
            curfew = {"confidence": 0.0}

        # --- Build unified context dict for trigger checks ---
        current_tti = traffic.get("tti", 1.0)
        prev_tti = _previous_tti.get(city, 1.0)

        ctx = {
            **weather,
            # Traffic fields
            "tti": current_tti,
            "_prev_tti": prev_tti,
            "current_speed_kmh": traffic.get("current_speed_kmh", 30.0),
            "free_flow_speed_kmh": traffic.get("free_flow_speed_kmh", 30.0),
            # Curfew fields
            "curfew_confidence": curfew.get("confidence", 0.0),
            "curfew_gdelt_events": curfew.get("gdelt_events", 0),
            "curfew_nlp_label": curfew.get("nlp_label", "none"),
        }

        # --- Persist TTI to history table and update state ---
        try:
            await asyncio.to_thread(
                _store_tti_history, city, current_tti,
                traffic.get("current_speed_kmh", 0),
                traffic.get("free_flow_speed_kmh", 0),
            )
        except Exception as exc:
            logger.warning("[triggers] Failed to store TTI history for %s: %s", city, exc)

        # Update the previous-cycle state for next poll
        _previous_tti[city] = current_tti

        # --- Evaluate all triggers via FUZZY SEVERITY ENGINE ---
        # Instead of boolean ON/OFF flags, we compute the fuzzy severity
        # score directly from calibration ranges.  This ensures partial
        # disruptions (e.g. AQI 390 → 60%, rain_3h 80mm → 18%) produce
        # proportional payouts rather than being silently ignored.
        fired: list[str] = []

        for rule in TRIGGER_RULES:
            try:
                trigger_id = rule["trigger_id"]

                # T-05 SPECIAL CASE: Traffic congestion must persist for
                # 2 consecutive 15-min polling cycles before we evaluate.
                # This prevents brief spikes from triggering payouts.
                if trigger_id == "T-05":
                    current_tti_val = ctx.get("tti", 1.0)
                    prev_tti_val = ctx.get("_prev_tti", 1.0)
                    if not (current_tti_val > 2.5 and prev_tti_val > 2.5):
                        continue  # Not consecutive — skip T-05 entirely

                # Compute fuzzy severity directly from calibration ranges
                severity_label, severity_score = compute_trigger_severity(
                    trigger_id, ctx
                )

                # Skip if severity is below the minimum actionable threshold
                if severity_score < MIN_SEVERITY_THRESHOLD:
                    continue

                logger.warning(
                    "[triggers] %s FIRED in %s — %s (fuzzy_severity=%.2f, label=%s)",
                    trigger_id,
                    city,
                    rule["description"],
                    severity_score,
                    severity_label,
                )

                # Upsert disruption event (idempotent per trigger+city+date)
                event_id = await asyncio.to_thread(
                    _upsert_disruption_event,
                    city, weather, rule, today, severity_label, severity_score,
                )

                if event_id:
                    # Auto-create claims for all workers in this city
                    await asyncio.to_thread(
                        _auto_create_claims,
                        event_id, city, rule, today, severity_score,
                    )
                    fired.append(trigger_id)

            except Exception as exc:
                logger.error(
                    "[triggers] Error evaluating %s for %s: %s",
                    rule["trigger_id"], city, exc,
                )

        if fired:
            summary[city] = fired

    if summary:
        logger.info("[triggers] Disruptions detected: %s", summary)
    else:
        logger.info("[triggers] No disruptions detected this cycle.")

    return summary


# ---------------------------------------------------------------------------
# TTI history persistence
# ---------------------------------------------------------------------------

def _store_tti_history(
    city: str, tti: float, current_speed: float, free_flow_speed: float
) -> None:
    """Insert a row into traffic_tti_history for audit/consecutive-cycle logic."""
    try:
        supabase.table("traffic_tti_history").insert({
            "city": city,
            "tti_value": round(tti, 4),
            "current_speed": round(current_speed, 1),
            "free_flow_speed": round(free_flow_speed, 1),
        }).execute()
    except Exception as exc:
        logger.warning("[triggers] TTI history insert failed for %s: %s", city, exc)


# ---------------------------------------------------------------------------
# Disruption event creation
# ---------------------------------------------------------------------------

def _upsert_disruption_event(
    city: str,
    ctx: dict,
    rule: dict,
    event_date: str,
    severity_label: str = "severe",
    severity_score: float = 1.0,
) -> str | None:
    """Insert a disruption event row. Returns the event UUID, or None on duplicate."""
    payload = {
        "trigger_id": rule["trigger_id"],
        "trigger_type": rule["trigger_type"],
        "city": city,
        "severity": severity_label,
        "severity_score": severity_score,
        "description": rule["description"],
        "temperature": ctx.get("temperature"),
        "rain_1h": ctx.get("rain_1h"),
        "rain_3h": ctx.get("rain_3h"),
        "aqi_index": ctx.get("aqi_index"),
        "wind_speed": ctx.get("wind_speed"),
        # Phase 3 columns
        "tti_value": ctx.get("tti"),
        "current_speed_kmh": ctx.get("current_speed_kmh"),
        "curfew_confidence": ctx.get("curfew_confidence"),
        "curfew_source": ctx.get("curfew_nlp_label"),
        "status": "active",
        "event_date": event_date,
    }

    try:
        resp = (
            supabase.table("disruption_events")
            .upsert(payload, on_conflict="trigger_id,city,event_date")
            .execute()
        )
        if resp.data:
            event_id = resp.data[0]["id"]
            logger.info(
                "[triggers] Disruption event upserted: %s in %s (id=%s)",
                rule["trigger_id"], city, event_id,
            )
            return event_id
    except Exception as exc:
        logger.error("[triggers] Failed to upsert disruption event: %s", exc)

    return None


# ---------------------------------------------------------------------------
# Auto-claim creation
# ---------------------------------------------------------------------------

def _auto_create_claims(
    event_id: str,
    city: str,
    rule: dict,
    event_date: str,
    severity_score: float = 1.0,
) -> int:
    """Create claims for all workers in the disrupted city.

    Returns the number of claims created.
    """
    claims_created = 0

    # Find all unique workers in this city across all platform tables
    workers = _get_workers_in_city(city, event_date)
    logger.info(
        "[triggers] Found %d workers in %s for auto-claim processing.",
        len(workers), city,
    )

    for worker in workers:
        worker_id = worker["worker_id"]
        platform = worker["platform"]

        try:
            # Cross-platform inactivity check
            cross_clear = check_cross_platform_activity(worker_id, event_date)

            # If the worker was actively delivering during the disruption,
            # they did not lose income — skip claim entirely (no payout warranted)
            if not cross_clear:
                logger.info(
                    "[triggers] Worker %s had activity during disruption in %s — claim skipped.",
                    worker_id, city,
                )
                continue

            # GPS verification
            gps_res = validate_gps_proximity(worker_id, city)
            gps_verified = gps_res["verified"]

            # Compute payout scaled by fuzzy severity multiplier
            daily_wage = get_worker_daily_wage(worker_id, days=7)
            disrupted_hours = 6.0  # default assumption

            # T-06 Curfew: hard-cap payout at daily_wage * 0.50
            if rule["trigger_id"] == "T-06":
                payout = round(min(daily_wage * 0.50, daily_wage * 0.50), 2)
            else:
                payout = compute_payout(daily_wage, disrupted_hours, severity_score)

            # ML Fraud scoring
            fraud_features = build_fraud_features(
                worker_id=worker_id,
                city=city,
                payout_amount=payout,
                daily_wage=daily_wage,
                cross_platform_clear=cross_clear,
                gps_verified=gps_verified,
                supabase_client=supabase,
                trigger_type=rule["trigger_type"],
            )
            fraud_score, fraud_flags = compute_fraud_score(
                fraud_features, trigger_type=rule["trigger_type"]
            )

            # Determine claim status based on fraud score
            status = "auto_initiated" if fraud_score < 0.75 else "under_review"
            payout_status = "approved" if fraud_score < 0.75 else "pending"

            claim_number = _generate_claim_number(event_date)

            claim_payload = {
                "claim_number": claim_number,
                "worker_id": worker_id,
                "platform": platform,
                "city": city,
                "disruption_event_id": event_id,
                "trigger_id": rule["trigger_id"],
                "trigger_type": rule["trigger_type"],
                "payout_amount": payout,
                "daily_wage_est": daily_wage,
                "disrupted_hours": disrupted_hours,
                "fuzzy_payout_multiplier": severity_score,
                "payout_status": payout_status,
                "fraud_score": fraud_score,
                "fraud_flags": fraud_flags,
                "gps_verified": gps_verified,
                "cross_platform_clear": cross_clear,
                "status": status,
            }

            # Upsert (idempotent: unique on worker_id + disruption_event_id)
            supabase.table("claims").upsert(
                claim_payload, on_conflict="worker_id,disruption_event_id"
            ).execute()

            claims_created += 1

        except Exception as exc:
            logger.error(
                "[triggers] Failed to create claim for worker %s: %s",
                worker_id, exc,
            )

    logger.info(
        "[triggers] Created/updated %d claims for event %s in %s.",
        claims_created, event_id, city,
    )
    return claims_created


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_workers_in_city(city: str, event_date: str) -> list[dict]:
    """Get all unique workers in a given city from today's data."""
    seen: set[str] = set()
    workers: list[dict] = []

    for table in PLATFORM_TABLES:
        try:
            resp = (
                supabase.table(table)
                .select("worker_id, platform, city")
                .eq("city", city)
                .eq("date", event_date)
                .limit(500)
                .execute()
            )
            for row in resp.data:
                wid = row["worker_id"]
                if wid not in seen:
                    seen.add(wid)
                    workers.append(row)
        except Exception:
            pass

    return workers


_claim_counter = 0

def _generate_claim_number(event_date: str) -> str:
    """Generate a human-readable claim number like CLM-20260403-a1b2c3."""
    global _claim_counter
    _claim_counter += 1
    date_part = event_date.replace("-", "")
    short_uuid = uuid.uuid4().hex[:6]
    return f"CLM-{date_part}-{short_uuid}"


# ---------------------------------------------------------------------------
# Test-fire function (for manual testing without real weather events)
# ---------------------------------------------------------------------------

def test_fire_trigger(city: str = "Chennai", trigger_id: str = "T-01") -> dict:
    """Manually fire a trigger for testing purposes.

    Creates a fake disruption event and auto-generates claims for workers in that city.
    """
    today = date.today().isoformat()

    rule = next((r for r in TRIGGER_RULES if r["trigger_id"] == trigger_id), None)
    if not rule:
        return {"error": f"Unknown trigger_id: {trigger_id}"}

    # Create a fake context snapshot with the trigger condition met
    fake_ctx = {
        "temperature": 46.0 if trigger_id == "T-02" else 32.0,
        "rain_1h": 25.0 if trigger_id in ("T-01", "T-04") else 0.0,
        "rain_3h": 70.0 if trigger_id == "T-01" else (120.0 if trigger_id == "T-04" else 0.0),
        "aqi_index": 450 if trigger_id == "T-03" else 80,
        "wind_speed": 15.0,
        "is_heavy_rain": trigger_id == "T-01",
        "is_extreme_heat": trigger_id == "T-02",
        "is_severe_aqi": trigger_id == "T-03",
        "is_flood_risk": trigger_id == "T-04",
        # T-05 Traffic: fake consecutive high TTI
        "tti": 3.2 if trigger_id == "T-05" else 1.0,
        "_prev_tti": 2.8 if trigger_id == "T-05" else 1.0,
        "current_speed_kmh": 8.0 if trigger_id == "T-05" else 30.0,
        "free_flow_speed_kmh": 30.0,
        # T-06 Curfew: fake high confidence
        "curfew_confidence": 0.92 if trigger_id == "T-06" else 0.0,
        "curfew_nlp_label": "section 144" if trigger_id == "T-06" else "none",
        "curfew_gdelt_events": 4 if trigger_id == "T-06" else 0,
    }

    event_id = _upsert_disruption_event(city, fake_ctx, rule, today)
    claims_count = 0
    if event_id:
        claims_count = _auto_create_claims(event_id, city, rule, today)

    return {
        "status": "fired",
        "trigger_id": trigger_id,
        "city": city,
        "event_id": event_id,
        "claims_created": claims_count,
    }


def get_trigger_status() -> dict:
    """Get current weather + traffic + curfew trigger evaluation for all monitored cities.

    Note: This is a synchronous endpoint.  Traffic and curfew data is pulled
    from cache (populated by the last poll_triggers() cycle) when available.
    Weather is fetched live (it has its own 5-min cache).
    """
    results: dict[str, dict] = {}

    for city in MONITORED_CITIES:
        weather = fetch_weather(city)

        # Pull cached traffic/curfew — no async calls here to keep it sync-safe
        from ml.traffic import _traffic_cache
        traffic = {}
        if city in _traffic_cache:
            _, traffic = _traffic_cache[city]

        from ml.curfew import _gdelt_cache
        curfew_events = 0
        if city in _gdelt_cache:
            _, events = _gdelt_cache[city]
            curfew_events = len(events)

        current_tti = traffic.get("tti", 1.0)
        prev_tti = _previous_tti.get(city, 1.0)

        # Build context
        ctx = {
            **weather,
            "tti": current_tti,
            "_prev_tti": prev_tti,
            "current_speed_kmh": traffic.get("current_speed_kmh", 30.0),
            "curfew_confidence": 0.0,  # not re-evaluated in sync call
            "curfew_gdelt_events": curfew_events,
        }

        triggered = []
        for rule in TRIGGER_RULES:
            trigger_id = rule["trigger_id"]

            # T-05: require consecutive high TTI
            if trigger_id == "T-05":
                if not (current_tti > 2.5 and prev_tti > 2.5):
                    continue

            severity_label, severity_score = compute_trigger_severity(
                trigger_id, ctx
            )

            if severity_score < MIN_SEVERITY_THRESHOLD:
                continue

            triggered.append({
                "trigger_id": trigger_id,
                "trigger_type": rule["trigger_type"],
                "description": rule["description"],
                "severity": severity_label,
                "severity_score": severity_score,
                "payout_multiplier_pct": round(severity_score * 100, 1),
            })

        results[city] = {
            "weather": weather,
            "traffic": {
                "tti": current_tti,
                "current_speed_kmh": traffic.get("current_speed_kmh", 30.0),
                "free_flow_speed_kmh": traffic.get("free_flow_speed_kmh", 30.0),
            },
            "curfew": {
                "gdelt_events": curfew_events,
            },
            "triggers_fired": triggered,
            "has_active_disruption": len(triggered) > 0,
        }

    return results
