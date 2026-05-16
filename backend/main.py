# ============================================
# ZAVARA MAIN.PY - CLEAN VERSION
# ============================================
from fastapi import (
    FastAPI, Depends, HTTPException,
    UploadFile, File, Form
)
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import (
    User, Product, Order,
    Restaurant, MenuItem,
    RideRequest, JobPost,
    SosAlert, VerificationRequest
)
from schemas import (
    UserRegister, UserResponse,
    UserLogin, TokenResponse,
    ProductCreate, ProductResponse,
    OrderCreate, OrderResponse,
    RestaurantCreate, RestaurantResponse,
    MenuItemCreate, MenuItemResponse,
    RideRequestCreate, RideResponse,
    JobPostCreate, JobPostResponse,
    SosAlertCreate, SosAlertResponse,
    VerificationRequestCreate,
    VerificationResponse
)
from cloudinary_config import (
    upload_image,
    upload_product_image,
    upload_restaurant_image,
    upload_profile_image,
    upload_document,
    delete_image
)
from auth import (
    hash_password,
    verify_password,
    create_access_token
)
from dotenv import load_dotenv
from typing import List, Optional
from datetime import datetime
import os

load_dotenv()

# ============================================
# APP SETUP
# ============================================
app = FastAPI(
    title="ZAVARA API 🌴",
    description="Bohol's Super App Platform",
    version="2.0"
)

Base.metadata.create_all(bind=engine)

# ============================================
# AUTO MIGRATION - Add missing columns
# ============================================
def run_migrations():
    from sqlalchemy import text
    from database import engine

    migrations = [
        # Users table new columns
        "ALTER TABLE users ADD COLUMN push_token VARCHAR",
        "ALTER TABLE users ADD COLUMN profile_image VARCHAR",
        "ALTER TABLE users ADD COLUMN farm_name VARCHAR",
        "ALTER TABLE users ADD COLUMN farm_location VARCHAR",
        "ALTER TABLE users ADD COLUMN farm_description TEXT",
        "ALTER TABLE users ADD COLUMN restaurant_name VARCHAR",
        "ALTER TABLE users ADD COLUMN restaurant_address VARCHAR",
        "ALTER TABLE users ADD COLUMN opening_hours VARCHAR",
        "ALTER TABLE users ADD COLUMN gcash_number VARCHAR",
        "ALTER TABLE users ADD COLUMN gcash_name VARCHAR",
        "ALTER TABLE users ADD COLUMN total_sales FLOAT DEFAULT 0.0",
        "ALTER TABLE users ADD COLUMN total_orders INTEGER DEFAULT 0",

        # Products table new columns
        "ALTER TABLE products ADD COLUMN image_url VARCHAR",
        "ALTER TABLE products ADD COLUMN is_approved BOOLEAN DEFAULT 0",
        "ALTER TABLE products ADD COLUMN total_sold INTEGER DEFAULT 0",
        "ALTER TABLE products ADD COLUMN rating FLOAT DEFAULT 0.0",
        "ALTER TABLE products ADD COLUMN total_reviews INTEGER DEFAULT 0",
        "ALTER TABLE products ADD COLUMN barangay VARCHAR",
        "ALTER TABLE products ADD COLUMN municipality VARCHAR",

        # Orders table new columns
        "ALTER TABLE orders ADD COLUMN seller_id INTEGER",
        "ALTER TABLE orders ADD COLUMN delivery_fee FLOAT DEFAULT 0.0",
        "ALTER TABLE orders ADD COLUMN grand_total FLOAT",
        "ALTER TABLE orders ADD COLUMN delivery_notes VARCHAR",
        "ALTER TABLE orders ADD COLUMN payment_method VARCHAR DEFAULT 'cod'",
        "ALTER TABLE orders ADD COLUMN payment_status VARCHAR DEFAULT 'unpaid'",
        "ALTER TABLE orders ADD COLUMN gcash_screenshot VARCHAR",
        "ALTER TABLE orders ADD COLUMN gcash_reference VARCHAR",
        "ALTER TABLE orders ADD COLUMN is_reviewed BOOLEAN DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN cancel_reason VARCHAR",
    ]

    with engine.connect() as conn:
        for migration in migrations:
            try:
                conn.execute(text(migration))
                conn.commit()
                print(f"✅ Migration done: {migration[:50]}...")
            except Exception as e:
                # Column already exists = skip it
                if "duplicate column" in str(e).lower() or \
                   "already exists" in str(e).lower():
                    pass
                else:
                    print(f"⚠️ Migration skipped: {str(e)[:60]}")

    print("✅ All migrations complete!")

# Run migrations on startup
run_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================
# ZAVARA ROLE SYSTEM
# ============================================
ZAVARA_ROLES = {
    "regular":   "Member",
    "producer":  "Harvest Partner",
    "seller":    "Market Seller",
    "transport": "Swift Partner",
    "haven":     "Haven Partner",
    "cuisine":   "Cuisine Partner",
    "admin":     "Overseer"
}

PRODUCER_TYPES = [
    "farmer",
    "fisherman",
    "livestock_raiser",
    "crop_producer",
    "other_producer"
]

SELLER_TYPES = [
    "market_vendor",
    "sari_sari_store",
    "small_business",
    "cooperative"
]

TRANSPORT_TYPES = [
    "motorcycle_rider",
    "van_driver",
    "truck_driver",
    "courier_service"
]

HAVEN_TYPES = [
    "hotel",
    "resort",
    "pension_house",
    "homestay",
    "airbnb"
]

CUISINE_TYPES = [
    "restaurant",
    "carinderia",
    "food_stall",
    "cloud_kitchen",
    "catering"
]

# ============================================
# HOME
# ============================================
@app.get("/")
def read_root():
    return {
        "Platform": "ZAVARA",
        "Tagline": "The Island's Pulse 🌴",
        "Status": "Online",
        "Version": "2.0",
        "Roles": ZAVARA_ROLES
    }

# ============================================
# AUTH ROUTES
# ============================================
@app.post("/users/register",
    response_model=UserResponse)
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

@app.post("/users/login",
    response_model=TokenResponse)
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

@app.get("/users/{user_id}",
    response_model=UserResponse)
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

# ============================================
# VERIFICATION ROUTES
# ============================================
@app.post("/verify/apply")
def apply_verification(
    user_id: int,
    requested_role: str,
    partner_type: str,
    business_name: Optional[str] = None,
    business_address: Optional[str] = None,
    description: Optional[str] = None,
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
    if requested_role not in ZAVARA_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Choose from: {list(ZAVARA_ROLES.keys())}"
        )
    existing = db.query(VerificationRequest).filter(
        VerificationRequest.user_id == user_id,
        VerificationRequest.status == "pending"
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending application"
        )
    new_request = VerificationRequest(
        user_id=user_id,
        requested_role=requested_role,
        partner_type=partner_type,
        business_name=business_name,
        business_address=business_address,
        description=description,
        document_url="pending_upload",
        status="pending"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return {
        "message": "Application submitted! ✅",
        "application_id": new_request.id,
        "status": "pending",
        "role_applied": requested_role,
        "partner_type": partner_type,
        "note": "Review takes 1-4 hours."
    }

@app.get("/verify/status/{user_id}")
def get_verification_status(
    user_id: int,
    db: Session = Depends(get_db)
):
    requests = db.query(VerificationRequest).filter(
        VerificationRequest.user_id == user_id
    ).order_by(
        VerificationRequest.created_at.desc()
    ).all()

    if not requests:
        return {
            "has_application": False,
            "message": "No application found"
        }

    latest = requests[0]
    return {
        "has_application": True,
        "application_id": latest.id,
        "status": latest.status,
        "requested_role": latest.requested_role,
        "partner_type": latest.partner_type,
        "submitted_at": latest.created_at,
        "rejection_reason": latest.rejection_reason
    }

@app.post("/verify/approve/{request_id}")
def approve_verification(
    request_id: int,
    admin_id: int,
    db: Session = Depends(get_db)
):
    admin = db.query(User).filter(
        User.id == admin_id
    ).first()
    if not admin or admin.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    req = db.query(VerificationRequest).filter(
        VerificationRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )
    req.status = "approved"
    req.reviewed_by = admin_id
    req.reviewed_at = datetime.utcnow()

    user = db.query(User).filter(
        User.id == req.user_id
    ).first()
    user.role = req.requested_role
    user.is_verified = True
    db.commit()

    return {
        "message": f"✅ Approved! User is now a {ZAVARA_ROLES.get(req.requested_role)}",
        "user_id": req.user_id,
        "new_role": req.requested_role
    }

@app.post("/verify/reject/{request_id}")
def reject_verification(
    request_id: int,
    admin_id: int,
    reason: str,
    db: Session = Depends(get_db)
):
    admin = db.query(User).filter(
        User.id == admin_id
    ).first()
    if not admin or admin.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    req = db.query(VerificationRequest).filter(
        VerificationRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )
    req.status = "rejected"
    req.rejection_reason = reason
    req.reviewed_by = admin_id
    req.reviewed_at = datetime.utcnow()
    db.commit()
    return {
        "message": "Application rejected",
        "reason": reason
    }

@app.get("/verify/pending")
def get_pending_verifications(
    admin_id: int,
    db: Session = Depends(get_db)
):
    admin = db.query(User).filter(
        User.id == admin_id
    ).first()
    if not admin or admin.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    requests = db.query(VerificationRequest).filter(
        VerificationRequest.status == "pending"
    ).all()
    result = []
    for req in requests:
        user = db.query(User).filter(
            User.id == req.user_id
        ).first()
        result.append({
            "application_id": req.id,
            "user_id": req.user_id,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "requested_role": req.requested_role,
            "role_label": ZAVARA_ROLES.get(
                req.requested_role
            ),
            "partner_type": req.partner_type,
            "business_name": req.business_name,
            "business_address": req.business_address,
            "description": req.description,
            "submitted_at": req.created_at,
            "status": req.status
        })
    return result

# ============================================
# ADMIN ROUTES
# ============================================
@app.post("/admin/set-role")
def set_user_role(
    user_id: int,
    new_role: str,
    db: Session = Depends(get_db)
):
    if new_role not in ZAVARA_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Choose: {list(ZAVARA_ROLES.keys())}"
        )
    user = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    user.role = new_role
    user.is_verified = (
        True if new_role != "regular" else False
    )
    db.commit()
    return {
        "message": "✅ Role updated!",
        "user_id": user_id,
        "new_role": new_role,
        "role_label": ZAVARA_ROLES.get(new_role)
    }

@app.get("/admin/users")
def get_all_users(
    admin_id: int,
    db: Session = Depends(get_db)
):
    admin = db.query(User).filter(
        User.id == admin_id
    ).first()
    if not admin or admin.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "role_label": ZAVARA_ROLES.get(u.role, u.role),
            "is_verified": u.is_verified,
            "is_active": u.is_active,
            "joined": u.created_at
        }
        for u in users
    ]

@app.get("/admin/dashboard")
def get_admin_dashboard(
    admin_id: int,
    db: Session = Depends(get_db)
):
    admin = db.query(User).filter(
        User.id == admin_id
    ).first()
    if not admin or admin.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    total_users = db.query(User).count()
    pending_verifications = db.query(
        VerificationRequest
    ).filter(
        VerificationRequest.status == "pending"
    ).count()
    total_orders = db.query(Order).count()
    total_restaurants = db.query(Restaurant).count()
    total_products = db.query(Product).count()

    role_counts = {}
    for role in ZAVARA_ROLES.keys():
        count = db.query(User).filter(
            User.role == role
        ).count()
        role_counts[ZAVARA_ROLES[role]] = count

    return {
        "platform": "ZAVARA",
        "stats": {
            "total_users": total_users,
            "pending_verifications": pending_verifications,
            "total_orders": total_orders,
            "total_restaurants": total_restaurants,
            "total_products": total_products
        },
        "users_by_role": role_counts
    }

# ============================================
# RESTAURANT ROUTES
# ============================================
@app.post("/restaurants",
    response_model=RestaurantResponse)
def create_restaurant(
    restaurant: RestaurantCreate,
    owner_id: int,
    db: Session = Depends(get_db)
):
    new_restaurant = Restaurant(
        owner_id=owner_id,
        name=restaurant.name,
        description=restaurant.description,
        address=restaurant.address,
        category=restaurant.category,
        delivery_range_km=restaurant.delivery_range_km,
        delivery_fee=restaurant.delivery_fee,
        image_url=restaurant.image_url
    )
    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)
    return new_restaurant

@app.get("/restaurants",
    response_model=List[RestaurantResponse])
def get_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).filter(
        Restaurant.is_open == True
    ).all()

@app.delete("/restaurants/{restaurant_id}")
def delete_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id
    ).first()
    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )
    db.delete(restaurant)
    db.commit()
    return {"message": "Restaurant deleted"}

@app.patch("/restaurants/{restaurant_id}")
def update_restaurant(
    restaurant_id: int,
    delivery_range_km: float,
    delivery_fee: float,
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id
    ).first()
    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )
    restaurant.delivery_range_km = delivery_range_km
    restaurant.delivery_fee = delivery_fee
    db.commit()
    return {"message": "Restaurant updated"}

@app.post(
    "/restaurants/{restaurant_id}/menu",
    response_model=MenuItemResponse
)
def add_menu_item(
    restaurant_id: int,
    item: MenuItemCreate,
    db: Session = Depends(get_db)
):
    new_item = MenuItem(
        restaurant_id=restaurant_id,
        name=item.name,
        description=item.description,
        price=item.price,
        category=item.category,
        image_url=item.image_url
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.get(
    "/restaurants/{restaurant_id}/menu",
    response_model=List[MenuItemResponse]
)
def get_menu(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    return db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id,
        MenuItem.is_available == True
    ).all()

@app.delete("/menu/{item_id}")
def delete_menu_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id
    ).first()
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found"
        )
    db.delete(item)
    db.commit()
    return {"message": "Menu item deleted"}

# ============================================
# PRODUCT ROUTES
# ============================================
@app.post("/products",
    response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    farmer_id: int,
    db: Session = Depends(get_db)
):
    farmer = db.query(User).filter(
        User.id == farmer_id
    ).first()
    if not farmer:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    if farmer.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only Harvest Partners can list products"
        )
    new_product = Product(
        farmer_id=farmer_id,
        name=product.name,
        description=product.description,
        price=product.price,
        unit=product.unit,
        quantity=product.quantity,
        category=product.category
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.get("/products",
    response_model=List[ProductResponse])
def get_products(
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
    if user.role not in ["producer", "seller", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Partner verification required."
        )
    return db.query(Product).filter(
        Product.is_available == True
    ).all()

@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}

# ============================================
# ORDER ROUTES
# ============================================
@app.post("/orders",
    response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    buyer_id: int,
    db: Session = Depends(get_db)
):
    buyer = db.query(User).filter(
        User.id == buyer_id
    ).first()
    if not buyer:
        raise HTTPException(
            status_code=404,
            detail="Buyer not found"
        )

    if order.order_type == "food":
        if not order.menu_item_id:
            raise HTTPException(
                status_code=400,
                detail="menu_item_id required for food orders"
            )
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == order.menu_item_id,
            MenuItem.is_available == True
        ).first()
        if not menu_item:
            raise HTTPException(
                status_code=404,
                detail="Menu item not found"
            )
        total_price = menu_item.price * order.quantity
        new_order = Order(
            buyer_id=buyer_id,
            menu_item_id=order.menu_item_id,
            quantity=order.quantity,
            total_price=total_price,
            status="pending",
            order_type="food",
            delivery_address=order.delivery_address
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return new_order

    elif order.order_type == "market":
        if not order.product_id:
            raise HTTPException(
                status_code=400,
                detail="product_id required for market orders"
            )
        product = db.query(Product).filter(
            Product.id == order.product_id,
            Product.is_available == True
        ).first()
        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )
        if product.quantity < order.quantity:
            raise HTTPException(
                status_code=400,
                detail="Not enough stock"
            )
        total_price = product.price * order.quantity
        new_order = Order(
            buyer_id=buyer_id,
            product_id=order.product_id,
            quantity=order.quantity,
            total_price=total_price,
            status="pending",
            order_type="market",
            delivery_address=order.delivery_address
        )
        product.quantity -= order.quantity
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return new_order
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid order type"
        )

@app.get("/orders/user/{user_id}",
    response_model=List[OrderResponse])
def get_user_orders(
    user_id: int,
    db: Session = Depends(get_db)
):
    return db.query(Order).filter(
        Order.buyer_id == user_id
    ).order_by(Order.created_at.desc()).all()

@app.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    new_status: str,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )
    valid_statuses = [
        "pending", "confirmed", "preparing",
        "delivering", "delivered", "cancelled"
    ]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Choose: {valid_statuses}"
        )

    # Update status
    order.status = new_status
    db.commit()

    # AUTO SEND NOTIFICATION! 🔥
    buyer = db.query(User).filter(
        User.id == order.buyer_id
    ).first()

    messages = {
        "confirmed": {
            "title": "Order Confirmed! ✅",
            "body": f"Your order #{str(order_id).zfill(4)} has been confirmed!"
        },
        "preparing": {
            "title": "Cooking Now! 👨‍🍳",
            "body": f"Your order #{str(order_id).zfill(4)} is being prepared!"
        },
        "delivering": {
            "title": "Rider On The Way! 🛵",
            "body": f"Your order #{str(order_id).zfill(4)} is on its way!"
        },
        "delivered": {
            "title": "Order Delivered! 🎉",
            "body": f"Enjoy your order #{str(order_id).zfill(4)}! 😋"
        },
        "cancelled": {
            "title": "Order Cancelled ❌",
            "body": f"Your order #{str(order_id).zfill(4)} was cancelled."
        },
    }

    if buyer and buyer.push_token:
        msg = messages.get(new_status)
        if msg:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        "https://exp.host/--/api/v2/push/send",
                        json={
                            "to": buyer.push_token,
                            "title": msg["title"],
                            "body": msg["body"],
                            "sound": "default",
                            "badge": 1,
                            "data": {
                                "order_id": order_id,
                                "status": new_status
                            }
                        },
                        headers={
                            "Content-Type": "application/json",
                        }
                    )
            except:
                pass

    return {
        "message": f"Order updated to {new_status}",
        "order_id": order_id,
        "notification_sent": True
    }

# ============================================
# DEV RESET ROUTE
# ============================================
@app.delete("/dev/reset-users")
def reset_all_users(
    secret: str,
    db: Session = Depends(get_db)
):
    if secret != "zavara_reset_2024":
        raise HTTPException(
            status_code=403,
            detail="Invalid secret"
        )
    db.query(Order).delete()
    db.query(VerificationRequest).delete()
    db.query(Product).delete()
    db.query(User).delete()
    db.commit()
    return {
        "message": "✅ All accounts deleted!",
        "status": "Fresh start!"
    }

# ============================================
# REVIEW ROUTES
# ============================================
from models import Review

@app.post("/reviews")
def create_review(
    user_id: int,
    rating: int,
    comment: Optional[str] = None,
    restaurant_id: Optional[int] = None,
    product_id: Optional[int] = None,
    order_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Validate rating
    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be 1-5"
        )

    # Check user exists
    user = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check if verified purchase
    is_verified = False
    if order_id:
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.buyer_id == user_id,
            Order.status == "delivered"
        ).first()
        if order:
            is_verified = True

    # Check duplicate review
    existing = db.query(Review).filter(
        Review.user_id == user_id,
        Review.restaurant_id == restaurant_id,
        Review.order_id == order_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already reviewed this!"
        )

    new_review = Review(
        user_id=user_id,
        rating=rating,
        comment=comment,
        restaurant_id=restaurant_id,
        product_id=product_id,
        order_id=order_id,
        is_verified_purchase=is_verified
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return {
        "message": "✅ Review submitted!",
        "review_id": new_review.id,
        "rating": rating,
        "is_verified_purchase": is_verified
    }

@app.get("/reviews/restaurant/{restaurant_id}")
def get_restaurant_reviews(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(
        Review.restaurant_id == restaurant_id
    ).order_by(Review.created_at.desc()).all()

    # Calculate average rating
    if reviews:
        avg = sum(r.rating for r in reviews) / len(reviews)
    else:
        avg = 0

    result = []
    for review in reviews:
        user = db.query(User).filter(
            User.id == review.user_id
        ).first()
        result.append({
            "id": review.id,
            "user_name": user.name if user else "Anonymous",
            "rating": review.rating,
            "comment": review.comment,
            "is_verified": review.is_verified_purchase,
            "date": review.created_at,
        })

    return {
        "restaurant_id": restaurant_id,
        "total_reviews": len(reviews),
        "average_rating": round(avg, 1),
        "reviews": result
    }

@app.get("/reviews/product/{product_id}")
def get_product_reviews(
    product_id: int,
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(
        Review.product_id == product_id
    ).order_by(Review.created_at.desc()).all()

    if reviews:
        avg = sum(r.rating for r in reviews) / len(reviews)
    else:
        avg = 0

    result = []
    for review in reviews:
        user = db.query(User).filter(
            User.id == review.user_id
        ).first()
        result.append({
            "id": review.id,
            "user_name": user.name if user else "Anonymous",
            "rating": review.rating,
            "comment": review.comment,
            "is_verified": review.is_verified_purchase,
            "date": review.created_at,
        })

    return {
        "product_id": product_id,
        "total_reviews": len(reviews),
        "average_rating": round(avg, 1),
        "reviews": result
    }

@app.get("/reviews/user/{user_id}")
def get_user_reviews(
    user_id: int,
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(
        Review.user_id == user_id
    ).order_by(Review.created_at.desc()).all()

    return {
        "user_id": user_id,
        "total_reviews": len(reviews),
        "reviews": reviews
    }

@app.delete("/reviews/{review_id}")
def delete_review(
    review_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.user_id == user_id
    ).first()
    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review not found"
        )
    db.delete(review)
    db.commit()
    return {"message": "Review deleted!"}

# ============================================
# RIDE ROUTES
# ============================================
@app.post("/rides", response_model=RideResponse)
def request_ride(
    ride: RideRequestCreate,
    passenger_id: int,
    db: Session = Depends(get_db)
):
    new_ride = RideRequest(
        passenger_id=passenger_id,
        pickup_location=ride.pickup_location,
        dropoff_location=ride.dropoff_location,
        ride_type=ride.ride_type
    )
    db.add(new_ride)
    db.commit()
    db.refresh(new_ride)
    return new_ride

@app.get("/rides", response_model=List[RideResponse])
def get_rides(db: Session = Depends(get_db)):
    return db.query(RideRequest).all()

# ============================================
# JOBS ROUTES
# ============================================
@app.post("/jobs", response_model=JobPostResponse)
def create_job(
    job: JobPostCreate,
    poster_id: int,
    db: Session = Depends(get_db)
):
    new_job = JobPost(
        poster_id=poster_id,
        title=job.title,
        description=job.description,
        location=job.location,
        salary=job.salary,
        job_type=job.job_type
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@app.get("/jobs", response_model=List[JobPostResponse])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(JobPost).filter(
        JobPost.is_active == True
    ).all()

@app.delete("/jobs/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    job = db.query(JobPost).filter(
        JobPost.id == job_id
    ).first()
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}

# ============================================
# PUSH NOTIFICATION ROUTES
# ============================================
import httpx

@app.post("/notifications/save-token")
async def save_push_token(
    user_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """Save Expo push token for user"""
    user = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    user.push_token = token
    db.commit()
    return {
        "message": "✅ Push token saved!",
        "user_id": user_id
    }

@app.post("/notifications/send")
async def send_notification(
    user_id: int,
    title: str,
    body: str,
    db: Session = Depends(get_db)
):
    """Send push notification to user"""
    user = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user or not user.push_token:
        raise HTTPException(
            status_code=404,
            detail="User or token not found"
        )

    # Send via Expo Push API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://exp.host/--/api/v2/push/send",
            json={
                "to": user.push_token,
                "title": title,
                "body": body,
                "sound": "default",
                "badge": 1,
            },
            headers={
                "Content-Type": "application/json",
            }
        )

    return {
        "message": "✅ Notification sent!",
        "response": response.json()
    }

@app.post("/notifications/send-order-update")
async def send_order_notification(
    order_id: int,
    new_status: str,
    db: Session = Depends(get_db)
):
    """Send notification when order status changes"""
    order = db.query(Order).filter(
        Order.id == order_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    buyer = db.query(User).filter(
        User.id == order.buyer_id
    ).first()

    if not buyer or not buyer.push_token:
        return {
            "message": "No push token found",
            "sent": False
        }

    # Status messages
    messages = {
        "confirmed": {
            "title": "Order Confirmed! ✅",
            "body": f"Your order #{order_id} has been confirmed!"
        },
        "preparing": {
            "title": "Cooking Now! 👨‍🍳",
            "body": f"Your order #{order_id} is being prepared!"
        },
        "delivering": {
            "title": "Rider On The Way! 🛵",
            "body": f"Your order #{order_id} is on its way!"
        },
        "delivered": {
            "title": "Order Delivered! 🎉",
            "body": f"Your order #{order_id} has been delivered!"
        },
        "cancelled": {
            "title": "Order Cancelled ❌",
            "body": f"Your order #{order_id} was cancelled."
        },
    }

    msg = messages.get(new_status, {
        "title": "Order Update 📦",
        "body": f"Your order #{order_id} is now {new_status}"
    })

    async with httpx.AsyncClient() as client:
        await client.post(
            "https://exp.host/--/api/v2/push/send",
            json={
                "to": buyer.push_token,
                "title": msg["title"],
                "body": msg["body"],
                "sound": "default",
                "badge": 1,
                "data": {
                    "order_id": order_id,
                    "status": new_status
                }
            },
            headers={
                "Content-Type": "application/json",
            }
        )

    return {
        "message": "✅ Notification sent!",
        "order_id": order_id,
        "status": new_status
    }

# ============================================
# SOS ROUTES
# ============================================
@app.post("/sos", response_model=SosAlertResponse)
def create_sos(
    sos: SosAlertCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    new_sos = SosAlert(
        user_id=user_id,
        location=sos.location,
        alert_type=sos.alert_type
    )
    db.add(new_sos)
    db.commit()
    db.refresh(new_sos)
    return new_sos

@app.get("/sos", response_model=List[SosAlertResponse])
def get_sos_alerts(db: Session = Depends(get_db)):
    return db.query(SosAlert).filter(
        SosAlert.status == "active"
    ).all()

# ============================================
# IMAGE UPLOAD ROUTES
# ============================================
@app.post("/upload/profile/{user_id}")
async def upload_profile_photo(
    user_id: int,
    file: UploadFile = File(...),
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
    if file.content_type not in [
        "image/jpeg", "image/png",
        "image/jpg", "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, JPG, WEBP allowed"
        )
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Max 5MB"
        )
    result = upload_profile_image(file_bytes)
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {result['error']}"
        )
    user.profile_image = result["url"]
    db.commit()
    return {
        "message": "Profile photo uploaded! ✅",
        "image_url": result["url"],
        "public_id": result["public_id"]
    }

@app.post("/upload/product/{product_id}")
async def upload_product_photo(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
    if file.content_type not in [
        "image/jpeg", "image/png",
        "image/jpg", "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, JPG, WEBP allowed"
        )
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Max 5MB"
        )
    result = upload_product_image(file_bytes)
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {result['error']}"
        )
    product.image_url = result["url"]
    db.commit()
    return {
        "message": "Product photo uploaded! ✅",
        "image_url": result["url"],
        "public_id": result["public_id"]
    }

@app.post("/upload/restaurant/{restaurant_id}")
async def upload_restaurant_photo(
    restaurant_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id
    ).first()
    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )
    if file.content_type not in [
        "image/jpeg", "image/png",
        "image/jpg", "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, JPG, WEBP allowed"
        )
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Max 5MB"
        )
    result = upload_restaurant_image(file_bytes)
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {result['error']}"
        )
    restaurant.image_url = result["url"]
    db.commit()
    return {
        "message": "Restaurant photo uploaded! ✅",
        "image_url": result["url"],
        "public_id": result["public_id"]
    }

@app.post("/upload/document/{user_id}")
async def upload_verification_document(
    user_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
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
    if file.content_type not in [
        "image/jpeg", "image/png",
        "image/jpg", "image/webp",
        "application/pdf"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only images and PDF allowed"
        )
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Max 10MB"
        )
    result = upload_document(file_bytes)
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {result['error']}"
        )
    verification = db.query(VerificationRequest).filter(
        VerificationRequest.user_id == user_id,
        VerificationRequest.status == "pending"
    ).first()
    if verification:
        if doc_type == "valid_id":
            verification.valid_id_url = result["url"]
        elif doc_type == "business_permit":
            verification.business_permit_url = result["url"]
        elif doc_type == "selfie":
            verification.selfie_url = result["url"]
        elif doc_type == "extra_doc":
            verification.extra_doc_url = result["url"]
        else:
            verification.document_url = result["url"]
        db.commit()
    return {
        "message": f"{doc_type} uploaded! ✅",
        "image_url": result["url"],
        "public_id": result["public_id"],
        "doc_type": doc_type
    }

@app.post("/upload/general")
async def upload_general_image(
    file: UploadFile = File(...)
):
    if file.content_type not in [
        "image/jpeg", "image/png",
        "image/jpg", "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, JPG, WEBP allowed"
        )
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Max 5MB"
        )
    result = upload_image(
        file_bytes,
        folder="zavara/general"
    )
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {result['error']}"
        )
    return {
        "message": "Image uploaded! ✅",
        "image_url": result["url"],
        "public_id": result["public_id"]
    }
# ============================================
# PRODUCER DASHBOARD ROUTES
# ============================================

@app.get("/producer/dashboard/{user_id}")
def get_producer_dashboard(
    user_id: int,
    db: Session = Depends(get_db)
):
    # Check user exists and is producer
    user = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

    # Get all products by this producer
    total_products = db.query(Product).filter(
        Product.farmer_id == user_id
    ).count()

    # Get all orders for this producer
    total_orders = db.query(Order).filter(
        Order.seller_id == user_id
    ).count()

    # Get pending orders
    pending_orders = db.query(Order).filter(
        Order.seller_id == user_id,
        Order.status == "pending"
    ).count()

    # Get total revenue (paid orders only)
    paid_orders = db.query(Order).filter(
        Order.seller_id == user_id,
        Order.payment_status == "paid"
    ).all()
    total_revenue = sum(
        o.grand_total or o.total_price 
        for o in paid_orders
    )

    # Get recent orders (last 5)
    recent_orders = db.query(Order).filter(
        Order.seller_id == user_id
    ).order_by(
        Order.created_at.desc()
    ).limit(5).all()

    # Get top products (most sold)
    top_products = db.query(Product).filter(
        Product.farmer_id == user_id
    ).order_by(
        Product.total_sold.desc()
    ).limit(5).all()

    # Build recent orders response
    recent_orders_data = []
    for order in recent_orders:
        buyer = db.query(User).filter(
            User.id == order.buyer_id
        ).first()
        recent_orders_data.append({
            "order_id": order.id,
            "buyer_name": buyer.name if buyer else "Unknown",
            "buyer_phone": buyer.phone if buyer else "",
            "quantity": order.quantity,
            "total_price": order.total_price,
            "grand_total": order.grand_total or order.total_price,
            "status": order.status,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "delivery_address": order.delivery_address,
            "order_type": order.order_type,
            "created_at": order.created_at
        })

    return {
        "producer": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_verified": user.is_verified,
            "farm_name": user.farm_name,
            "farm_location": user.farm_location,
            "total_sales": user.total_sales,
            "profile_image": user.profile_image
        },
        "stats": {
            "total_products": total_products,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "total_revenue": round(total_revenue, 2)
        },
        "recent_orders": recent_orders_data,
        "top_products": [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "quantity": p.quantity,
                "total_sold": p.total_sold,
                "unit": p.unit,
                "category": p.category,
                "image_url": p.image_url,
                "is_available": p.is_available,
                "rating": p.rating
            }
            for p in top_products
        ]
    }


# ============================================
# PRODUCER - GET MY PRODUCTS
# ============================================

@app.get("/producer/products/{user_id}")
def get_producer_products(
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
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

    products = db.query(Product).filter(
        Product.farmer_id == user_id
    ).order_by(Product.created_at.desc()).all()

    return {
        "total": len(products),
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": p.price,
                "unit": p.unit,
                "quantity": p.quantity,
                "category": p.category,
                "image_url": p.image_url,
                "is_available": p.is_available,
                "is_approved": p.is_approved,
                "total_sold": p.total_sold,
                "rating": p.rating,
                "total_reviews": p.total_reviews,
                "barangay": p.barangay,
                "municipality": p.municipality,
                "created_at": p.created_at
            }
            for p in products
        ]
    }


# ============================================
# PRODUCER - ADD PRODUCT
# ============================================

@app.post("/producer/products/{user_id}")
def add_producer_product(
    user_id: int,
    product: ProductCreate,
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
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

    new_product = Product(
        farmer_id=user_id,
        name=product.name,
        description=product.description,
        price=product.price,
        unit=product.unit,
        quantity=product.quantity,
        category=product.category,
        is_available=True,
        is_approved=False,   # Admin must approve
        total_sold=0,
        rating=0.0
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "✅ Product added! Waiting for admin approval.",
        "product_id": new_product.id,
        "name": new_product.name,
        "status": "pending_approval"
    }


# ============================================
# PRODUCER - EDIT PRODUCT
# ============================================

@app.put("/producer/products/{product_id}/edit")
def edit_producer_product(
    product_id: int,
    user_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    price: Optional[float] = None,
    quantity: Optional[int] = None,
    unit: Optional[str] = None,
    category: Optional[str] = None,
    is_available: Optional[bool] = None,
    barangay: Optional[str] = None,
    municipality: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Check product belongs to this producer
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.farmer_id == user_id
    ).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Update only fields that were provided
    if name is not None:
        product.name = name
    if description is not None:
        product.description = description
    if price is not None:
        product.price = price
    if quantity is not None:
        product.quantity = quantity
    if unit is not None:
        product.unit = unit
    if category is not None:
        product.category = category
    if is_available is not None:
        product.is_available = is_available
    if barangay is not None:
        product.barangay = barangay
    if municipality is not None:
        product.municipality = municipality

    db.commit()
    db.refresh(product)

    return {
        "message": "✅ Product updated!",
        "product_id": product.id,
        "name": product.name
    }


# ============================================
# PRODUCER - DELETE PRODUCT
# ============================================

@app.delete("/producer/products/{product_id}")
def delete_producer_product(
    product_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.farmer_id == user_id
    ).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found or not yours"
        )

    db.delete(product)
    db.commit()

    return {
        "message": "✅ Product deleted!",
        "product_id": product_id
    }


# ============================================
# PRODUCER - GET MY ORDERS
# ============================================

@app.get("/producer/orders/{user_id}")
def get_producer_orders(
    user_id: int,
    status: Optional[str] = None,
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
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

    # Build query
    query = db.query(Order).filter(
        Order.seller_id == user_id
    )

    # Filter by status if provided
    if status:
        query = query.filter(Order.status == status)

    orders = query.order_by(
        Order.created_at.desc()
    ).all()

    result = []
    for order in orders:
        # Get buyer info
        buyer = db.query(User).filter(
            User.id == order.buyer_id
        ).first()

        # Get product info
        product = None
        if order.product_id:
            product = db.query(Product).filter(
                Product.id == order.product_id
            ).first()

        result.append({
            "order_id": order.id,
            "buyer_name": buyer.name if buyer else "Unknown",
            "buyer_phone": buyer.phone if buyer else "",
            "buyer_address": buyer.address if buyer else "",
            "product_name": product.name if product else "Unknown",
            "product_image": product.image_url if product else None,
            "quantity": order.quantity,
            "total_price": order.total_price,
            "delivery_fee": order.delivery_fee,
            "grand_total": order.grand_total or order.total_price,
            "status": order.status,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "gcash_screenshot": order.gcash_screenshot,
            "gcash_reference": order.gcash_reference,
            "delivery_address": order.delivery_address,
            "delivery_notes": order.delivery_notes,
            "is_reviewed": order.is_reviewed,
            "cancel_reason": order.cancel_reason,
            "order_type": order.order_type,
            "created_at": order.created_at
        })

    return {
        "total": len(result),
        "orders": result
    }


# ============================================
# PRODUCER - UPDATE ORDER STATUS
# ============================================

@app.patch("/producer/orders/{order_id}/status")
async def producer_update_order_status(
    order_id: int,
    user_id: int,
    new_status: str,
    note: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Validate status values
    valid_statuses = [
        "confirmed",
        "preparing",
        "ready",
        "delivering",
        "delivered",
        "cancelled"
    ]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Choose: {valid_statuses}"
        )

    # Check order belongs to this producer
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == user_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    # Update status
    order.status = new_status
    if note:
        order.delivery_notes = note

    # If delivered - update product total_sold
    if new_status == "delivered":
        if order.product_id:
            product = db.query(Product).filter(
                Product.id == order.product_id
            ).first()
            if product:
                product.total_sold += order.quantity

        # Update seller total_sales
        seller = db.query(User).filter(
            User.id == user_id
        ).first()
        if seller:
            seller.total_sales += (
                order.grand_total or order.total_price
            )
            seller.total_orders += 1

    db.commit()

    # Send notification to buyer
    buyer = db.query(User).filter(
        User.id == order.buyer_id
    ).first()

    messages = {
        "confirmed": {
            "title": "Order Confirmed! ✅",
            "body": f"Your order #{str(order_id).zfill(4)} has been confirmed by the seller!"
        },
        "preparing": {
            "title": "Being Prepared! 📦",
            "body": f"Your order #{str(order_id).zfill(4)} is now being prepared!"
        },
        "ready": {
            "title": "Order Ready! 🎉",
            "body": f"Your order #{str(order_id).zfill(4)} is ready for pickup/delivery!"
        },
        "delivering": {
            "title": "On The Way! 🛵",
            "body": f"Your order #{str(order_id).zfill(4)} is on its way to you!"
        },
        "delivered": {
            "title": "Order Delivered! 🎉",
            "body": f"Your order #{str(order_id).zfill(4)} has been delivered. Enjoy!"
        },
        "cancelled": {
            "title": "Order Cancelled ❌",
            "body": f"Your order #{str(order_id).zfill(4)} was cancelled. {note or ''}"
        }
    }

    if buyer and buyer.push_token:
        msg = messages.get(new_status)
        if msg:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        "https://exp.host/--/api/v2/push/send",
                        json={
                            "to": buyer.push_token,
                            "title": msg["title"],
                            "body": msg["body"],
                            "sound": "default",
                            "badge": 1,
                            "data": {
                                "order_id": order_id,
                                "status": new_status
                            }
                        },
                        headers={
                            "Content-Type": "application/json"
                        }
                    )
            except:
                pass

    return {
        "message": f"✅ Order updated to {new_status}",
        "order_id": order_id,
        "new_status": new_status,
        "notification_sent": True
    }


# ============================================
# PRODUCER - UPDATE PROFILE
# ============================================

@app.put("/producer/profile/{user_id}")
def update_producer_profile(
    user_id: int,
    farm_name: Optional[str] = None,
    farm_location: Optional[str] = None,
    farm_description: Optional[str] = None,
    phone: Optional[str] = None,
    address: Optional[str] = None,
    gcash_number: Optional[str] = None,
    gcash_name: Optional[str] = None,
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
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

    # Update only provided fields
    if farm_name is not None:
        user.farm_name = farm_name
    if farm_location is not None:
        user.farm_location = farm_location
    if farm_description is not None:
        user.farm_description = farm_description
    if phone is not None:
        user.phone = phone
    if address is not None:
        user.address = address
    if gcash_number is not None:
        user.gcash_number = gcash_number
    if gcash_name is not None:
        user.gcash_name = gcash_name

    db.commit()

    return {
        "message": "✅ Profile updated!",
        "user_id": user_id,
        "farm_name": user.farm_name,
        "farm_location": user.farm_location
    }


# ============================================
# PRODUCER - GET SALES SUMMARY
# ============================================

@app.get("/producer/sales/{user_id}")
def get_producer_sales(
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
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

    # All orders
    all_orders = db.query(Order).filter(
        Order.seller_id == user_id
    ).all()

    # Count by status
    status_counts = {}
    for order in all_orders:
        s = order.status
        status_counts[s] = status_counts.get(s, 0) + 1

    # Revenue by month (simple version)
    monthly = {}
    for order in all_orders:
        if order.payment_status == "paid":
            month = order.created_at.strftime("%Y-%m")
            amount = order.grand_total or order.total_price
            monthly[month] = monthly.get(month, 0) + amount

    # Top selling products
    products = db.query(Product).filter(
        Product.farmer_id == user_id
    ).order_by(Product.total_sold.desc()).all()

    return {
        "summary": {
            "total_orders": len(all_orders),
            "total_revenue": user.total_sales,
            "orders_by_status": status_counts
        },
        "monthly_revenue": monthly,
        "top_products": [
            {
                "name": p.name,
                "total_sold": p.total_sold,
                "price": p.price,
                "unit": p.unit,
                "revenue": p.total_sold * p.price
            }
            for p in products[:5]
        ]
    }

    # ============================================
# CUISINE DASHBOARD ROUTES
# ============================================

@app.get("/cuisine/dashboard/{user_id}")
def get_cuisine_dashboard(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ["cuisine", "admin"]:
        raise HTTPException(status_code=403, detail="Cuisine partner access only")
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == user_id).first()
    restaurant_id = restaurant.id if restaurant else None
    total_menu_items = db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant_id).count() if restaurant_id else 0
    total_orders = db.query(Order).filter(Order.seller_id == user_id).count()
    pending_orders = db.query(Order).filter(Order.seller_id == user_id, Order.status == "pending").count()
    paid_orders = db.query(Order).filter(Order.seller_id == user_id, Order.payment_status == "paid").all()
    total_revenue = sum(o.grand_total or o.total_price for o in paid_orders)
    recent_orders = db.query(Order).filter(Order.seller_id == user_id).order_by(Order.created_at.desc()).limit(5).all()
    recent_orders_data = []
    for order in recent_orders:
        buyer = db.query(User).filter(User.id == order.buyer_id).first()
        menu_item = db.query(MenuItem).filter(MenuItem.id == order.menu_item_id).first() if order.menu_item_id else None
        recent_orders_data.append({
            "order_id": order.id,
            "buyer_name": buyer.name if buyer else "Unknown",
            "buyer_phone": buyer.phone if buyer else "",
            "item_name": menu_item.name if menu_item else "Unknown",
            "quantity": order.quantity,
            "total_price": order.total_price,
            "grand_total": order.grand_total or order.total_price,
            "status": order.status,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "delivery_address": order.delivery_address,
            "created_at": str(order.created_at)
        })
    reviews = db.query(Review).filter(Review.restaurant_id == restaurant_id).all() if restaurant_id else []
    avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0
    return {
        "cuisine_partner": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_verified": user.is_verified,
            "restaurant_name": user.restaurant_name,
            "restaurant_address": user.restaurant_address,
            "opening_hours": user.opening_hours,
            "total_sales": user.total_sales,
            "profile_image": user.profile_image,
            "gcash_number": user.gcash_number
        },
        "restaurant": {
            "id": restaurant.id if restaurant else None,
            "name": restaurant.name if restaurant else None,
            "address": restaurant.address if restaurant else None,
            "category": restaurant.category if restaurant else None,
            "is_open": restaurant.is_open if restaurant else False,
            "delivery_fee": restaurant.delivery_fee if restaurant else 0,
            "image_url": restaurant.image_url if restaurant else None
        },
        "stats": {
            "total_menu_items": total_menu_items,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "total_revenue": round(total_revenue, 2),
            "total_reviews": len(reviews),
            "average_rating": avg_rating
        },
        "recent_orders": recent_orders_data
    }


@app.get("/cuisine/menu/{user_id}")
def get_cuisine_menu(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ["cuisine", "admin"]:
        raise HTTPException(status_code=403, detail="Cuisine partner access only")
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == user_id).first()
    if not restaurant:
        return {"message": "No restaurant found. Create one first.", "total": 0, "menu_items": []}
    items = db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant.id).all()
    return {
        "restaurant_id": restaurant.id,
        "restaurant_name": restaurant.name,
        "total": len(items),
        "menu_items": [
            {
                "id": i.id,
                "name": i.name,
                "description": i.description,
                "price": i.price,
                "category": i.category,
                "is_available": i.is_available,
                "image_url": i.image_url
            }
            for i in items
        ]
    }


@app.post("/cuisine/menu/{user_id}")
def add_cuisine_menu_item(user_id: int, item: MenuItemCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ["cuisine", "admin"]:
        raise HTTPException(status_code=403, detail="Cuisine partner access only")
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == user_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Create your restaurant first")
    new_item = MenuItem(
        restaurant_id=restaurant.id,
        name=item.name,
        description=item.description,
        price=item.price,
        category=item.category,
        image_url=item.image_url,
        is_available=True
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {
        "message": "Menu item added!",
        "item_id": new_item.id,
        "name": new_item.name,
        "price": new_item.price
    }


@app.put("/cuisine/menu/{item_id}/edit")
def edit_cuisine_menu_item(
    item_id: int,
    user_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    price: Optional[float] = None,
    category: Optional[str] = None,
    is_available: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == user_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.restaurant_id == restaurant.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    if name is not None:
        item.name = name
    if description is not None:
        item.description = description
    if price is not None:
        item.price = price
    if category is not None:
        item.category = category
    if is_available is not None:
        item.is_available = is_available
    db.commit()
    db.refresh(item)
    return {
        "message": "Menu item updated!",
        "item_id": item.id,
        "name": item.name
    }


@app.delete("/cuisine/menu/{item_id}/remove")
def delete_cuisine_menu_item(item_id: int, user_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == user_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.restaurant_id == restaurant.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    db.delete(item)
    db.commit()
    return {"message": "Menu item deleted!", "item_id": item_id}


@app.get("/cuisine/orders/{user_id}")
def get_cuisine_orders(user_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ["cuisine", "admin"]:
        raise HTTPException(status_code=403, detail="Cuisine partner access only")
    query = db.query(Order).filter(Order.seller_id == user_id)
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(Order.created_at.desc()).all()
    result = []
    for order in orders:
        buyer = db.query(User).filter(User.id == order.buyer_id).first()
        menu_item = db.query(MenuItem).filter(MenuItem.id == order.menu_item_id).first() if order.menu_item_id else None
        result.append({
            "order_id": order.id,
            "buyer_name": buyer.name if buyer else "Unknown",
            "buyer_phone": buyer.phone if buyer else "",
            "item_name": menu_item.name if menu_item else "Unknown",
            "item_image": menu_item.image_url if menu_item else None,
            "quantity": order.quantity,
            "total_price": order.total_price,
            "delivery_fee": order.delivery_fee,
            "grand_total": order.grand_total or order.total_price,
            "status": order.status,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "gcash_screenshot": order.gcash_screenshot,
            "delivery_address": order.delivery_address,
            "delivery_notes": order.delivery_notes,
            "is_reviewed": order.is_reviewed,
            "order_type": order.order_type,
            "created_at": str(order.created_at)
        })
    return {"total": len(result), "orders": result}


@app.patch("/cuisine/orders/{order_id}/status")
async def cuisine_update_order_status(
    order_id: int,
    user_id: int,
    new_status: str,
    db: Session = Depends(get_db)
):
    valid_statuses = ["confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose: {valid_statuses}")
    order = db.query(Order).filter(Order.id == order_id, Order.seller_id == user_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = new_status
    if new_status == "delivered":
        seller = db.query(User).filter(User.id == user_id).first()
        if seller:
            seller.total_sales += (order.grand_total or order.total_price)
            seller.total_orders += 1
    db.commit()
    buyer = db.query(User).filter(User.id == order.buyer_id).first()
    if buyer and buyer.push_token:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    "https://exp.host/--/api/v2/push/send",
                    json={
                        "to": buyer.push_token,
                        "title": "Order Update!",
                        "body": f"Your food order is now {new_status}",
                        "sound": "default",
                        "badge": 1,
                        "data": {"order_id": order_id, "status": new_status}
                    },
                    headers={"Content-Type": "application/json"}
                )
        except:
            pass
    return {
        "message": f"Order updated to {new_status}",
        "order_id": order_id,
        "new_status": new_status,
        "notification_sent": True
    }


@app.patch("/cuisine/restaurant/{user_id}/toggle")
def toggle_restaurant_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ["cuisine", "admin"]:
        raise HTTPException(status_code=403, detail="Cuisine partner access only")
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == user_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    restaurant.is_open = not restaurant.is_open
    db.commit()
    status = "OPEN" if restaurant.is_open else "CLOSED"
    return {
        "message": f"Restaurant is now {status}!",
        "restaurant_id": restaurant.id,
        "is_open": restaurant.is_open
    }


@app.put("/cuisine/profile/{user_id}")
def update_cuisine_profile(
    user_id: int,
    restaurant_name: Optional[str] = None,
    restaurant_address: Optional[str] = None,
    opening_hours: Optional[str] = None,
    phone: Optional[str] = None,
    gcash_number: Optional[str] = None,
    gcash_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ["cuisine", "admin"]:
        raise HTTPException(status_code=403, detail="Cuisine partner access only")
    if restaurant_name is not None:
        user.restaurant_name = restaurant_name
    if restaurant_address is not None:
        user.restaurant_address = restaurant_address
    if opening_hours is not None:
        user.opening_hours = opening_hours
    if phone is not None:
        user.phone = phone
    if gcash_number is not None:
        user.gcash_number = gcash_number
    if gcash_name is not None:
        user.gcash_name = gcash_name
    db.commit()
    return {
        "message": "Profile updated!",
        "user_id": user_id,
        "restaurant_name": user.restaurant_name
    }


@app.get("/cuisine/sales/{user_id}")
def get_cuisine_sales(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ["cuisine", "admin"]:
        raise HTTPException(status_code=403, detail="Cuisine partner access only")
    all_orders = db.query(Order).filter(Order.seller_id == user_id).all()
    status_counts = {}
    for order in all_orders:
        s = order.status
        status_counts[s] = status_counts.get(s, 0) + 1
    monthly = {}
    for order in all_orders:
        if order.payment_status == "paid":
            month = order.created_at.strftime("%Y-%m")
            amount = order.grand_total or order.total_price
            monthly[month] = monthly.get(month, 0) + amount
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == user_id).first()
    top_items = db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant.id).all() if restaurant else []
    return {
        "summary": {
            "total_orders": len(all_orders),
            "total_revenue": user.total_sales,
            "orders_by_status": status_counts
        },
        "monthly_revenue": monthly,
        "menu_performance": [
            {
                "name": item.name,
                "price": item.price,
                "category": item.category,
                "is_available": item.is_available
            }
            for item in top_items[:5]
        ]
    }

# ============================================
# GCASH PAYMENT ROUTES
# ============================================

@app.post("/payment/gcash/initiate")
def initiate_gcash_payment(
    order_id: int,
    buyer_id: int,
    db: Session = Depends(get_db)
):
    # Get order
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.buyer_id == buyer_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )
    if order.payment_status == "paid":
        raise HTTPException(
            status_code=400,
            detail="Order already paid"
        )

    # Get seller GCash info
    seller = db.query(User).filter(
        User.id == order.seller_id
    ).first()
    if not seller:
        raise HTTPException(
            status_code=404,
            detail="Seller not found"
        )

    return {
        "message": "Send payment to this GCash number",
        "order_id": order_id,
        "amount": order.grand_total or order.total_price,
        "seller_gcash_number": seller.gcash_number,
        "seller_gcash_name": seller.gcash_name,
        "instruction": "1. Open GCash app\n2. Send money to the number above\n3. Screenshot the receipt\n4. Upload the screenshot below"
    }


@app.post("/payment/gcash/upload/{order_id}")
async def upload_gcash_screenshot(
    order_id: int,
    buyer_id: int,
    gcash_reference: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Verify order belongs to buyer
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.buyer_id == buyer_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )
    if order.payment_status == "paid":
        raise HTTPException(
            status_code=400,
            detail="Order already paid"
        )

    # Validate file type
    if file.content_type not in [
        "image/jpeg", "image/png",
        "image/jpg", "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only image files allowed"
        )

    # Upload screenshot to Cloudinary
    file_bytes = await file.read()
    result = upload_image(
        file_bytes,
        folder="zavara/gcash_screenshots"
    )
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail="Upload failed"
        )

    # Save screenshot URL and reference to order
    order.gcash_screenshot = result["url"]
    order.gcash_reference = gcash_reference
    order.payment_method = "gcash"
    order.payment_status = "pending_verification"
    db.commit()

    # Notify seller to verify payment
    seller = db.query(User).filter(
        User.id == order.seller_id
    ).first()

    if seller and seller.push_token:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    "https://exp.host/--/api/v2/push/send",
                    json={
                        "to": seller.push_token,
                        "title": "GCash Payment Received!",
                        "body": f"Order #{str(order_id).zfill(4)} - Please verify the payment screenshot.",
                        "sound": "default",
                        "badge": 1,
                        "data": {
                            "order_id": order_id,
                            "type": "payment_verification"
                        }
                    },
                    headers={"Content-Type": "application/json"}
                )
        except:
            pass

    return {
        "message": "Screenshot uploaded! Waiting for seller verification.",
        "order_id": order_id,
        "screenshot_url": result["url"],
        "gcash_reference": gcash_reference,
        "payment_status": "pending_verification"
    }


@app.post("/payment/gcash/verify/{order_id}")
async def verify_gcash_payment(
    order_id: int,
    seller_id: int,
    approved: bool,
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Verify order belongs to seller
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == seller_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    buyer = db.query(User).filter(
        User.id == order.buyer_id
    ).first()

    if approved:
        # Mark as paid
        order.payment_status = "paid"
        order.status = "confirmed"
        db.commit()

        # Notify buyer payment approved
        if buyer and buyer.push_token:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        "https://exp.host/--/api/v2/push/send",
                        json={
                            "to": buyer.push_token,
                            "title": "Payment Verified!",
                            "body": f"Your GCash payment for order #{str(order_id).zfill(4)} has been verified!",
                            "sound": "default",
                            "badge": 1,
                            "data": {
                                "order_id": order_id,
                                "type": "payment_approved"
                            }
                        },
                        headers={"Content-Type": "application/json"}
                    )
            except:
                pass

        return {
            "message": "Payment verified! Order confirmed.",
            "order_id": order_id,
            "payment_status": "paid",
            "order_status": "confirmed"
        }
    else:
        # Reject payment
        order.payment_status = "unpaid"
        order.gcash_screenshot = None
        order.gcash_reference = None
        db.commit()

        # Notify buyer payment rejected
        if buyer and buyer.push_token:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        "https://exp.host/--/api/v2/push/send",
                        json={
                            "to": buyer.push_token,
                            "title": "Payment Rejected",
                            "body": f"Your payment for order #{str(order_id).zfill(4)} was rejected. {reason or 'Please try again.'}",
                            "sound": "default",
                            "badge": 1,
                            "data": {
                                "order_id": order_id,
                                "type": "payment_rejected"
                            }
                        },
                        headers={"Content-Type": "application/json"}
                    )
            except:
                pass

        return {
            "message": "Payment rejected.",
            "order_id": order_id,
            