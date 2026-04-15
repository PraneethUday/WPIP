# GigGuard Traffic/Curfew & Fuzzy System Integration Fixes

The recent merge combining the `Traffic` and `Curfew` APIs along with the new continuous `Fuzzy Logic` system introduced parameter mismatches in the backend, and missed integrating the new data visual components into the mobile app UI.

## User Review Required
> [!IMPORTANT]
> Please review this plan. The backend integration changes will ensure that the parametric AI uses the new TTI (Traffic Time Index) and Curfew Confidence metrics for calculating claims and payouts scaling.

## Proposed Changes

### Backend Components

#### [MODIFY] `backend/fuzzy.py`
- Modify `_TRIGGER_CALIBRATION` dictionary:
  - Add exact calibration ranges for `T-05` (Traffic) using entries `(2.5, 3.5)` representing TTI scaling from Severe to Extreme.
  - Add exact calibration ranges for `T-06` (Curfew) using entries `(0.8, 0.95)` representing NLP confidence scaling.
- Change `compute_trigger_severity` parameter from `weather` to `ctx` (context dictionary containing weather + traffic + curfew data).
- Update logic inside `compute_trigger_severity` to extract `tti` for `T-05` and `curfew_confidence` for `T-06`.

#### [MODIFY] `backend/triggers.py`
- In `poll_triggers()`, change `compute_trigger_severity(rule["trigger_id"], weather)` to pass `ctx` instead.
- In `get_trigger_status()`, change `compute_trigger_severity(rule["trigger_id"], weather)` to pass `ctx` instead.
This ensures the trigger evaluator has access to the full data necessary for Traffic and Curfew.

---

### Mobile Components

#### [MODIFY] `mobile/screens/HomeScreen.js`
- Extract `traffic` and `curfew` data from `cityData` returned by `get_trigger_status()`.
- Implement new conditional UI Cards (`TrafficStrip` and `CurfewStrip`) underneath the existing `WeatherCard`. 
- Visualize TTI / Free flow speed / Road Closures and GDELT/NLP unrest confidence, bringing the mobile app up to parity with the web dashboard.

## Verification Plan

### Automated Tests
- Static type and compilation checks: `python3 -m py_compile backend/*.py`.

### Manual Verification
- A user/admin can use the test fire API (`test_fire_trigger(..., trigger_id="T-05")`) and view the dashboard in the UI to ensure the claim logic handles the traffic rules correctly.
- Review Mobile dashboard.
