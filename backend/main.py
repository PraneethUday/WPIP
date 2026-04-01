"""
FastAPI application for GigGuard — Delivery Platform Data API + ML Premium Engine.

Exposes endpoints for:
  - Worker activity data (per platform)
  - ML-powered premium prediction
  - Weather data
  - Admin premium management
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import fetch_workers, fetch_worker_history, supabase
from scheduler import tick, INTERVAL_SECONDS
from ml.weather import fetch_weather, fetch_all_cities
from ml.premium_model import (
    build_features_from_history,
    predict_premium,
    load_model,
    load_metadata,
    compute_target_premium,
    TIER_CONFIG,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Background scheduler as a lifespan task
# ---------------------------------------------------------------------------

async def _scheduler_loop() -> None:
    """Background loop that generates data every 15 minutes."""
    logger.info("Background scheduler started (interval=%ds).", INTERVAL_SECONDS)
    while True:
        await tick()
        await asyncio.sleep(INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the background scheduler when the app boots."""
    task = asyncio.create_task(_scheduler_loop())
    logger.info("FastAPI lifespan: scheduler task created.")
    yield
    task.cancel()
    logger.info("FastAPI lifespan: scheduler task cancelled.")


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="GigGuard — Delivery Platform Data API",
    description=(
        "Synthetic delivery-worker data simulator for premium calculation, "
        "fraud detection, and worker risk profiling."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "service": "GigGuard Delivery Platform Data API",
        "version": "2.0.0",
        "platforms": [
            "swiggy", "zomato", "amazon_flex", "blinkit",
            "zepto", "meesho", "porter", "dunzo",
        ],
        "endpoints": [
            "/api/workers",
            "/api/swiggy/workers",
            "/api/zomato/workers",
            "/api/amazon_flex/workers",
            "/api/blinkit/workers",
            "/api/zepto/workers",
            "/api/meesho/workers",
            "/api/porter/workers",
            "/api/dunzo/workers",
            "/api/workers/{worker_id}/history",
            "/api/health",
        ],
    }


@app.get("/api/workers")
async def get_all_workers(limit: int = Query(500, ge=1, le=5000)):
    """Return latest delivery data for **all** platforms combined."""
    data = fetch_workers(platform=None, limit=limit)
    return {"count": len(data), "platform": "all", "data": data}


@app.get("/api/swiggy/workers")
async def get_swiggy_workers(limit: int = Query(500, ge=1, le=5000)):
    """Return latest delivery data for **Swiggy** workers."""
    data = fetch_workers(platform="swiggy", limit=limit)
    return {"count": len(data), "platform": "swiggy", "data": data}


@app.get("/api/zomato/workers")
async def get_zomato_workers(limit: int = Query(500, ge=1, le=5000)):
    """Return latest delivery data for **Zomato** workers."""
    data = fetch_workers(platform="zomato", limit=limit)
    return {"count": len(data), "platform": "zomato", "data": data}


@app.get("/api/amazon_flex/workers")
async def get_amazon_flex_workers(limit: int = Query(500, ge=1, le=5000)):
    """Return latest delivery data for **Amazon Flex** workers."""
    data = fetch_workers(platform="amazon_flex", limit=limit)
    return {"count": len(data), "platform": "amazon_flex", "data": data}


@app.get("/api/blinkit/workers")
async def get_blinkit_workers(limit: int = Query(500, ge=1, le=5000)):
    """Return latest delivery data for **Blinkit** workers."""
    data = fetch_workers(platform="blinkit", limit=limit)
    return {"count": len(data), "platform": "blinkit", "data": data}


@app.get("/api/zepto/workers")
async def get_zepto_workers(limit: int = Query(500, ge=1, le=5000)):
    """Return latest delivery data for **Zepto** workers."""
    data = fetch_workers(platform="zepto", limit=limit)
    return {"count": len(data), "platform": "zepto", "data": data}


@app.get("/api/meesho/workers")
async def get_meesho_workers(limit: int = Query(500, ge=1, le=5000)):
    """Return latest delivery data for **Meesho** workers."""
    data = fetch_workers(platform="meesho", limit=limit)
    return {"count": len(data), "platform": "meesho", "data": data}


@app.get("/api/porter/workers")
async def get_porter_workers(limit: int = Query(500, ge=1, le=5000)):
    """Return latest delivery data for **Porter** workers."""
    data = fetch_workers(platform="porter", limit=limit)
    return {"count": len(data), "platform": "porter", "data": data}


@app.get("/api/dunzo/workers")
async def get_dunzo_workers(limit: int = Query(500, ge=1, le=5000)):
    """Return latest delivery data for **Dunzo** workers."""
    data = fetch_workers(platform="dunzo", limit=limit)
    return {"count": len(data), "platform": "dunzo", "data": data}


@app.get("/api/workers/{worker_id}/history")
async def get_worker_history(
    worker_id: str,
    days: int = Query(30, ge=1, le=365),
):
    """Return historical data for a specific worker (for ML features)."""
    data = fetch_worker_history(worker_id=worker_id, days=days)
    return {"count": len(data), "worker_id": worker_id, "days": days, "data": data}


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# ML Premium Endpoints
# ---------------------------------------------------------------------------

class PremiumRequest(BaseModel):
    delivery_id: str
    city: str = "Unknown"
    tier: str = "standard"


@app.post("/api/premium/predict")
async def predict_worker_premium(req: PremiumRequest):
    """Predict weekly premium for a single worker using trained ML model."""
    # Fetch worker history
    history = fetch_worker_history(req.delivery_id, days=30)
    weather = fetch_weather(req.city)
    features = build_features_from_history(history, weather)

    model = load_model()
    if model:
        result = predict_premium(model, features, req.tier)
    else:
        premium = compute_target_premium(features, req.tier)
        cfg = TIER_CONFIG.get(req.tier, TIER_CONFIG["standard"])
        result = {
            "weekly_premium": premium,
            "weekly_premium_autopay": round(premium * 0.95, 2),
            "raw_prediction": premium,
            "tier": req.tier,
            "max_payout": cfg["max_payout"],
            "weather_risk": features.get("weather_risk", 0),
            "city_risk": features.get("city_risk", 1.0),
            "weekly_earnings_est": features.get("weekly_earnings_est", 0),
        }

    result["history_days"] = len(history)
    result["weather"] = weather
    return result


@app.get("/api/premium/worker/{worker_id}")
async def get_worker_premium(worker_id: str):
    """Get the latest computed premium for a registered worker from DB."""
    try:
        resp = (
            supabase.table("premium_predictions")
            .select("*")
            .eq("worker_id", worker_id)
            .order("week_start", desc=True)
            .limit(1)
            .execute()
        )
        if resp.data:
            return {"found": True, "premium": resp.data[0]}
        return {"found": False, "message": "No premium computed yet for this worker."}
    except Exception as e:
        return {"found": False, "error": str(e)}


@app.get("/api/premium/all")
async def get_all_premiums(limit: int = Query(100, ge=1, le=1000)):
    """Get latest computed premiums for all workers."""
    try:
        resp = (
            supabase.table("premium_predictions")
            .select("*")
            .order("computed_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"count": len(resp.data), "data": resp.data}
    except Exception as e:
        return {"count": 0, "error": str(e), "data": []}


@app.get("/api/weather/{city}")
async def get_city_weather(city: str):
    """Get real-time weather + AQI for a city from OpenWeatherMap."""
    data = fetch_weather(city)
    return {"city": city, "weather": data}


@app.get("/api/weather")
async def get_all_weather():
    """Get weather for all supported cities."""
    data = fetch_all_cities()
    return {"cities": data}


@app.get("/api/model/status")
async def model_status():
    """Get info about the currently loaded ML model."""
    meta = load_metadata()
    model = load_model()
    return {
        "model_loaded": model is not None,
        "metadata": meta,
        "tiers": TIER_CONFIG,
    }
