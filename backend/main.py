"""
FastAPI application for GigGuard — Delivery Platform Data API + ML Premium Engine.

Exposes endpoints for:
  - Worker activity data (per platform)
  - ML-powered premium prediction
  - Weather data
  - Admin premium management
"""

import asyncio
import io
import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import fetch_workers, fetch_worker_history, supabase
from scheduler import tick, run_retrain, INTERVAL_SECONDS
from ml.weather import fetch_weather, fetch_all_cities
from ml.premium_model import (
    build_features_from_history,
    predict_premium,
    load_model,
    load_metadata,
    compute_target_premium,
    clamp_premium,
    TIER_CONFIG,
)
from triggers import poll_triggers, get_trigger_status, test_fire_trigger

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Retrain state — shared between the background task and the logs endpoint
# ---------------------------------------------------------------------------
retrain_state: dict = {
    "running": False,
    "completed": False,
    "error": None,
    "logs": [],
}


class _LogCapture(io.TextIOBase):
    """Tee: write to both a list and the original stdout."""

    def __init__(self, log_list: list, original: object) -> None:
        self._log_list = log_list
        self._original = original

    def write(self, s: str) -> int:
        stripped = s.rstrip("\n")
        if stripped:
            self._log_list.append(stripped)
        self._original.write(s)  # type: ignore[attr-defined]
        return len(s)

    def flush(self) -> None:
        self._original.flush()  # type: ignore[attr-defined]


async def _retrain_with_logs() -> None:
    retrain_state["running"] = True
    retrain_state["completed"] = False
    retrain_state["error"] = None
    retrain_state["logs"] = []

    original_stdout = sys.stdout
    sys.stdout = _LogCapture(retrain_state["logs"], original_stdout)
    try:
        await run_retrain()
        retrain_state["completed"] = True
    except Exception as exc:  # pylint: disable=broad-except
        retrain_state["error"] = str(exc)
        retrain_state["logs"].append(f"[retrain] ERROR: {exc}")
    finally:
        sys.stdout = original_stdout
        retrain_state["running"] = False


# ---------------------------------------------------------------------------
# Background scheduler as a lifespan task
# ---------------------------------------------------------------------------

async def _scheduler_loop() -> None:
    """Background loop that generates data every 15 minutes."""
    logger.info("Background scheduler started (interval=%ds). Waiting 30s before first tick...", INTERVAL_SECONDS)
    await asyncio.sleep(30)  # Let the server start serving requests first
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
def get_worker_history(
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
def predict_worker_premium(req: PremiumRequest):
    """Predict weekly premium for a single worker using trained ML model."""
    # Fetch worker history
    history = fetch_worker_history(req.delivery_id, days=30)
    weather = fetch_weather(req.city)
    features = build_features_from_history(history, weather)

    model = load_model()
    if model:
        result = predict_premium(model, features, req.tier)
    else:
        raw_premium = compute_target_premium(features, req.tier)
        premium = clamp_premium(raw_premium, req.tier)
        cfg = TIER_CONFIG.get(req.tier, TIER_CONFIG["standard"])
        result = {
            "weekly_premium": premium,
            "weekly_premium_autopay": round(premium * 0.95, 2),
            "raw_prediction": round(raw_premium, 2),
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
def get_city_weather(city: str):
    """Get real-time weather + AQI for a city from OpenWeatherMap."""
    data = fetch_weather(city)
    return {"city": city, "weather": data}


@app.get("/api/weather")
def get_all_weather():
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


@app.post("/api/model/retrain")
async def trigger_retrain():
    """Start model retraining as a background task and return immediately."""
    if retrain_state["running"]:
        return {"status": "already_running", "message": "Retrain is already in progress."}
    asyncio.create_task(_retrain_with_logs())
    return {"status": "started", "message": "Retrain started in background."}


@app.get("/api/model/retrain/logs")
async def get_retrain_logs():
    """Return current retrain progress: running flag, logs, error, completed."""
    meta = load_metadata() if retrain_state["completed"] else None
    return {
        "running": retrain_state["running"],
        "completed": retrain_state["completed"],
        "error": retrain_state["error"],
        "logs": retrain_state["logs"],
        "metadata": meta,
    }


class AdjustIncomeRequest(BaseModel):
    platform: str | None = None
    worker_id: str | None = None
    earnings_multiplier: float = 1.0
    deliveries_multiplier: float = 1.0


@app.post("/api/admin/adjust-income")
async def adjust_income(req: AdjustIncomeRequest):
    """Adjust worker income data by multiplier for testing the ML model.

    This modifies TODAY's data for the specified platform or worker,
    letting the admin see how the model responds to different income levels.
    """
    from datetime import date as date_type
    today = date_type.today().isoformat()

    tables = []
    if req.platform:
        table_name = f"{req.platform}_workers"
        if table_name in [
            "swiggy_workers", "zomato_workers", "amazon_flex_workers",
            "blinkit_workers", "zepto_workers", "meesho_workers",
            "porter_workers", "dunzo_workers",
        ]:
            tables = [table_name]
    else:
        from db import PLATFORM_TABLES
        tables = PLATFORM_TABLES

    updated_count = 0
    for table in tables:
        try:
            query = supabase.table(table).select("id, earnings, deliveries").eq("date", today)
            if req.worker_id:
                query = query.eq("worker_id", req.worker_id)
            resp = query.limit(500).execute()

            for row in resp.data:
                new_earnings = round(row["earnings"] * req.earnings_multiplier, 2)
                new_deliveries = max(1, int(row["deliveries"] * req.deliveries_multiplier))
                supabase.table(table).update({
                    "earnings": new_earnings,
                    "deliveries": new_deliveries,
                }).eq("id", row["id"]).execute()
                updated_count += 1
        except Exception as e:
            logger.error(f"Error adjusting {table}: {e}")

    return {
        "status": "ok",
        "updated_rows": updated_count,
        "earnings_multiplier": req.earnings_multiplier,
        "deliveries_multiplier": req.deliveries_multiplier,
    }


@app.get("/api/admin/data-summary")
async def data_summary():
    """Get summary statistics of current worker data for the control center."""
    from db import PLATFORM_TABLES
    from datetime import date as date_type
    today = date_type.today().isoformat()

    platform_stats = []
    for table in PLATFORM_TABLES:
        try:
            resp = (
                supabase.table(table)
                .select("earnings, deliveries, active_hours, rating")
                .eq("date", today)
                .limit(500)
                .execute()
            )
            rows = resp.data
            if rows:
                earnings = [r["earnings"] for r in rows]
                deliveries = [r["deliveries"] for r in rows]
                platform_stats.append({
                    "platform": table.replace("_workers", ""),
                    "worker_count": len(rows),
                    "avg_earnings": round(sum(earnings) / len(earnings), 2),
                    "min_earnings": round(min(earnings), 2),
                    "max_earnings": round(max(earnings), 2),
                    "avg_deliveries": round(sum(deliveries) / len(deliveries), 1),
                    "total_earnings": round(sum(earnings), 2),
                })
        except Exception:
            pass

    return {
        "date": today,
        "platforms": platform_stats,
        "total_workers": sum(p["worker_count"] for p in platform_stats),
        "overall_avg_earnings": round(
            sum(p["avg_earnings"] * p["worker_count"] for p in platform_stats) /
            max(1, sum(p["worker_count"] for p in platform_stats)), 2
        ) if platform_stats else 0,
    }


@app.post("/api/admin/generate-data")
async def trigger_data_generation():
    """Manually trigger one cycle of data generation."""
    await tick()
    return {"status": "ok", "message": "Data generation cycle completed."}


# ---------------------------------------------------------------------------
# Parametric Trigger & Claims Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/triggers/status")
def triggers_status():
    """Get current weather + trigger evaluation for all monitored cities."""
    return get_trigger_status()


@app.get("/api/disruptions")
async def get_disruptions(limit: int = Query(50, ge=1, le=500)):
    """Get recent disruption events."""
    try:
        resp = (
            supabase.table("disruption_events")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"count": len(resp.data), "data": resp.data}
    except Exception as e:
        return {"count": 0, "error": str(e), "data": []}


@app.get("/api/claims")
async def get_claims(limit: int = Query(100, ge=1, le=1000)):
    """Get recent auto-generated claims."""
    try:
        resp = (
            supabase.table("claims")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"count": len(resp.data), "data": resp.data}
    except Exception as e:
        return {"count": 0, "error": str(e), "data": []}


@app.get("/api/claims/worker/{worker_id}")
def get_worker_claims(worker_id: str):
    """Get all claims for a specific worker."""
    try:
        resp = (
            supabase.table("claims")
            .select("*")
            .eq("worker_id", worker_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"count": len(resp.data), "worker_id": worker_id, "data": resp.data}
    except Exception as e:
        return {"count": 0, "error": str(e), "data": []}


class TestFireRequest(BaseModel):
    city: str = "Chennai"
    trigger_id: str = "T-01"


@app.post("/api/triggers/test-fire")
def test_fire(req: TestFireRequest):
    """Manually fire a trigger for testing (creates mock disruption + claims)."""
    result = test_fire_trigger(city=req.city, trigger_id=req.trigger_id)
    return result


# ---------------------------------------------------------------------------
# Phase 3: Payouts, GPS, & Exposure
# ---------------------------------------------------------------------------

class PayoutRequest(BaseModel):
    claim_ids: list[str] = []  # If empty, execute all 'approved' claims

@app.post("/api/claims/execute-payouts")
def execute_payouts(req: PayoutRequest):
    """Mock integration with external payment gateway. Pays out approved claims."""
    try:
        # Fetch approved claims that are not yet paid
        query = supabase.table("claims").select("id").eq("payout_status", "approved")
        if req.claim_ids:
            query = query.in_("id", req.claim_ids)
        
        resp = query.execute()
        claims = resp.data

        if not claims:
            return {"status": "ok", "paid_count": 0, "message": "No approved claims found to pay."}

        paid_count = 0
        import time
        import uuid
        
        # Simulate network delay to payment gateway
        time.sleep(0.5)

        for c in claims:
            txn_id = f"TXN_MOCK_{uuid.uuid4().hex[:8].upper()}"
            supabase.table("claims").update({
                "payout_status": "paid",
                "status": "paid",
                "transaction_id": txn_id,
                "paid_at": datetime.utcnow().isoformat(),
            }).eq("id", c["id"]).execute()
            paid_count += 1

        return {
            "status": "ok",
            "paid_count": paid_count,
            "message": f"Successfully paid {paid_count} claims.",
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


class GPSCheckinRequest(BaseModel):
    worker_id: str
    latitude: float
    longitude: float

@app.post("/api/gps/checkin")
def gps_checkin(req: GPSCheckinRequest):
    """Mobile app calls this periodically to update worker location."""
    return store_gps_checkin(req.worker_id, req.latitude, req.longitude)


@app.get("/api/admin/exposure")
async def regional_exposure():
    """Get aggregated risk exposure by city for the heatmap."""
    try:
        # Fetch all active workers
        resp = supabase.table("registered_workers").select("id, city, coverage_tier").eq("status", "active").execute()
        workers = resp.data

        # Aggregate by city
        exposure = {}
        for w in workers:
            city = w.get("city", "Unknown")
            tier = w.get("coverage_tier", "basic")
            
            # Max payout estimations based on tier
            max_payout = 500 if tier == "basic" else (1200 if tier == "standard" else 2500)
            
            if city not in exposure:
                exposure[city] = {"worker_count": 0, "max_exposure_inr": 0}
            
            exposure[city]["worker_count"] += 1
            exposure[city]["max_exposure_inr"] += max_payout

        # Also get current weather risk for these cities
        weather = fetch_all_cities()
        for city, stats in exposure.items():
            stats["active_alerts"] = 0
            w = weather.get(city, {})
            if w.get("is_heavy_rain") or w.get("is_extreme_heat") or w.get("is_severe_aqi"):
                stats["active_alerts"] = 1

        return {"status": "ok", "exposure": exposure}
    except Exception as e:
        return {"status": "error", "error": str(e)}
