"""
sync_models.py — Copy trained .joblib model files from backend → ml_service.

Run this ONCE after the backend has finished retraining (or whenever
the backend produces a new model):

    python sync_models.py          (from the GigGuard/ root)
  OR
    python ml_service/sync_models.py

It copies:
  backend/ml/saved_models/premium_model.joblib  → ml_service/saved_models/
  backend/ml/saved_models/model_metadata.json   → ml_service/saved_models/
  backend/ml/saved_models/fraud_model.joblib    → ml_service/saved_models/
"""

import shutil
from pathlib import Path

ROOT       = Path(__file__).parent.parent          # GigGuard/
BACKEND_ML = ROOT / "backend" / "ml" / "saved_models"
ML_SVC     = ROOT / "ml_service" / "saved_models"

ML_SVC.mkdir(exist_ok=True)

FILES = [
    "premium_model.joblib",
    "model_metadata.json",
    "fraud_model.joblib",
]

print("=" * 55)
print("GigGuard — syncing model files to ml_service")
print("=" * 55)

for fname in FILES:
    src = BACKEND_ML / fname
    dst = ML_SVC / fname
    if src.exists():
        shutil.copy2(src, dst)
        print(f"  ✓  Copied  {fname}")
    else:
        print(f"  ✗  MISSING {fname}  (backend hasn't trained yet)")

print("\nDone. Restart ml_service to pick up the new models.")
print("  uvicorn main:app --host 0.0.0.0 --port 8001 --reload")
