"""
Fetch real-time weather and AQI data from OpenWeatherMap for Indian cities.
Uses:
  - Current Weather API  (temp, humidity, rain, wind, weather condition)
  - Air Pollution API    (AQI 1-5 scale + PM2.5/PM10)
"""

import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

OWM_API_KEY = os.getenv("OWM_API_KEY", "")

# Lat/Lon for supported cities
CITY_COORDS: dict[str, tuple[float, float]] = {
    "Chennai":    (13.0827, 80.2707),
    "Bangalore":  (12.9716, 77.5946),
    "Hyderabad":  (17.3850, 78.4867),
    "Mumbai":     (19.0760, 72.8777),
    "Delhi":      (28.6139, 77.2090),
    "Pune":       (18.5204, 73.8567),
    "Kolkata":    (22.5726, 88.3639),
    "Ahmedabad":  (23.0225, 72.5714),
    "Jaipur":     (26.9124, 75.7873),
    "Surat":      (21.1702, 72.8311),
    "Bengaluru":  (12.9716, 77.5946),  # alias
}

# OWM AQI scale: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
# We map to a 0-500 scale similar to India's NAQI for the ML model
AQI_SCALE_MAP = {1: 50, 2: 100, 3: 200, 4: 300, 5: 450}


# ---------------------------------------------------------------------------
# In-memory weather cache (5-minute TTL)
# ---------------------------------------------------------------------------
_weather_cache: dict[str, tuple[float, dict]] = {}  # city -> (timestamp, data)
_CACHE_TTL = 300  # 5 minutes


def fetch_weather(city: str) -> dict:
    """Fetch current weather for a city. Returns a flat dict of features.
    
    Results are cached for 5 minutes to avoid hammering the API.
    """
    # Normalize city name aliases
    if city in ("Bengaluru",):
        city = "Bangalore"

    # Check cache first
    if city in _weather_cache:
        cached_time, cached_data = _weather_cache[city]
        if time.time() - cached_time < _CACHE_TTL:
            return cached_data

    coords = CITY_COORDS.get(city)
    if not coords:
        return _default_weather()

    lat, lon = coords

    try:
        with httpx.Client(timeout=10) as client:
            # Current weather
            wr = client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"lat": lat, "lon": lon, "appid": OWM_API_KEY, "units": "metric"},
            )
            wr.raise_for_status()
            wd = wr.json()

            # Air pollution
            ar = client.get(
                "https://api.openweathermap.org/data/2.5/air_pollution",
                params={"lat": lat, "lon": lon, "appid": OWM_API_KEY},
            )
            ar.raise_for_status()
            ad = ar.json()

        # Parse weather
        temp = wd.get("main", {}).get("temp", 30.0)
        humidity = wd.get("main", {}).get("humidity", 50)
        wind_speed = wd.get("wind", {}).get("speed", 0.0)
        rain_1h = wd.get("rain", {}).get("1h", 0.0)
        rain_3h = wd.get("rain", {}).get("3h", 0.0)
        weather_id = wd.get("weather", [{}])[0].get("id", 800)
        weather_main = wd.get("weather", [{}])[0].get("main", "Clear")

        # Parse AQI
        aqi_list = ad.get("list", [{}])
        aqi_raw = aqi_list[0].get("main", {}).get("aqi", 2) if aqi_list else 2
        components = aqi_list[0].get("components", {}) if aqi_list else {}
        pm25 = components.get("pm2_5", 25.0)
        pm10 = components.get("pm10", 50.0)
        aqi_index = AQI_SCALE_MAP.get(aqi_raw, 100)

        # Derived risk flags
        is_heavy_rain = rain_1h > 20.0 or rain_3h > 64.5
        is_extreme_heat = temp > 39.5  # fuzzy entry point (T-02)
        is_severe_aqi = aqi_raw >= 4  # Poor or Very Poor
        is_flood_risk = rain_3h > 100.0

        result = {
            "temperature": round(temp, 1),
            "humidity": humidity,
            "wind_speed": round(wind_speed, 1),
            "rain_1h": round(rain_1h, 1),
            "rain_3h": round(rain_3h, 1),
            "weather_id": weather_id,
            "weather_main": weather_main,
            "aqi_index": aqi_index,
            "pm25": round(pm25, 1),
            "pm10": round(pm10, 1),
            "is_heavy_rain": is_heavy_rain,
            "is_extreme_heat": is_extreme_heat,
            "is_severe_aqi": is_severe_aqi,
            "is_flood_risk": is_flood_risk,
        }

        # Store in cache
        _weather_cache[city] = (time.time(), result)
        return result

    except Exception as e:
        print(f"[weather] Error fetching for {city}: {e}")
        return _default_weather()


def fetch_all_cities() -> dict[str, dict]:
    """Fetch weather for all major cities. Returns {city: weather_dict}."""
    results = {}
    for city in ["Chennai", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune"]:
        results[city] = fetch_weather(city)
    return results


def _default_weather() -> dict:
    """Fallback weather when API is unavailable."""
    return {
        "temperature": 30.0,
        "humidity": 60,
        "wind_speed": 5.0,
        "rain_1h": 0.0,
        "rain_3h": 0.0,
        "weather_id": 800,
        "weather_main": "Clear",
        "aqi_index": 100,
        "pm25": 25.0,
        "pm10": 50.0,
        "is_heavy_rain": False,
        "is_extreme_heat": False,
        "is_severe_aqi": False,
        "is_flood_risk": False,
    }
