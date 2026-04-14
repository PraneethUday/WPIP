-- ============================================================
-- GigGuard — Fuzzy Logic Schema Additions (Phase 3D)
-- Run in Supabase SQL Editor AFTER triggers_schema.sql
-- ============================================================

-- ── Add severity_score to disruption_events ──────────────────
-- Stores the continuous fuzzy severity score (0.0–1.0) alongside
-- the existing text label (moderate / severe / extreme).
ALTER TABLE disruption_events
    ADD COLUMN IF NOT EXISTS severity_score FLOAT DEFAULT 1.0;

-- ── Add fuzzy_payout_multiplier to claims ────────────────────
-- Records the exact fuzzy multiplier used at claim creation time
-- for full auditability of partial payout decisions.
ALTER TABLE claims
    ADD COLUMN IF NOT EXISTS fuzzy_payout_multiplier FLOAT DEFAULT 1.0;
