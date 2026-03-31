# GigGuard — Synthetic Data Generator & API Backend

Parametric Trigger Worker that simulates delivery platform data (Swiggy/Zomato) and exposes it via FastAPI for the AI/ML service.

## 📁 Files

| File | Purpose |
|---|---|
| `main.py` | FastAPI app + background scheduler |
| `generator.py` | Synthetic worker data generation |
| `db.py` | Supabase connection & query helpers |
| `scheduler.py` | 15-minute async data generation loop |
| `schema.sql` | Supabase table DDL (run once) |
| `requirements.txt` | Python dependencies |
| `Procfile` | Render start command |
| `render.yaml` | Render Blueprint (one-click deploy) |

## 🚀 Run Locally

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set env vars
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the server (includes background data generation)
uvicorn main:app --reload --port 8000
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Service info |
| GET | `/api/workers` | All platform data |
| GET | `/api/swiggy/workers` | Swiggy workers only |
| GET | `/api/zomato/workers` | Zomato workers only |
| GET | `/api/health` | Health check |

All endpoints accept `?limit=N` (default 500, max 5000).

## ☁️ Deploy to Render

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. **New → Web Service** → connect your repo
4. Set **Root Directory** to `backend`
5. Set **Build Command**: `pip install -r requirements.txt`
6. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_KEY` = your service role key
8. Deploy!

The background scheduler will automatically generate 100 rows of synthetic data every 15 minutes.
