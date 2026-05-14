from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User, Product, Order
from schemas import (
    UserRegister, UserResponse,
    UserLogin, TokenResponse,
    ProductCreate, ProductResponse,
    OrderCreate, OrderResponse
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

@app.get("/")
def read_root():
    return {
        "Project": "OneBohol",
        "Status": "Online 🌴",
        "Version": "1.0"
    }

# REGISTER
@app.post("/users/register", response_model=UserResponse)
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    hashed = hash_password(user.password)
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# LOGIN
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
    access_token = create_access_token(
        data={"sub": db_user.email}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_name": db_user.name
    }

# ADD PRODUCT (Farmers list their products)
@app.post("/products", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    farmer_id: int,
    db: Session = Depends(get_db)
):
    farmer = db.query(User).filter(User.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    new_product = Product(
        name=product.name,
        description=product.description,
        price=product.price,
        unit=product.unit,
        quantity=product.quantity,
        category=product.category,
        farmer_id=farmer_id
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

# GET ALL PRODUCTS (Buyers see the marketplace)
@app.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return products

# GET PRODUCTS BY CATEGORY
@app.get("/products/category/{category}",
         response_model=List[ProductResponse])
def get_products_by_category(
    category: str,
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.category == category
    ).all()
    return products

# CREATE ORDER (Buyer orders a product)
@app.post("/orders", response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    buyer_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == order.product_id
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
        status="pending"
    )
    product.quantity -= order.quantity
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

# GET ALL ORDERS
@app.get("/orders", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).all()
    return orders