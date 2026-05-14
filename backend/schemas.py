from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# USER SCHEMAS
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    role: str
    is_verified: bool

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_id: int
    role: str

# VERIFICATION SCHEMAS
class VerificationRequestCreate(BaseModel):
    requested_role: str
    document_url: Optional[str] = None

class VerificationResponse(BaseModel):
    id: int
    user_id: int
    requested_role: str
    status: str

    class Config:
        from_attributes = True

# RESTAURANT SCHEMAS
class RestaurantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    category: str
    delivery_range_km: Optional[float] = 5.0
    delivery_fee: Optional[float] = 50.0

class RestaurantResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    address: str
    category: str
    is_open: bool
    delivery_range_km: float
    delivery_fee: float
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

# MENU ITEM SCHEMAS
class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image_url: Optional[str] = None

class MenuItemResponse(BaseModel):
    id: int
    restaurant_id: int
    name: str
    description: Optional[str]
    price: float
    category: str
    is_available: bool
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

# PRODUCT SCHEMAS (Farm products)
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    unit: str
    quantity: int
    category: str

class ProductResponse(BaseModel):
    id: int
    farmer_id: int
    name: str
    description: Optional[str]
    price: float
    unit: str
    quantity: int
    category: str
    is_available: bool

    class Config:
        from_attributes = True

# ORDER SCHEMAS
class OrderCreate(BaseModel):
    product_id: Optional[int] = None
    menu_item_id: Optional[int] = None
    quantity: int
    order_type: str
    delivery_address: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    buyer_id: int
    quantity: int
    total_price: float
    status: str
    order_type: str

    class Config:
        from_attributes = True

# RIDE SCHEMAS
class RideRequestCreate(BaseModel):
    pickup_location: str
    dropoff_location: str
    ride_type: str

class RideResponse(BaseModel):
    id: int
    passenger_id: int
    pickup_location: str
    dropoff_location: str
    ride_type: str
    status: str
    fare: Optional[float]

    class Config:
        from_attributes = True

# JOB SCHEMAS
class JobPostCreate(BaseModel):
    title: str
    description: str
    location: str
    salary: Optional[float] = None
    job_type: str

class JobPostResponse(BaseModel):
    id: int
    poster_id: int
    title: str
    description: str
    location: str
    salary: Optional[float]
    job_type: str
    is_active: bool

    class Config:
        from_attributes = True

# SOS SCHEMAS
class SosAlertCreate(BaseModel):
    location: str
    alert_type: str

class SosAlertResponse(BaseModel):
    id: int
    user_id: int
    location: str
    alert_type: str
    status: str

    class Config:
        from_attributes = True