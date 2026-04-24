"""
GigGuard ML Service — FastAPI
=============================
Standalone microservice running on port 8001.
Serves two real ML-powered endpoints:

  POST /predict/premium     — XGBoost weekly premium prediction (25 features)
  POST /predict/fraud-score — Isolation Forest fraud scoring (8 features)

The backend's compute_premiums.py and fraud_model.py already call this
service first and fall back to their local models if this service is down.

Run:
    cd ml_service
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload
"""

import os
import json
import logging
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from datetime import date, timedelta

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger("ml_service")

# ── Model paths ──────────────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

PREMIUM_MODEL_PATH  = MODEL_DIR / "premium_model.joblib"
PREMIUM_META_PATH   = MODEL_DIR / "model_metadata.json"
FRAUD_MODEL_PATH    = MODEL_DIR / "fraud_model.joblib"

# ── Premium config ───────────────────────────────────────────────────────────
TIER_CONFIG = {
    "basic":    {"rate": 0.008, "min": 40,  "max": 80,  "max_payout": 500},
    "standard": {"rate": 0.012, "min": 60,  "max": 100, "max_payout": 1200},
    "pro":      {"rate": 0.016, "min": 80,  "max": 120, "max_payout": 2500},
}

CITY_RISK_BASE = {
    "Chennai": 1.15, "Delhi": 1.20, "Mumbai": 1.10,
    "Bangalore": 1.00, "Bengaluru": 1.00,
    "Hyderabad": 0.95, "Pune": 0.90,
    "Kolkata": 1.05, "Ahmedabad": 0.95,
    "Jaipur": 0.90, "Surat": 0.90,
}

# The 25 feature columns (order must match training)
FEATURE_COLS = [
    "avg_earnings_7d", "avg_deliveries_7d", "avg_hours_7d", "avg_rating_7d",
    "weekly_earnings_est", "earnings_trend", "delivery_trend", "earnings_cv",
    "earnings_std", "total_days_active", "earn_per_delivery", "earn_per_hour",
    "temperature", "aqi_index", "rain_1h", "rain_3h", "humidity", "wind_speed",
    "is_heavy_rain", "is_extreme_heat", "is_severe_aqi",
    "weather_risk", "city_risk",
    "historical_traffic_variance", "unrest_exposure_flag",
]

# The 7 fraud feature columns (order must match training — GPS removed)
FRAUD_FEATURE_COLS = [
    "claim_count_30d", "total_payout_30d", "payout_amount",
    "payout_ratio", "daily_wage", "cross_platform_flag",
    "curfew_zone_mismatch",
]

# ── In-memory model cache ────────────────────────────────────────────────────
_premium_model = None
_fraud_model   = None


def _load_premium_model():
    global _premium_model
    if _premium_model is not None:
        return _premium_model
    if PREMIUM_MODEL_PATH.exists():
        try:
            _premium_model = joblib.load(PREMIUM_MODEL_PATH)
            logger.info("[premium] XGBoost model loaded from disk.")
        except Exception as e:
            logger.warning("[premium] Failed to load model: %s", e)
    return _premium_model


def _load_fraud_model():
    global _fraud_model
    if _fraud_model is not None:
        return _fraud_model
    if FRAUD_MODEL_PATH.exists():
        try:
            _fraud_model = joblib.load(FRAUD_MODEL_PATH)
            logger.info("[fraud] Isolation Forest model loaded from disk.")
        except Exception as e:
            logger.warning("[fraud] Failed to load model: %s", e)
    return _fraud_model


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="GigGuard ML Service",
    version="1.0.0",
    description="Microservice for premium prediction and fraud scoring.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
# Pydantic schemas
# ═══════════════════════════════════════════════════════════════════════════════

class PremiumRequest(BaseModel):
    # All 25 features — matches exactly what build_features_from_history() returns
    avg_earnings_7d:            float = Field(default=0.0)
    avg_deliveries_7d:          float = Field(default=0.0)
    avg_hours_7d:               float = Field(default=0.0)
    avg_rating_7d:              float = Field(default=0.0)
    weekly_earnings_est:        float = Field(default=0.0)
    earnings_trend:             float = Field(default=0.0)
    delivery_trend:             float = Field(default=0.0)
    earnings_cv:                float = Field(default=0.0)
    earnings_std:               float = Field(default=0.0)
    total_days_active:          int   = Field(default=0)
    earn_per_delivery:          float = Field(default=0.0)
    earn_per_hour:              float = Field(default=0.0)
    temperature:                float = Field(default=30.0)
    aqi_index:                  float = Field(default=100.0)
    rain_1h:                    float = Field(default=0.0)
    rain_3h:                    float = Field(default=0.0)
    humidity:                   float = Field(default=60.0)
    wind_speed:                 float = Field(default=5.0)
    is_heavy_rain:              float = Field(default=0.0)
    is_extreme_heat:            float = Field(default=0.0)
    is_severe_aqi:              float = Field(default=0.0)
    weather_risk:               float = Field(default=0.0)
    city_risk:                  float = Field(default=1.0)
    historical_traffic_variance: float = Field(default=0.0)
    unrest_exposure_flag:       int   = Field(default=0)
    # Tier is optional — defaults to standard
    tier: str = Field(default="standard")


class FraudRequest(BaseModel):
    # Behavioral fraud signals — GPS removed (not used for scoring)
    delivery_activity_detected: bool  = Field(default=False)
    duplicate_claim:            bool  = Field(default=False)
    new_registration_fraud:     bool  = Field(default=False)
    abnormal_claim_freq:        bool  = Field(default=False)
    payout_amount:              float = Field(default=0.0)
    premium_paid:               float = Field(default=0.0)
    weekly_earnings_avg:        float = Field(default=0.0)
    disrupted_hours:            float = Field(default=0.0)
    rainfall_mm:                float = Field(default=0.0)
    aqi_value:                  float = Field(default=0.0)
    n_platforms_verified:       int   = Field(default=1)
    eligibility_passed:         bool  = Field(default=True)
    # Extended Isolation Forest features (optional)
    claim_count_30d:            int   = Field(default=0)
    total_payout_30d:           float = Field(default=0.0)
    daily_wage:                 float = Field(default=400.0)
    cross_platform_flag:        float = Field(default=0.0)
    curfew_zone_mismatch:       float = Field(default=0.0)


# ═══════════════════════════════════════════════════════════════════════════════
# Helper: formula-based premium (no model needed)
# ═══════════════════════════════════════════════════════════════════════════════

def _formula_premium(features: dict, tier: str) -> float:
    """Replicated from premium_model.compute_target_premium()."""
    cfg = TIER_CONFIG.get(tier, TIER_CONFIG["standard"])
    weekly = features.get("weekly_earnings_est", 0)
    base   = weekly * cfg["rate"]

    risk_mult        = 1.0 + features.get("weather_risk", 0) * 0.5
    traffic_var      = features.get("historical_traffic_variance", 0.0)
    traffic_mult     = 1.0 + float(np.clip(traffic_var, 0.0, 0.2))
    unrest_mult      = 1.10 if features.get("unrest_exposure_flag", 0) else 1.0
    city_mult        = features.get("city_risk", 1.0)
    cv               = features.get("earnings_cv", 0)
    consistency_mult = 1.0 + min(cv, 0.5) * 0.4
    earn_per_hour    = features.get("earn_per_hour", 100)
    efficiency_factor = max(0.8, min(1.2, 1.0 - (earn_per_hour - 100) / 500))
    days_active      = features.get("total_days_active", 7)
    activity_mult    = max(0.9, min(1.3, 1.0 + (7 - min(days_active, 7)) / 14))

    return round(base * risk_mult * traffic_mult * unrest_mult
                 * city_mult * consistency_mult * efficiency_factor * activity_mult, 2)


def _clamp_premium(raw: float, tier: str) -> float:
    cfg = TIER_CONFIG.get(tier, TIER_CONFIG["standard"])
    return round(max(cfg["min"], min(cfg["max"], raw)), 2)


# ═══════════════════════════════════════════════════════════════════════════════
# Helper: rule-based fraud fallback (mirrors fraud_model._rule_based_fallback())
# ═══════════════════════════════════════════════════════════════════════════════

def _rule_based_fraud(req: FraudRequest) -> dict:
    score   = 0.0
    signals = []

    # Behavioral signals (GPS removed — not used for scoring)
    if req.delivery_activity_detected:
        score += 0.50; signals.append("ACTIVE_DURING_CLAIM")
    if req.duplicate_claim:
        score += 0.45; signals.append("DUPLICATE_CLAIM")
    if req.new_registration_fraud:
        score += 0.25; signals.append("NEW_REGISTRATION_RISK")
    if req.abnormal_claim_freq:
        score += 0.25; signals.append("ABNORMAL_CLAIM_FREQUENCY")
    if req.cross_platform_flag > 0:
        score += 0.35; signals.append("CROSS_PLATFORM_ACTIVITY")
    if req.curfew_zone_mismatch > 0:
        score += 0.50; signals.append("CURFEW_ZONE_MISMATCH")

    # Payout ratio check
    # Threshold raised to 1.2 — disruption insurance can legitimately pay out
    # 80-100% of a daily wage (disrupted full-day shifts). Only flag if the
    # claimed amount exceeds what is physically possible (>120% of daily wage).
    payout_ratio = req.payout_amount / max(req.daily_wage, 1.0)
    if payout_ratio > 1.2:
        score += 0.15; signals.append("HIGH_PAYOUT_RATIO")
    if req.claim_count_30d > 5:
        score += 0.25; signals.append("HIGH_CLAIM_FREQUENCY")
    elif req.claim_count_30d > 3:
        score += 0.10; signals.append("ELEVATED_CLAIM_FREQUENCY")
    if req.total_payout_30d > 3000:
        score += 0.10; signals.append("HIGH_CUMULATIVE_PAYOUT")

    score = round(min(0.99, score), 4)

    # Disposition thresholds (calibrated):
    #   >= 0.90 → Auto_Rejected          (2+ hard signals stacked, very clear fraud)
    #   >= 0.60 → Flagged_Manual_Review  (significant risk, human review needed)
    #   <  0.60 → Auto_Approved          (clean or single soft signal)
    if score >= 0.90:
        disposition = "Auto_Rejected"
    elif score >= 0.60:
        disposition = "Flagged_Manual_Review"
    else:
        disposition = "Auto_Approved"

    return {
        "fraud_risk_score":    score,
        "claim_disposition":   disposition,
        "fraud_signals_found": signals,
        "auto_action":         disposition,
        "explanation":         "Rule-based scoring (ML model fallback)",
        "model_used":          "rule_based",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Routes
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/", tags=["Health"])
def root():
    return {
        "service": "GigGuard ML Service",
        "version": "1.0.0",
        "status":  "running",
        "endpoints": ["/predict/premium", "/predict/fraud-score", "/health", "/model/status"],
    }


@app.get("/health", tags=["Health"])
def health():
    premium_ready = PREMIUM_MODEL_PATH.exists()
    fraud_ready   = FRAUD_MODEL_PATH.exists()
    return {
        "status":               "ok",
        "premium_model_loaded": premium_ready,
        "fraud_model_loaded":   fraud_ready,
    }


@app.get("/model/status", tags=["Model Info"])
def model_status():
    meta = None
    if PREMIUM_META_PATH.exists():
        try:
            meta = json.loads(PREMIUM_META_PATH.read_text())
        except Exception:
            pass
    return {
        "premium_model": {
            "file_exists":   PREMIUM_MODEL_PATH.exists(),
            "in_memory":     _premium_model is not None,
            "metadata":      meta,
        },
        "fraud_model": {
            "file_exists":   FRAUD_MODEL_PATH.exists(),
            "in_memory":     _fraud_model is not None,
        },
    }


# ─── POST /predict/premium ───────────────────────────────────────────────────

@app.post("/predict/premium", tags=["Predictions"])
def predict_premium(req: PremiumRequest):
    """
    Predict weekly insurance premium for a single worker.

    Accepts the 25-feature dict produced by build_features_from_history()
    plus an optional 'tier' ('basic' / 'standard' / 'pro').

    Returns:
        weekly_premium, weekly_premium_autopay, raw_prediction,
        tier, max_payout, weather_risk, city_risk, weekly_earnings_est
    """
    tier = req.tier if req.tier in TIER_CONFIG else "standard"
    cfg  = TIER_CONFIG[tier]

    features = req.model_dump(exclude={"tier"})

    model = _load_premium_model()
    model_used = "xgboost"

    if model is not None:
        try:
            X = pd.DataFrame([features], columns=FEATURE_COLS)
            raw_pred = float(model.predict(X)[0])

            # Scale from standard-tier training targets to requested tier
            standard_rate = TIER_CONFIG["standard"]["rate"]
            raw_pred      = raw_pred * (cfg["rate"] / standard_rate)

            # Guard: if XGBoost outputs a negative or very-low value it means
            # the feature vector is too sparse (partial inputs, no activity history).
            # Blend 40% XGBoost + 60% formula to produce a sensible result.
            formula_pred = _formula_premium(features, tier)
            if raw_pred < cfg["min"]:
                raw_pred   = round(0.4 * raw_pred + 0.6 * formula_pred, 2)
                model_used = "xgboost_blended"
                logger.info("[premium] Sparse features — blended XGBoost+formula → raw=%.2f", raw_pred)
            else:
                logger.info("[premium] XGBoost → raw=%.2f tier=%s", raw_pred, tier)

            premium = _clamp_premium(raw_pred, tier)

        except Exception as e:
            logger.warning("[premium] XGBoost predict failed: %s — using formula", e)
            raw_pred  = _formula_premium(features, tier)
            premium   = _clamp_premium(raw_pred, tier)
            model_used = "formula_fallback"
    else:
        logger.info("[premium] No XGBoost model — using formula.")
        raw_pred   = _formula_premium(features, tier)
        premium    = _clamp_premium(raw_pred, tier)
        model_used = "formula"

    return {
        "weekly_premium":         premium,
        "weekly_premium_autopay": round(premium * 0.95, 2),
        "raw_prediction":         round(raw_pred, 2),
        "tier":                   tier,
        "max_payout":             cfg["max_payout"],
        "weather_risk":           features.get("weather_risk", 0),
        "city_risk":              features.get("city_risk", 1.0),
        "weekly_earnings_est":    features.get("weekly_earnings_est", 0),
        "model_used":             model_used,
    }


# ─── POST /predict/fraud-score ───────────────────────────────────────────────

@app.post("/predict/fraud-score", tags=["Predictions"])
def predict_fraud(req: FraudRequest):
    """
    Score a single insurance claim for fraud risk.

    Uses Isolation Forest ML model when available, falls back to
    rule-based heuristics.

    Returns:
        fraud_risk_score (0-1), claim_disposition, fraud_signals_found,
        auto_action, explanation, model_used
    """
    model = _load_fraud_model()

    if model is not None:
        try:
            payout_ratio = req.payout_amount / max(req.daily_wage, 1.0)
            feature_vec = [
                req.claim_count_30d,
                req.total_payout_30d,
                req.payout_amount,
                payout_ratio,
                req.daily_wage,
                req.cross_platform_flag if req.cross_platform_flag else (0.0 if req.eligibility_passed else 1.0),
                req.curfew_zone_mismatch,
            ]
            X = np.array([feature_vec])

            # IsolationForest: lower decision_function = more anomalous
            raw_score = model.decision_function(X)[0]
            score = float(np.clip(0.5 - raw_score, 0.0, 1.0))
            score = round(score, 4)

            signals = []
            if score > 0.6:
                signals.append("ML_ANOMALY_DETECTED")
            # Layer in explicit behavioral signals on top of ML score (GPS removed)
            if req.delivery_activity_detected:    signals.append("ACTIVE_DURING_CLAIM")
            if req.duplicate_claim:               signals.append("DUPLICATE_CLAIM")
            if req.new_registration_fraud:        signals.append("NEW_REGISTRATION_RISK")
            if req.abnormal_claim_freq:           signals.append("ABNORMAL_CLAIM_FREQUENCY")

            if score > 0.90:
                disposition = "Auto_Rejected"
            elif score > 0.75:
                disposition = "Flagged_Manual_Review"
            else:
                disposition = "Auto_Approved"

            logger.info("[fraud] IsolationForest score=%.4f disposition=%s", score, disposition)

            return {
                "fraud_risk_score":    score,
                "claim_disposition":   disposition,
                "fraud_signals_found": signals,
                "auto_action":         disposition,
                "explanation":         f"Isolation Forest anomaly score: {score:.4f}",
                "model_used":          "isolation_forest",
            }

        except Exception as e:
            logger.warning("[fraud] Model predict failed: %s — falling back to rules", e)

    # No model or predict failed → rule-based
    result = _rule_based_fraud(req)
    logger.info("[fraud] Rule-based score=%.4f disposition=%s", result["fraud_risk_score"], result["claim_disposition"])
    return result


# ─── Startup: eager-load models into RAM ─────────────────────────────────────

@app.on_event("startup")
def startup_event():
    logger.info("=" * 60)
    logger.info("GigGuard ML Service starting on port 8001")
    logger.info("=" * 60)
    _load_premium_model()
    _load_fraud_model()
    if not PREMIUM_MODEL_PATH.exists():
        logger.warning("[startup] No premium model file found at %s", PREMIUM_MODEL_PATH)
        logger.warning("[startup] Premium endpoint will use formula-based fallback until backend retrains.")
    if not FRAUD_MODEL_PATH.exists():
        logger.warning("[startup] No fraud model file found at %s", FRAUD_MODEL_PATH)
        logger.warning("[startup] Fraud endpoint will use rule-based fallback.")
