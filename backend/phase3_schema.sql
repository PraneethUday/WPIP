-- ============================================================
-- GigGuard — Phase 3 Schema Additions
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
