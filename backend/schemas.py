# ============================================
# ZAVARA SCHEMAS.PY - COMPLETE VERSION
# ============================================
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime


# ============================================
# REVIEW SCHEMAS
# ============================================
class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None
    restaurant_id: Optional[int] = None
    product_id: Optional[int] = None
    order_id: Optional[int] = None

    @validator("rating")
    def rating_must_be_valid(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Rating must be 1-5")
        return v


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    rating: int
    comment: Optional[str]
    restaurant_id: Optional[int]
    product_id: Optional[int]
    order_id: Optional[int]
    is_verified_purchase: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# USER SCHEMAS
# ============================================
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None

    @validator("email")
    def email_must_be_valid(cls, v):
        if "@" not in v:
            raise ValueError("Invalid email")
        return v.lower().strip()

    @validator("password")
    def password_must_be_strong(cls, v):
        if len(v) < 6:
            raise ValueError(
                "Password must be at least 6 characters"
            )
        return v

    @validator("name")
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


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

    @validator("email")
    def email_lowercase(cls, v):
        return v.lower().strip()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_id: int
    role: str


# ============================================
# VERIFICATION SCHEMAS
# ============================================
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


# ============================================
# RESTAURANT SCHEMAS
# ============================================
class RestaurantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    category: str
    delivery_range_km: Optional[float] = 5.0
    delivery_fee: Optional[float] = 50.0
    image_url: Optional[str] = None


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


# ============================================
# MENU ITEM SCHEMAS
# ============================================
class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image_url: Optional[str] = None

    @validator("price")
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be positive")
        return v


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


# ============================================
# PRODUCT SCHEMAS
# ============================================
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    unit: str
    quantity: int
    category: str
    market_type: Optional[str] = "wholesale"

    @validator("price")
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be positive")
        return v

    @validator("quantity")
    def quantity_must_be_positive(cls, v):
        if v < 0:
            raise ValueError(
                "Quantity cannot be negative"
            )
        return v

    @validator("market_type")
    def market_type_must_be_valid(cls, v):
        if v not in ["wholesale", "retail"]:
            raise ValueError(
                "market_type must be wholesale or retail"
            )
        return v


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
    is_approved: Optional[bool] = False
    total_sold: Optional[int] = 0
    rating: Optional[float] = 0.0
    total_reviews: Optional[int] = 0
    image_url: Optional[str] = None
    barangay: Optional[str] = None
    municipality: Optional[str] = None
    market_type: Optional[str] = "wholesale"

    class Config:
        from_attributes = True


# ============================================
# ORDER SCHEMAS
# ============================================
class OrderCreate(BaseModel):
    product_id: Optional[int] = None
    menu_item_id: Optional[int] = None
    quantity: int
    order_type: str
    delivery_address: Optional[str] = None

    @validator("quantity")
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be at least 1")
        return v

    @validator("order_type")
    def order_type_must_be_valid(cls, v):
        if v not in ["food", "market"]:
            raise ValueError(
                "order_type must be food or market"
            )
        return v


class OrderResponse(BaseModel):
    id: int
    buyer_id: int
    quantity: int
    total_price: float
    status: str
    order_type: str
    delivery_address: Optional[str] = None
    payment_method: Optional[str] = "cod"
    payment_status: Optional[str] = "unpaid"
    grand_total: Optional[float] = None
    delivery_fee: Optional[float] = 0.0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# ORDER STATUS UPDATE SCHEMA
# ============================================
class OrderStatusUpdate(BaseModel):
    new_status: str
    note: Optional[str] = None
    eta_minutes: Optional[int] = None
    rider_name: Optional[str] = None
    rider_phone: Optional[str] = None

    @validator("new_status")
    def status_must_be_valid(cls, v):
        valid = [
            "confirmed", "preparing", "ready",
            "delivering", "delivered", "cancelled"
        ]
        if v not in valid:
            raise ValueError(
                f"Status must be one of: {valid}"
            )
        return v

    @validator("eta_minutes")
    def eta_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError(
                "ETA minutes cannot be negative"
            )
        return v


# ============================================
# ORDER TRACKING RESPONSE SCHEMA
# ============================================
class StatusHistoryItem(BaseModel):
    status: str
    note: Optional[str]
    timestamp: str

    class Config:
        from_attributes = True


class OrderTrackingResponse(BaseModel):
    order_id: int
    order_code: str
    status: str
    payment_status: str
    payment_method: str
    order_type: str
    quantity: int
    total_price: float
    delivery_fee: Optional[float] = 0.0
    grand_total: Optional[float] = None
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None

    # Item info
    item_name: Optional[str] = None
    item_image: Optional[str] = None

    # People info
    buyer_name: Optional[str] = None
    seller_name: Optional[str] = None
    rider_name: Optional[str] = None
    rider_phone: Optional[str] = None

    # Progress
    progress_percent: int = 0
    estimated_minutes: Optional[int] = 30
    eta_minutes: Optional[int] = None
    live_eta_remaining: Optional[int] = None

    # Timestamps
    created_at: Optional[str] = None
    status_updated_at: Optional[str] = None
    confirmed_at: Optional[str] = None
    preparing_at: Optional[str] = None
    delivering_at: Optional[str] = None
    delivered_at: Optional[str] = None
    cancelled_at: Optional[str] = None

    # History & Flags
    status_history: Optional[List[StatusHistoryItem]] = []
    can_review: bool = False
    can_cancel: bool = False
    cancel_reason: Optional[str] = None

    # Smart polling
    poll_interval_seconds: int = 20
    should_stop_polling: bool = False

    class Config:
        from_attributes = True


# ============================================
# SELLER PENDING ALERT SCHEMA
# ============================================
class SellerAlertResponse(BaseModel):
    seller_id: int
    pending_orders: int
    pending_payments: int
    total_urgent: int
    needs_attention: bool
    message: str
    checked_at: str

    class Config:
        from_attributes = True


# ============================================
# RIDE SCHEMAS
# ============================================
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


# ============================================
# JOB SCHEMAS
# ============================================
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


# ============================================
# SOS SCHEMAS
# ============================================
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