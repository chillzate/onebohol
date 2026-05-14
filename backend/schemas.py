from pydantic import BaseModel
from typing import Optional

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "buyer"

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_name: str

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    unit: str
    quantity: int
    category: str

class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    unit: str
    quantity: int
    category: str
    farmer_id: int

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    product_id: int
    quantity: int

class OrderResponse(BaseModel):
    id: int
    buyer_id: int
    product_id: int
    quantity: int
    total_price: float
    status: str

    class Config:
        from_attributes = True