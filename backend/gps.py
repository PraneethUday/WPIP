"""
GPS Validation module for GigGuard.

Provides:
  - GPS check-in storage (workers report their location periodically)
  - Proximity check against disruption zones during claim generation
"""

import logging
import math
from datetime import datetime, timedelta

from db import supabase

logger = logging.getLogger(__name__)

# Approximate bounding boxes for monitored cities (center lat, center lon, radius_km)
CITY_ZONES: dict[str, tuple[float, float, float]] = {
    "Chennai":   (13.0827, 80.2707, 25.0),
    "Bangalore": (12.9716, 77.5946, 25.0),
    "Bengaluru": (12.9716, 77.5946, 25.0),
    "Hyderabad": (17.3850, 78.4867, 25.0),
    "Mumbai":    (19.0760, 72.8777, 30.0),
    "Delhi":     (28.6139, 77.2090, 30.0),
    "Pune":      (18.5204, 73.8567, 20.0),
    "Kolkata":   (22.5726, 88.3639, 25.0),
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth (km)."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def store_gps_checkin(worker_id: str, lat: float, lon: float) -> dict:
    """Store a GPS check-in from the mobile app.

    Workers periodically send their location while online.
    We store the latest position and use it during claim validation.
    """
    try:
        # Upsert: one row per worker, always update to latest position
        supabase.table("gps_checkins").upsert({
            "worker_id": worker_id,
            "latitude": lat,
            "longitude": lon,
            "checked_in_at": datetime.utcnow().isoformat(),
        }, on_conflict="worker_id").execute()

        return {"status": "ok", "worker_id": worker_id, "lat": lat, "lon": lon}
    except Exception as e:
        logger.error("GPS check-in failed for %s: %s", worker_id, e)
        return {"status": "error", "error": str(e)}


def validate_gps_proximity(worker_id: str, city: str, max_age_minutes: int = 60) -> dict:
    """Check if a worker's last known GPS position is within the disrupted city zone.

    Args:
        worker_id: The delivery partner ID
        city: The city where the disruption event occurred
        max_age_minutes: Maximum age of the GPS check-in to consider valid

    Returns:
        dict with: verified (bool), distance_km (float), details (str)
    """
    zone = CITY_ZONES.get(city)
    if not zone:
        return {
            "verified": False,
            "distance_km": None,
            "details": f"No GPS zone defined for city: {city}",
        }

    city_lat, city_lon, radius_km = zone

    try:
        cutoff = (datetime.utcnow() - timedelta(minutes=max_age_minutes)).isoformat()
        resp = (
            supabase.table("gps_checkins")
            .select("latitude, longitude, checked_in_at")
            .eq("worker_id", worker_id)
            .gte("checked_in_at", cutoff)
            .order("checked_in_at", desc=True)
            .limit(1)
            .execute()
        )

        if not resp.data:
            return {
                "verified": False,
                "distance_km": None,
                "details": "No recent GPS check-in found",
            }

        row = resp.data[0]
        worker_lat = row["latitude"]
        worker_lon = row["longitude"]
        distance = haversine_km(city_lat, city_lon, worker_lat, worker_lon)

        verified = distance <= radius_km
        return {
            "verified": verified,
            "distance_km": round(distance, 2),
            "details": (
                f"Worker is {distance:.1f}km from {city} center "
                f"({'within' if verified else 'outside'} {radius_km}km zone)"
            ),
        }

    except Exception as e:
        logger.error("GPS validation failed for %s: %s", worker_id, e)
        return {
            "verified": False,
            "distance_km": None,
            "details": f"GPS check error: {str(e)}",
        }
