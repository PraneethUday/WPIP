"""
Parametric Trigger Polling Engine for GigGuard.

Every 15 minutes (called from scheduler.tick()), this module:
  1. Fetches live weather/AQI for all active worker cities
  2. Evaluates each trigger rule against the data
  3. If a threshold is breached → creates a disruption_event
  4. For each disruption → auto-initiates claims for affected workers

Trigger Rules (from README):
  T-01: Heavy Rainfall   — rain_1h > 20mm OR rain_3h > 64.5mm
  T-02: Extreme Heat      — temperature > 45°C
  T-03: Severe AQI        — AQI index ≥ 400 (Severe)
  T-04: Flood Risk        — rain_3h > 100mm
  T-05: Curfew (stub)     — placeholder for government feed integration
"""

import logging
import uuid
import asyncio
from datetime import date, datetime

from db import supabase, PLATFORM_TABLES
from ml.weather import fetch_weather
from claims import (
    get_worker_daily_wage,
    compute_payout,
    check_cross_platform_activity,
)
from gps import validate_gps_proximity
from ml.fraud_model import build_fraud_features, compute_fraud_score

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Trigger rule definitions
# ---------------------------------------------------------------------------

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
        "trigger_type": "curfew",
        "description": "Curfew / Section 144 — government advisory",
        "check": lambda _: False,  # stub — will integrate news/govt feed later
        "severity": lambda _: "severe",
    },
]

# Cities to monitor (same as weather.py active set)
MONITORED_CITIES = ["Chennai", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune"]


# ---------------------------------------------------------------------------
# Main polling function
# ---------------------------------------------------------------------------

async def poll_triggers() -> dict:
    """Poll weather for all cities and evaluate trigger rules.

    Returns a summary dict: {city: [list of fired trigger_ids]}
    """
    logger.info("[triggers] Polling weather for %d cities...", len(MONITORED_CITIES))
    today = date.today().isoformat()
    summary: dict[str, list[str]] = {}

    for city in MONITORED_CITIES:
        weather = await asyncio.to_thread(fetch_weather, city)
        fired: list[str] = []

        for rule in TRIGGER_RULES:
            try:
                if rule["check"](weather):
                    logger.warning(
                        "[triggers] 🚨 %s FIRED in %s — %s",
                        rule["trigger_id"],
                        city,
                        rule["description"],
                    )

                    # Upsert disruption event (idempotent per trigger+city+date)
                    event_id = _upsert_disruption_event(city, weather, rule, today)

                    if event_id:
                        # Auto-create claims for all workers in this city
                        _auto_create_claims(event_id, city, rule, today)
                        fired.append(rule["trigger_id"])

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
# Disruption event creation
# ---------------------------------------------------------------------------

def _upsert_disruption_event(
    city: str, weather: dict, rule: dict, event_date: str
) -> str | None:
    """Insert a disruption event row. Returns the event UUID, or None on duplicate."""
    severity = rule["severity"](weather)

    payload = {
        "trigger_id": rule["trigger_id"],
        "trigger_type": rule["trigger_type"],
        "city": city,
        "severity": severity,
        "description": rule["description"],
        "temperature": weather.get("temperature"),
        "rain_1h": weather.get("rain_1h"),
        "rain_3h": weather.get("rain_3h"),
        "aqi_index": weather.get("aqi_index"),
        "wind_speed": weather.get("wind_speed"),
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
    event_id: str, city: str, rule: dict, event_date: str
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

            # GPS verification
            gps_res = validate_gps_proximity(worker_id, city)
            gps_verified = gps_res["verified"]

            # Compute payout
            daily_wage = get_worker_daily_wage(worker_id, days=7)
            disrupted_hours = 6.0  # default assumption
            payout = compute_payout(daily_wage, disrupted_hours)

            # ML Fraud scoring
            fraud_features = build_fraud_features(
                worker_id=worker_id,
                city=city,
                payout_amount=payout,
                daily_wage=daily_wage,
                cross_platform_clear=cross_clear,
                gps_verified=gps_verified,
                supabase_client=supabase,
            )
            fraud_score, fraud_flags = compute_fraud_score(fraud_features)

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

    # Create a fake weather snapshot with the trigger condition met
    fake_weather = {
        "temperature": 46.0 if trigger_id == "T-02" else 32.0,
        "rain_1h": 25.0 if trigger_id in ("T-01", "T-04") else 0.0,
        "rain_3h": 70.0 if trigger_id == "T-01" else (120.0 if trigger_id == "T-04" else 0.0),
        "aqi_index": 450 if trigger_id == "T-03" else 80,
        "wind_speed": 15.0,
        "is_heavy_rain": trigger_id == "T-01",
        "is_extreme_heat": trigger_id == "T-02",
        "is_severe_aqi": trigger_id == "T-03",
        "is_flood_risk": trigger_id == "T-04",
    }

    event_id = _upsert_disruption_event(city, fake_weather, rule, today)
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
    """Get current weather + trigger evaluation for all monitored cities."""
    results: dict[str, dict] = {}

    for city in MONITORED_CITIES:
        weather = fetch_weather(city)

        triggered = []
        for rule in TRIGGER_RULES:
            if rule["check"](weather):
                triggered.append({
                    "trigger_id": rule["trigger_id"],
                    "trigger_type": rule["trigger_type"],
                    "description": rule["description"],
                    "severity": rule["severity"](weather),
                })

        results[city] = {
            "weather": weather,
            "triggers_fired": triggered,
            "has_active_disruption": len(triggered) > 0,
        }

    return results
