# هم‌حساب (HamHesab)
تقسیم هزینه‌ها بین دوستان با تمرکز روی تسویه دقیق و شفاف.

## امکانات
- ثبت هزینه و تقسیم مساوی بین افراد
- تایید هزینه توسط مشارکت‌کنندگان
- ثبت پرداخت‌های واقعی (جزئی یا کامل)
- گزارش تسویه ماهانه + مانده حساب شما با هر نفر
- پنل ادمین برای تایید کاربران
- تم روشن/تیره

## تکنولوژی‌ها
- Backend: FastAPI, SQLAlchemy, Alembic, MySQL
- Frontend: Next.js, TailwindCSS, React Query

## اجرای محلی (بدون Docker)

### Backend
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

### Frontend
```bash
cd frontend
npm install

# .env.local بساز
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

npm run dev
```

## اجرای پروژه با Docker
```bash
docker compose up --build
```

سرویس‌ها:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

نکته: اولین کاربر ثبت‌نام‌شده **ادمین** و **تاییدشده** می‌شود.

## متغیرهای محیطی مهم

### Backend
- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `CORS_ORIGINS`

### Frontend
- `NEXT_PUBLIC_API_BASE_URL`

## نکات توسعه
- در Docker، migrationها موقع بالا آمدن Backend اجرا می‌شود.
- اگر دیتای تستی را می‌خواهید پاک کنید:
  ```bash
  docker compose down -v
  ```

---



docker build --build-arg NEXT_PUBLIC_API_BASE_URL="https://hesab-api.tabaro.ir/api/v1" -t "registry.tabaro.ir/friends-split-front:latest" .