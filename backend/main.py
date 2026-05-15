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
def update_order_status(
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
    order.status = new_status
    db.commit()
    return {
        "message": f"Order updated to {new_status}",
        "order_id": order_id
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