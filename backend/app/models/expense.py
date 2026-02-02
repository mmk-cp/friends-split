from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Numeric, String, func, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    payer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="RESTRICT"), index=True)

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    shamsi_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    shamsi_month: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    participants: Mapped[list["ExpenseParticipant"]] = relationship(
        "ExpenseParticipant",
        back_populates="expense",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

class ExpenseParticipant(Base):
    __tablename__ = "expense_participants"

    expense_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("expenses.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True, index=True)

    share_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    approved: Mapped[bool] = mapped_column(nullable=False, default=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    expense: Mapped["Expense"] = relationship("Expense", back_populates="participants")
