"""
Compute weekly premiums for ALL registered workers and store in Supabase.

Flow:
  1. Load trained XGBoost model
  2. Fetch all registered workers from registered_workers table
  3. For each worker, fetch their platform activity history
  4. Build features + predict premium
  5. Upsert results into premium_predictions table

Usage:
  python -m ml.compute_premiums   (from backend/ directory)
"""

import sys
import os
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
from db import supabase, fetch_worker_history
from ml.weather import fetch_all_cities
from ml.premium_model import (
    build_features_from_history,
    predict_premium,
    load_model,
    load_metadata,
    compute_target_premium,
    TIER_CONFIG,
)

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8001")


def get_premium(worker_features: dict, tier: str = "standard") -> dict:
    """
    Call GigGuard ML Service for premium prediction.
    Falls back to local XGBoost model (or formula) if the service is unreachable.

    worker_features: flat dict of 25 numeric features (output of build_features_from_history).
    tier: 'basic' | 'standard' | 'pro'
    """
    payload = {**worker_features, "tier": tier}
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/predict/premium",
            json=payload,
            timeout=5,
        )
        response.raise_for_status()
        result = response.json()
        # Normalise to the same keys the rest of the code expects
        return {
            "weekly_premium":         result["weekly_premium"],
            "weekly_premium_autopay": result.get("weekly_premium_autopay", round(result["weekly_premium"] * 0.95, 2)),
            "raw_prediction":         result.get("raw_prediction", result["weekly_premium"]),
            "tier":                   tier,
            "max_payout":             result.get("max_payout", TIER_CONFIG[tier]["max_payout"]),
            "weather_risk":           result.get("weather_risk", worker_features.get("weather_risk", 0)),
            "city_risk":              result.get("city_risk",    worker_features.get("city_risk", 1.0)),
            "weekly_earnings_est":    result.get("weekly_earnings_est", worker_features.get("weekly_earnings_est", 0)),
        }
    except Exception as e:
        # Fallback: local XGBoost model (or formula if model not trained yet)
        print(f"[premium] ML service unavailable: {e}. Using local fallback.")
        model = load_model()
        if model is not None:
            return predict_premium(model, worker_features, tier)
        # Last resort: formula-based
        premium = compute_target_premium(worker_features, tier)
        cfg = TIER_CONFIG[tier]
        return {
            "weekly_premium":         premium,
            "weekly_premium_autopay": round(premium * 0.95, 2),
            "raw_prediction":         premium,
            "tier":                   tier,
            "max_payout":             cfg["max_payout"],
            "weather_risk":           worker_features.get("weather_risk", 0),
            "city_risk":              worker_features.get("city_risk", 1.0),
            "weekly_earnings_est":    worker_features.get("weekly_earnings_est", 0),
        }


def get_week_start(d: date | None = None) -> date:
    """Get Monday of the current week."""
    d = d or date.today()
    return d - timedelta(days=d.weekday())


def compute_all_premiums():
    """Compute premiums for every registered worker."""
    print(f"[compute] Starting premium computation — {date.today()}")
    print(f"[compute] ML service endpoint: {ML_SERVICE_URL}")

    # 1. Log local model status (used only as fallback now)
    meta = load_metadata()
    if meta:
        print(f"[compute] Local fallback model available (RMSE: ₹{meta['rmse']:.2f}, trained: {meta['trained_at']})")
    else:
        print("[compute] No local fallback model. Formula-based calculation will be used if ML service is down.")

    # 2. Fetch weather
    print("[compute] Fetching weather data...")
    city_weather = fetch_all_cities()

    # 3. Fetch all registered workers
    print("[compute] Fetching registered workers...")
    resp = supabase.table("registered_workers").select(
        "id, name, email, city, tier, platforms, delivery_id, autopay, is_active"
    ).eq("is_active", True).execute()

    workers = resp.data
    print(f"[compute] Found {len(workers)} active registered workers")

    if not workers:
        print("[compute] No registered workers. Done.")
        return

    week_start = get_week_start()
    model_rmse = meta["rmse"] if meta else None
    results = []

    for i, w in enumerate(workers):
        worker_id = w["id"]
        city = w.get("city", "Unknown")
        tier = w.get("tier", "standard")
        delivery_id = w.get("delivery_id", "")
        platforms = w.get("platforms", [])

        # Fetch activity history using delivery_id across platform tables
        history = fetch_worker_history(delivery_id, days=30)

        # Get weather for worker's city
        weather = city_weather.get(city)

        # Build features
        features = build_features_from_history(history, weather)

        # Predict premium — ML service first, local model as fallback
        pred = get_premium(features, tier)

        # Apply autopay discount if worker has it enabled
        if w.get("autopay"):
            final_premium = pred["weekly_premium_autopay"]
        else:
            final_premium = pred["weekly_premium"]

        results.append({
            "worker_id": worker_id,
            "worker_name": w["name"],
            "email": w["email"],
            "city": city,
            "tier": tier,
            "platforms": platforms,
            "delivery_id": delivery_id,
            "weekly_premium": final_premium,
            "weekly_premium_autopay": pred["weekly_premium_autopay"],
            "raw_prediction": pred["raw_prediction"],
            "max_payout": pred["max_payout"],
            "weekly_earnings_est": pred.get("weekly_earnings_est", 0),
            "weather_risk": pred.get("weather_risk", 0),
            "city_risk": pred.get("city_risk", 1.0),
            "aqi_index": features.get("aqi_index", 100),
            "temperature": features.get("temperature", 30),
            "rain_1h": features.get("rain_1h", 0),
            "model_rmse": meta["rmse"] if meta else None,
            "week_start": week_start.isoformat(),
        })

        if (i + 1) % 10 == 0:
            print(f"  Processed {i + 1}/{len(workers)} workers...")

    # 4. Upsert to Supabase
    print(f"[compute] Upserting {len(results)} premium predictions...")
    try:
        # Batch upsert in chunks of 50
        for chunk_start in range(0, len(results), 50):
            chunk = results[chunk_start:chunk_start + 50]
            supabase.table("premium_predictions").upsert(
                chunk, on_conflict="worker_id,week_start"
            ).execute()

        print(f"[compute] Done. {len(results)} premiums computed and stored.")
    except Exception as e:
        print(f"[compute] Error upserting: {e}")
        return

    # Summary
    premiums = [r["weekly_premium"] for r in results]
    if premiums:
        avg = sum(premiums) / len(premiums)
        print(f"\n[compute] Summary for week starting {week_start}:")
        print(f"  Workers:      {len(results)}")
        print(f"  Avg premium:  ₹{avg:.0f}")
        print(f"  Min premium:  ₹{min(premiums):.0f}")
        print(f"  Max premium:  ₹{max(premiums):.0f}")


if __name__ == "__main__":
    compute_all_premiums()
