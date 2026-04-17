"""
Claims helper module — payout computation and eligibility checks.
"""

import logging
from datetime import date, timedelta

from db import supabase, PLATFORM_TABLES

logger = logging.getLogger(__name__)


def get_worker_daily_wage(worker_id: str, days: int = 7) -> float:
    """Estimate a worker's daily wage from their recent earnings history.

    Looks back `days` days across all platform tables and computes:
        total_earnings / number_of_active_days
    Returns 0 if no history is found.
    """
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    total_earnings = 0.0
    active_days: set[str] = set()

    for table in PLATFORM_TABLES:
        try:
            resp = (
                supabase.table(table)
                .select("earnings, date")
                .eq("worker_id", worker_id)
                .gte("date", cutoff)
                .execute()
            )
            for row in resp.data:
                total_earnings += row["earnings"]
                active_days.add(row["date"])
        except Exception:
            pass

    if not active_days:
        return 0.0

    return round(total_earnings / len(active_days), 2)


def compute_payout(
    daily_wage: float,
    disrupted_hours: float = 6.0,
    severity: float = 1.0,
    tier: str = "standard",
) -> float:
    """Compute the claim payout amount bounded by premium tier caps and severity.

    Formula:  payout = (daily_wage / active_hours_per_day) × disrupted_hours × severity
    We assume an 8-hour active day as the baseline.
    The raw payout is scaled by the fuzzy severity score and bounded by two caps:
      1. A daily wage percentage limit determined by the tier (Basic: 50%, Standard: 80%, Pro: 100%)
      2. The mathematical absolute tier ceiling.
    """
    if daily_wage <= 0 or severity <= 0.0:
        return 0.0

    from ml.premium_model import TIER_CONFIG
    import numpy as np
    
    tier_lower = tier.lower()
    tier_cfg = TIER_CONFIG.get(tier_lower, TIER_CONFIG["standard"])
    absolute_tier_cap = float(tier_cfg.get("max_payout", 1200))

    # Determine percentage of daily income covered based on their plan
    if tier_lower == "basic":
        wage_coverage_pct = 0.50   # 50% of daily wage
    elif tier_lower == "standard":
        wage_coverage_pct = 0.80   # 80% of daily wage
    else:  # pro
        wage_coverage_pct = 1.00   # 100% of daily wage

    hourly_rate = daily_wage / 8.0
    # Apply the plan's wage coverage percentage to their rate
    raw_payout = hourly_rate * wage_coverage_pct * disrupted_hours * severity
    
    # Cap 1: Coverage % of their daily wage scaled by severity
    # Cap 2: Absolute tier mathematical ceiling scaled by severity
    max_payout = min((daily_wage * wage_coverage_pct) * severity, absolute_tier_cap * severity)
    
    return round(float(np.clip(raw_payout, 0.0, max_payout)), 2)


def has_active_policy(worker_id: str) -> bool:
    """Check if the worker has a current premium prediction (active policy).

    A worker is considered covered if they have a premium_predictions row
    for the current or previous week.
    """
    today = date.today()
    # Find the Monday of the current week
    monday = today - timedelta(days=today.weekday())
    last_monday = monday - timedelta(days=7)

    try:
        resp = (
            supabase.table("premium_predictions")
            .select("id")
            .eq("worker_id", worker_id)
            .gte("week_start", last_monday.isoformat())
            .limit(1)
            .execute()
        )
        return len(resp.data) > 0
    except Exception as e:
        logger.warning("Could not check policy for %s: %s", worker_id, e)
        return False


def check_cross_platform_activity(worker_id: str, event_date: str) -> bool:
    """Check if the worker had ANY delivery activity on any platform on the event date.

    Returns True if NO activity was found (worker is clear for claim).
    Returns False if activity was detected (potential fraud flag).
    """
    for table in PLATFORM_TABLES:
        try:
            resp = (
                supabase.table(table)
                .select("deliveries")
                .eq("worker_id", worker_id)
                .eq("date", event_date)
                .gt("deliveries", 0)
                .limit(1)
                .execute()
            )
            if resp.data:
                # Worker was active on this platform during disruption
                return False
        except Exception:
            pass

    return True  # No activity found — worker is clear
