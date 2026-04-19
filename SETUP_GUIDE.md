# WPIP — Hackathon Coordinator Setup & Evaluation Guide

> **Last updated:** 2026-04-17  
> **Repository:** PraneethUday/WPIP

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Components](#2-architecture--components)
3. [Environment Files — Full Reference](#3-environment-files--full-reference)
4. [Database Setup (SQL Schemas)](#4-database-setup-sql-schemas)
5. [Running Commands — Quick Start](#5-running-commands--quick-start)
6. [Worker Registration Flow — Step by Step](#6-worker-registration-flow--step-by-step)
7. [Demo Worker IDs & Walkthrough](#7-demo-worker-ids--walkthrough)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [ML Pipeline Overview](#9-ml-pipeline-overview)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Project Overview

**WPIP (Worker Protection Insurance Platform)** is a parametric micro-insurance platform for gig economy delivery workers (Swiggy, Zomato, Blinkit, Amazon Flex, Zepto, Meesho, Porter, Dunzo). It provides:

- **Real-time risk-based premium calculation** using an XGBoost ML model trained on synthetic delivery data
- **Parametric trigger-based claims** — weather events (heavy rain, extreme heat, poor AQI, floods), traffic congestion (TomTom TTI), and civil unrest (GDELT + NLP) automatically generate claims for affected workers
- **Fuzzy logic severity scaling** — proportional payouts based on continuous disruption intensity (not binary on/off)
- **Fraud detection** using Isolation Forest anomaly detection with geo-polygon GPS validation
- **Cross-platform activity checks** to prevent fraudulent claims
- **Auto-payouts** via mock UPI integration
- **Vernacular language support** — English, Hindi, Tamil, Telugu, Malayalam

The platform has **four interfaces**:

| Component | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| **Backend API** | FastAPI (Python) | `8000` | Data API, ML engine, auth, triggers, claims, fuzzy logic |
| **Web App** | Next.js (React/TypeScript) | `3000` | Worker-facing dashboard, registration, login, scenario simulator |
| **Admin Panel** | Next.js (React/TypeScript) | `3001` | Admin control center, disruption monitoring, fraud review |
| **Mobile App** | React Native (Expo) | `8081` | Worker mobile app, GPS check-ins, vernacular UI |

---

## 2. Architecture & Components

```
WPIP/
├── backend/              # FastAPI backend (Python 3.12)
│   ├── main.py           # All API endpoints
│   ├── db.py             # Supabase client & DB operations
│   ├── generator.py      # Synthetic data generator (200 workers, 8 platforms)
│   ├── scheduler.py      # Background 15-min scheduler (data gen + retrain)
│   ├── triggers.py       # Parametric trigger engine (weather + traffic + curfew auto-claims)
│   ├── claims.py         # Payout computation & eligibility checks (tier-aware)
│   ├── fuzzy.py          # Fuzzy logic severity engine (T-01 to T-06 scaling)
│   ├── gps.py            # GPS proximity validation (Haversine)
│   ├── auth_utils.py     # JWT auth + bcrypt password hashing
│   ├── seed.py           # One-time 30-day backfill script
│   ├── ml/
│   │   ├── weather.py        # OpenWeatherMap API (5-min cache)
│   │   ├── traffic.py        # TomTom Traffic API — TTI computation (5-min cache)
│   │   ├── curfew.py         # GDELT 2.0 + HuggingFace NLP curfew/unrest detection
│   │   ├── premium_model.py  # XGBoost premium prediction model (25 features)
│   │   ├── fraud_model.py    # Isolation Forest fraud detection + geo-polygon validation
│   │   ├── retrain.py        # Model retraining pipeline
│   │   └── compute_premiums.py
│   ├── schema.sql            # Platform worker tables (8 tables)
│   ├── triggers_schema.sql   # disruption_events + claims tables
│   ├── phase3_schema.sql     # GPS check-ins + claims transaction_id
│   └── requirements.txt
├── web/                  # Next.js worker dashboard
│   ├── src/app/
│   │   ├── register/     # 4-step registration wizard
│   │   ├── login/        # Login page
│   │   ├── dashboard/    # Worker dashboard (premiums, claims, weather, language selector)
│   │   ├── simulator/    # Scenario simulator sandbox (5 sliders, tier-aware payouts)
│   │   └── api/          # API route proxies (auth, premium, claims, payments)
│   ├── src/lib/
│   │   └── translations.ts   # Vernacular translations (en, hi, te, ta, ml)
│   ├── supabase-schema.sql    # registered_workers table
│   └── payments-schema.sql    # worker_payments + insurance_claims tables
├── admin/                # Next.js admin panel
│   └── src/app/
│       ├── control-center/  # ML model control, data generation, income adjustment
│       ├── disruptions/     # Live disruption monitoring
│       └── admin/           # Admin dashboard
├── mobile/               # React Native (Expo) mobile app
│   ├── context/
│   │   └── LanguageContext.js  # Vernacular language provider (5 languages)
│   ├── lib/
│   │   └── translations.js    # Mobile translations (en, hi, te, ta, ml)
│   └── screens/
│       ├── SignUpScreen.js    # Worker registration (mobile)
│       ├── LoginScreen.js     # Login
│       ├── HomeScreen.js      # Home dashboard
│       ├── LandingScreen.js   # Landing/splash screen
│       ├── PolicyScreen.js    # Policy details
│       ├── ClaimsScreen.js    # Claims history
│       ├── PaymentScreen.js   # Payment history
│       └── ProfileScreen.js   # Worker profile + language picker
└── shared/
    └── theme.js           # Shared design tokens
```

---

## 3. Environment Files — Full Reference

The project uses **5 separate `.env` files** across different components. Below is every variable, what it does, and where it is consumed.

### 3.1 Root `.env` — `/.env`

```env
# ============================================================
# WPIP — Root Environment Variables
# ============================================================

# Supabase (shared)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```


### 3.2 Backend `.env` — `/backend/.env`

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OWM_API_KEY=your_openweathermap_api_key
JWT_SECRET=your_jwt_secret_min_32_chars
TOMTOM_API_KEY=your_tomtom_api_key
```

| Variable | Purpose | Consumed By |
|----------|---------|-------------|
| `SUPABASE_URL` | Supabase project URL | `db.py` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (full DB access) | `db.py` |
| `OWM_API_KEY` | OpenWeatherMap API key (free tier) | `ml/weather.py` |
| `JWT_SECRET` | Secret for signing JWT auth tokens | `auth_utils.py` |
| `TOMTOM_API_KEY` | TomTom Traffic Flow Segment API key (free tier: 2,500 calls/day) | `ml/traffic.py` |


### 3.3 Web App `.env` — `/web/.env`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_min_32_chars
BACKEND_URL=http://127.0.0.1:8000
```

| Variable | Purpose | Consumed By |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (client-side accessible) | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-side accessible) | Supabase client |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only) | API routes |
| `JWT_SECRET` | JWT signing secret (must match backend) | API route auth |
| `BACKEND_URL` | FastAPI backend URL for proxy routes | `api/backend/[...path]/route.ts` |


### 3.4 Admin Panel `.env` — `/admin/.env`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
BACKEND_URL=http://localhost:8000
```

| Variable | Purpose | Consumed By |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Supabase client |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Server-side API calls |
| `BACKEND_URL` | FastAPI backend URL | Admin API proxy routes |


### 3.5 Mobile App `.env` — `/mobile/.env`

```env
WEB_API_URL=http://localhost:3000
BACKEND_API_URL=http://localhost:8000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Environment Variables Summary Matrix

| Variable | Root | Backend | Web | Admin | Mobile |
|----------|:----:|:-------:|:---:|:-----:|:------:|
| `SUPABASE_URL` | Yes | Yes | — | — | Yes |
| `SUPABASE_ANON_KEY` | Yes | — | — | — | Yes |
| `SUPABASE_SERVICE_KEY` | Yes | Yes | Yes | Yes | — |
| `NEXT_PUBLIC_SUPABASE_URL` | — | — | Yes | Yes | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | — | Yes | — | — |
| `OWM_API_KEY` | — | Yes | — | — | — |
| `JWT_SECRET` | — | Yes | Yes | — | — |
| `TOMTOM_API_KEY` | — | Yes | — | — | — |
| `BACKEND_URL` | — | — | Yes | Yes | — |
| `WEB_API_URL` | — | — | — | — | Yes |
| `BACKEND_API_URL` | — | — | — | — | Yes |

---

## 4. Database Setup (SQL Schemas)

Run these SQL files **in order** in the Supabase SQL Editor (`Dashboard → SQL Editor`):

| Order | File | Tables Created | Purpose |
|:-----:|------|----------------|---------| 
| 1 | `backend/schema.sql` | 8 platform tables: `swiggy_workers`, `zomato_workers`, `amazon_flex_workers`, `blinkit_workers`, `zepto_workers`, `meesho_workers`, `porter_workers`, `dunzo_workers` | Store daily synthetic delivery activity data |
| 2 | `web/supabase-schema.sql` | `registered_workers` | Store registered worker accounts (auth) |
| 3 | `backend/triggers_schema.sql` | `disruption_events`, `claims` | Weather disruption events and auto-generated insurance claims |
| 4 | `backend/ml/schema.sql` | `premium_predictions`, `weather_cache` | ML model predictions and cached weather data |
| 5 | `web/payments-schema.sql` | `worker_payments`, `insurance_claims` | Payment history and manual insurance claims |
| 6 | `backend/phase3_schema.sql` | `gps_checkins` + adds `transaction_id` to claims | GPS location tracking and payment transaction IDs |

---

## 5. Running Commands — Quick Start

### Prerequisites

- **Python 3.12+** with `pip`
- **Node.js 18+** with `npm`
- **Expo CLI** (for mobile): `npm install -g expo-cli`

---

### 5.1 Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the backend server  
uvicorn main:app --reload 
```

The backend will:
1. Start serving the API on `http://localhost:8000`
2. Launch a background scheduler that generates synthetic data every 15 minutes
3. Auto-retrain the ML model every 4 scheduler ticks (~1 hour)
4. Poll OpenWeatherMap, TomTom Traffic, and GDELT/NLP feeds for parametric triggers

**Verify:** Open `http://localhost:8000` in browser — you should see the API info JSON.

---

### 5.2 Web App (Next.js — Worker Dashboard)

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start the development server  (runs on port 3000)
npm run dev
```

**Verify:** Open `http://localhost:3000` — you should see the landing/login page.

---

### 5.3 Admin Panel (Next.js — Admin Dashboard)

```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install

# Start the development server  (runs on port 3001)
npm run dev
```

**Verify:** Open `http://localhost:3001` — you should see the admin dashboard.

---

### 5.4 Mobile App (React Native / Expo)

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on a physical device

---


## 6. Worker Registration Flow — Step by Step

The registration process is a **4-step wizard** available on both the Web App (`/register`) and the Mobile App (`SignUpScreen.js`).

### Step 1: Platform Selection
- Worker selects which delivery platforms they work with
- Available platforms: **Zomato, Swiggy, Amazon Flex, Blinkit, Zepto, Meesho, Porter, Dunzo**
- At least one platform must be selected to proceed
- Each platform is displayed with a branded badge (symbol + name)

### Step 2: Personal Information
- **Full Name** — required
- **Age** — optional
- **Phone** — required, must be unique across all registered workers
- **Email** — required, must be unique
- **Password** — required, minimum 6 characters
- **Confirm Password** — must match
- **City** — required, dropdown selection (Bengaluru, Chennai, Delhi, Mumbai, Hyderabad, Pune, Kolkata, Ahmedabad, Jaipur, Surat)
- **Delivery Area / Zone** — optional (e.g., "Koramangala")
- **Primary Delivery Partner ID** — required, this is the worker's ID from the platform app

**Delivery ID Verification:**  
A "Verify ID" button checks the entered Delivery Partner ID against the selected platform's database tables. The backend endpoint `POST /api/verify-id` looks up the `worker_id` column in each selected platform's table (`swiggy_workers`, `zomato_workers`, etc.) and returns which platforms matched:
- **Green banner:** "ID verified on: SW Swiggy, ZO Zomato" — worker found in platform DB
- **Red banner:** ID not found — worker can still register but will need manual admin verification

### Step 3: Identity & Payment Documents
- **PAN Card Number** — optional (10-character alphanumeric, auto-uppercased)
- **Aadhaar Number** — optional (12-digit, must be unique)
- **UPI ID** — optional (for receiving claim payouts, e.g., `name@upi`)
- **Bank Account** — optional (IFSC + Account Number)
- **Consent checkbox** — agrees to terms and conditions
- **GPS Consent checkbox** — allows location tracking for claim verification
- **Auto-pay checkbox** — enables automatic weekly premium deduction

### Step 4: Coverage Tier Selection
- **Basic** — ~INR 30/week, max payout INR 500 (50% wage coverage)
- **Standard** — ~INR 60/week, max payout INR 1,200 (80% wage coverage)
- **Pro** — ~INR 105/week, max payout INR 2,500 (100% wage coverage)

Each tier shows a summary card with: name, estimated weekly premium, and maximum claim payout.

### What Happens on Submit

1. Frontend sends `POST /api/auth/register` with all collected data
2. Backend validates: unique email, unique phone, password length
3. Backend hashes the password using bcrypt (12 rounds)
4. Backend checks the delivery ID against selected platform tables for auto-verification
5. A new row is inserted into the `registered_workers` table with `verification_status: pending`
6. A JWT token is created (HS256, 30-day expiry) and returned
7. The frontend stores the token in `localStorage` (`gg_token`) and redirects to `/dashboard`

**Registration payload stored in `registered_workers` table:**
```json
{
  "name": "Worker Name",
  "age": 25,
  "phone": "+919876543210",
  "email": "worker@example.com",
  "password_hash": "$2b$12$...",
  "city": "Bangalore",
  "area": "Koramangala",
  "delivery_id": "7bc38f78-c07d-da0d-6fab-2e511a57b2c4",
  "platforms": ["swiggy", "zomato"],
  "pan": "ABCDE1234F",
  "aadhaar": "123456789012",
  "upi": "name@upi",
  "bank": "SBIN0001234-1234567890",
  "consent": true,
  "gps_consent": true,
  "autopay": true,
  "tier": "standard",
  "verification_status": "pending"
}
```

---

## 7. Demo Worker IDs & Walkthrough

Below are two **real worker IDs** from the synthetic database that you can use for testing. These IDs exist in the platform tables and will pass Delivery ID verification during registration.

---

### 7.1 Swiggy Worker

| Field | Value |
|-------|-------|
| **Worker ID** | `7bc38f78-c07d-da0d-6fab-2e511a57b2c4` |
| **Platform** | Swiggy |
| **City** | Pune |
| **Base Daily Deliveries** | 11 |
| **Rating** | 4.66 |
| **Verified** | Yes |

#### How This Worker Operates in the System

1. **Data Generation (every 15 min):**  
   The `generator.py` script generates daily activity for this worker. With a base of 11 deliveries/day:
   - Normal distribution: `np.random.normal(loc=11, scale=1.65)` ≈ 9-13 deliveries
   - Weekend boost: ×1.3 → ≈ 12-17 deliveries on Sat/Sun
   - 5% anomaly spike chance: ×2-3 → ≈ 22-33 deliveries (rare)
   - Earnings: 11 deliveries × INR 25-40/delivery = **INR 275-440/day**
   - Active hours: 11 × 0.35-0.55 hrs/delivery = **3.85-6.05 hours/day**
   - Rating: jitters ±0.1 around 4.66

2. **Data Storage:**  
   Each day's activity is upserted into the `swiggy_workers` table with columns: `worker_id`, `platform="swiggy"`, `date`, `deliveries`, `earnings`, `active_hours`, `rating`, `verified=true`, `city="Pune"`

3. **Premium Calculation:**  
   When `/api/premium/predict` is called with this worker's delivery ID:
   - Fetches last 30 days of data from `swiggy_workers` table
   - Fetches real-time Pune weather from OpenWeatherMap
   - Fetches real-time Pune traffic TTI from TomTom
   - Builds 25 ML features:
     - Rolling 7-day averages (earnings, deliveries, hours, rating)
     - Weekly earnings estimate (~INR 2,500/week)
     - Earnings trend (3d vs 7d), consistency (std dev, CV)
     - Efficiency (earnings/delivery, earnings/hour)
     - Weather risk (rain, AQI, temperature composited into 0-1 score)
     - Traffic TTI risk factor
     - Unrest exposure flag (GDELT + NLP curfew signal)
     - Pune city risk: 0.90 (lower than average — Pune is relatively safer)
   - XGBoost model predicts raw premium, then clamped to tier bounds
   - Example output for "standard" tier: ~INR 40-60/week

4. **Trigger & Claims Processing:**  
   If Pune experiences heavy rainfall (>20mm/hr or >64.5mm/3hr):
   - `triggers.py` detects the breach via OpenWeatherMap data
   - `fuzzy.py` computes severity score (0.0–1.0) using fuzzy logic scaling
   - Creates a `disruption_events` row for Pune
   - Finds this worker in `swiggy_workers` for today's date in Pune
   - Computes payout: `daily_wage × (disrupted_hours/8) × severity × wage_coverage_pct`
   - Wage coverage: Basic=50%, Standard=80%, Pro=100%
   - Runs GPS proximity check (is worker within 20km of Pune center?)
   - Runs cross-platform activity check (was worker delivering on other platforms during disruption?)
   - Runs fraud scoring (Isolation Forest ML + rule-based)
   - Creates a claim: `CLM-20260405-a1b2c3` with `payout_status: approved` (if fraud_score < 0.75)

5. **Registration Demo:**  
   To register this worker on the web app:
   - Go to `http://localhost:3000/register`
   - Select "Swiggy" platform
   - Enter personal details, use delivery ID: `7bc38f78-c07d-da0d-6fab-2e511a57b2c4`
   - Click "Verify ID" → should show green "ID verified on: SW Swiggy"
   - Complete remaining steps → worker appears in dashboard with their premium calculated

---

### 7.2 Zomato Worker

| Field | Value |
|-------|-------|
| **Worker ID** | `ad71d7fc-0172-428c-6c36-b94f3914907d` |
| **Platform** | Zomato |
| **City** | Hyderabad |
| **Base Daily Deliveries** | 15 |
| **Rating** | 4.16 |
| **Verified** | Yes |

#### How This Worker Operates in the System

1. **Data Generation (every 15 min):**  
   With a base of 15 deliveries/day:
   - Normal distribution: `np.random.normal(loc=15, scale=2.25)` ≈ 12-18 deliveries
   - Weekend boost: ×1.3 → ≈ 16-24 deliveries on Sat/Sun
   - 5% anomaly spike: ×2-3 → ≈ 30-45 deliveries (rare)
   - Earnings: 15 deliveries × INR 25-40/delivery = **INR 375-600/day**
   - Active hours: 15 × 0.35-0.55 hrs = **5.25-8.25 hours/day**
   - Rating: jitters ±0.1 around 4.16

2. **Data Storage:**  
   Upserted daily into `zomato_workers` table: `worker_id`, `platform="zomato"`, `date`, `deliveries`, `earnings`, `active_hours`, `rating`, `verified=true`, `city="Hyderabad"`

3. **Premium Calculation:**  
   When `/api/premium/predict` is called:
   - Fetches 30 days from `zomato_workers`
   - Fetches real-time Hyderabad weather + traffic TTI
   - Key feature differences vs. Swiggy worker:
     - Higher weekly earnings estimate (~INR 3,400/week) → higher base premium
     - Hyderabad city risk: 0.95 (moderate)
     - Slightly lower rating (4.16 vs 4.66) — no direct premium impact but captured in features
   - Expected premium for "standard" tier: ~INR 55-85/week (higher because higher earnings)

4. **Trigger & Claims Processing:**  
   Hyderabad is monitored for all 6 trigger types. Example scenario — **Severe AQI (T-03)**:
   - If AQI ≥ 300 (entry threshold), fuzzy logic begins scaling severity linearly up to AQI 450
   - Disruption event created for Hyderabad
   - This Zomato worker gets an auto-claim:
     - Daily wage estimate: ~INR 490 (7-day average)
     - Payout: `daily_wage × (6hrs/8hrs) × severity × wage_coverage_pct`
     - Fraud score computed, GPS checked, cross-platform verified
   - Claim appears in worker's claims history and admin disruptions page

5. **Registration Demo:**  
   - Go to `http://localhost:3000/register`
   - Select "Zomato" platform
   - Use delivery ID: `ad71d7fc-0172-428c-6c36-b94f3914907d`
   - Click "Verify ID" → green confirmation "ID verified on: ZO Zomato"
   - Select city "Hyderabad", pick tier, complete registration

---

### 7.3 Comparison: Swiggy vs Zomato Worker

| Metric | Swiggy Worker | Zomato Worker |
|--------|:------------:|:-------------:|
| Delivery ID | `7bc38f78-...b2c4` | `ad71d7fc-...907d` |
| Platform | Swiggy | Zomato |
| City | Pune | Hyderabad |
| Base Deliveries/Day | 11 | 15 |
| Rating | 4.66 | 4.16 |
| Est. Daily Earnings | INR 275-440 | INR 375-600 |
| Est. Weekly Earnings | ~INR 2,500 | ~INR 3,400 |
| City Risk Factor | 0.90 (low) | 0.95 (moderate) |
| Expected Premium (Std) | ~INR 40-60/wk | ~INR 55-85/wk |
| DB Table | `swiggy_workers` | `zomato_workers` |

---

## 8. API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/auth/register` | Register a new worker (see registration flow above) |
| `POST` | `/api/auth/login` | Login with email/password → returns JWT token |
| `GET` | `/api/auth/me` | Get current user profile (requires `Authorization: Bearer <token>`) |
| `POST` | `/api/verify-id` | Verify a delivery ID against platform databases |

### Worker Data
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/workers` | All workers across all platforms |
| `GET` | `/api/swiggy/workers` | Swiggy workers only |
| `GET` | `/api/zomato/workers` | Zomato workers only |
| `GET` | `/api/{platform}/workers` | Workers for a specific platform |
| `GET` | `/api/workers/{worker_id}/history?days=30` | Historical data for a specific worker |

### ML & Premium
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/premium/predict` | Predict premium for a worker (body: `{delivery_id, city, tier}`) |
| `GET` | `/api/premium/worker/{worker_id}` | Get latest computed premium from DB |
| `GET` | `/api/premium/all` | Get all computed premiums |
| `GET` | `/api/model/status` | Current ML model info (RMSE, features, trained_at) |
| `POST` | `/api/model/retrain` | Trigger model retraining (async) |
| `GET` | `/api/model/retrain/logs` | Get retrain progress, logs, and status |

### Weather, Traffic & Triggers
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/weather/{city}` | Real-time weather for a city (OpenWeatherMap) |
| `GET` | `/api/weather` | Weather for all monitored cities |
| `GET` | `/api/traffic/{city}` | Real-time traffic TTI for a city (TomTom) |
| `GET` | `/api/curfew/{city}` | GDELT + NLP curfew/unrest assessment for a city |
| `GET` | `/api/triggers/status` | Current trigger evaluation for all cities (T-01 to T-06) |
| `POST` | `/api/triggers/test-fire` | Manually fire a trigger for testing (body: `{city, trigger_id}`) |

### Claims & Payouts
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/claims` | All recent claims |
| `GET` | `/api/claims/worker/{worker_id}` | Claims for a specific worker |
| `GET` | `/api/disruptions` | Recent disruption events |
| `POST` | `/api/claims/execute-payouts` | Execute mock payouts for approved claims |

### Scenario Simulator
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/simulator/evaluate` | Simulate disruption (body: `{city, tier, temperature, aqi, rainfall, tti, curfew_confidence}`) |

### Admin
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/admin/generate-data` | Manually trigger one data generation cycle |
| `POST` | `/api/admin/adjust-income` | Adjust worker income data (for ML testing) |
| `GET` | `/api/admin/data-summary` | Platform statistics summary |
| `GET` | `/api/admin/exposure` | Regional risk exposure heatmap data |
| `POST` | `/api/gps/checkin` | Mobile GPS check-in (body: `{worker_id, latitude, longitude}`) |
| `GET` | `/api/health` | Health check |

---

## 9. ML Pipeline Overview

### 9.1 Premium Prediction (XGBoost Regressor)

**Training Data:**
- 200 synthetic workers × 30 days = ~6,000 samples
- 25 features: earnings averages, delivery trends, weather risk, traffic TTI, unrest exposure, city risk, consistency metrics

**Model Config:**
```python
XGBRegressor(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.1,
    reg_lambda=1.0,
)
```

**Tier Bounds (clamped at serving time):**
| Tier | Rate | Min Premium | Max Premium | Max Payout | Wage Coverage |
|------|------|:-----------:|:-----------:|:----------:|:-------------:|
| Basic | 0.8% of weekly earnings | INR 40 | INR 80 | INR 500 | 50% |
| Standard | 1.2% of weekly earnings | INR 60 | INR 100 | INR 1,200 | 80% |
| Pro | 1.6% of weekly earnings | INR 80 | INR 120 | INR 2,500 | 100% |

### 9.2 Fraud Detection (Isolation Forest + Geo-Polygon Validation)

**Features:** claim frequency (30d), cumulative payouts, payout ratio, cross-platform flag, GPS flag  
**Contamination:** 10% assumed anomaly rate  
**Geo-Polygon Validation:** Cities split into North/South sub-zones; T-06 curfew claims checked against worker GPS pings — mismatch adds +0.50 fraud penalty  
**Threshold:** Anomaly score > 0.75 suspends auto-payout, flags for admin review  
**Fallback:** Rule-based scoring if no trained model exists

### 9.3 Fuzzy Logic Severity Engine

All 6 triggers use continuous fuzzy membership functions instead of binary thresholds:

| ID | Type | Entry (0% Payout) | Ceiling (100% Payout) | Data Source |
|----|------|:------------------:|:---------------------:|-------------|
| T-01 | Heavy Rainfall | 20.0 mm | 100.0 mm | OpenWeatherMap |
| T-02 | Extreme Heat | 39.5 °C | 45.0 °C | OpenWeatherMap |
| T-03 | Severe AQI | 300 AQI | 450 AQI | CPCB / OpenAQ |
| T-04 | Flood Risk | 64.5 mm (3hr) | 150.0 mm | OpenWeatherMap |
| T-05 | Traffic Congestion | 2.5x TTI | 3.5x TTI | TomTom Traffic API |
| T-06 | Curfew / Unrest | 0.80 confidence | 0.95 confidence | GDELT 2.0 + HuggingFace NLP |

### 9.4 Curfew/Unrest Detection (GDELT + NLP)

**Two-stage pipeline (`ml/curfew.py`):**

1. **GDELT Stage:** Fetches GDELT 2.0 15-minute CSV export, filters for Indian bounding box (Lat 8°–37°, Lon 68°–97°), isolates events within ~50km of target city, checks for CAMEO codes: `{14, 141, 142, 143, 144, 145, 18, 19}`
2. **NLP Stage:** HuggingFace `cross-encoder/nli-deberta-v3-xsmall` zero-shot classifier scans RSS headlines against labels: `["curfew", "section 144", "riot", "strike"]`
3. **Combined confidence** drives T-06 fuzzy trigger

---

## 10. Troubleshooting

| Issue | Solution |
|-------|---------| 
| `Missing SUPABASE_URL or SUPABASE_SERVICE_KEY` | Ensure `backend/.env` exists and has both variables set |
| Backend port 8000 already in use | Kill: `lsof -ti:8000 \| xargs kill -9` |
| Web app port 3000 already in use | Kill: `lsof -ti:3000 \| xargs kill -9` |
| `ModuleNotFoundError` in Python | Activate venv: `source venv/bin/activate`, then `pip install -r requirements.txt` |
| Weather API returns defaults | Check `OWM_API_KEY` in `backend/.env` — get a free key at openweathermap.org |
| Traffic API returns defaults | Check `TOMTOM_API_KEY` in `backend/.env` — get a free key at developer.tomtom.com |
| JWT token invalid across services | Ensure `JWT_SECRET` matches between `backend/.env` and `web/.env` |
| Mobile app can't connect to API | Replace `localhost` with your LAN IP in `mobile/.env` |
| No premium data in dashboard | Run `python seed.py` first, then trigger a retrain via admin or wait ~1 hour |
| "Verify ID" shows not found | Ensure `seed.py` has been run (creates 200 workers in platform tables) |
| Admin control center errors | Ensure `BACKEND_URL=http://localhost:8000` in `admin/.env` and backend is running |
| Hydration mismatch error in admin | Restart the Next.js dev server (`Ctrl+C` then `npm run dev`) to clear Turbopack cache |
| NLP model fails to load | Normal on low-memory machines — system falls back to GDELT-only with confidence=0.0 |

---

> **For any questions during evaluation, the API docs are live at `http://localhost:8000/docs` (Swagger UI) once the backend is running.**
