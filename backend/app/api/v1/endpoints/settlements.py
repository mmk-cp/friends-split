from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_

from app.api.deps import get_db, require_approved_user
from app.models.user import User
from app.models.expense import Expense, ExpenseParticipant
from app.models.payment import Payment
from app.schemas.settlement import SettlementReport, TransferSuggestion, UserBalance

router = APIRouter()

def _round2(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

@router.get("", response_model=SettlementReport)
def settlement_for_month(
    shamsi_year: int,
    shamsi_month: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_approved_user),
    scope: str | None = None,
) -> SettlementReport:
    is_admin_view = current.is_admin and scope == "all"
    users = db.scalars(select(User).where(User.is_approved == True)).all()  # noqa: E712
    user_ids = [u.id for u in users]
    net: dict[int, Decimal] = {uid: Decimal("0.00") for uid in user_ids}
    my_net: dict[int, Decimal] = {uid: Decimal("0.00") for uid in user_ids if uid != current.id}

    month_filter = or_(
        Expense.shamsi_year < shamsi_year,
        and_(Expense.shamsi_year == shamsi_year, Expense.shamsi_month <= shamsi_month),
    )

    exp_stmt = select(Expense).where(and_(month_filter, Expense.status == "approved"))
    if not is_admin_view:
        exp_stmt = (
            exp_stmt.join(ExpenseParticipant, ExpenseParticipant.expense_id == Expense.id, isouter=True)
            .where(or_(Expense.payer_id == current.id, ExpenseParticipant.user_id == current.id))
            .distinct()
        )
    expenses = db.scalars(exp_stmt).all()

    for e in expenses:
        parts = db.scalars(select(ExpenseParticipant).where(ExpenseParticipant.expense_id == e.id)).all()
        payer = e.payer_id
        for p in parts:
            if p.user_id != payer:
                net[p.user_id] -= Decimal(p.share_amount)
                net[payer] += Decimal(p.share_amount)
            if payer == current.id and p.user_id in my_net and p.user_id != payer:
                my_net[p.user_id] += Decimal(p.share_amount)
            elif p.user_id == current.id and payer in my_net and p.user_id != payer:
                my_net[payer] -= Decimal(p.share_amount)

    pay_filter = or_(
        Payment.shamsi_year < shamsi_year,
        and_(Payment.shamsi_year == shamsi_year, Payment.shamsi_month <= shamsi_month),
    )
    pay_stmt = select(Payment).where(pay_filter)
    if not is_admin_view:
        pay_stmt = pay_stmt.where(or_(Payment.from_user_id == current.id, Payment.to_user_id == current.id))
    payments = db.scalars(pay_stmt).all()
    for pay in payments:
        if pay.from_user_id in net:
            net[pay.from_user_id] += Decimal(pay.amount)
        if pay.to_user_id in net:
            net[pay.to_user_id] -= Decimal(pay.amount)
        if pay.from_user_id == current.id and pay.to_user_id in my_net:
            my_net[pay.to_user_id] += Decimal(pay.amount)
        elif pay.to_user_id == current.id and pay.from_user_id in my_net:
            my_net[pay.from_user_id] -= Decimal(pay.amount)

    transfers: list[TransferSuggestion] = []
    if is_admin_view:
        debtors = [(uid, -bal) for uid, bal in net.items() if bal < 0]
        creditors = [(uid, bal) for uid, bal in net.items() if bal > 0]
        debtors.sort(key=lambda x: x[1], reverse=True)
        creditors.sort(key=lambda x: x[1], reverse=True)

        i = j = 0
        while i < len(debtors) and j < len(creditors):
            d_uid, d_amt = debtors[i]
            c_uid, c_amt = creditors[j]
            x = d_amt if d_amt < c_amt else c_amt
            x = _round2(x)
            if x > 0:
                transfers.append(TransferSuggestion(from_user_id=d_uid, to_user_id=c_uid, amount=x))
            d_amt -= x
            c_amt -= x
            debtors[i] = (d_uid, d_amt)
            creditors[j] = (c_uid, c_amt)
            if d_amt <= Decimal("0.0001"):
                i += 1
            if c_amt <= Decimal("0.0001"):
                j += 1

    balances = [UserBalance(user_id=uid, balance=_round2(bal)) for uid, bal in net.items()] if is_admin_view else []
    my_balances = [
        UserBalance(user_id=uid, balance=_round2(bal))
        for uid, bal in my_net.items()
        if abs(bal) > Decimal("0.0001")
    ]

    return SettlementReport(
        shamsi_year=shamsi_year,
        shamsi_month=shamsi_month,
        balances=balances,
        my_balances=my_balances,
        transfers=transfers,
    )
