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

### 1. Curfew & Urban Unrest Assessment (GDELT + NLP)
One of the hardest disruptions to insure is abruptly declared state ordinances ("Section 144" curfews or sudden localized unrest). To predict and verify this parametrically without manual forms, WPIP ingests a constant stream of global news utilizing the **GDELT Project (Global Database of Events, Language, and Tone)**. 
- A Zero-Shot NLP Engine continuously scans localized Indian RSS news feeds and government press broadcasts.
- The pipeline looks for distinct contextual clusters: "Section 144", "curfew", "mobility restricted", and isolates the geographical epicenter.
- This outputs a continuous classification mapping probability (`0.0` to `1.0`). Any trigger breaching the `0.80` confidence threshold natively activates the **T-06** Parametric safety net, issuing automated payments for locked-down gig workers safely halted at home.

### 2. Dynamic Premium Engine (Scikit-Learn Regression)
An embedded ML pipeline inside the FastAPI backend recursively re-trains against worker earnings tables and disruption likelihood metrics. By predicting regional exposure indices, the AI dictates accurate weekly premiums matching hyper-local risk topologies—meaning operations in a temperate low-risk city won't arbitrarily subsidize workers executing deliveries directly inside monsoon warning boundaries.

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

*Built for Guidewire DEVTrails 2026 | Team WPIP*
