import os
import random
import string
import time
from datetime import date, timedelta

import requests

# ====== FILL THESE LATER ======
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "pass"
# ==============================

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1").rstrip("/")
PER_USER_EXPENSES = 100
PER_USER_PAYMENTS = 100
TOTAL_USERS = 100


def rand_str(n: int) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def rand_date_within(days: int = 180) -> str:
    d = date.today() - timedelta(days=random.randint(0, days))
    return d.isoformat()


def api(method: str, path: str, token: str | None = None, **kwargs):
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    headers["Content-Type"] = "application/json"
    url = f"{API_BASE}{path}"
    res = requests.request(method, url, headers=headers, **kwargs)
    if res.status_code >= 400:
        raise RuntimeError(f"{method} {path} -> {res.status_code}: {res.text}")
    if res.text:
        return res.json()
    return None


def login(username: str, password: str) -> str:
    data = {"username": username, "password": password}
    res = requests.post(f"{API_BASE}/auth/login", json=data)
    if res.status_code >= 400:
        raise RuntimeError(f"LOGIN failed {res.status_code}: {res.text}")
    return res.json()["access_token"]


def main():
    if not ADMIN_USERNAME or not ADMIN_PASSWORD:
        raise SystemExit("Set ADMIN_USERNAME and ADMIN_PASSWORD first.")

    # print(ADMIN_USERNAME, ADMIN_PASSWORD)
    token = login(ADMIN_USERNAME, ADMIN_PASSWORD)

    # create users
    users = []
    for i in range(TOTAL_USERS):
        username = f"user_{rand_str(8)}_{i}"
        payload = {
            "first_name": f"User{i+1}",
            "last_name": "Test",
            "username": username,
            "password": "12345678",
        }
        user = api("POST", "/users", token=None, json=payload)
        users.append(user)

    # approve users
    for u in users:
        api("PATCH", f"/users/{u['id']}/approve", token=token, json={"is_approved": True})

    # create expenses and payments per user
    user_ids = [u["id"] for u in users]
    for uid in user_ids:
        user_token = login(next(u["username"] for u in users if u["id"] == uid), "12345678")

        # expenses
        for _ in range(PER_USER_EXPENSES):
            participants = random.sample(user_ids, k=min(5, len(user_ids)))
            if uid not in participants:
                participants[0] = uid
            expense_payload = {
                "amount": random.randint(10000, 2000000),
                "description": f"Expense {rand_str(6)}",
                "expense_date": rand_date_within(),
                "participant_user_ids": participants,
            }
            api("POST", "/expenses", token=user_token, json=expense_payload)

        # payments
        for _ in range(PER_USER_PAYMENTS):
            to_user = random.choice([x for x in user_ids if x != uid])
            pay_payload = {
                "to_user_id": to_user,
                "amount": random.randint(10000, 2000000),
                "description": f"Payment {rand_str(6)}",
                "payment_date": rand_date_within(),
            }
            api("POST", "/payments", token=user_token, json=pay_payload)

        time.sleep(0.2)


if __name__ == "__main__":
    main()
