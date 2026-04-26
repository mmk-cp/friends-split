from __future__ import annotations

import os
import unittest
from datetime import date
from decimal import Decimal

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1.endpoints.settlements import settlement_overall
from app.core.database import Base
from app.models.expense import Expense, ExpenseParticipant
from app.models.payment import Payment
from app.models.user import User


class TestSettlementOverall(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.SessionLocal = sessionmaker(bind=cls.engine, autoflush=False, autocommit=False)
        Base.metadata.create_all(bind=cls.engine)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)

    def setUp(self):
        self.db: Session = self.SessionLocal()
        self._seed()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)

    def _seed(self):
        admin = User(
            id=1,
            first_name="Admin",
            last_name="User",
            username="admin",
            hashed_password="x",
            is_admin=True,
            is_approved=True,
            is_active=True,
        )
        ali = User(
            id=2,
            first_name="Ali",
            last_name="A",
            username="ali",
            hashed_password="x",
            is_admin=False,
            is_approved=True,
            is_active=True,
        )
        sara = User(
            id=3,
            first_name="Sara",
            last_name="S",
            username="sara",
            hashed_password="x",
            is_admin=False,
            is_approved=True,
            is_active=True,
        )
        self.db.add_all([admin, ali, sara])
        self.db.flush()

        # Across different months/years.
        e1 = Expense(
            id=100,
            payer_id=admin.id,
            amount=Decimal("300.00"),
            description="Bahman expense",
            expense_date=date(2026, 1, 1),
            shamsi_year=1404,
            shamsi_month=11,
            status="approved",
        )
        e2 = Expense(
            id=101,
            payer_id=ali.id,
            amount=Decimal("90.00"),
            description="Esfand expense",
            expense_date=date(2026, 2, 1),
            shamsi_year=1404,
            shamsi_month=12,
            status="approved",
        )
        e3 = Expense(
            id=102,
            payer_id=sara.id,
            amount=Decimal("120.00"),
            description="Farvardin expense",
            expense_date=date(2026, 3, 25),
            shamsi_year=1405,
            shamsi_month=1,
            status="approved",
        )
        self.db.add_all([e1, e2, e3])
        self.db.flush()

        self.db.add_all(
            [
                ExpenseParticipant(expense_id=100, user_id=1, share_amount=Decimal("100.00"), approved=True),
                ExpenseParticipant(expense_id=100, user_id=2, share_amount=Decimal("100.00"), approved=True),
                ExpenseParticipant(expense_id=100, user_id=3, share_amount=Decimal("100.00"), approved=True),
                ExpenseParticipant(expense_id=101, user_id=1, share_amount=Decimal("30.00"), approved=True),
                ExpenseParticipant(expense_id=101, user_id=2, share_amount=Decimal("30.00"), approved=True),
                ExpenseParticipant(expense_id=101, user_id=3, share_amount=Decimal("30.00"), approved=True),
                ExpenseParticipant(expense_id=102, user_id=1, share_amount=Decimal("40.00"), approved=True),
                ExpenseParticipant(expense_id=102, user_id=2, share_amount=Decimal("40.00"), approved=True),
                ExpenseParticipant(expense_id=102, user_id=3, share_amount=Decimal("40.00"), approved=True),
            ]
        )

        self.db.add_all(
            [
                Payment(
                    id=200,
                    from_user_id=2,
                    to_user_id=1,
                    amount=Decimal("50.00"),
                    description="old payment",
                    payment_date=date(2026, 2, 15),
                    shamsi_year=1404,
                    shamsi_month=12,
                ),
                Payment(
                    id=201,
                    from_user_id=3,
                    to_user_id=1,
                    amount=Decimal("20.00"),
                    description="new payment",
                    payment_date=date(2026, 4, 10),
                    shamsi_year=1405,
                    shamsi_month=1,
                ),
            ]
        )
        self.db.commit()

        self.admin = admin
        self.ali = ali

    def test_overall_admin_scope_all(self):
        report = settlement_overall(db=self.db, current=self.admin, scope="all")

        balances = {b.user_id: b.balance for b in report.balances}
        self.assertEqual(
            balances,
            {
                1: Decimal("60.00"),
                2: Decimal("-30.00"),
                3: Decimal("-30.00"),
            },
        )

        transfer_amounts = sorted([t.amount for t in report.transfers])
        self.assertEqual(transfer_amounts, [Decimal("30.00"), Decimal("30.00")])

    def test_overall_regular_user_my_balances(self):
        report = settlement_overall(db=self.db, current=self.ali, scope="mine")
        my = {b.user_id: b.balance for b in report.my_balances}
        self.assertEqual(
            my,
            {
                1: Decimal("-20.00"),
                3: Decimal("-10.00"),
            },
        )


if __name__ == "__main__":
    unittest.main()
