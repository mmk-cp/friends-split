### راه‌اندازی سریع

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# .env بساز
DATABASE_URL="mysql+pymysql://user:pass@localhost:3306/friends_split?charset=utf8mb4"
SECRET_KEY="change_me_very_long_random"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS="http://localhost:3000"

alembic upgrade head
uvicorn app.main:app --reload
```

#### Front

```bash
cd front
npm install

# .env.local بساز
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

npm run dev
```
