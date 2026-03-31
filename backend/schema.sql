-- ============================================================
-- GigGuard — Supabase Tables: one per delivery platform
-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL)
-- ============================================================

-- Enable the uuid-ossp extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Helper: macro-like block repeated for every platform table
-- Platforms: swiggy, zomato, amazon_flex, blinkit,
--            zepto, meesho, porter, dunzo
-- ============================================================

-- ── SWIGGY ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS swiggy_workers (
    id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id    TEXT             NOT NULL,
    platform     TEXT             NOT NULL DEFAULT 'swiggy',
    date         DATE             NOT NULL,
    deliveries   INTEGER          NOT NULL,
    earnings     DOUBLE PRECISION NOT NULL,
    active_hours DOUBLE PRECISION NOT NULL,
    rating       DOUBLE PRECISION NOT NULL,
    verified     BOOLEAN          NOT NULL DEFAULT TRUE,
    city         TEXT             NOT NULL,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_swiggy_worker_date UNIQUE (worker_id, date)
);
CREATE INDEX IF NOT EXISTS idx_swiggy_worker_id  ON swiggy_workers (worker_id);
CREATE INDEX IF NOT EXISTS idx_swiggy_created_at ON swiggy_workers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swiggy_date       ON swiggy_workers (date);
ALTER TABLE swiggy_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access – swiggy"
    ON swiggy_workers FOR ALL USING (true) WITH CHECK (true);

-- ── ZOMATO ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zomato_workers (
    id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id    TEXT             NOT NULL,
    platform     TEXT             NOT NULL DEFAULT 'zomato',
    date         DATE             NOT NULL,
    deliveries   INTEGER          NOT NULL,
    earnings     DOUBLE PRECISION NOT NULL,
    active_hours DOUBLE PRECISION NOT NULL,
    rating       DOUBLE PRECISION NOT NULL,
    verified     BOOLEAN          NOT NULL DEFAULT TRUE,
    city         TEXT             NOT NULL,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_zomato_worker_date UNIQUE (worker_id, date)
);
CREATE INDEX IF NOT EXISTS idx_zomato_worker_id  ON zomato_workers (worker_id);
CREATE INDEX IF NOT EXISTS idx_zomato_created_at ON zomato_workers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zomato_date       ON zomato_workers (date);
ALTER TABLE zomato_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access – zomato"
    ON zomato_workers FOR ALL USING (true) WITH CHECK (true);

-- ── AMAZON FLEX ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amazon_flex_workers (
    id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id    TEXT             NOT NULL,
    platform     TEXT             NOT NULL DEFAULT 'amazon_flex',
    date         DATE             NOT NULL,
    deliveries   INTEGER          NOT NULL,
    earnings     DOUBLE PRECISION NOT NULL,
    active_hours DOUBLE PRECISION NOT NULL,
    rating       DOUBLE PRECISION NOT NULL,
    verified     BOOLEAN          NOT NULL DEFAULT TRUE,
    city         TEXT             NOT NULL,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_amazon_flex_worker_date UNIQUE (worker_id, date)
);
CREATE INDEX IF NOT EXISTS idx_amazon_flex_worker_id  ON amazon_flex_workers (worker_id);
CREATE INDEX IF NOT EXISTS idx_amazon_flex_created_at ON amazon_flex_workers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_amazon_flex_date       ON amazon_flex_workers (date);
ALTER TABLE amazon_flex_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access – amazon_flex"
    ON amazon_flex_workers FOR ALL USING (true) WITH CHECK (true);

-- ── BLINKIT ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blinkit_workers (
    id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id    TEXT             NOT NULL,
    platform     TEXT             NOT NULL DEFAULT 'blinkit',
    date         DATE             NOT NULL,
    deliveries   INTEGER          NOT NULL,
    earnings     DOUBLE PRECISION NOT NULL,
    active_hours DOUBLE PRECISION NOT NULL,
    rating       DOUBLE PRECISION NOT NULL,
    verified     BOOLEAN          NOT NULL DEFAULT TRUE,
    city         TEXT             NOT NULL,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_blinkit_worker_date UNIQUE (worker_id, date)
);
CREATE INDEX IF NOT EXISTS idx_blinkit_worker_id  ON blinkit_workers (worker_id);
CREATE INDEX IF NOT EXISTS idx_blinkit_created_at ON blinkit_workers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blinkit_date       ON blinkit_workers (date);
ALTER TABLE blinkit_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access – blinkit"
    ON blinkit_workers FOR ALL USING (true) WITH CHECK (true);

-- ── ZEPTO ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zepto_workers (
    id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id    TEXT             NOT NULL,
    platform     TEXT             NOT NULL DEFAULT 'zepto',
    date         DATE             NOT NULL,
    deliveries   INTEGER          NOT NULL,
    earnings     DOUBLE PRECISION NOT NULL,
    active_hours DOUBLE PRECISION NOT NULL,
    rating       DOUBLE PRECISION NOT NULL,
    verified     BOOLEAN          NOT NULL DEFAULT TRUE,
    city         TEXT             NOT NULL,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_zepto_worker_date UNIQUE (worker_id, date)
);
CREATE INDEX IF NOT EXISTS idx_zepto_worker_id  ON zepto_workers (worker_id);
CREATE INDEX IF NOT EXISTS idx_zepto_created_at ON zepto_workers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zepto_date       ON zepto_workers (date);
ALTER TABLE zepto_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access – zepto"
    ON zepto_workers FOR ALL USING (true) WITH CHECK (true);

-- ── MEESHO ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meesho_workers (
    id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id    TEXT             NOT NULL,
    platform     TEXT             NOT NULL DEFAULT 'meesho',
    date         DATE             NOT NULL,
    deliveries   INTEGER          NOT NULL,
    earnings     DOUBLE PRECISION NOT NULL,
    active_hours DOUBLE PRECISION NOT NULL,
    rating       DOUBLE PRECISION NOT NULL,
    verified     BOOLEAN          NOT NULL DEFAULT TRUE,
    city         TEXT             NOT NULL,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_meesho_worker_date UNIQUE (worker_id, date)
);
CREATE INDEX IF NOT EXISTS idx_meesho_worker_id  ON meesho_workers (worker_id);
CREATE INDEX IF NOT EXISTS idx_meesho_created_at ON meesho_workers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meesho_date       ON meesho_workers (date);
ALTER TABLE meesho_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access – meesho"
    ON meesho_workers FOR ALL USING (true) WITH CHECK (true);

-- ── PORTER ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS porter_workers (
    id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id    TEXT             NOT NULL,
    platform     TEXT             NOT NULL DEFAULT 'porter',
    date         DATE             NOT NULL,
    deliveries   INTEGER          NOT NULL,
    earnings     DOUBLE PRECISION NOT NULL,
    active_hours DOUBLE PRECISION NOT NULL,
    rating       DOUBLE PRECISION NOT NULL,
    verified     BOOLEAN          NOT NULL DEFAULT TRUE,
    city         TEXT             NOT NULL,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_porter_worker_date UNIQUE (worker_id, date)
);
CREATE INDEX IF NOT EXISTS idx_porter_worker_id  ON porter_workers (worker_id);
CREATE INDEX IF NOT EXISTS idx_porter_created_at ON porter_workers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_porter_date       ON porter_workers (date);
ALTER TABLE porter_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access – porter"
    ON porter_workers FOR ALL USING (true) WITH CHECK (true);

-- ── DUNZO ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dunzo_workers (
    id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id    TEXT             NOT NULL,
    platform     TEXT             NOT NULL DEFAULT 'dunzo',
    date         DATE             NOT NULL,
    deliveries   INTEGER          NOT NULL,
    earnings     DOUBLE PRECISION NOT NULL,
    active_hours DOUBLE PRECISION NOT NULL,
    rating       DOUBLE PRECISION NOT NULL,
    verified     BOOLEAN          NOT NULL DEFAULT TRUE,
    city         TEXT             NOT NULL,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dunzo_worker_date UNIQUE (worker_id, date)
);
CREATE INDEX IF NOT EXISTS idx_dunzo_worker_id  ON dunzo_workers (worker_id);
CREATE INDEX IF NOT EXISTS idx_dunzo_created_at ON dunzo_workers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dunzo_date       ON dunzo_workers (date);
ALTER TABLE dunzo_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access – dunzo"
    ON dunzo_workers FOR ALL USING (true) WITH CHECK (true);
