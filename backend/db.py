"""
Supabase connection module.
Provides a singleton Supabase client for database operations.
Each platform has its own table: swiggy_workers, zomato_workers, etc.
"""

import os
from collections import defaultdict
from datetime import date, timedelta

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables. "
        "Check your .env file."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# All platform table names
PLATFORM_TABLES = [
    "swiggy_workers",
    "zomato_workers",
    "amazon_flex_workers",
    "blinkit_workers",
    "zepto_workers",
    "meesho_workers",
    "porter_workers",
    "dunzo_workers",
]


def upsert_rows(rows: list[dict]) -> None:
    """Upsert a batch of rows, routing each row to its platform table.

    Each row must have a '_table' key (set by generator.py) indicating the
    target table. The '_table' key is stripped before insertion.
    Uses the unique constraint (worker_id, date) per table for upsert.
    """
    from datetime import datetime

    now = datetime.utcnow().isoformat()

    # Group rows by target table
    by_table: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        table = row.pop("_table")
        row["updated_at"] = now
        by_table[table].append(row)

    for table, table_rows in by_table.items():
        supabase.table(table).upsert(
            table_rows, on_conflict="worker_id,date"
        ).execute()


# Backward-compatible alias
insert_rows = upsert_rows


def fetch_workers(platform: str | None = None, limit: int = 500) -> list[dict]:
    """Fetch the latest worker data from the appropriate platform table(s).

    If platform is None, fetches from all tables and merges the results.
    """
    if platform:
        table = f"{platform}_workers"
        response = (
            supabase.table(table)
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data

    # Fetch from all tables and merge
    all_data: list[dict] = []
    per_table_limit = max(1, limit // len(PLATFORM_TABLES))
    for table in PLATFORM_TABLES:
        try:
            response = (
                supabase.table(table)
                .select("*")
                .order("created_at", desc=True)
                .limit(per_table_limit)
                .execute()
            )
            all_data.extend(response.data)
        except Exception:
            pass  # skip tables that may not exist yet

    return all_data[:limit]


def fetch_worker_history(worker_id: str, days: int = 30) -> list[dict]:
    """Fetch historical data for a specific worker across all platform tables."""
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    all_data: list[dict] = []

    for table in PLATFORM_TABLES:
        try:
            response = (
                supabase.table(table)
                .select("*")
                .eq("worker_id", worker_id)
                .gte("date", cutoff)
                .order("date", desc=True)
                .execute()
            )
            all_data.extend(response.data)
        except Exception:
            pass

    # Sort combined results by date descending
    all_data.sort(key=lambda r: r.get("date", ""), reverse=True)
    return all_data
