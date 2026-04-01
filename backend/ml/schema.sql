-- ============================================================
-- GigGuard ML — Premium Predictions & Weather Cache Tables
-- Run in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores computed weekly premiums for each registered worker
CREATE TABLE IF NOT EXISTS premium_predictions (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       UUID            NOT NULL,              -- FK to registered_workers.id
    worker_name     TEXT            NOT NULL,
    email           TEXT            NOT NULL,
    city            TEXT            NOT NULL,
    tier            TEXT            NOT NULL,
    platforms       TEXT[]          NOT NULL,
    delivery_id     TEXT            NOT NULL,

    -- ML prediction output
    weekly_premium          DOUBLE PRECISION NOT NULL,
    weekly_premium_autopay  DOUBLE PRECISION NOT NULL,
    raw_prediction          DOUBLE PRECISION NOT NULL,
    max_payout              INTEGER          NOT NULL,

    -- Risk features used
    weekly_earnings_est     DOUBLE PRECISION,
    weather_risk            DOUBLE PRECISION,
    city_risk               DOUBLE PRECISION,
    aqi_index               DOUBLE PRECISION,
    temperature             DOUBLE PRECISION,
    rain_1h                 DOUBLE PRECISION,

    -- Metadata
    model_rmse              DOUBLE PRECISION,
    computed_at             TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    week_start              DATE             NOT NULL,       -- Monday of the premium week

    UNIQUE(worker_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_pp_worker   ON premium_predictions (worker_id);
CREATE INDEX IF NOT EXISTS idx_pp_week     ON premium_predictions (week_start);
CREATE INDEX IF NOT EXISTS idx_pp_city     ON premium_predictions (city);

ALTER TABLE premium_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on premium_predictions"
    ON premium_predictions FOR ALL USING (true) WITH CHECK (true);


-- Cache weather snapshots per city per day (avoid excessive API calls)
CREATE TABLE IF NOT EXISTS weather_cache (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    city            TEXT            NOT NULL,
    date            DATE            NOT NULL,
    temperature     DOUBLE PRECISION,
    humidity        INTEGER,
    wind_speed      DOUBLE PRECISION,
    rain_1h         DOUBLE PRECISION,
    rain_3h         DOUBLE PRECISION,
    aqi_index       INTEGER,
    pm25            DOUBLE PRECISION,
    pm10            DOUBLE PRECISION,
    weather_main    TEXT,
    is_heavy_rain   BOOLEAN DEFAULT FALSE,
    is_extreme_heat BOOLEAN DEFAULT FALSE,
    is_severe_aqi   BOOLEAN DEFAULT FALSE,
    fetched_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE(city, date)
);

CREATE INDEX IF NOT EXISTS idx_wc_city_date ON weather_cache (city, date);

ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on weather_cache"
    ON weather_cache FOR ALL USING (true) WITH CHECK (true);
