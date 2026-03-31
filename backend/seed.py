"""
One-time seed script — backfills 30 days of historical data for all 200
workers across all 8 platform tables.

Run once locally:
    source venv/bin/activate
    python seed.py
"""

import asyncio
import logging
from datetime import date, timedelta

from generator import generate_daily_rows
from db import upsert_rows

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(message)s",
)
logger = logging.getLogger(__name__)

DAYS_TO_SEED = 30


async def seed():
    today = date.today()
    logger.info("Seeding %d days of data for all platforms...", DAYS_TO_SEED)

    for offset in range(DAYS_TO_SEED, -1, -1):  # oldest → today
        target = today - timedelta(days=offset)
        rows = generate_daily_rows(target_date=target)
        try:
            upsert_rows(rows)
            logger.info("  ✓ %s — %d rows upserted", target.isoformat(), len(rows))
        except Exception as exc:
            logger.error("  ✗ %s — failed: %s", target.isoformat(), exc)

    logger.info("Seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed())
