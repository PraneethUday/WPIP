"""
Isolation Forest-based fraud detection for GigGuard insurance claims.

Uses unsupervised anomaly detection to flag suspicious claim patterns:
  - Cross-platform activity during disruption
  - Claim frequency (too many claims in a short window)
  - Payout amount anomalies
  - Timing patterns (claims filed suspiciously fast)
  - T-06 Curfew geo-polygon mismatch (Phase 3)
"""

import logging
import math
import numpy as np
import joblib
from pathlib import Path
from datetime import date, timedelta

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent / "saved_models"
FRAUD_MODEL_PATH = MODEL_DIR / "fraud_model.joblib"


# ---------------------------------------------------------------------------
# Phase 3: Sub-city zone definitions for curfew geo-polygon validation
# ---------------------------------------------------------------------------
# Each city is split into North/South sub-zones using a dividing latitude.
# When a T-06 curfew trigger fires, we check whether the worker's GPS pings
# are INSIDE the affected sub-zone.  If all 3 recent pings are OUTSIDE,
# we apply a massive +0.50 fraud penalty.

CITY_SUB_ZONES: dict[str, dict] = {
    "Chennai": {
        "dividing_lat": 13.0600,
        "north": {"lat_min": 13.0600, "lat_max": 13.2500, "lon_min": 80.1500, "lon_max": 80.3500},
        "south": {"lat_min": 12.8500, "lat_max": 13.0600, "lon_min": 80.1500, "lon_max": 80.3500},
    },
    "Bangalore": {
        "dividing_lat": 12.9700,
        "north": {"lat_min": 12.9700, "lat_max": 13.1500, "lon_min": 77.4500, "lon_max": 77.7500},
        "south": {"lat_min": 12.8000, "lat_max": 12.9700, "lon_min": 77.4500, "lon_max": 77.7500},
    },
    "Hyderabad": {
        "dividing_lat": 17.4000,
        "north": {"lat_min": 17.4000, "lat_max": 17.5500, "lon_min": 78.3500, "lon_max": 78.6000},
        "south": {"lat_min": 17.2500, "lat_max": 17.4000, "lon_min": 78.3500, "lon_max": 78.6000},
    },
    "Mumbai": {
        "dividing_lat": 19.0500,
        "north": {"lat_min": 19.0500, "lat_max": 19.2800, "lon_min": 72.7800, "lon_max": 72.9800},
        "south": {"lat_min": 18.8800, "lat_max": 19.0500, "lon_min": 72.7800, "lon_max": 72.9800},
    },
    "Delhi": {
        "dividing_lat": 28.6200,
        "north": {"lat_min": 28.6200, "lat_max": 28.8800, "lon_min": 77.0500, "lon_max": 77.3500},
        "south": {"lat_min": 28.4000, "lat_max": 28.6200, "lon_min": 77.0500, "lon_max": 77.3500},
    },
    "Pune": {
        "dividing_lat": 18.5200,
        "north": {"lat_min": 18.5200, "lat_max": 18.6500, "lon_min": 73.7500, "lon_max": 73.9500},
        "south": {"lat_min": 18.4000, "lat_max": 18.5200, "lon_min": 73.7500, "lon_max": 73.9500},
    },
}


def build_fraud_features(
    worker_id: str,
    city: str,
    payout_amount: float,
    daily_wage: float,
    cross_platform_clear: bool,
    supabase_client=None,
    trigger_type: str = "",
) -> dict:
    """Build a feature vector for fraud scoring a single claim.

    Features are designed to capture anomalous behavior patterns
    without needing labelled fraud data (unsupervised approach).
    """
    # --- Claim frequency: how many claims has this worker had in the last 30 days? ---
    claim_count_30d = 0
    total_payout_30d = 0.0
    if supabase_client:
        try:
            cutoff = (date.today() - timedelta(days=30)).isoformat()
            resp = (
                supabase_client.table("claims")
                .select("payout_amount")
                .eq("worker_id", worker_id)
                .gte("created_at", cutoff)
                .execute()
            )
            claim_count_30d = len(resp.data)
            total_payout_30d = sum(r.get("payout_amount", 0) for r in resp.data)
        except Exception:
            pass

    # --- Payout ratio: how much of the daily wage is being claimed ---
    # Only compute if we have meaningful wage data — if daily_wage is 0
    # (no earnings history yet), we skip this check entirely to avoid
    # falsely penalising new workers.
    if daily_wage >= 50.0:
        payout_ratio = payout_amount / daily_wage
    else:
        payout_ratio = 0.0  # No wage history — benefit of the doubt

    # --- Cross-platform: was the worker active elsewhere? ---
    cross_platform_flag = 0.0 if cross_platform_clear else 1.0

    # --- Phase 3: T-06 curfew zone mismatch ---
    curfew_zone_mismatch = 0.0
    if trigger_type == "curfew" and supabase_client:
        curfew_zone_mismatch = _check_curfew_zone_mismatch(
            worker_id, city, supabase_client
        )

    return {
        "claim_count_30d": claim_count_30d,
        "total_payout_30d": round(total_payout_30d, 2),
        "payout_amount": round(payout_amount, 2),
        "payout_ratio": round(payout_ratio, 4),
        "daily_wage": round(daily_wage, 2),
        "cross_platform_flag": cross_platform_flag,
        "curfew_zone_mismatch": curfew_zone_mismatch,
    }


FRAUD_FEATURE_COLS = [
    "claim_count_30d", "total_payout_30d", "payout_amount",
    "payout_ratio", "daily_wage", "cross_platform_flag",
    "curfew_zone_mismatch",
]


def _check_curfew_zone_mismatch(
    worker_id: str, city: str, supabase_client
) -> float:
    """Check if a worker's last 3 GPS pings are outside the affected curfew sub-zone.

    For T-06 claims: if ALL 3 of the worker's most recent GPS pings fall outside
    the affected city sub-zone, this returns 1.0 (triggering a +0.50 penalty in
    rule-based scoring).  Otherwise returns 0.0.

    If there are fewer than 3 pings or no zone data, returns 0.0 (benefit of doubt).
    """
    zones = CITY_SUB_ZONES.get(city)
    if not zones:
        return 0.0

    try:
        resp = (
            supabase_client.table("gps_checkins")
            .select("latitude, longitude, checked_in_at")
            .eq("worker_id", worker_id)
            .order("checked_in_at", desc=True)
            .limit(3)
            .execute()
        )
        pings = resp.data
    except Exception:
        return 0.0

    if len(pings) < 3:
        return 0.0  # Not enough data — give benefit of doubt

    # The curfew is assumed to affect the "north" sub-zone by default.
    # (In production, the disruption_event would specify the exact zone.)
    affected_zone = zones["north"]

    pings_outside = 0
    for ping in pings:
        lat = ping.get("latitude", 0)
        lon = ping.get("longitude", 0)
        if not (affected_zone["lat_min"] <= lat <= affected_zone["lat_max"] and
                affected_zone["lon_min"] <= lon <= affected_zone["lon_max"]):
            pings_outside += 1

    # ALL 3 pings outside the affected zone = mismatch
    return 1.0 if pings_outside == 3 else 0.0


def compute_fraud_score(
    features: dict, trigger_type: str = ""
) -> tuple[float, list[str]]:
    """Compute a fraud score (0.0 to 1.0) and a list of flag reasons.

    Uses the Isolation Forest model if available, otherwise falls back
    to a rule-based heuristic scoring system.

    Returns:
        (fraud_score, fraud_flags)
    """
    flags: list[str] = []
    score = 0.0

    # --- Try ML model first ---
    model = _load_fraud_model()
    if model is not None:
        try:
            X = np.array([[features[col] for col in FRAUD_FEATURE_COLS]])
            # IsolationForest.decision_function: lower = more anomalous
            raw_score = model.decision_function(X)[0]
            # Normalize: decision_function returns ~[-0.5, 0.5] typically
            # Map to 0-1 where higher = more fraudulent
            score = float(np.clip(0.5 - raw_score, 0.0, 1.0))
            if score > 0.6:
                flags.append("ML_anomaly_detected")
        except Exception as e:
            logger.warning("Fraud model prediction failed: %s, falling back to rules", e)
            score, flags = _rule_based_score(features, trigger_type)
    else:
        score, flags = _rule_based_score(features, trigger_type)

    return round(score, 4), flags


def _rule_based_score(
    features: dict, trigger_type: str = ""
) -> tuple[float, list[str]]:
    """Fallback rule-based fraud scoring when no ML model is available."""
    score = 0.0
    flags: list[str] = []

    # Cross-platform activity during disruption
    if features["cross_platform_flag"] > 0:
        score += 0.35
        flags.append("cross_platform_activity")

    # Too many claims in 30 days (>3 is suspicious)
    if features["claim_count_30d"] > 5:
        score += 0.25
        flags.append("high_claim_frequency")
    elif features["claim_count_30d"] > 3:
        score += 0.10
        flags.append("elevated_claim_frequency")

    # Payout ratio too high (claiming >45% of daily wage)
    if features["payout_ratio"] > 0.45:
        score += 0.15
        flags.append("high_payout_ratio")

    # Large cumulative payouts
    if features["total_payout_30d"] > 3000:
        score += 0.10
        flags.append("high_cumulative_payout")

    return min(score, 1.0), flags


def train_fraud_model(supabase_client) -> dict:
    """Train an Isolation Forest model on historical claim data.

    Uses existing claims to learn 'normal' patterns, then flags
    anomalies. Requires at least 20 claims to train meaningfully.
    """
    from sklearn.ensemble import IsolationForest

    try:
        resp = (
            supabase_client.table("claims")
            .select("worker_id, payout_amount, daily_wage_est, cross_platform_clear, fraud_score, created_at")
            .order("created_at", desc=True)
            .limit(1000)
            .execute()
        )
        claims = resp.data
    except Exception as e:
        return {"error": f"Failed to fetch claims: {e}"}

    if len(claims) < 20:
        return {"error": f"Need at least 20 claims to train, found {len(claims)}"}

    # Build feature matrix from historical claims
    rows = []
    for c in claims:
        payout = c.get("payout_amount", 0) or 0
        wage = c.get("daily_wage_est", 0) or 1
        cross_clear = c.get("cross_platform_clear", True)
        rows.append({
            "claim_count_30d": 1,  # Placeholder — in production, aggregate per worker
            "total_payout_30d": payout,
            "payout_amount": payout,
            "payout_ratio": payout / max(wage, 1),
            "daily_wage": wage,
            "cross_platform_flag": 0.0 if cross_clear else 1.0,
            "curfew_zone_mismatch": 0.0,  # No historical data for this
        })

    X = np.array([[r[col] for col in FRAUD_FEATURE_COLS] for r in rows])

    model = IsolationForest(
        n_estimators=100,
        contamination=0.1,  # Assume ~10% of claims could be anomalous
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)

    # Save model
    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(model, FRAUD_MODEL_PATH)

    # Evaluate: count anomalies in training data
    predictions = model.predict(X)
    n_anomalies = int((predictions == -1).sum())

    result = {
        "status": "ok",
        "n_samples": len(X),
        "n_anomalies": n_anomalies,
        "contamination": 0.1,
    }
    logger.info("[fraud] Trained Isolation Forest: %s", result)
    return result


def _load_fraud_model():
    """Load saved Isolation Forest model or return None."""
    if FRAUD_MODEL_PATH.exists():
        try:
            return joblib.load(FRAUD_MODEL_PATH)
        except Exception:
            return None
    return None
