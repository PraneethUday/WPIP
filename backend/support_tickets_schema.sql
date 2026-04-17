-- ============================================================
-- GigGuard — Support & Escalation Tickets
-- Run in Supabase SQL Editor (Dashboard -> SQL)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS support_tickets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id           TEXT NOT NULL,
    worker_name         TEXT,
    worker_email        TEXT,
    delivery_id         TEXT,

    ticket_type         TEXT NOT NULL DEFAULT 'support',
    -- 'support', 'claim_escalation'
    subject             TEXT NOT NULL,
    message             TEXT NOT NULL,

    claim_id            TEXT,
    claim_number        TEXT,
    claim_trigger_type  TEXT,
    source_tab          TEXT,

    status              TEXT NOT NULL DEFAULT 'open',
    -- 'open', 'in_progress', 'resolved'
    owner_notes         TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_worker
    ON support_tickets (worker_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status
    ON support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created
    ON support_tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_type
    ON support_tickets (ticket_type);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on support_tickets"
    ON support_tickets FOR ALL USING (true) WITH CHECK (true);
