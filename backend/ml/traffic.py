"""
TomTom Traffic API integration for GigGuard Phase 3.

Fetches real-time traffic flow data per city, calculates the Travel Time
Index (TTI), and exposes a cached async interface for the trigger engine.

TTI = currentTravelTime / freeFlowTravelTime
  - TTI ~1.0 → free-flow traffic
  - TTI  2.0 → travel takes 2× longer than normal
  - TTI >2.5 → severe congestion (trigger threshold)

Uses TomTom Flow Segment Data API (free tier: 2,500 calls/day).
"""

import os
import time
import logging
from typing import Any

import httpx
import numpy as np

logger = logging.getLogger(__name__)

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "")

# ---------------------------------------------------------------------------
# City bounding-box configs — we query a representative arterial road point
# per city.  TomTom Flow Segment Data takes a (lat, lon) point and returns
# traffic on the nearest road segment.  We use one major arterial per city
# to approximate city-wide congestion.
# ---------------------------------------------------------------------------

CITY_TRAFFIC_POINTS: dict[str, tuple[float, float]] = {
    "Chennai":    (13.0604, 80.2496),   # Anna Salai
    "Bangalore":  (12.9352, 77.6245),   # Hosur Road
    "Bengaluru":  (12.9352, 77.6245),   # alias
    "Hyderabad":  (17.4399, 78.4983),   # Jubilee Hills Road
    "Mumbai":     (19.0176, 72.8562),   # Western Express Hwy
    "Delhi":      (28.6328, 77.2197),   # Ring Road
    "Pune":       (18.5074, 73.8077),   # Pune-Mumbai Expressway entry
    "Kolkata":    (22.5448, 88.3426),   # EM Bypass
}

# ---------------------------------------------------------------------------
# In-memory TTI cache (5-minute TTL, same cadence as weather.py)
# ---------------------------------------------------------------------------
_traffic_cache: dict[str, tuple[float, dict]] = {}  # city -> (timestamp, data)
_CACHE_TTL = 300  # 5 minutes


async def fetch_traffic_tti(city: str) -> dict[str, Any]:
    """Fetch real-time traffic TTI for a city from TomTom.

    Returns:
        {
            "tti": float,               # Travel Time Index (>1 = congestion)
            "current_speed_kmh": float,  # current speed on segment
            "free_flow_speed_kmh": float,# free-flow speed on segment
            "current_travel_time": int,  # seconds
            "free_flow_travel_time": int,# seconds
            "confidence": float,         # TomTom confidence 0-1
            "road_closure": bool,
            "source": str,
        }
    """
    # Alias normalisation
    if city == "Bengaluru":
        city = "Bangalore"

    # --- Check cache ---
    if city in _traffic_cache:
        cached_ts, cached_data = _traffic_cache[city]
        if time.time() - cached_ts < _CACHE_TTL:
            return cached_data

    # --- No API key → return safe defaults ---
    if not TOMTOM_API_KEY:
        logger.debug("[traffic] TOMTOM_API_KEY not set — returning defaults for %s", city)
        return _default_traffic()

    coords = CITY_TRAFFIC_POINTS.get(city)
    if not coords:
        return _default_traffic()

    lat, lon = coords

    url = (
        f"https://api.tomtom.com/traffic/services/4/flowSegmentData"
        f"/absolute/10/json"
    )
    params = {
        "point": f"{lat},{lon}",
        "key": TOMTOM_API_KEY,
        "unit": "KMPH",
        "thickness": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        frd = data.get("flowSegmentData", {})

        current_speed = float(frd.get("currentSpeed", 0))
        free_flow_speed = float(frd.get("freeFlowSpeed", 1))
        current_tt = int(frd.get("currentTravelTime", 0))
        free_flow_tt = int(frd.get("freeFlowTravelTime", 1))
        confidence = float(frd.get("confidence", 0))
        road_closure = bool(frd.get("roadClosure", False))

        # TTI = currentTravelTime / freeFlowTravelTime (deterministic, no rand)
        tti = float(np.clip(current_tt / max(free_flow_tt, 1), 0.0, 10.0))

        result = {
            "tti": round(tti, 4),
            "current_speed_kmh": round(current_speed, 1),
            "free_flow_speed_kmh": round(free_flow_speed, 1),
            "current_travel_time": current_tt,
            "free_flow_travel_time": free_flow_tt,
            "confidence": round(confidence, 4),
            "road_closure": road_closure,
            "source": "tomtom",
        }

        _traffic_cache[city] = (time.time(), result)
        return result

    except Exception as exc:
        logger.error("[traffic] TomTom API error for %s: %s", city, exc)
        return _default_traffic()


def _default_traffic() -> dict[str, Any]:
    """Safe fallback when the API is unavailable or unconfigured."""
    return {
        "tti": 1.0,
        "current_speed_kmh": 30.0,
        "free_flow_speed_kmh": 30.0,
        "current_travel_time": 0,
        "free_flow_travel_time": 0,
        "confidence": 0.0,
        "road_closure": False,
        "source": "default",
    }


def compute_traffic_risk(tti_avg: float) -> float:
    """Compute normalised traffic risk score for the premium model.

    Formula:
        traffic_risk = clip((TTI_avg - 1.2) / 2.0, 0, 1) * 0.2

    This produces a value in [0.0, 0.2] — contributing at most 20%
    to the composite risk multiplier.
    """
    return float(np.clip((tti_avg - 1.2) / 2.0, 0.0, 1.0)) * 0.2
