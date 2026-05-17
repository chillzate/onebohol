# ============================================
# ZAVARA PRODUCER ROUTES
# ============================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Product, Order
from schemas import ProductCreate
from typing import Optional
from datetime import datetime
import httpx

router = APIRouter(
    prefix="/producer",
    tags=["Producer"]
)


def _check_producer(user_id: int, db: Session):
    """Reusable producer role check"""
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
    return user


async def _push(
    token: str,
    title: str,
    body: str,
    data: dict = None
) -> bool:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": token,
                    "title": title,
                    "body": body,
                    "sound": "default",
                    "badge": 1,
                    "priority": "high",
                    "data": data or {}
                },
                headers={"Content-Type": "application/json"}
            )
            result = res.json()
            if "errors" in result:
                print(f"⚠️ Push error: {result['errors']}")
                return False
            return True
    except httpx.TimeoutException:
        print(f"⚠️ Push timeout")
        return False
    except Exception as e:
        print(f"⚠️ Push failed: {str(e)}")
        return False


# ============================================
# DASHBOARD
# ============================================
@router.get("/dashboard/{user_id}")
def get_producer_dashboard(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = _check_producer(user_id, db)

    total_products = db.query(Product).filter(
        Product.farmer_id == user_id
    ).count()

    total_orders = db.query(Order).filter(
        Order.seller_id == user_id
    ).count()

    pending_orders = db.query(Order).filter(
        Order.seller_id == user_id,
        Order.status == "pending"
    ).count()

    paid_orders = db.query(Order).filter(
        Order.seller_id == user_id,
        Order.payment_status == "paid"
    ).all()
    total_revenue = sum(
        o.grand_total or o.total_price
        for o in paid_orders
    )

    recent_orders = db.query(Order).filter(
        Order.seller_id == user_id
    ).order_by(
        Order.created_at.desc()
    ).limit(5).all()

    top_products = db.query(Product).filter(
        Product.farmer_id == user_id
    ).order_by(
        Product.total_sold.desc()
    ).limit(5).all()

    recent_orders_data = []
    for order in recent_orders:
        buyer = db.query(User).filter(
            User.id == order.buyer_id
        ).first()
        recent_orders_data.append({
            "order_id": order.id,
            "order_code": f"#{str(order.id).zfill(4)}",
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
            "eta_minutes": order.eta_minutes,
            "created_at": str(order.created_at)
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
# PRODUCTS
# ============================================
@router.get("/products/{user_id}")
def get_producer_products(
    user_id: int,
    db: Session = Depends(get_db)
):
    _check_producer(user_id, db)

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
                "market_type": p.market_type,
                "created_at": str(p.created_at)
            }
            for p in products
        ]
    }


@router.post("/products/{user_id}")
def add_producer_product(
    user_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    _check_producer(user_id, db)

    new_product = Product(
        farmer_id=user_id,
        name=product.name,
        description=product.description,
        price=product.price,
        unit=product.unit,
        quantity=product.quantity,
        category=product.category,
        market_type=product.market_type,
        is_available=True,
        is_approved=False,
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


@router.put("/products/{product_id}/edit")
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
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.farmer_id == user_id
    ).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found or not yours"
        )

    if name is not None:
        product.name = name
    if description is not None:
        product.description = description
    if price is not None:
        if price <= 0:
            raise HTTPException(
                status_code=400,
                detail="Price must be positive"
            )
        product.price = price
    if quantity is not None:
        if quantity < 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity cannot be negative"
            )
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


@router.delete("/products/{product_id}/remove")
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
# ORDERS
# ============================================
@router.get("/orders/{user_id}")
def get_producer_orders(
    user_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    _check_producer(user_id, db)

    query = db.query(Order).filter(
        Order.seller_id == user_id
    )
    if status:
        query = query.filter(Order.status == status)

    orders = query.order_by(
        Order.created_at.desc()
    ).all()

    result = []
    for order in orders:
        buyer = db.query(User).filter(
            User.id == order.buyer_id
        ).first()
        product = None
        if order.product_id:
            product = db.query(Product).filter(
                Product.id == order.product_id
            ).first()

        result.append({
            "order_id": order.id,
            "order_code": f"#{str(order.id).zfill(4)}",
            "buyer_name": buyer.name if buyer else "Unknown",
            "buyer_phone": buyer.phone if buyer else "",
            "product_name": product.name if product else "Unknown",
            "product_image": product.image_url if product else None,
            "quantity": order.quantity,
            "total_price": order.total_price,
            "delivery_fee": order.delivery_fee,
            "grand_total": order.grand_total or order.total_price,
            "status": order.status,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "delivery_address": order.delivery_address,
            "is_reviewed": order.is_reviewed,
            "order_type": order.order_type,
            "eta_minutes": order.eta_minutes,
            "rider_name": order.rider_name,
            "created_at": str(order.created_at)
        })

    return {"total": len(result), "orders": result}


# ============================================
# PROFILE
# ============================================
@router.put("/profile/{user_id}")
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
    user = _check_producer(user_id, db)

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
# SALES
# ============================================
@router.get("/sales/{user_id}")
def get_producer_sales(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = _check_producer(user_id, db)

    all_orders = db.query(Order).filter(
        Order.seller_id == user_id
    ).all()

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
                "total_sold": p.total_sold or 0,
                "price": p.price,
                "unit": p.unit,
                "revenue": (p.total_sold or 0) * p.price
            }
            for p in products[:5]
        ]
    }