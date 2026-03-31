"""
Synthetic data generator for delivery platform workers.
Generates ~200 persistent worker profiles and realistic daily activity data
across 8 platforms: Swiggy, Zomato, Amazon Flex, Blinkit, Zepto, Meesho,
Porter, and Dunzo.
"""

import uuid
import random
import hashlib
from datetime import date

import numpy as np

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PLATFORMS = [
    "swiggy",
    "zomato",
    "amazon_flex",
    "blinkit",
    "zepto",
    "meesho",
    "porter",
    "dunzo",
]

# Map platform → Supabase table name
PLATFORM_TABLE: dict[str, str] = {
    "swiggy":       "swiggy_workers",
    "zomato":       "zomato_workers",
    "amazon_flex":  "amazon_flex_workers",
    "blinkit":      "blinkit_workers",
    "zepto":        "zepto_workers",
    "meesho":       "meesho_workers",
    "porter":       "porter_workers",
    "dunzo":        "dunzo_workers",
}

CITIES = ["Chennai", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune"]
NUM_WORKERS = 200  # ~25 workers per platform

# Earnings per delivery range (INR)
EARNING_PER_DELIVERY_MIN = 25
EARNING_PER_DELIVERY_MAX = 40

# Hours-per-delivery ratio
HOURS_PER_DELIVERY_MIN = 0.35
HOURS_PER_DELIVERY_MAX = 0.55

# Anomaly probability
ANOMALY_CHANCE = 0.05

# Weekend boost multiplier
WEEKEND_BOOST = 1.3


# ---------------------------------------------------------------------------
# Deterministic worker ID generator
# ---------------------------------------------------------------------------

def _deterministic_uuid(seed_string: str) -> str:
    """Generate a deterministic UUID from a seed string so the same workers
    persist across runs."""
    h = hashlib.md5(seed_string.encode()).hexdigest()
    return str(uuid.UUID(h))


# ---------------------------------------------------------------------------
# Worker profile pool (generated once, stays consistent)
# ---------------------------------------------------------------------------

def generate_worker_profiles(n: int = NUM_WORKERS) -> list[dict]:
    """Create *n* persistent worker profiles evenly spread across all platforms.

    Each worker gets:
    - A deterministic worker_id (UUID)
    - A platform (one of the 8 platforms, assigned round-robin)
    - A base city
    - A base_daily_deliveries (8-25)
    - A rating (3.5-5.0)
    - A verified flag (90% True)
    """
    rng = random.Random(42)  # fixed seed → same profiles every time
    np_rng = np.random.default_rng(42)

    profiles = []
    for i in range(n):
        worker_id = _deterministic_uuid(f"gigguard-worker-{i}")
        platform = PLATFORMS[i % len(PLATFORMS)]  # evenly split across 8 platforms
        city = rng.choice(CITIES)
        base_daily_deliveries = rng.randint(8, 25)
        rating = round(np_rng.uniform(3.5, 5.0), 2)
        verified = rng.random() < 0.90

        profiles.append({
            "worker_id": worker_id,
            "platform": platform,
            "city": city,
            "base_daily_deliveries": base_daily_deliveries,
            "rating": rating,
            "verified": verified,
        })

    return profiles


# Singleton: generate once per process
WORKER_PROFILES = generate_worker_profiles()


# ---------------------------------------------------------------------------
# Daily activity generator
# ---------------------------------------------------------------------------

def generate_daily_rows(
    target_date: date | None = None,
    profiles: list[dict] | None = None,
) -> list[dict]:
    """Generate one row of activity per worker for *target_date*.

    Returns a list of dicts ready for Supabase insertion.
    Each row includes a 'table' key indicating the target table.
    """
    if target_date is None:
        target_date = date.today()
    if profiles is None:
        profiles = WORKER_PROFILES

    is_weekend = target_date.weekday() >= 5  # Sat=5, Sun=6
    rows: list[dict] = []

    for p in profiles:
        base = p["base_daily_deliveries"]

        # Normal distribution around base
        deliveries = int(np.random.normal(loc=base, scale=base * 0.15))
        deliveries = max(1, deliveries)

        # Weekend boost
        if is_weekend:
            deliveries = int(deliveries * WEEKEND_BOOST)

        # 5% anomaly spike (2×-3× deliveries)
        if random.random() < ANOMALY_CHANCE:
            deliveries = int(deliveries * random.uniform(2.0, 3.0))

        # Earnings
        rate_per_delivery = random.uniform(
            EARNING_PER_DELIVERY_MIN, EARNING_PER_DELIVERY_MAX
        )
        earnings = round(deliveries * rate_per_delivery, 2)

        # Active hours (correlated with deliveries)
        hours_per = random.uniform(HOURS_PER_DELIVERY_MIN, HOURS_PER_DELIVERY_MAX)
        active_hours = round(deliveries * hours_per, 2)
        active_hours = min(active_hours, 14.0)  # cap at 14h

        # Slight rating jitter (±0.1)
        rating = round(
            min(5.0, max(1.0, p["rating"] + random.uniform(-0.1, 0.1))), 2
        )

        rows.append({
            "_table": PLATFORM_TABLE[p["platform"]],  # routing key (not stored in DB)
            "worker_id": p["worker_id"],
            "platform": p["platform"],
            "date": target_date.isoformat(),
            "deliveries": deliveries,
            "earnings": earnings,
            "active_hours": active_hours,
            "rating": rating,
            "verified": p["verified"],
            "city": p["city"],
        })

    return rows
