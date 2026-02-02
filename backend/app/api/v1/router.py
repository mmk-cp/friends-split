from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.expenses import router as expenses_router
from app.api.v1.endpoints.payments import router as payments_router
from app.api.v1.endpoints.settlements import router as settlements_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(expenses_router, prefix="/expenses", tags=["expenses"])
api_router.include_router(payments_router, prefix="/payments", tags=["payments"])
api_router.include_router(settlements_router, prefix="/settlements", tags=["settlements"])
