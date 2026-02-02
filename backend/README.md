# HamHesab - Backend (FastAPI + MySQL)

## Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Env
Create `.env` (or export env vars):
```bash
DATABASE_URL="mysql+pymysql://user:pass@localhost:3306/friends_split?charset=utf8mb4"
SECRET_KEY="change_me_very_long_random"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS="http://localhost:3000"
```

## Migrations
```bash
alembic upgrade head
```

## Run
```bash
uvicorn app.main:app --reload
```

- First registered user becomes **admin** and **approved** automatically.
- Other users are **pending** until admin approves.
- Expenses are **pending** until all participants approve.
- Monthly settlement works with **Shamsi (Jalali) year/month** (query params).
