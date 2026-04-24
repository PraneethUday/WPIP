import requests
import os
from datetime import date, timedelta

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8001")


def get_fraud_score(claim_data: dict) -> dict:
    """
    Call GigGuard ML Service for fraud scoring.

    claim_data keys (GPS removed — behavioral signals only):
      - delivery_activity_detected (bool)
      - duplicate_claim (bool)
      - new_registration_fraud (bool)
      - abnormal_claim_freq (bool)
      - payout_amount (float)
      - daily_wage (float)
      - claim_count_30d (int)
      - total_payout_30d (float)
      - cross_platform_flag (float)
      - curfew_zone_mismatch (float)
    """
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/predict/fraud-score",
            json=claim_data,
            timeout=5
        )
        response.raise_for_status()
        result = response.json()

        return {
            "fraud_risk_score":  result["fraud_risk_score"],
            "disposition":       result["claim_disposition"],
            "signals":           result["fraud_signals_found"],
            "auto_action":       result["auto_action"],
            "explanation":       result["explanation"],
        }

    except Exception as e:
        print(f"ML service unavailable: {e}. Using rule-based fallback.")
        return _rule_based_fallback(claim_data)


def _rule_based_fallback(claim_data: dict) -> dict:
    """Simple fallback if ML service is unreachable. GPS signals removed."""
    score = 0.0
    signals = []

    if claim_data.get("delivery_activity_detected", False):
        score += 0.50; signals.append("ACTIVE_DURING_CLAIM")
    if claim_data.get("duplicate_claim", False):
        score += 0.45; signals.append("DUPLICATE_CLAIM")
    if claim_data.get("new_registration_fraud", False):
        score += 0.25; signals.append("NEW_REGISTRATION_RISK")
    if claim_data.get("abnormal_claim_freq", False):
        score += 0.25; signals.append("ABNORMAL_CLAIM_FREQUENCY")
    if claim_data.get("cross_platform_flag", 0) > 0:
        score += 0.35; signals.append("CROSS_PLATFORM_ACTIVITY")
    if claim_data.get("curfew_zone_mismatch", 0) > 0:
        score += 0.50; signals.append("CURFEW_ZONE_MISMATCH")

    payout_ratio = claim_data.get("payout_amount", 0) / max(claim_data.get("daily_wage", 1), 1)
    if payout_ratio > 1.2:
        score += 0.15; signals.append("HIGH_PAYOUT_RATIO")

    claim_count = claim_data.get("claim_count_30d", 0)
    if claim_count > 5:
        score += 0.25; signals.append("HIGH_CLAIM_FREQUENCY")
    elif claim_count > 3:
        score += 0.10; signals.append("ELEVATED_CLAIM_FREQUENCY")

    if claim_data.get("total_payout_30d", 0) > 3000:
        score += 0.10; signals.append("HIGH_CUMULATIVE_PAYOUT")

    score = round(min(0.99, score), 4)

    if score >= 0.90:
        disposition = "Auto_Rejected"
    elif score >= 0.60:
        disposition = "Flagged_Manual_Review"
    else:
        disposition = "Auto_Approved"

    return {
        "fraud_risk_score": score,
        "disposition":      disposition,
        "signals":          signals,
        "auto_action":      disposition,
        "explanation":      "Rule-based fallback (ML service offline)",
    }


# ---------------------------------------------------------------------------
# Compatibility shims — required by triggers.py
# ---------------------------------------------------------------------------

def build_fraud_features(
    worker_id: str,
    city: str,
    payout_amount: float,
    daily_wage: float,
    cross_platform_clear: bool,
    gps_verified: bool,          # kept for backward compat with triggers.py — not used for scoring
    supabase_client=None,
    trigger_type: str = "",
) -> dict:
    """
    Build fraud feature dict for compute_fraud_score().
    GPS removed — only behavioral features are passed to the ML service.
    """
    claim_count_30d  = 0
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
            claim_count_30d  = len(resp.data)
            total_payout_30d = sum(r.get("payout_amount", 0) for r in resp.data)
        except Exception:
            pass

    return {
        # Behavioral signals only — GPS removed
        "delivery_activity_detected": not cross_platform_clear,
        "duplicate_claim":            False,
        "new_registration_fraud":     False,
        "abnormal_claim_freq":        claim_count_30d > 5,
        "payout_amount":              round(payout_amount, 2),
        "daily_wage":                 round(daily_wage, 2),
        "cross_platform_flag":        0.0 if cross_platform_clear else 1.0,
        "curfew_zone_mismatch":       0.0,
        "claim_count_30d":            claim_count_30d,
        "total_payout_30d":           round(total_payout_30d, 2),
        # Metadata (not sent to ML service)
        "_worker_id":    worker_id,
        "_city":         city,
        "_trigger_type": trigger_type,
    }


def compute_fraud_score(features: dict, trigger_type: str = "") -> tuple[float, list[str]]:
    """
    Score a claim. Routes to ML service first, rule-based fallback second.
    Returns (fraud_score: float, fraud_flags: list[str]).
    """
    payload = {k: v for k, v in features.items() if not k.startswith("_")}
    result  = get_fraud_score(payload)
    return float(result.get("fraud_risk_score", 0.0)), list(result.get("signals", []))