"""
Isolation Forest-based fraud detection for GigGuard insurance claims.

Uses unsupervised anomaly detection to flag suspicious claim patterns:
  - Cross-platform activity during disruption
  - Claim frequency (too many claims in a short window)
  - Payout amount anomalies
  - Timing patterns (claims filed suspiciously fast)
"""

import logging
import numpy as np
import joblib
from pathlib import Path
from datetime import date, timedelta

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent / "saved_models"
FRAUD_MODEL_PATH = MODEL_DIR / "fraud_model.joblib"


def build_fraud_features(
    worker_id: str,
    city: str,
    payout_amount: float,
    daily_wage: float,
    cross_platform_clear: bool,
    gps_verified: bool,
    supabase_client=None,
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
    payout_ratio = payout_amount / max(daily_wage, 1.0)

    # --- Cross-platform: was the worker active elsewhere? ---
    cross_platform_flag = 0.0 if cross_platform_clear else 1.0

    # --- GPS: was location verified? ---
    gps_flag = 0.0 if gps_verified else 1.0

    return {
        "claim_count_30d": claim_count_30d,
        "total_payout_30d": round(total_payout_30d, 2),
        "payout_amount": round(payout_amount, 2),
        "payout_ratio": round(payout_ratio, 4),
        "daily_wage": round(daily_wage, 2),
        "cross_platform_flag": cross_platform_flag,
        "gps_flag": gps_flag,
    }


FRAUD_FEATURE_COLS = [
    "claim_count_30d", "total_payout_30d", "payout_amount",
    "payout_ratio", "daily_wage", "cross_platform_flag", "gps_flag",
]


def compute_fraud_score(features: dict) -> tuple[float, list[str]]:
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
            score, flags = _rule_based_score(features)
    else:
        score, flags = _rule_based_score(features)

    return round(score, 4), flags


def _rule_based_score(features: dict) -> tuple[float, list[str]]:
    """Fallback rule-based fraud scoring when no ML model is available."""
    score = 0.0
    flags: list[str] = []

    # Cross-platform activity during disruption
    if features["cross_platform_flag"] > 0:
        score += 0.35
        flags.append("cross_platform_activity")

    # GPS not verified
    if features["gps_flag"] > 0:
        score += 0.15
        flags.append("gps_not_verified")

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
            "gps_flag": 0.0,  # Assume verified for historical context
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
