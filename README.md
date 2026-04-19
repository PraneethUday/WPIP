# WPIP — Worker Protection Insurance Platform

> Guidewire DEVTrails 2026 | Problem Statement: AI-Powered Insurance for India's Gig Economy

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Application Workflow](#application-workflow)
- [Worker Registration & Fraud Prevention](#worker-registration--fraud-prevention)
- [Core Features & Modules](#core-features--modules)
- [Parametric Triggers & Fuzzy Math](#parametric-triggers--fuzzy-math)
- [AI, GDELT & NLP Integration](#ai-gdelt--nlp-integration)
- [Tech Stack & Architecture](#tech-stack--architecture)

---

## Overview
**WPIP (Worker Protection Insurance Platform)** is an AI-enabled parametric insurance ecosystem designed exclusively for platform-based delivery partners in India (Zomato, Swiggy, Zepto, Amazon, Blinkit, etc.). It protects their income against uncontrollable external disruptions such as extreme weather, severe pollution, road-paralyzing traffic, and sudden socio-political curfews.

WPIP operates on a weekly pricing model aligned with the gig worker's earnings cycle and uses machine learning to dynamically compute premiums, predict regional risk, automate the claims process, and detect fraud — all with near-zero human intervention.

---

## The Problem
India's gig delivery workforce is the backbone of the digital economy. However, workers are fully exposed to external disruptions — heavy rainfall, floods, AQI spikes, curfews — that can wipe out 20-30% of their monthly earnings with no safety net. No existing insurance product is designed around the week-to-week financial reality of a delivery partner.

---

## Our Solution
WPIP solves this with four core pillars:
1. **AI-Powered Weekly Premiums** — Dynamic, hyper-local risk pricing computed weekly using ML models trained on weather forecasts, location risk, earnings history, and loyalty.
2. **Parametric Automation** — Real-time monitoring of disruption triggers (rain, AQI, TTI traffic data, curfew data). When a threshold is crossed, claims are automatically initiated and payouts processed with no manual filing required.
3. **Fuzzy Logic Claim Scaling** — Instead of a rigid yes/no trigger, WPIP uses mathematical fuzzy sets to calculate severity, issuing proportional compensation based on genuine risk impact.
4. **Intelligent Fraud Detection** — Anomaly detection, GPS validation, minimum eligibility verification, and duplicate prevention to ensure payout integrity.

> **Coverage Scope: Income loss ONLY.** Health, life, accidents, and vehicle repair coverage are strictly excluded.

---

## Application Workflow
1. **Registration:** Worker securely registers confirming primary delivery platforms.
2. **Background Verification:** AI checks for minimum tenure API history.
3. **Weekly Premium Collection:** Dynamic pricing evaluates local geographic risk.
4. **Real-time Monitoring:** Data ingested asynchronously (Weather, Traffic, News). 
5. **Trigger Evaluation:** Fuzzy Math computes disruption severity.
6. **Payout Execution:** Qualified logic processes claim disbursements via UPI.

---

## Intelligent Fraud Detection & Verification

WPIP implements a defense-in-depth approach to payout fraud and adverse selection via the embedded `fraud_model.py` pipeline using Isolation Forest ML architectures:

### 1. Multi-Platform Inactivity Tracking
A critical fraud vector in the gig economy is simultaneously logging into multiple applications. A worker might be registered on both Amazon Flex and Zomato. If a disruption occurs and they attempt to claim a payout on Zomato, the backend API (`claims.py`) structurally verifies API records across *all linked platforms* (e.g. Swiggy, Zepto, Blinkit tables). If overlapping delivery activity is detected during the requested outage window, the claim is instantly blocked.

### 2. T-06 Curfew Geo-Polygon Mismatch (GPS Rules)
For sensitive claims like undocumented civil unrest (T-06), the fraud model partitions major Indian cities (Chennai, Bengaluru, Delhi) into strict latitudinal North/South sub-zones (`geo-polygons`). When a curfew triggers, the AI checks if the worker's recent GPS pings were actually INSIDE the affected sub-zone. If all recent GPS pings fall outside the disruption polygon, a massive `+0.50` mathematical penalty is universally applied to their fraud probability score.

### 3. Claim Velocity & Payout Anomalies
WPIP utilizes unsupervised anomaly detection (ML) to flag suspicious overarching patterns across worker histories. The system flags users attempting to file claims suspiciously fast against minor weather shifts, or clustering high-frequency claims across short multi-week windows. Any normalized anomaly score crossing `0.75` suspends the automated UPI disbursement, redirecting the claim to the Admin portal for an actuary review.

---

## Core Features & Modules

### 1. Worker Web & Mobile Dashboards
Cross-platform instances (Next.js for web wrappers, React Native for iOS/Android apps) allow delivery partners to authenticate via JWT to monitor active policy coverages securely. The dashboard presents current earnings histories, active geographic risk warnings, and a localized payout history table.

### 2. Scenario Simulator Sandbox
A dedicated module built to safely evaluate and demonstrate the backend system's mathematical response without initiating real financial payments. Integrators and actuaries can manipulate live variables (Temperature, AQI, Rainfall, TTI indexing, and Curfew NLP Confidence) to instantly visualize how the ML models adapt both the projected weekly premiums and the expected proportional claim payout percentages. It strictly adheres to backend limits, verifying that a 'Standard Guard' plan caps payouts precisely at 80% coverage vs 100% on higher-tier plans.

### 3. Admin Control Center
A standalone Next.js portal purposed strictly for internal operations teams. Actuaries can oversee systemic health, monitor live parametric APIs globally, trace macro-disruption clusters over major gig hubs (Delhi, Mumbai, Bengaluru), and adjudicate system-flagged fraud anomalies or edge cases.

---

## Parametric Triggers & Fuzzy Math

Parametric insurance means the event data triggers the claim proactively. When a pre-defined measurable threshold is crossed, the system acts automatically in real-time.

WPIP leverages **Fuzzy Mathematical Models** in the backend (`backend/fuzzy.py`) to eliminate rigid boundary issues (e.g., receiving $0 at 39.9°C and full payout at 40°C). Instead, payouts scale linearly from a `0%` baseline entry threshold to a `100%` absolute ceiling:

| Trigger ID | Disruption Type | Real-Time Source | Entry Threshold (0% Payout) | Absolute Ceiling (100% Payout) |
|---|---|---|---|---|
| **T-01** | Heavy Rainfall | OpenWeatherMap (3hr/1hr) | `20.0 mm` | `100.0 mm` |
| **T-02** | Extreme Heat | OpenWeatherMap | `39.5 °C` | `45.0 °C` |
| **T-03** | Severe AQI | CPCB India NAQI | `300 AQI` | `450 AQI` |
| **T-04** | Flood Risk | OpenWeatherMap (3hr) | `64.5 mm` | `150.0 mm` |
| **T-05** | Traffic Congestion | TomTom TTI (Travel Time Index) | `2.5x TTI` | `3.5x TTI` |
| **T-06** | Curfew / Unrest | NLP GDELT / News Feeds | `0.80 Confidence` | `0.95 Confidence` |

*How it works*: If a Zomato worker experiences **42.25°C** heat, the fuzzy logic calculates exactly **50% severity** (`(42.25 - 39.5) / (45.0 - 39.5)`). Their calculated hourly loss is multiplied seamlessly by this `0.5` severity coefficient, assuring proportionally fair compensation without sharp drop-offs.

---

## AI, GDELT & NLP Integration

### 1. Curfew & Urban Unrest Detection — Two-Stage Pipeline (GDELT + NLP)
One of the hardest disruptions to insure parametrically is abruptly declared state ordinances ("Section 144" curfews or sudden localized unrest). WPIP solves this with a sophisticated **two-stage AI pipeline** implemented in `backend/ml/curfew.py`:

**Stage 1 — GDELT Event Scanning:**
Every 15 minutes, the backend asynchronously pings the **GDELT 2.0** (Global Database of Events, Language, and Tone) latest export API (`data.gdeltproject.org/gdeltv2/lastupdate.txt`). It downloads and parses the newest 15-minute CSV manifest, filtering strictly for:
- **Indian geo-coordinates:** Latitude 8°–37°, Longitude 68°–97° (bounding box covering all of India)
- **City proximity:** Events within ~50 km of the worker's registered city (Chennai, Delhi, Mumbai, Bengaluru, Hyderabad, Pune, Kolkata)
- **CAMEO Unrest Codes:** Code `14` (Protest), `141–145` (Protest variants including force), `18` (Assault), `19` (Fight)

Matched events are counted and cached with a 15-minute TTL aligned to GDELT's own update cadence.

**Stage 2 — HuggingFace NLP Fallback:**
Because GDELT data can sometimes lag by several minutes, a parallel **Zero-Shot Classification** model runs as a fallback. WPIP uses the lightweight `cross-encoder/nli-deberta-v3-xsmall` (~50 MB) HuggingFace transformer, loaded as a lazy singleton to minimize memory pressure. It continuously scans local Indian RSS news headlines and classifies each headline against **4 strict labels:**
- `"curfew"`
- `"section 144"`
- `"riot"`
- `"strike"`

The highest classification probability from the NLP model is combined with the GDELT event count to produce a final **confidence score** (`0.0` to `1.0`). This score drives **Trigger T-06** through the fuzzy engine: any confidence breaching `0.80` activates the parametric safety net.

**Concrete Example:** In a live scenario, GDELT may report `0 events` for a city (no protest coordinates mapped yet), but the NLP model reads an RSS headline about a local transport strike and classifies it as `"strike"` with `83% (0.83)` confidence. Because `0.83 > 0.80` (the T-06 entry threshold), the trigger fires autonomously and initiates automated claim payouts for affected workers.

### 2. Dynamic Premium Engine (XGBoost Regression)
An embedded ML pipeline inside the FastAPI backend (`backend/ml/premium_model.py`) uses **XGBoost** to predict weekly premiums. The model trains on a 25-feature vector including rolling 7-day earnings averages, weather severity, AQI, traffic TTI, past claims count, unrest exposure flags from the GDELT+NLP pipeline, and city/platform encodings. It re-trains consistently against worker earnings tables and disruption likelihood metrics, ensuring hyper-local risk-accurate pricing.

---

## Tech Stack & Architecture

| Domain | Technology / Framework | Usage |
|---|---|---|
| **Frontend Workers** | Next.js, React Native (Expo) | Cross-compatible web dashboards and iOS/Android applications. |
| **Frontend Actuaries**| Next.js, Next UI Components | Secured internal command center routing. |
| **Core API Backend** | Python 3.10+, FastAPI, Uvicorn | Asynchronous processing handling mass parametric event polling. |
| **Mathematical Logic**| Pandas, Scikit-Learn, NumPy | Executing fuzzy set theory mappings, XGBoost premium sizing, and NLP analysis. |
| **Database & Auth** | Supabase, PostgreSQL | Globally replicated Edge DB ensuring ACID-compliant transaction records. |
| **External APIs**| TomTom Traffic | Tracking real-time TTI road congestion index. |
| **External APIs**| OpenWeatherMap | Tracking rainfall (mm) and absolute temperature metrics. |

---

## Pitch Deck

**[View the WPIP Pitch Deck (Canva)](https://canva.link/s9ij8xh88yiuvy5)**

---

*Built for Guidewire DEVTrails 2026 | Team WPIP*
