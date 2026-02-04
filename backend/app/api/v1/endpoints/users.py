from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.api.deps import get_db, get_current_user, require_admin
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserApproveRequest

router = APIRouter()

@router.post("", response_model=UserOut)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    exists = db.scalar(select(User).where(User.username == payload.username))
    if exists:
        raise HTTPException(status_code=400, detail="Username already exists")

    user_count = db.scalar(select(func.count()).select_from(User)) or 0
    is_first = user_count == 0

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        is_admin=is_first,
        is_approved=is_first,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)) -> User:
    return current

@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[User]:
    users = db.scalars(select(User).order_by(User.id.asc())).all()
    return list(users)

@router.get("/pending-approvals", response_model=list[UserOut])
def list_pending_users(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[User]:
    users = db.scalars(select(User).where(User.is_approved == False)).all()  # noqa: E712
    return list(users)

@router.patch("/{user_id}/approve", response_model=UserOut)
def approve_user(
    user_id: int,
    payload: UserApproveRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = bool(payload.is_approved)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=204, response_class=Response)
def delete_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> Response:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Admin user cannot be deleted")
    if user.is_approved:
        raise HTTPException(status_code=400, detail="Approved user cannot be deleted")

    db.delete(user)
    db.commit()
    return Response(status_code=204)
