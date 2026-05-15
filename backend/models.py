from sqlalchemy import (
    Column, Integer, String, Float,
    ForeignKey, Boolean, Text, DateTime
)
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# ============================================
# USER MODEL
# ============================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    push_token = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)

    # ZAVARA ROLES
    role = Column(String, default="regular")
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # For Producers (farmers/fishermen)
    farm_name = Column(String, nullable=True)         # ← ADD
    farm_location = Column(String, nullable=True)     # ← ADD
    farm_description = Column(Text, nullable=True)    # ← ADD

    # For Cuisine partners (restaurants)
    restaurant_name = Column(String, nullable=True)   # ← ADD
    restaurant_address = Column(String, nullable=True)# ← ADD
    opening_hours = Column(String, nullable=True)     # ← ADD

    # GCash Info
    gcash_number = Column(String, nullable=True)      # ← ADD
    gcash_name = Column(String, nullable=True)        # ← ADD

    # Stats
    total_sales = Column(Float, default=0.0)          # ← ADD
    total_orders = Column(Integer, default=0)         # ← ADD

    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship(
        "Product", 
        back_populates="farmer",
        foreign_keys="Product.farmer_id"
    )
    orders = relationship(
        "Order", 
        back_populates="buyer",
        foreign_keys="Order.buyer_id"
    )
    verifications = relationship(
        "VerificationRequest", 
        back_populates="user"
    )

# ============================================
# REVIEW MODEL
# ============================================
class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    restaurant_id = Column(
        Integer, ForeignKey("restaurants.id"),
        nullable=True
    )
    product_id = Column(
        Integer, ForeignKey("products.id"),
        nullable=True
    )
    order_id = Column(
        Integer, ForeignKey("orders.id"),
        nullable=True
    )
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    is_verified_purchase = Column(
        Boolean, default=False
    )
    created_at = Column(
        DateTime, default=datetime.utcnow
    )

    user = relationship("User")

# ============================================
# VERIFICATION REQUEST MODEL
# ============================================
class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Role they are applying for
    # producer / seller / transport / haven / cuisine
    requested_role = Column(String, nullable=False)

    # Partner sub-type
    # producer: farmer / fisherman / livestock / crop
    # seller: market_vendor / sari_sari / small_business
    # transport: motorcycle / van / truck / courier
    # haven: hotel / resort / pension / homestay
    # cuisine: restaurant / carinderia / food_stall
    partner_type = Column(String, nullable=True)

    # Document URLs (stored as comma-separated)
    valid_id_url = Column(String, nullable=True)
    document_url = Column(String, nullable=True)
    selfie_url = Column(String, nullable=True)
    business_permit_url = Column(String, nullable=True)
    extra_doc_url = Column(String, nullable=True)

    # Additional info
    business_name = Column(String, nullable=True)
    business_address = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    # Status: pending / under_review / approved / rejected
    status = Column(String, default="pending")
    rejection_reason = Column(String, nullable=True)
    reviewed_by = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="verifications")

# ============================================
# RESTAURANT MODEL
# ============================================
class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String, nullable=False)
    category = Column(String, nullable=False)
    is_open = Column(Boolean, default=True)
    delivery_range_km = Column(Float, default=5.0)
    delivery_fee = Column(Float, default=50.0)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    menu_items = relationship("MenuItem", back_populates="restaurant")

# ============================================
# MENU ITEM MODEL
# ============================================
class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    is_available = Column(Boolean, default=True)
    image_url = Column(String, nullable=True)

    restaurant = relationship("Restaurant", back_populates="menu_items")

# ============================================
# PRODUCT MODEL (Farm/Market Products)
# ============================================
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    unit = Column(String, nullable=False)      # kg, piece, bundle
    quantity = Column(Integer, nullable=False)  # stock
    category = Column(String, nullable=False)
    image_url = Column(String, nullable=True)   # ← ADD THIS
    is_available = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False) # ← ADD THIS
    total_sold = Column(Integer, default=0)      # ← ADD THIS
    rating = Column(Float, default=0.0)          # ← ADD THIS
    total_reviews = Column(Integer, default=0)   # ← ADD THIS
    barangay = Column(String, nullable=True)     # ← ADD THIS
    municipality = Column(String, nullable=True) # ← ADD THIS
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("User", back_populates="products")

# ============================================
# ORDER MODEL
# ============================================
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"))
    seller_id = Column(                              # ← ADD THIS
        Integer, ForeignKey("users.id"), nullable=True
    )
    product_id = Column(
        Integer, ForeignKey("products.id"), nullable=True
    )
    menu_item_id = Column(
        Integer, ForeignKey("menu_items.id"), nullable=True
    )
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=0.0)        # ← ADD THIS
    grand_total = Column(Float, nullable=True)        # ← ADD THIS
    status = Column(String, default="pending")
    order_type = Column(String, nullable=False)
    delivery_address = Column(String, nullable=True)
    delivery_notes = Column(String, nullable=True)   # ← ADD THIS
    
    # Payment                                        # ← ADD ALL THESE
    payment_method = Column(String, default="cod")   # cod/gcash
    payment_status = Column(String, default="unpaid")
    gcash_screenshot = Column(String, nullable=True)
    gcash_reference = Column(String, nullable=True)
    
    # Review tracking
    is_reviewed = Column(Boolean, default=False)     # ← ADD THIS
    
    cancel_reason = Column(String, nullable=True)    # ← ADD THIS
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship(
        "User", 
        back_populates="orders",
        foreign_keys=[buyer_id]        # ← Important! Two FKs to User
    )

# ============================================
# RIDE REQUEST MODEL
# ============================================
class RideRequest(Base):
    __tablename__ = "ride_requests"

    id = Column(Integer, primary_key=True, index=True)
    passenger_id = Column(Integer, ForeignKey("users.id"))
    pickup_location = Column(String, nullable=False)
    dropoff_location = Column(String, nullable=False)
    ride_type = Column(String, nullable=False)
    vehicle_type = Column(String, nullable=True)
    status = Column(String, default="pending")
    fare = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# ============================================
# JOB POST MODEL
# ============================================
class JobPost(Base):
    __tablename__ = "job_posts"

    id = Column(Integer, primary_key=True, index=True)
    poster_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    salary = Column(Float, nullable=True)
    job_type = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# ============================================
# SOS ALERT MODEL
# ============================================
class SosAlert(Base):
    __tablename__ = "sos_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    location = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)