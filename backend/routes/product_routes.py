# ============================================
# ZAVARA PRODUCT ROUTES
# ============================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Product
from schemas import ProductCreate, ProductResponse
from typing import List

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.post("", response_model=ProductResponse)
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
        category=product.category,
        market_type=product.market_type
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("", response_model=List[ProductResponse])
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
    if user.role == "admin":
        return db.query(Product).filter(
            Product.is_available == True
        ).all()
    if user.role == "regular":
        return db.query(Product).filter(
            Product.is_available == True,
            Product.market_type == "retail"
        ).all()
    if user.role in ["seller", "producer"]:
        return db.query(Product).filter(
            Product.is_available == True,
            Product.market_type == "wholesale"
        ).all()
    raise HTTPException(
        status_code=403,
        detail="Access denied"
    )


@router.delete("/{product_id}")
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
    return {"message": "✅ Product deleted!"}