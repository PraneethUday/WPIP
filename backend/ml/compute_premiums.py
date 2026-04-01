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


def get_week_start(d: date | None = None) -> date:
    """Get Monday of the current week."""
    d = d or date.today()
    return d - timedelta(days=d.weekday())


def compute_all_premiums():
    """Compute premiums for every registered worker."""
    print(f"[compute] Starting premium computation — {date.today()}")

    # 1. Load model
    model = load_model()
    meta = load_metadata()
    use_model = model is not None

    if use_model:
        print(f"[compute] Using trained model (RMSE: ₹{meta['rmse']:.2f}, trained: {meta['trained_at']})")
    else:
        print("[compute] No trained model found. Using formula-based premium calculation.")

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

        # Predict premium
        if use_model:
            pred = predict_premium(model, features, tier)
        else:
            # Fallback: formula-based
            premium = compute_target_premium(features, tier)
            cfg = TIER_CONFIG[tier]
            pred = {
                "weekly_premium": premium,
                "weekly_premium_autopay": round(premium * 0.95, 2),
                "raw_prediction": premium,
                "tier": tier,
                "max_payout": cfg["max_payout"],
                "weather_risk": features.get("weather_risk", 0),
                "city_risk": features.get("city_risk", 1.0),
                "weekly_earnings_est": features.get("weekly_earnings_est", 0),
            }

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
            "model_rmse": model_rmse,
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
