# ============================================
# ZAVARA AUTH.PY
# ============================================
import os
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "zavara_super_secret_key_2024"
)
ALGORITHM = "HS256"

# ✅ IMPROVED: 7 days for mobile apps
# WHY: Uber/Grab/GCash don't log you out
# every 30 mins - that's terrible UX!
# 30 mins is for banking apps, not delivery
ACCESS_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        days=ACCESS_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_token(token: str) -> dict:
    """
    Decode and validate JWT token
    Raises HTTPException if invalid
    """
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token expired or invalid"
        )