from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class PaymentCreate(BaseModel):
    to_user_id: int
    amount: Decimal = Field(gt=0)
    description: str | None = Field(default=None, max_length=500)
    payment_date: date

class PaymentOut(BaseModel):
    id: int
    from_user_id: int
    to_user_id: int
    amount: Decimal
    description: str | None
    payment_date: date
    shamsi_year: int
    shamsi_month: int
    created_at: datetime
    class Config:
        from_attributes = True
