import os
import time

from sqlalchemy import create_engine, text


def main() -> int:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is not set", flush=True)
        return 1

    timeout = int(os.getenv("DB_WAIT_TIMEOUT", "60"))
    delay = 2
    deadline = time.time() + timeout

    while time.time() < deadline:
        try:
            engine = create_engine(database_url, pool_pre_ping=True)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("Database is ready", flush=True)
            return 0
        except Exception as exc:
            print(f"Waiting for database... ({exc})", flush=True)
            time.sleep(delay)

    print("Database is not ready in time", flush=True)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
