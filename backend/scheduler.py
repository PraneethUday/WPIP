"""
Background scheduler – generates and inserts synthetic delivery data
into Supabase every 15 minutes.
"""

import asyncio
import logging
from datetime import date

from generator import generate_daily_rows
from db import upsert_rows

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(message)s",
)
logger = logging.getLogger(__name__)

INTERVAL_SECONDS = 15 * 60  # 15 minutes


async def tick() -> None:
    """Run one generation + upsert cycle.

    - First run of the day → INSERTs new rows for all workers.
    - Subsequent runs same day → UPDATEs deliveries, earnings, hours, etc.
    """
    today = date.today()
    rows = generate_daily_rows(target_date=today)
    logger.info("Generated %d rows for %s", len(rows), today.isoformat())

    try:
        result = upsert_rows(rows)
        logger.info(
            "Upserted %d rows into Supabase (insert or update).",
            len(rows),
        )
    except Exception as exc:
        logger.error("Supabase upsert failed: %s", exc)


async def run_scheduler() -> None:
    """Loop forever, calling tick() every INTERVAL_SECONDS."""
    logger.info(
        "Scheduler started — generating data every %d seconds (%d min).",
        INTERVAL_SECONDS,
        INTERVAL_SECONDS // 60,
    )
    while True:
        await tick()
        await asyncio.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    asyncio.run(run_scheduler())
