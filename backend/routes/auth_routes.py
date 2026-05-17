# ============================================
# ZAVARA AUTH ROUTES
# ============================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import (
    UserRegister, UserResponse,
    UserLogin, TokenResponse
)
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/users", tags=["Auth"])

ZAVARA_ROLES = {
    "regular":   "Member",
    "producer":  "Harvest Partner",
    "seller":    "Market Seller",
    "transport": "Swift Partner",
    "haven":     "Haven Partner",
    "cuisine":   "Cuisine Partner",
    "admin":     "Overseer"
}


@router.post("/register", response_model=UserResponse)
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(
        User.email == user.email
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    hashed = hash_password(user.password)
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed,
        phone=user.phone,
        role="regular"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=TokenResponse)
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()
    if not db_user or not verify_password(
        user.password, db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    token = create_access_token(
        data={"sub": db_user.email}
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": db_user.name,
        "user_id": db_user.id,
        "role": db_user.role
    }


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return user