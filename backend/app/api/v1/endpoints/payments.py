from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_db, require_approved_user
from app.core.jalali import to_shamsi_year_month
from app.models.user import User
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentOut

router = APIRouter()

def _round2(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

@router.post("/", response_model=PaymentOut)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db), current: User = Depends(require_approved_user)) -> Payment:
    if payload.to_user_id == current.id:
        raise HTTPException(status_code=400, detail="to_user_id cannot be yourself")

    to_user = db.get(User, payload.to_user_id)
    if not to_user:
        raise HTTPException(status_code=404, detail="Receiver user not found")
    if not to_user.is_approved:
        raise HTTPException(status_code=400, detail="Receiver user is not approved")

    sh_y, sh_m = to_shamsi_year_month(payload.payment_date)

    payment = Payment(
        from_user_id=current.id,
        to_user_id=payload.to_user_id,
        amount=_round2(Decimal(payload.amount)),
        description=payload.description,
        payment_date=payload.payment_date,
        shamsi_year=sh_y,
        shamsi_month=sh_m,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.get("/", response_model=list[PaymentOut])
def list_payments(
    db: Session = Depends(get_db),
    _: User = Depends(require_approved_user),
    shamsi_year: int | None = None,
    shamsi_month: int | None = None,
) -> list[Payment]:
    stmt = select(Payment).order_by(Payment.id.desc())
    if shamsi_year is not None:
        stmt = stmt.where(Payment.shamsi_year == shamsi_year)
    if shamsi_month is not None:
        stmt = stmt.where(Payment.shamsi_month == shamsi_month)
    payments = db.scalars(stmt).all()
    return list(payments)
