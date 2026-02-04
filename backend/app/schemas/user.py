from datetime import datetime
from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=6, max_length=128)

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    username: str
    is_admin: bool
    is_approved: bool
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class UserApproveRequest(BaseModel):
    is_approved: bool = True

class UserActiveRequest(BaseModel):
    is_active: bool = True
