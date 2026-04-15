# GigGuard: Deep System & Codebase Analysis

## 1. System Architecture & Foundation
**GigGuard** is an AI-powered parametric micro-insurance platform designed around the gig economy's week-to-week workforce dynamics in India. The current system implements a full closed-loop architecture that simulates worker activity, computes machine-learning driven risk premiums, actively polls environmental trigger thresholds, and automatically processes claim logic and fraud checks.

### Core Stack & Services:
*   **Backend (Python 3.12 / FastAPI):** The central nervous system handling all background processes (15-min scheduler), synthetic data generation, machine learning inference (XGBoost/Isolation Forests), triggers, and the primary REST API.
*   **Datastore (PostgreSQL / Supabase):** 8 distinct platform tables (`swiggy_workers`, `zomato_workers`, `amazon_flex_workers`, `blinkit_workers`, `zepto_workers`, `meesho_workers`, `porter_workers`, `dunzo_workers`), alongside `claims`, `gps_checkins`, `premium_predictions`, and `disruption_events`.
*   **Web Dashboard (Next.js / TypeScript):** Worker-facing registration and dashboard interfaces.
*   **Admin Panel (Next.js / TypeScript):** Internal tools for triggering disruptions manually, triggering ML retraining, and viewing system capacity.
*   **Mobile App (React Native/Expo):** Worker endpoint for checking GPS proximities and viewing payments.

---

## 2. In-Depth Data Simulation Layer
Because real-world API access to Zomato/Swiggy is unavailable to external parties, the system maintains a robust, highly-deterministic **Synthetic Data Generator (`generator.py`)**.

### User Initialization & Seed Logic
*   **Deterministic UUIDs:** Uses `hashlib.md5(seed_string.encode()).hexdigest()` to ensure consistent `worker_id` tracking across container restarts. There are precisely **200 persistent worker profiles** dispersed equally among the 8 database tables.
*   **Base Behaviors:** Ratings are bounded `(3.5 - 5.0)`. Base Deliveries range `(8 - 25)` per day. 90% of profiles are designated as "verified."

### Daily Activity Physics (Generator Math)
Activity rows are injected every 15 minutes. Daily delivery profiles use statistical Normal Distributions:
*   **Delivery Output Equation:** `deliveries = max(1, np.random.normal(loc=base, scale=base * 0.15))`
*   **Temporal Boosts:** `WEEKEND_BOOST = 1.3`. Deliveries on Saturdays/Sundays scale linearly.
*   **Shock Events:** `ANOMALY_CHANCE = 0.05`. There is a 5% chance of simulating a heavily boosted day where a worker performs `2.0x to 3.0x` their normal output.
*   **Financial Bounds:** Active hours per delivery bounded `[0.35 - 0.55]`. Earnings bounded `[INR 25 - INR 40]` per delivery.

---

## 3. Machine Learning Models - Deep Dive

The platform employs specific programmatic ML systems that recalculate risk contexts weekly.

### A. Dynamic Premium Prediction Model (`premium_model.py`)
This is the core algorithmic component for pricing policies dynamically. 

*   **Model Specification:** `xgboost.XGBRegressor`
*   **Hyperparameters:** `n_estimators=200`, `max_depth=6`, `learning_rate=0.05`, `subsample=0.8`, `colsample_bytree=0.8`, `reg_alpha=0.1`, `reg_lambda=1.0`. Evaluated using `mean_squared_error` (RMSE) with an 80/20 train-test split.
*   **Extracted Features (23 per worker):** The ML transforms 30-day SQL datasets into a 23-column tensor, tracking standard metrics alongside computed traits like `earnings_trend` (3-day vs 7-day delta), `earnings_cv` (Coefficient of Variation—Standard Deviation divided by mean), and `earn_per_hour`.
*   **Weather Risk Composite Equation:**
    ```python
    weather_risk = min(1.0, (
        (rain_1h / 50.0) * 0.3 +       # 30% weighting for instant rain
        (aqi_index / 500.0) * 0.3 +    # 30% weighting for active pollution
        (max(0, temp - 40) / 15.0) * 0.2 + # 20% weighting for temperatures crossing 40C
        is_heavy_rain * 0.1 +          # 10% penalty for formal warning label
        is_severe_aqi * 0.1            # 10% penalty for formal warning label
    ))
    ```
*   **Premium Calculation Adjustments:**
    The model's target premium generates raw numbers before tier enforcement. Modifiers:
    1.  *Risk Factor:* `1.0 + weather_risk * 0.5`
    2.  *Consistency Factor:* `1.0 + min(earnings_cv, 0.5) * 0.4` (inconsistent workers pay more).
    3.  *Efficiency Factor:* `max(0.8, min(1.2, 1.0 - (earn_per_hour - 100) / 500))`
*   **Strict Disruption Tiering:** Raw numbers are securely clamped to boundaries at distribution time (e.g., standard tier bounded `20 - 250` weekly). Autopay users achieve a pure 5% flat drop applied lastly.

### B. Intelligent Fraud Detection System (`fraud_model.py`)
Leverages Unsupervised Learning to catch strange anomaly blocks without needing explicit prior labels.

*   **Model Specification:** `sklearn.ensemble.IsolationForest` (`n_estimators=100`, `contamination=0.1`).
*   **Features Used:** `claim_count_30d`, `total_payout_30d`, `payout_amount`, `payout_ratio`, `daily_wage`, `cross_platform_flag`, `gps_flag`.
*   **Scoring Logic:**
    *   IsolationForest maps its internal decision outputs tightly. GigGuard clips this: `np.clip(0.5 - raw_score, 0.0, 1.0)`. A normalized core `> 0.6` pushes an `"ML_anomaly_detected"` flag.
    *   **Rule-Based Fallback Engine:** If the ML container is un-trained (sub 20-claims) or fails, the code applies a strict linear penalizer metric:
        * `+ 0.35` for active activity on other SQL app tables (`cross_platform_activity`).
        * `+ 0.15` for missing or mismatched GPS parameters (`gps_not_verified`).
        * `+ 0.25` if there have been > 5 claims in the past 30 days (`high_claim_frequency`).
        * `+ 0.15` if the worker is asking for more than 45% of their average max wage layout (`high_payout_ratio`).
    *   **Actionable Limit:** If the `score > 0.75`, the status flips from `approved` to `under_review`.

---

## 4. Parametric Triggers & Execution Pipeline

GigGuard handles 0% manual claims. Instead, the backend background `scheduler.py` wakes every 15 minutes to call `triggers.py`.

### Trigger Formulations
1.  **T-01 (Heavy Rainfall):** Fired if open weather mapping hits `rain_1h > 20mm` OR `rain_3h > 64.5mm`. Severity marked as `"extreme"` if `rain_3h > 100mm`.
2.  **T-02 (Extreme Heat):** Fired if `temperature > 45°C`
3.  **T-03 (Severe AQI):** Fired if `AQI >= 400`
4.  **T-04 (Flood Risk):** Fired if `rain_3h > 100mm`
5.  **T-05 (Curfew):** Stub. Pending RSS/gov feed integrations. 

### Claim Execution Logic (`claims.py`)
If a city hits a trigger, the disruption loop loops through `PLATFORM_TABLES` for that city.
1.  **Cross Platform Ping:** Selects all matching tables matching `worker_id` and `date`. If deliveries > 0, the script flags `cross_platform_clear = False`.
2.  **Payout Math Formulation:**
    *   Worker `daily_wage` = Rolling total recent earnings / active days.
    *   Assumed hours metric `hourly_rate = daily_wage / 8.0`  
    *   `raw_payout = hourly_rate * disrupted_hours` (disrupted hours bounds to 6.0 internally).
    *   `Payout Cap = daily_wage * 0.50` (A single event cannot recoup > 50% of an entire 8-hour shift).
    *   Final Payout Output = `min(raw_payout, Payout Cap)`

---

## 5. Security & Verification
*   **Verification Bypass Guards:** The API runs JWT tokenization checks securely via `HS256`, utilizing bcrypt with a work factor of 12 for password hashing mapping against Supabase tables.
*   **Multi-App GPS Corroboration:** The Mobile App uses standard Native geolocation packages which check Lat/Long endpoints against Haversine bounding boxes from city cores on the FastAPI instances.

## Conclusion 
GigGuard operates as an incredibly robust micro-service cluster, not merely faking its AI implementation but driving genuine gradient-boosted regressions bounding user attributes mathematically. It protects operational risk systematically by strictly separating predictive models (Premium Prediction XGB) and preventative architectures (Isolation Forest Fraud Guard).
