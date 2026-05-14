from fastapi import FastAPI, Depends, HTTPException
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
from auth import hash_password, verify_password, create_access_token
from typing import List

app = FastAPI(title="OneBohol API 🌴")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================
# HOME
# ============================================
@app.get("/")
def read_root():
    return {
        "Project": "OneBohol",
        "Status": "Online 🌴",
        "Version": "2.0"
    }

# ============================================
# AUTH ROUTES
# ============================================
@app.post("/users/register", response_model=UserResponse)
def register_user(user: UserRegister, db: Session = Depends(get_db)):
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

@app.post("/users/login", response_model=TokenResponse)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()
    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    token = create_access_token(data={"sub": db_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": db_user.name,
        "user_id": db_user.id,
        "role": db_user.role
    }

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ============================================
# VERIFICATION ROUTES
# ============================================
@app.post("/verify/apply", response_model=VerificationResponse)
def apply_verification(
    request: VerificationRequestCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_request = VerificationRequest(
        user_id=user_id,
        requested_role=request.requested_role,
        document_url=request.document_url
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@app.post("/verify/approve/{request_id}")
def approve_verification(
    request_id: int,
    db: Session = Depends(get_db)
):
    request = db.query(VerificationRequest).filter(
        VerificationRequest.id == request_id
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    request.status = "approved"
    user = db.query(User).filter(
        User.id == request.user_id
    ).first()
    user.role = request.requested_role
    user.is_verified = True
    db.commit()
    return {"message": "User verified successfully"}

@app.get("/verify/pending")
def get_pending_verifications(db: Session = Depends(get_db)):
    requests = db.query(VerificationRequest).filter(
        VerificationRequest.status == "pending"
    ).all()
    return requests

# ============================================
# RESTAURANT ROUTES
# ============================================
@app.post("/restaurants", response_model=RestaurantResponse)
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

@app.get("/restaurants", response_model=List[RestaurantResponse])
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
    return {"message": "Restaurant deleted successfully"} 
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
    return {"message": "Restaurant updated successfully"}

@app.post("/restaurants/{restaurant_id}/menu",
          response_model=MenuItemResponse)
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

@app.get("/restaurants/{restaurant_id}/menu",
         response_model=List[MenuItemResponse])
def get_menu(restaurant_id: int, db: Session = Depends(get_db)):
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
    return {"message": "Menu item deleted successfully"}

# ============================================
# FARM MARKET ROUTES (Verified only)
# ============================================
@app.post("/products", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    farmer_id: int,
    db: Session = Depends(get_db)
):
    farmer = db.query(User).filter(User.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    if farmer.role not in ["farmer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only verified farmers can list products"
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

@app.get("/products", response_model=List[ProductResponse])
def get_products(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ["farmer", "vendor", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Verification required."
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
    return {"message": "Product deleted successfully"}

# ============================================
# ORDER ROUTES
# ============================================
@app.post("/orders", response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    buyer_id: int,
    db: Session = Depends(get_db)
):
    buyer = db.query(User).filter(User.id == buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    if order.order_type == "food":
        if not order.menu_item_id:
            raise HTTPException(
                status_code=400,
                detail="menu_item_id is required for food orders"
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
                detail="product_id is required for market orders"
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

@app.get("/orders/user/{user_id}", response_model=List[OrderResponse])
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    return db.query(Order).filter(
        Order.buyer_id == user_id
    ).all()

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
    return {"message": "Job deleted successfully"}

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