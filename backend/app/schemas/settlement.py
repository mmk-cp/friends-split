from decimal import Decimal
from pydantic import BaseModel

class TransferSuggestion(BaseModel):
    from_user_id: int
    to_user_id: int
    amount: Decimal

class SettlementReport(BaseModel):
    shamsi_year: int
    shamsi_month: int
    transfers: list[TransferSuggestion]
