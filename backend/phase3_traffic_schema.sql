-- ============================================================
-- GigGuard — Phase 3 Schema Additions (Traffic & Curfew)
-- Run in Supabase SQL Editor AFTER the triggers_schema.sql
-- ============================================================

-- ── GPS CHECK-INS ───────────────────────────────────────────
-- Stores latest GPS position per worker for proximity validation.
CREATE TABLE IF NOT EXISTS gps_checkins (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       TEXT            NOT NULL UNIQUE,
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    checked_in_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_worker  ON gps_checkins (worker_id);
CREATE INDEX IF NOT EXISTS idx_gps_time    ON gps_checkins (checked_in_at DESC);

ALTER TABLE gps_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on gps_checkins"
    ON gps_checkins FOR ALL USING (true) WITH CHECK (true);

-- ── Add transaction_id column to claims if not exists ────────
ALTER TABLE claims ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- ============================================================
-- Phase 3 Traffic & Curfew additions
-- ============================================================

-- ── Additional columns on disruption_events for T-05 / T-06 ─
ALTER TABLE disruption_events
    ADD COLUMN IF NOT EXISTS tti_value           DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS current_speed_kmh   DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS curfew_confidence   DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS curfew_source       TEXT;

-- ── TTI history: tracks per-city TTI across polling cycles ───
-- Used to enforce the "2 consecutive cycles > 2.5" rule for T-05.
CREATE TABLE IF NOT EXISTS traffic_tti_history (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    city            TEXT            NOT NULL,
    tti_value       DOUBLE PRECISION NOT NULL,
    current_speed   DOUBLE PRECISION,
    free_flow_speed DOUBLE PRECISION,
    polled_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tti_city     ON traffic_tti_history (city);
CREATE INDEX IF NOT EXISTS idx_tti_polled   ON traffic_tti_history (polled_at DESC);

ALTER TABLE traffic_tti_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on traffic_tti_history"
    ON traffic_tti_history FOR ALL USING (true) WITH CHECK (true);
