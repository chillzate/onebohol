# ============================================
# ZAVARA CUISINE ROUTES
# ============================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Order, Restaurant, MenuItem, Review
from schemas import MenuItemCreate, RestaurantCreate
from typing import Optional
from datetime import datetime
import httpx

router = APIRouter(
    prefix="/cuisine",
    tags=["Cuisine"]
)


def _check_cuisine(user_id: int, db: Session):
    user = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    if user.role not in ["cuisine", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Cuisine partner access only"
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
    except Exception as e:
        print(f"⚠️ Push failed: {str(e)}")
        return False


# ============================================
# DASHBOARD
# ============================================
@router.get("/dashboard/{user_id}")
def get_cuisine_dashboard(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = _check_cuisine(user_id, db)

    restaurant = db.query(Restaurant).filter(
        Restaurant.owner_id == user_id
    ).first()
    restaurant_id = restaurant.id if restaurant else None

    total_menu_items = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id
    ).count() if restaurant_id else 0

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
    ).order_by(Order.created_at.desc()).limit(5).all()

    recent_orders_data = []
    for order in recent_orders:
        buyer = db.query(User).filter(
            User.id == order.buyer_id
        ).first()
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == order.menu_item_id
        ).first() if order.menu_item_id else None
        recent_orders_data.append({
            "order_id": order.id,
            "order_code": f"#{str(order.id).zfill(4)}",
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
            "eta_minutes": order.eta_minutes,
            "created_at": str(order.created_at)
        })

    reviews = db.query(Review).filter(
        Review.restaurant_id == restaurant_id
    ).all() if restaurant_id else []
    avg_rating = round(
        sum(r.rating for r in reviews) / len(reviews), 1
    ) if reviews else 0

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


# ============================================
# MENU
# ============================================
@router.get("/menu/{user_id}")
def get_cuisine_menu(
    user_id: int,
    db: Session = Depends(get_db)
):
    _check_cuisine(user_id, db)
    restaurant = db.query(Restaurant).filter(
        Restaurant.owner_id == user_id
    ).first()
    if not restaurant:
        return {
            "message": "No restaurant found.",
            "total": 0,
            "menu_items": []
        }
    items = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant.id
    ).all()
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


@router.post("/menu/{user_id}")
def add_cuisine_menu_item(
    user_id: int,
    item: MenuItemCreate,
    db: Session = Depends(get_db)
):
    _check_cuisine(user_id, db)
    restaurant = db.query(Restaurant).filter(
        Restaurant.owner_id == user_id
    ).first()
    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Create your restaurant first"
        )
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
        "message": "✅ Menu item added!",
        "item_id": new_item.id,
        "name": new_item.name,
        "price": new_item.price
    }


@router.put("/menu/{item_id}/edit")
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
    restaurant = db.query(Restaurant).filter(
        Restaurant.owner_id == user_id
    ).first()
    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.restaurant_id == restaurant.id
    ).first()
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found"
        )
    if name is not None:
        item.name = name
    if description is not None:
        item.description = description
    if price is not None:
        if price <= 0:
            raise HTTPException(
                status_code=400,
                detail="Price must be positive"
            )
        item.price = price
    if category is not None:
        item.category = category
    if is_available is not None:
        item.is_available = is_available
    db.commit()
    db.refresh(item)
    return {
        "message": "✅ Menu item updated!",
        "item_id": item.id,
        "name": item.name
    }


@router.delete("/menu/{item_id}/remove")
def delete_cuisine_menu_item(
    item_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(
        Restaurant.owner_id == user_id
    ).first()
    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.restaurant_id == restaurant.id
    ).first()
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found"
        )
    db.delete(item)
    db.commit()
    return {
        "message": "✅ Menu item deleted!",
        "item_id": item_id
    }


# ============================================
# ORDERS
# ============================================
@router.get("/orders/{user_id}")
def get_cuisine_orders(
    user_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    _check_cuisine(user_id, db)

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
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == order.menu_item_id
        ).first() if order.menu_item_id else None

        result.append({
            "order_id": order.id,
            "order_code": f"#{str(order.id).zfill(4)}",
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
            "order_type": order.order_type,
            "eta_minutes": order.eta_minutes,
            "rider_name": order.rider_name,
            "created_at": str(order.created_at)
        })
    return {"total": len(result), "orders": result}


# ============================================
# RESTAURANT TOGGLE
# ============================================
@router.patch("/restaurant/{user_id}/toggle")
def toggle_restaurant_status(
    user_id: int,
    db: Session = Depends(get_db)
):
    _check_cuisine(user_id, db)
    restaurant = db.query(Restaurant).filter(
        Restaurant.owner_id == user_id
    ).first()
    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )
    restaurant.is_open = not restaurant.is_open
    db.commit()
    status = "OPEN 🟢" if restaurant.is_open else "CLOSED 🔴"
    return {
        "message": f"Restaurant is now {status}!",
        "restaurant_id": restaurant.id,
        "is_open": restaurant.is_open
    }


# ============================================
# PROFILE
# ============================================
@router.put("/profile/{user_id}")
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
    user = _check_cuisine(user_id, db)

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
        "message": "✅ Profile updated!",
        "user_id": user_id,
        "restaurant_name": user.restaurant_name
    }


# ============================================
# SALES
# ============================================
@router.get("/sales/{user_id}")
def get_cuisine_sales(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = _check_cuisine(user_id, db)

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

    restaurant = db.query(Restaurant).filter(
        Restaurant.owner_id == user_id
    ).first()
    top_items = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant.id
    ).all() if restaurant else []

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