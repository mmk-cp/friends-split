from decimal import Decimal
from pydantic import BaseModel

class UserBalance(BaseModel):
    user_id: int
    balance: Decimal

class TransferSuggestion(BaseModel):
    from_user_id: int
    to_user_id: int
    amount: Decimal

class SettlementReport(BaseModel):
    shamsi_year: int
    shamsi_month: int
    balances: list[UserBalance]
    my_balances: list[UserBalance]
    transfers: list[TransferSuggestion]
