-- ============================================================
-- GigGuard — Worker Payments Schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- This replaces the old WPIP payments schema.
-- ============================================================

-- Drop old table if it exists (old schema had incompatible columns)
DROP TABLE IF EXISTS worker_payments;

CREATE TABLE worker_payments (
    transaction_id  TEXT            PRIMARY KEY,
    worker_id       TEXT            NOT NULL,
    amount          NUMERIC(10,2)   NOT NULL,
    method          TEXT            NOT NULL CHECK (method IN ('upi', 'debit', 'credit')),
    tier            TEXT            NOT NULL DEFAULT 'standard',
    status          TEXT            NOT NULL DEFAULT 'success',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_worker  ON worker_payments (worker_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON worker_payments (created_at DESC);

ALTER TABLE worker_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on worker_payments"
    ON worker_payments FOR ALL
    USING (true)
    WITH CHECK (true);
