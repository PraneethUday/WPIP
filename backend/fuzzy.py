"""
Fuzzy Logic Severity Engine — GigGuard Parametric Trigger System.

Replaces binary ON/OFF thresholds with a continuous severity score (0.0–1.0)
so payout amounts scale proportionally with disruption intensity, reducing
basis risk in parametric insurance payouts.

Calibration table:
  T-01  Heavy Rain  — rain intensity (mm)  : 0% @ 20mm  → 100% @ 100mm
  T-02  Extreme Heat — temperature (°C)    : 0% @ 39.5° → 100% @ 45°C
  T-03  Severe AQI  — aqi_index            : 0% @ 300   → 100% @ 450
  T-04  Flood Risk  — rain_3h (mm)         : 0% @ 64.5  → 100% @ 150mm
  T-05  Curfew      — binary stub           : 0% or 100% (no fuzzy yet)
"""

from __future__ import annotations


# ---------------------------------------------------------------------------
# Core fuzzy membership function  (linear / trapezoidal)
# ---------------------------------------------------------------------------

def fuzzy_score(value: float, low: float, high: float) -> float:
    """Linear fuzzy membership function.

    Returns a severity score in [0.0, 1.0]:
      - 0.0  for values ≤ low   (entry threshold — no disruption)
      - 1.0  for values ≥ high  (ceiling   — maximum disruption)
      - Linear interpolation in between  (partial disruption)

    Example (T-02 Heat, low=39.5, high=45.0):
      40.0 → 0.09   (just over entry, tiny payout)
      42.5 → 0.545  (moderate disruption, ~55% payout)
      45.0 → 1.0    (extreme heat, full payout)
    """
    if value <= low:
        return 0.0
    if value >= high:
        return 1.0
    return round((value - low) / (high - low), 3)


def _score_to_label(score: float) -> str:
    """Map a numeric severity score to a human-readable text label."""
    if score >= 0.75:
        return "extreme"
    if score >= 0.40:
        return "severe"
    if score > 0.0:
        return "moderate"
    return "none"


# ---------------------------------------------------------------------------
# Per-trigger calibration  (low, high)
# low  = entry point: any reading below this yields 0% payout
# high = ceiling:     any reading above this yields 100% payout
# ---------------------------------------------------------------------------

_TRIGGER_CALIBRATION: dict[str, tuple[float, float]] = {
    "T-01": (20.0,  100.0),   # rain intensity (mm), combined 1h/3h signal
    "T-02": (39.5,  45.0),    # temperature (°C) — entry 39.5°C per design
    "T-03": (300.0, 450.0),   # aqi_index (India NAQI scale)
    "T-04": (64.5,  150.0),   # rain_3h (mm) for flood risk
    "T-05": (0.0,   1.0),     # curfew stub — binary until govt feed integration
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_trigger_severity(
    trigger_id: str, weather: dict
) -> tuple[str, float]:
    """Compute fuzzy severity for a given trigger + weather snapshot.

    Args:
        trigger_id: GigGuard trigger code, e.g. "T-01", "T-02".
        weather:    Weather dict from ml.weather.fetch_weather().

    Returns:
        (text_label, float_score)
          text_label  — "none" | "moderate" | "severe" | "extreme"
          float_score — continuous value in [0.0, 1.0]
    """
    calibration = _TRIGGER_CALIBRATION.get(trigger_id)
    if not calibration:
        # Unknown trigger: default to full severity to avoid silent misses
        return ("severe", 1.0)

    low, high = calibration

    # Resolve the measurement value for this trigger type
    if trigger_id == "T-01":
        # Use the strongest available rain signal:
        # rain_3h is preferable; if unavailable, extrapolate from rain_1h
        rain_3h = weather.get("rain_3h", 0.0) or 0.0
        rain_1h = weather.get("rain_1h", 0.0) or 0.0
        value = max(rain_3h, rain_1h * 3.0)

    elif trigger_id == "T-02":
        value = float(weather.get("temperature", 0.0) or 0.0)

    elif trigger_id == "T-03":
        value = float(weather.get("aqi_index", 0) or 0)

    elif trigger_id == "T-04":
        value = float(weather.get("rain_3h", 0.0) or 0.0)

    elif trigger_id == "T-05":
        # Curfew stub: binary until a government/news feed is integrated
        value = 1.0 if weather.get("curfew_active", False) else 0.0

    else:
        return ("severe", 1.0)

    score = fuzzy_score(value, low, high)
    label = _score_to_label(score)
    return (label, score)
