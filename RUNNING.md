# GigGuard — How to Run Everything

> Branch: `ml-service-integration`  
> Last updated: April 2026

---

## Services Overview

| Service | Port | What it does |
|---------|------|--------------|
| **ML Service** | 8001 | XGBoost premium prediction + Fraud scoring |
| **Backend** | 8000 | FastAPI — triggers, claims, weather, traffic, curfew |
| **Web (Worker App)** | 3000 | Next.js worker-facing app |
| **Admin Panel** | 3001 | Next.js admin dashboard |

---

## Prerequisites

Make sure you have:
- Python 3.11+
- Node.js 18+
- `pip`, `npm`

---

## Step 1 — ML Service (port 8001)

Open a terminal and run:

```bash
cd GigGuard/ml_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Verify it's alive:**
```bash
curl http://localhost:8001/health
```
Expected: `{"status":"ok","premium_model_loaded":true,...}`

### Sync model files from backend (run once after backend trains):
```bash
cd GigGuard
python3 ml_service/sync_models.py
```

---

## Step 2 — Backend (port 8000)

Open a **new** terminal:

```bash
cd GigGuard/backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verify:**
```bash
curl http://localhost:8000/api/weather/Bangalore
curl http://localhost:8000/api/triggers/status
```

### Required `.env` variables (`backend/.env`):
```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
OWM_API_KEY=...
JWT_SECRET=...
BACKEND_URL=http://127.0.0.1:8000
ML_SERVICE_URL=http://localhost:8001
MLSERVICE_API_KEY=dev_ml_key_123
```

---

## Step 3 — Web App (port 3000)

Open a **new** terminal:

```bash
cd GigGuard/web
npm install
npm run dev
```
Open: [http://localhost:3000](http://localhost:3000)

---

## Step 4 — Admin Panel (port 3001)

Open a **new** terminal:

```bash
cd GigGuard/admin
npm install
npm run dev
```
Open: [http://localhost:3001](http://localhost:3001)

---

## Supabase — One-time Schema Fixes

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Add Phase 3 columns to disruption_events (required for T-06 curfew trigger)
ALTER TABLE disruption_events
  ADD COLUMN IF NOT EXISTS curfew_confidence  FLOAT   DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS curfew_source      TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tti_value          FLOAT   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_speed_kmh  FLOAT   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS severity_score     FLOAT   DEFAULT 1.0;

-- Create traffic TTI history table
CREATE TABLE IF NOT EXISTS traffic_tti_history (
  id               BIGSERIAL PRIMARY KEY,
  city             TEXT      NOT NULL,
  tti_value        FLOAT     NOT NULL,
  current_speed    FLOAT     DEFAULT 0,
  free_flow_speed  FLOAT     DEFAULT 0,
  recorded_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tti_history_city ON traffic_tti_history(city);
CREATE INDEX IF NOT EXISTS idx_tti_history_time ON traffic_tti_history(recorded_at DESC);
```

---

## ML Service API — Quick Test Commands

### Premium Prediction
```bash
curl -X POST http://localhost:8001/predict/premium \
  -H "Content-Type: application/json" \
  -d '{"weekly_earnings_est": 3000, "city_risk": 1.0, "weather_risk": 0.2, "tier": "standard"}'
```

### Fraud Scoring
```bash
# Clean claim → Auto_Approved (score 0.0)
curl -X POST http://localhost:8001/predict/fraud-score \
  -H "Content-Type: application/json" \
  -d '{"delivery_activity_detected": false, "duplicate_claim": false, "payout_amount": 300, "daily_wage": 450}'

# Active delivery during claim → Flagged_Manual_Review
curl -X POST http://localhost:8001/predict/fraud-score \
  -H "Content-Type: application/json" \
  -d '{"delivery_activity_detected": true, "cross_platform_flag": 1.0, "payout_amount": 350, "daily_wage": 480}'

# All fraud signals → Auto_Rejected (score 0.99)
curl -X POST http://localhost:8001/predict/fraud-score \
  -H "Content-Type: application/json" \
  -d '{"delivery_activity_detected": true, "duplicate_claim": true, "curfew_zone_mismatch": 1.0, "cross_platform_flag": 1.0, "payout_amount": 2500, "daily_wage": 400, "claim_count_30d": 8}'
```

---

## Fraud Detection — Signals (GPS Removed)

| Signal | Weight | Meaning |
|--------|--------|---------|
| `ACTIVE_DURING_CLAIM` | +0.50 | Worker was delivering while claiming disruption |
| `CURFEW_ZONE_MISMATCH` | +0.50 | Claimed curfew disruption but not in the zone |
| `DUPLICATE_CLAIM` | +0.45 | Same claim submitted more than once |
| `CROSS_PLATFORM_ACTIVITY` | +0.35 | Active on another platform (Zomato/Swiggy) during claim |
| `NEW_REGISTRATION_RISK` | +0.25 | Fresh registration claiming payout immediately |
| `ABNORMAL_CLAIM_FREQUENCY` | +0.25 | Unusually high claim rate |
| `HIGH_CLAIM_FREQUENCY` | +0.25 | 6+ claims in 30 days |
| `ELEVATED_CLAIM_FREQUENCY` | +0.10 | 4-5 claims in 30 days |
| `HIGH_PAYOUT_RATIO` | +0.15 | Payout > 120% of daily wage |
| `HIGH_CUMULATIVE_PAYOUT` | +0.10 | Total 30-day payout > ₹3000 |

### Disposition Thresholds
| Score | Action |
|-------|--------|
| `>= 0.90` | **Auto_Rejected** |
| `>= 0.60` | **Flagged_Manual_Review** |
| `< 0.60` | **Auto_Approved** |

---

## Model Files

The XGBoost premium model lives in:
```
backend/ml/saved_models/premium_model.joblib
backend/ml/saved_models/model_metadata.json
```

After backend retrains (auto every 15 min), sync to ML service:
```bash
python3 ml_service/sync_models.py
```
Then restart the ML service to pick up the new model.
