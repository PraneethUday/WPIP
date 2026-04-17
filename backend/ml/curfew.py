"""
GDELT + HuggingFace NLP curfew / unrest detection for GigGuard Phase 3.

Two-stage pipeline:
  1. Fetch the GDELT 2.0 15-minute JSON update, filtered for Indian
     geo-coordinates (lat 8–37, lon 68–97) and protest/unrest event codes.
  2. Run local RSS headlines through a HuggingFace zero-shot-classification
     pipeline to detect curfew/riot/strike language.

The combined confidence score drives trigger T-06.

Design constraints:
  - All HTTP calls use httpx.AsyncClient (non-blocking).
  - The HuggingFace pipeline is wrapped in aggressive try/except so that
    an OOM or model-load crash never takes down the 15-minute polling loop.
  - Fallback is always confidence=0.0 (no disruption assumed).
"""

import asyncio
import logging
import time
from typing import Any

import httpx
import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# GDELT 2.0 configuration
# ---------------------------------------------------------------------------

# GDELT GKG (Global Knowledge Graph) latest 15-min update
GDELT_LATEST_URL = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"

# CAMEO event codes related to civil unrest
# 14 = Protest, 145 = Protest with force, 18 = Assault, 19 = Fight
CAMEO_UNREST_CODES = {"14", "141", "142", "143", "144", "145", "18", "19"}

# India bounding box
INDIA_LAT_MIN, INDIA_LAT_MAX = 8.0, 37.0
INDIA_LON_MIN, INDIA_LON_MAX = 68.0, 97.0

# City approximate coordinates for geo-matching GDELT events within 50 km
CITY_COORDS: dict[str, tuple[float, float]] = {
    "Chennai":    (13.0827, 80.2707),
    "Bangalore":  (12.9716, 77.5946),
    "Bengaluru":  (12.9716, 77.5946),
    "Hyderabad":  (17.3850, 78.4867),
    "Mumbai":     (19.0760, 72.8777),
    "Delhi":      (28.6139, 77.2090),
    "Pune":       (18.5204, 73.8567),
    "Kolkata":    (22.5726, 88.3639),
}

# ---------------------------------------------------------------------------
# NLP pipeline — lazy-loaded singleton
# ---------------------------------------------------------------------------

_nlp_pipeline = None
_nlp_load_failed = False

CURFEW_LABELS = ["curfew", "section 144", "riot", "strike"]


def _get_nlp_pipeline():
    """Lazy-load the HuggingFace zero-shot-classification pipeline.

    Uses the smaller cross-encoder/nli-deberta-v3-xsmall (~50 MB) to
    minimise memory pressure on the polling loop.

    Returns None if loading fails for any reason.
    """
    global _nlp_pipeline, _nlp_load_failed

    if _nlp_load_failed:
        return None

    if _nlp_pipeline is not None:
        return _nlp_pipeline

    try:
        from transformers import pipeline as hf_pipeline
        logger.info("[curfew] Loading zero-shot-classification model (first run downloads ~50 MB)...")
        _nlp_pipeline = hf_pipeline(
            "zero-shot-classification",
            model="cross-encoder/nli-deberta-v3-xsmall",
            device=-1,  # CPU only — safe for constrained environments
        )
        logger.info("[curfew] NLP pipeline loaded successfully.")
        return _nlp_pipeline
    except Exception as exc:
        logger.error("[curfew] Failed to load HuggingFace pipeline: %s", exc)
        _nlp_load_failed = True
        return None


# ---------------------------------------------------------------------------
# GDELT event fetching
# ---------------------------------------------------------------------------

# In-memory cache: city -> (timestamp, events_list)
_gdelt_cache: dict[str, tuple[float, list[dict]]] = {}
_GDELT_CACHE_TTL = 900  # 15 minutes (aligned with GDELT update cadence)


async def fetch_gdelt_india_events(city: str) -> list[dict]:
    """Fetch recent GDELT events near a specific Indian city.

    Strategy:
      1. Hit the GDELT 2.0 latest-update manifest to get the URL of
         the newest 15-minute export CSV.
      2. Download and parse the CSV, filtering for:
         - Indian coordinates (bounding box)
         - Proximity to the target city (within 1° lat/lon ≈ ~100 km)
         - CAMEO event codes related to unrest

    Returns a list of raw event dicts (may be empty).
    """
    if city == "Bengaluru":
        city = "Bangalore"

    # Check cache
    if city in _gdelt_cache:
        cached_ts, cached_events = _gdelt_cache[city]
        if time.time() - cached_ts < _GDELT_CACHE_TTL:
            return cached_events

    coords = CITY_COORDS.get(city)
    if not coords:
        return []

    city_lat, city_lon = coords
    events: list[dict] = []

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Step 1: Get the manifest to find the latest export URL
            manifest_resp = await client.get(GDELT_LATEST_URL)
            manifest_resp.raise_for_status()
            manifest_lines = manifest_resp.text.strip().split("\n")

            # The first line contains the events export
            # Format: "<size> <hash> <url>"
            if not manifest_lines:
                return []

            parts = manifest_lines[0].strip().split()
            if len(parts) < 3:
                return []

            export_url = parts[2]  # the URL

            # Step 2: Download the zipped CSV
            # GDELT exports are gzipped CSVs — we'll try to read them
            csv_resp = await client.get(export_url)
            csv_resp.raise_for_status()

            # Decompress if gzipped
            import io
            import zipfile

            try:
                zf = zipfile.ZipFile(io.BytesIO(csv_resp.content))
                csv_name = zf.namelist()[0]
                csv_text = zf.read(csv_name).decode("utf-8", errors="replace")
            except Exception:
                # May not be zip — try plain text
                csv_text = csv_resp.text

            # Step 3: Parse tab-separated GDELT events
            # GDELT v2 events have 61 columns. Key columns:
            #   col 0: GlobalEventID
            #   col 5: EventCode (CAMEO)
            #   col 17: Actor1Geo_Lat
            #   col 18: Actor1Geo_Long
            #   col 53: ActionGeo_Lat
            #   col 54: ActionGeo_Long
            #   col 57: SOURCEURL
            for line in csv_text.strip().split("\n")[:500]:  # cap at 500 rows
                cols = line.split("\t")
                if len(cols) < 58:
                    continue

                event_code = cols[26] if len(cols) > 26 else ""  # EventBaseCode
                # Check if this is an unrest-related event
                if event_code not in CAMEO_UNREST_CODES:
                    continue

                # Parse coordinates (ActionGeo preferred, fallback to Actor1Geo)
                try:
                    lat = float(cols[53]) if cols[53] else None
                    lon = float(cols[54]) if cols[54] else None
                except (ValueError, IndexError):
                    lat, lon = None, None

                if lat is None or lon is None:
                    try:
                        lat = float(cols[17]) if cols[17] else None
                        lon = float(cols[18]) if cols[18] else None
                    except (ValueError, IndexError):
                        continue

                if lat is None or lon is None:
                    continue

                # Filter: must be in India
                if not (INDIA_LAT_MIN <= lat <= INDIA_LAT_MAX and
                        INDIA_LON_MIN <= lon <= INDIA_LON_MAX):
                    continue

                # Filter: must be within ~1° of target city
                if abs(lat - city_lat) > 1.0 or abs(lon - city_lon) > 1.0:
                    continue

                source_url = cols[57] if len(cols) > 57 else ""
                events.append({
                    "event_id": cols[0],
                    "event_code": event_code,
                    "lat": lat,
                    "lon": lon,
                    "source_url": source_url,
                })

        # Cache results
        _gdelt_cache[city] = (time.time(), events)
        logger.info("[curfew] GDELT: found %d unrest events near %s", len(events), city)

    except Exception as exc:
        logger.error("[curfew] GDELT fetch error for %s: %s", city, exc)

    return events


# ---------------------------------------------------------------------------
# RSS headline classification
# ---------------------------------------------------------------------------

# Default RSS feeds for Indian city news / police updates
DEFAULT_RSS_FEEDS: dict[str, list[str]] = {
    "Chennai":    [
        "https://timesofindia.indiatimes.com/rssfeeds/2950623.cms",  # TOI Chennai
    ],
    "Bangalore":  [
        "https://timesofindia.indiatimes.com/rssfeeds/2961717.cms",  # TOI Bangalore
    ],
    "Hyderabad":  [
        "https://timesofindia.indiatimes.com/rssfeeds/3373565.cms",  # TOI Hyderabad
    ],
    "Mumbai":     [
        "https://timesofindia.indiatimes.com/rssfeeds/2950623.cms",  # TOI Mumbai
    ],
    "Delhi":      [
        "https://timesofindia.indiatimes.com/rssfeeds/2950623.cms",  # TOI Delhi
    ],
    "Pune":       [
        "https://timesofindia.indiatimes.com/rssfeeds/2950623.cms",  # TOI Pune
    ],
}


async def fetch_rss_headlines(city: str, max_headlines: int = 20) -> list[str]:
    """Fetch recent headlines from RSS feeds for a city.

    Uses feedparser for robust RSS/Atom parsing.  Limited to
    `max_headlines` to keep NLP inference fast.
    """
    if city == "Bengaluru":
        city = "Bangalore"

    feeds = DEFAULT_RSS_FEEDS.get(city, [])
    if not feeds:
        return []

    headlines: list[str] = []
    try:
        import feedparser

        async with httpx.AsyncClient(timeout=10) as client:
            for feed_url in feeds:
                try:
                    resp = await client.get(feed_url)
                    resp.raise_for_status()
                    parsed = feedparser.parse(resp.text)
                    for entry in parsed.entries[:max_headlines]:
                        title = entry.get("title", "").strip()
                        if title:
                            headlines.append(title)
                except Exception as exc:
                    logger.warning("[curfew] RSS fetch failed for %s: %s", feed_url, exc)

    except ImportError:
        logger.warning("[curfew] feedparser not installed — skipping RSS")
    except Exception as exc:
        logger.error("[curfew] RSS pipeline error: %s", exc)

    return headlines[:max_headlines]


def classify_headlines(headlines: list[str]) -> tuple[float, str]:
    """Run zero-shot classification on headlines looking for curfew signals.

    Uses batch inference (all headlines in one pipeline call) to avoid
    blocking the event loop for 20 sequential forward passes.

    Returns:
        (max_confidence, matched_label)

    If the NLP pipeline is unavailable or crashes, returns (0.0, "none").
    """
    if not headlines:
        return 0.0, "none"

    pipe = _get_nlp_pipeline()
    if pipe is None:
        return 0.0, "none"

    max_conf = 0.0
    best_label = "none"

    try:
        # Batch all headlines in a single pipeline call — much faster than a loop
        results = pipe(headlines, candidate_labels=CURFEW_LABELS)
        # Single-headline input returns a dict; multi returns a list
        if isinstance(results, dict):
            results = [results]

        for result in results:
            top_score = float(result["scores"][0])
            top_label = str(result["labels"][0])
            if top_score > max_conf:
                max_conf = top_score
                best_label = top_label

    except Exception as exc:
        logger.error("[curfew] NLP classification crashed: %s", exc)
        return 0.0, "none"

    return round(float(np.clip(max_conf, 0.0, 1.0)), 4), best_label


# ---------------------------------------------------------------------------
# Combined curfew risk evaluator
# ---------------------------------------------------------------------------

async def evaluate_curfew_risk(city: str) -> dict[str, Any]:
    """Evaluate combined curfew/unrest risk for a city.

    Combines:
      - GDELT event count (each event adds 0.15 to base confidence, capped)
      - NLP headline classification confidence

    Final confidence = clip(gdelt_score + nlp_score, 0, 1)
    where:
      gdelt_score = min(gdelt_event_count * 0.15, 0.5)
      nlp_score   = headline classification top score

    Returns:
        {
            "confidence": float,      # 0.0 – 1.0
            "gdelt_events": int,
            "gdelt_score": float,
            "nlp_score": float,
            "nlp_label": str,
            "fired": bool,            # confidence >= 0.8
            "source": str,
        }
    """
    if city == "Bengaluru":
        city = "Bangalore"

    # Stage 1: GDELT events
    gdelt_events = await fetch_gdelt_india_events(city)
    gdelt_count = len(gdelt_events)
    gdelt_score = float(np.clip(gdelt_count * 0.15, 0.0, 0.5))

    # Stage 2: RSS + NLP
    # classify_headlines() is synchronous (HuggingFace CPU inference).
    # Run in a thread so it never blocks the asyncio event loop.
    headlines = await fetch_rss_headlines(city)
    
    # Run heavy NLP classification in a thread so we don't freeze the main event loop!
    import asyncio
    # Serialize the PyTorch execution to prevent OpenMP CPU thrashing
    global _nlp_lock
    if '_nlp_lock' not in globals():
        _nlp_lock = asyncio.Lock()
        
    async with _nlp_lock:
        nlp_score, nlp_label = await asyncio.to_thread(classify_headlines, headlines)

    # Combined confidence (deterministic, no randomness)
    confidence = float(np.clip(gdelt_score + nlp_score, 0.0, 1.0))
    fired = confidence >= 0.8

    result = {
        "confidence": round(confidence, 4),
        "gdelt_events": gdelt_count,
        "gdelt_score": round(gdelt_score, 4),
        "nlp_score": round(nlp_score, 4),
        "nlp_label": nlp_label,
        "fired": fired,
        "source": "gdelt+nlp",
    }

    if fired:
        logger.warning(
            "[curfew] T-06 SIGNAL in %s — confidence=%.2f (GDELT=%d events, NLP='%s' @ %.2f)",
            city, confidence, gdelt_count, nlp_label, nlp_score,
        )

    return result
