"""
Render cron job entry point.

Runs one data-generation tick (today's rows for all 200 workers across
all 8 platform tables) then exits.

Render cron schedule: every 15 minutes  →  */15 * * * *
"""

import asyncio
import logging
from scheduler import tick

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(message)s",
)

if __name__ == "__main__":
    asyncio.run(tick())
