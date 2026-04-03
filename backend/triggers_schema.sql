-- ============================================================
-- GigGuard — Parametric Trigger Tables
-- Run in Supabase SQL Editor (Dashboard → SQL)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── DISRUPTION EVENTS ───────────────────────────────────────
-- One row per detected threshold breach per city per trigger type.
-- The poll_triggers() function upserts here every 15 minutes.
CREATE TABLE IF NOT EXISTS disruption_events (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_id      TEXT            NOT NULL,        -- e.g. 'T-01', 'T-02'
    trigger_type    TEXT            NOT NULL,        -- 'heavy_rain', 'extreme_heat', 'severe_aqi', 'flood'
    city            TEXT            NOT NULL,
    severity        TEXT            NOT NULL DEFAULT 'moderate',  -- 'moderate', 'severe', 'extreme'
    description     TEXT,

    -- Weather snapshot at trigger time
    temperature     DOUBLE PRECISION,
    rain_1h         DOUBLE PRECISION,
    rain_3h         DOUBLE PRECISION,
    aqi_index       INTEGER,
    wind_speed      DOUBLE PRECISION,

    -- Lifecycle
    status          TEXT            NOT NULL DEFAULT 'active',  -- 'active', 'resolved', 'expired'
    started_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Prevent duplicate events for the same trigger+city on the same day
    event_date      DATE            NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(trigger_id, city, event_date)
);

CREATE INDEX IF NOT EXISTS idx_de_city       ON disruption_events (city);
CREATE INDEX IF NOT EXISTS idx_de_status     ON disruption_events (status);
CREATE INDEX IF NOT EXISTS idx_de_date       ON disruption_events (event_date);
CREATE INDEX IF NOT EXISTS idx_de_trigger    ON disruption_events (trigger_id);

ALTER TABLE disruption_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on disruption_events"
    ON disruption_events FOR ALL USING (true) WITH CHECK (true);


-- ── CLAIMS ──────────────────────────────────────────────────
-- One row per auto-initiated claim per worker per disruption event.
-- Created by the trigger engine when a disruption is detected.
CREATE TABLE IF NOT EXISTS claims (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number    TEXT            NOT NULL UNIQUE,      -- human-readable e.g. 'CLM-20260403-001'
    worker_id       TEXT            NOT NULL,              -- the delivery partner ID
    platform        TEXT            NOT NULL,              -- primary platform at time of claim
    city            TEXT            NOT NULL,

    -- Link to disruption
    disruption_event_id  UUID       NOT NULL REFERENCES disruption_events(id),
    trigger_id           TEXT       NOT NULL,
    trigger_type         TEXT       NOT NULL,

    -- Payout
    payout_amount        DOUBLE PRECISION NOT NULL DEFAULT 0,
    daily_wage_est       DOUBLE PRECISION,
    disrupted_hours      DOUBLE PRECISION DEFAULT 6,       -- estimated hours lost
    payout_status        TEXT       NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'paid', 'rejected'
    payout_method        TEXT       DEFAULT 'UPI',

    -- Fraud checks
    fraud_score          DOUBLE PRECISION DEFAULT 0,
    fraud_flags          TEXT[]     DEFAULT '{}',
    gps_verified         BOOLEAN    DEFAULT FALSE,
    cross_platform_clear BOOLEAN    DEFAULT FALSE,        -- no activity on other platforms

    -- Lifecycle
    status               TEXT       NOT NULL DEFAULT 'auto_initiated',
    -- 'auto_initiated', 'under_review', 'approved', 'paid', 'rejected'
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at          TIMESTAMPTZ,
    paid_at              TIMESTAMPTZ,

    -- Prevent duplicate claims for same worker + same disruption event
    UNIQUE(worker_id, disruption_event_id)
);

CREATE INDEX IF NOT EXISTS idx_claims_worker    ON claims (worker_id);
CREATE INDEX IF NOT EXISTS idx_claims_city      ON claims (city);
CREATE INDEX IF NOT EXISTS idx_claims_status    ON claims (status);
CREATE INDEX IF NOT EXISTS idx_claims_event     ON claims (disruption_event_id);
CREATE INDEX IF NOT EXISTS idx_claims_created   ON claims (created_at DESC);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on claims"
    ON claims FOR ALL USING (true) WITH CHECK (true);
