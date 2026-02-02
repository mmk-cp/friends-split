from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class ExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    description: str | None = Field(default=None, max_length=500)
    expense_date: date
    participant_user_ids: list[int] = Field(min_length=1)

class ExpenseParticipantOut(BaseModel):
    user_id: int
    share_amount: Decimal
    approved: bool
    approved_at: datetime | None
    class Config:
        from_attributes = True

class ExpenseOut(BaseModel):
    id: int
    payer_id: int
    amount: Decimal
    description: str | None
    expense_date: date
    shamsi_year: int
    shamsi_month: int
    status: str
    created_at: datetime
    participants: list[ExpenseParticipantOut]
    class Config:
        from_attributes = True

class ExpenseApproveResponse(BaseModel):
    expense_id: int
    user_id: int
    approved: bool
    expense_status: str
