from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.api.deps import get_db, require_approved_user
from app.core.jalali import to_shamsi_year_month
from app.models.user import User
from app.models.expense import Expense, ExpenseParticipant
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseApproveResponse

router = APIRouter()

def _round2(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

@router.post("/", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db), current: User = Depends(require_approved_user)) -> Expense:
    participant_ids = list(dict.fromkeys(payload.participant_user_ids))
    if not participant_ids:
        raise HTTPException(status_code=400, detail="participant_user_ids cannot be empty")

    users = db.scalars(select(User).where(User.id.in_(participant_ids))).all()
    if len(users) != len(participant_ids):
        raise HTTPException(status_code=400, detail="Some participant_user_ids do not exist")

    not_approved = [u.id for u in users if not u.is_approved]
    if not_approved:
        raise HTTPException(status_code=400, detail=f"These users are not approved: {not_approved}")

    sh_y, sh_m = to_shamsi_year_month(payload.expense_date)

    count = Decimal(len(participant_ids))
    share = _round2(Decimal(payload.amount) / count)

    expense = Expense(
        payer_id=current.id,
        amount=_round2(Decimal(payload.amount)),
        description=payload.description,
        expense_date=payload.expense_date,
        shamsi_year=sh_y,
        shamsi_month=sh_m,
        status="pending",
    )
    db.add(expense)
    db.flush()

    participants: list[ExpenseParticipant] = []
    for uid in participant_ids:
        auto = uid == current.id
        participants.append(
            ExpenseParticipant(
                expense_id=expense.id,
                user_id=uid,
                share_amount=share,
                approved=auto,
                approved_at=(datetime.now(timezone.utc) if auto else None),
            )
        )

    expense.participants = participants
    db.add_all(participants)

    if all(p.approved for p in participants):
        expense.status = "approved"

    db.commit()
    db.refresh(expense)
    return expense

@router.get("/", response_model=list[ExpenseOut])
def list_expenses(
    db: Session = Depends(get_db),
    _: User = Depends(require_approved_user),
    shamsi_year: int | None = None,
    shamsi_month: int | None = None,
) -> list[Expense]:
    stmt = select(Expense).order_by(Expense.id.desc())
    if shamsi_year is not None:
        stmt = stmt.where(Expense.shamsi_year == shamsi_year)
    if shamsi_month is not None:
        stmt = stmt.where(Expense.shamsi_month == shamsi_month)
    expenses = db.scalars(stmt).all()
    return list(expenses)

@router.get("/pending-my-approvals", response_model=list[ExpenseOut])
def pending_my_approvals(db: Session = Depends(get_db), current: User = Depends(require_approved_user)) -> list[Expense]:
    expense_ids = db.scalars(
        select(ExpenseParticipant.expense_id).where(
            and_(ExpenseParticipant.user_id == current.id, ExpenseParticipant.approved == False)  # noqa: E712
        )
    ).all()
    if not expense_ids:
        return []
    expenses = db.scalars(select(Expense).where(Expense.id.in_(expense_ids))).all()
    return list(expenses)

@router.post("/{expense_id}/approve", response_model=ExpenseApproveResponse)
def approve_expense(expense_id: int, db: Session = Depends(get_db), current: User = Depends(require_approved_user)) -> ExpenseApproveResponse:
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    ep = db.get(ExpenseParticipant, {"expense_id": expense_id, "user_id": current.id})
    if not ep:
        raise HTTPException(status_code=403, detail="You are not a participant of this expense")

    if ep.approved:
        return ExpenseApproveResponse(expense_id=expense_id, user_id=current.id, approved=True, expense_status=expense.status)

    ep.approved = True
    ep.approved_at = datetime.now(timezone.utc)

    participants = db.scalars(select(ExpenseParticipant).where(ExpenseParticipant.expense_id == expense_id)).all()
    if all(p.approved for p in participants):
        expense.status = "approved"

    db.commit()
    db.refresh(expense)
    return ExpenseApproveResponse(expense_id=expense_id, user_id=current.id, approved=True, expense_status=expense.status)
