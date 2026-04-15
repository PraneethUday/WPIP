-- ============================================================
-- GigGuard — Worker Payments Schema (Phase 3D)
-- Run in Supabase SQL Editor AFTER phase3_schema.sql
-- ============================================================

-- ── WORKER PAYMENTS ─────────────────────────────────────────
-- Persists weekly premium payments made by workers.
-- Replaces the in-memory payment-store in the Next.js app.
CREATE TABLE IF NOT EXISTS worker_payments (
    transaction_id  TEXT            PRIMARY KEY,
    worker_id       TEXT            NOT NULL,
    amount          NUMERIC(10,2)   NOT NULL,
    method          TEXT            NOT NULL CHECK (method IN ('upi', 'debit', 'credit')),
    tier            TEXT            NOT NULL DEFAULT 'standard',
    status          TEXT            NOT NULL DEFAULT 'success',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_worker   ON worker_payments (worker_id);
CREATE INDEX IF NOT EXISTS idx_payments_created  ON worker_payments (created_at DESC);

ALTER TABLE worker_payments ENABLE ROW LEVEL SECURITY;

-- Service role has full unrestricted access (used by Next.js API routes)
CREATE POLICY "Service role full access on worker_payments"
    ON worker_payments FOR ALL
    USING (true)
    WITH CHECK (true);
