# ============================================
# ZAVARA ORDER ROUTES - FEATURE E INCLUDED
# Real-time tracking, smart polling, timeline
# ============================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import (
    User, Product, Order,
    MenuItem, Restaurant,
    OrderStatusHistory
)
from schemas import OrderCreate, OrderResponse
from typing import Optional
from datetime import datetime
import httpx

router = APIRouter(prefix="/orders", tags=["Orders"])


# ============================================
# HELPERS
# ============================================
def _get_poll_interval(status: str) -> int:
    """
    Smart adaptive polling
    ✅ BETTER than Uber Eats fixed 30s
    Fast when active, slow when idle
    """
    return {
        "pending":    30,
        "confirmed":  20,
        "preparing":  15,
        "ready":      10,
        "delivering":  8,
        "delivered":  60,
        "cancelled":  120
    }.get(status, 20)


def _get_progress(status: str) -> int:
    """Progress bar percentage for UI"""
    return {
        "pending":    10,
        "confirmed":  25,
        "preparing":  50,
        "ready":      65,
        "delivering": 85,
        "delivered":  100,
        "cancelled":  0
    }.get(status, 0)


def _get_status_message(
    status: str,
    order_id: int,
    order_type: str = "food",
    eta_minutes: int = None,
    rider_name: str = None
) -> dict:
    """
    Rich notification messages
    ✅ BETTER than generic 'Order Updated'
    DoorDash/Grab use specific messages per status
    We do the same + add ETA + rider name
    """
    code = f"#{str(order_id).zfill(4)}"
    eta = f" (~{eta_minutes} mins)" if eta_minutes else ""
    rider = f" by {rider_name}" if rider_name else ""

    return {
        "confirmed": {
            "title": "Order Confirmed! ✅",
            "body": f"Order {code} confirmed{eta}!"
        },
        "preparing": {
            "title": "🍳 Being Prepared!",
            "body": (
                f"Order {code} is being cooked{eta}!"
                if order_type == "food"
                else f"Order {code} is being packed{eta}!"
            )
        },
        "ready": {
            "title": "📦 Order Ready!",
            "body": f"Order {code} is ready! Rider coming soon."
        },
        "delivering": {
            "title": "🛵 On The Way!",
            "body": f"Order {code} is on the way{rider}{eta}!"
        },
        "delivered": {
            "title": "🎉 Delivered!",
            "body": f"Order {code} delivered! Rate us 🌟"
        },
        "cancelled": {
            "title": "❌ Order Cancelled",
            "body": f"Order {code} was cancelled."
        }
    }.get(status, {
        "title": "Order Update 📋",
        "body": f"Order {code} is now {status}"
    })


def _set_timestamps(
    order,
    status: str,
    eta_minutes: int = None,
    rider_name: str = None,
    rider_phone: str = None
):
    """Auto timestamps per status change"""
    order.status_updated_at = datetime.utcnow()
    if eta_minutes is not None:
        order.eta_minutes = eta_minutes
    if rider_name is not None:
        order.rider_name = rider_name
    if rider_phone is not None:
        order.rider_phone = rider_phone

    fields = {
        "confirmed":  "confirmed_at",
        "preparing":  "preparing_at",
        "delivering": "delivering_at",
        "delivered":  "delivered_at",
        "cancelled":  "cancelled_at"
    }
    field = fields.get(status)
    if field and hasattr(order, field):
        setattr(order, field, datetime.utcnow())


async def _push(
    token: str,
    title: str,
    body: str,
    data: dict = None
) -> bool:
    """
    Push notification with proper error logging
    ✅ No more silent bare except: pass
    ✅ Returns bool so caller knows if it worked
    """
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
                    "channelId": "zavara-orders",
                    "data": data or {}
                },
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate"
                }
            )
            result = res.json()
            if "errors" in result:
                print(f"⚠️ Push error: {result['errors']}")
                return False
            return True
    except httpx.TimeoutException:
        print(f"⚠️ Push timeout: {token[:20]}...")
        return False
    except Exception as e:
        print(f"⚠️ Push failed: {str(e)}")
        return False


def _get_item_info(order, db: Session):
    """Get item name and image from order"""
    item_name = "Unknown"
    item_image = None
    if order.product_id:
        p = db.query(Product).filter(
            Product.id == order.product_id
        ).first()
        if p:
            item_name = p.name
            item_image = p.image_url
    elif order.menu_item_id:
        m = db.query(MenuItem).filter(
            MenuItem.id == order.menu_item_id
        ).first()
        if m:
            item_name = m.name
            item_image = m.image_url
    return item_name, item_image


# ============================================
# CREATE ORDER
# ============================================
@router.post("", response_model=OrderResponse)
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
                detail="Menu item not found or unavailable"
            )
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == menu_item.restaurant_id
        ).first()
        if not restaurant or not restaurant.is_open:
            raise HTTPException(
                status_code=400,
                detail="Restaurant is currently closed"
            )
        seller_id = restaurant.owner_id
        delivery_fee = restaurant.delivery_fee or 0.0
        total_price = menu_item.price * order.quantity
        grand_total = total_price + delivery_fee

        new_order = Order(
            buyer_id=buyer_id,
            seller_id=seller_id,
            menu_item_id=order.menu_item_id,
            quantity=order.quantity,
            total_price=total_price,
            delivery_fee=delivery_fee,
            grand_total=grand_total,
            status="pending",
            order_type="food",
            delivery_address=order.delivery_address,
            payment_method="cod",
            payment_status="unpaid"
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        db.add(OrderStatusHistory(
            order_id=new_order.id,
            old_status=None,
            new_status="pending",
            changed_by=buyer_id,
            note="Order placed by buyer"
        ))
        db.commit()
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
                detail="Product not found or unavailable"
            )
        if product.quantity < order.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough stock. "
                    f"Only {product.quantity} available."
                )
            )
        total_price = product.price * order.quantity
        grand_total = total_price

        new_order = Order(
            buyer_id=buyer_id,
            seller_id=product.farmer_id,
            product_id=order.product_id,
            quantity=order.quantity,
            total_price=total_price,
            delivery_fee=0.0,
            grand_total=grand_total,
            status="pending",
            order_type="market",
            delivery_address=order.delivery_address,
            payment_method="cod",
            payment_status="unpaid"
        )
        product.quantity -= order.quantity
        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        db.add(OrderStatusHistory(
            order_id=new_order.id,
            old_status=None,
            new_status="pending",
            changed_by=buyer_id,
            note="Order placed by buyer"
        ))
        db.commit()
        return new_order

    raise HTTPException(
        status_code=400,
        detail="Invalid order_type. Use: food or market"
    )


# ============================================
# FEATURE E - TRACK ORDER (MAIN POLL ENDPOINT)
# ============================================
@router.get("/{order_id}/track")
def track_order(
    order_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    ✅ FEATURE E - Smart Real-time Tracking
    Frontend polls this endpoint
    Returns everything for tracking UI +
    tells frontend exactly HOW FAST to poll
    
    Better than Uber Eats because:
    - Adaptive polling (8s-120s based on status)
    - Live ETA countdown calculation
    - Full timeline history
    - Rider info included
    - Progress percentage for progress bar
    - should_stop_polling flag = saves battery
    """
    order = db.query(Order).filter(
        Order.id == order_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )
    if (order.buyer_id != user_id and
            order.seller_id != user_id):
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    buyer = db.query(User).filter(
        User.id == order.buyer_id
    ).first()
    seller = db.query(User).filter(
        User.id == order.seller_id
    ).first() if order.seller_id else None
    item_name, item_image = _get_item_info(order, db)

    history = db.query(OrderStatusHistory).filter(
        OrderStatusHistory.order_id == order_id
    ).order_by(
        OrderStatusHistory.created_at.asc()
    ).all()

    # Live ETA countdown
    live_eta = None
    if (order.eta_minutes and
            order.delivering_at and
            order.status == "delivering"):
        elapsed = datetime.utcnow() - order.delivering_at
        elapsed_mins = int(elapsed.total_seconds() / 60)
        live_eta = max(0, order.eta_minutes - elapsed_mins)

    is_done = order.status in ["delivered", "cancelled"]

    return {
        # Core
        "order_id": order.id,
        "order_code": f"#{str(order.id).zfill(4)}",
        "status": order.status,
        "order_type": order.order_type,
        "quantity": order.quantity,
        "total_price": order.total_price,
        "delivery_fee": order.delivery_fee or 0.0,
        "grand_total": order.grand_total or order.total_price,
        "delivery_address": order.delivery_address,
        "delivery_notes": order.delivery_notes,

        # Payment
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "gcash_reference": order.gcash_reference,

        # Item
        "item_name": item_name,
        "item_image": item_image,

        # People
        "buyer_name": buyer.name if buyer else "Unknown",
        "buyer_phone": buyer.phone if buyer else None,
        "seller_name": seller.name if seller else None,
        "seller_phone": seller.phone if seller else None,
        "rider_name": order.rider_name,
        "rider_phone": order.rider_phone,

        # Progress & ETA
        "progress_percent": _get_progress(order.status),
        "eta_minutes": order.eta_minutes,
        "live_eta_remaining": live_eta,
        "estimated_minutes": order.estimated_minutes or 30,

        # Timestamps for timeline UI
        "created_at": str(order.created_at),
        "status_updated_at": str(order.status_updated_at) if order.status_updated_at else None,
        "confirmed_at": str(order.confirmed_at) if order.confirmed_at else None,
        "preparing_at": str(order.preparing_at) if order.preparing_at else None,
        "delivering_at": str(order.delivering_at) if order.delivering_at else None,
        "delivered_at": str(order.delivered_at) if order.delivered_at else None,
        "cancelled_at": str(order.cancelled_at) if order.cancelled_at else None,

        # Timeline
        "status_history": [
            {
                "status": h.new_status,
                "note": h.note,
                "timestamp": str(h.created_at)
            }
            for h in history
        ],

        # Flags
        "cancel_reason": order.cancel_reason,
        "can_review": (
            order.status == "delivered" and
            not order.is_reviewed
        ),
        "can_cancel": order.status == "pending",

        # Smart polling - server tells frontend speed!
        "poll_interval_seconds": _get_poll_interval(order.status),
        "should_stop_polling": is_done
    }


# ============================================
# ACTIVE ORDERS (Buyer polling list)
# ============================================
@router.get("/active/{user_id}")
def get_active_orders(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Only returns active orders
    ✅ Saves bandwidth vs fetching all orders
    Frontend knows which orders to poll
    """
    active = [
        "pending", "confirmed",
        "preparing", "ready", "delivering"
    ]
    orders = db.query(Order).filter(
        Order.buyer_id == user_id,
        Order.status.in_(active)
    ).order_by(Order.created_at.desc()).all()

    result = []
    for order in orders:
        item_name, item_image = _get_item_info(order, db)
        result.append({
            "order_id": order.id,
            "order_code": f"#{str(order.id).zfill(4)}",
            "status": order.status,
            "item_name": item_name,
            "item_image": item_image,
            "quantity": order.quantity,
            "grand_total": order.grand_total or order.total_price,
            "order_type": order.order_type,
            "payment_method": order.payment_method,
            "progress_percent": _get_progress(order.status),
            "eta_minutes": order.eta_minutes,
            "created_at": str(order.created_at),
            "poll_interval_seconds": _get_poll_interval(order.status)
        })

    return {
        "total_active": len(result),
        "active_orders": result,
        "should_poll": len(result) > 0,
        "next_poll_seconds": (
            min(o["poll_interval_seconds"] for o in result)
            if result else 60
        )
    }


# ============================================
# ORDER HISTORY (Paginated)
# ============================================
@router.get("/user/{user_id}/history")
def get_user_order_history(
    user_id: int,
    page: int = 1,
    limit: int = 10,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Paginated order history
    ✅ Fixed: No longer returns ALL orders forever
    ✅ Status filter for tabs (All/Active/Done)
    """
    if limit > 50:
        limit = 50

    query = db.query(Order).filter(
        Order.buyer_id == user_id
    )
    if status_filter:
        query = query.filter(Order.status == status_filter)

    total = query.count()
    orders = query.order_by(
        Order.created_at.desc()
    ).offset((page - 1) * limit).limit(limit).all()

    all_orders = db.query(Order).filter(
        Order.buyer_id == user_id
    ).all()
    status_counts = {}
    for o in all_orders:
        status_counts[o.status] = (
            status_counts.get(o.status, 0) + 1
        )

    result = []
    for order in orders:
        item_name, item_image = _get_item_info(order, db)
        result.append({
            "order_id": order.id,
            "order_code": f"#{str(order.id).zfill(4)}",
            "status": order.status,
            "item_name": item_name,
            "item_image": item_image,
            "quantity": order.quantity,
            "grand_total": order.grand_total or order.total_price,
            "order_type": order.order_type,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "created_at": str(order.created_at),
            "can_review": (
                order.status == "delivered" and
                not order.is_reviewed
            ),
            "can_cancel": order.status == "pending"
        })

    return {
        "user_id": user_id,
        "total_orders": total,
        "page": page,
        "total_pages": (total + limit - 1) // limit,
        "has_next": page * limit < total,
        "status_summary": status_counts,
        "orders": result
    }


# ============================================
# UPDATE ORDER STATUS (Seller - Master Route)
# ============================================
@router.patch("/{order_id}/update-status")
async def update_order_status(
    order_id: int,
    seller_id: int,
    new_status: str,
    note: Optional[str] = None,
    eta_minutes: Optional[int] = None,
    rider_name: Optional[str] = None,
    rider_phone: Optional[str] = None,
    cancel_reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    ✅ ONE master status update route
    Replaces 3 duplicate routes (main, producer, cuisine)
    Has auth, history, timestamps, smart notifications
    Prevents backwards status
    Auto-restores stock on cancel
    """
    valid = [
        "confirmed", "preparing", "ready",
        "delivering", "delivered", "cancelled"
    ]
    if new_status not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Choose: {valid}"
        )

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == seller_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found or access denied"
        )

    # Prevent backwards
    order_flow = [
        "pending", "confirmed", "preparing",
        "ready", "delivering", "delivered"
    ]
    curr = order_flow.index(order.status) if order.status in order_flow else -1
    nxt = order_flow.index(new_status) if new_status in order_flow else -1

    if new_status != "cancelled" and nxt != -1 and curr != -1 and nxt < curr:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot go from '{order.status}' back to '{new_status}'"
        )

    old_status = order.status

    # Record history
    db.add(OrderStatusHistory(
        order_id=order_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=seller_id,
        note=note or cancel_reason
    ))

    # Update order
    order.status = new_status
    _set_timestamps(order, new_status, eta_minutes, rider_name, rider_phone)

    if new_status == "cancelled":
        order.cancel_reason = cancel_reason
        if order.order_type == "market" and order.product_id:
            product = db.query(Product).filter(
                Product.id == order.product_id
            ).first()
            if product:
                product.quantity += order.quantity

    if new_status == "delivered":
        if order.product_id:
            product = db.query(Product).filter(
                Product.id == order.product_id
            ).first()
            if product:
                if not product.total_sold:
                    product.total_sold = 0
                product.total_sold += order.quantity

        seller = db.query(User).filter(
            User.id == seller_id
        ).first()
        if seller:
            if not seller.total_sales:
                seller.total_sales = 0
            if not seller.total_orders:
                seller.total_orders = 0
            seller.total_sales += (
                order.grand_total or order.total_price
            )
            seller.total_orders += 1

    db.commit()

    # Push notification
    buyer = db.query(User).filter(
        User.id == order.buyer_id
    ).first()
    notif_sent = False
    if buyer and buyer.push_token:
        msg = _get_status_message(
            new_status, order_id,
            order.order_type, eta_minutes, rider_name
        )
        notif_sent = await _push(
            token=buyer.push_token,
            title=msg["title"],
            body=msg["body"],
            data={
                "order_id": order_id,
                "status": new_status,
                "old_status": old_status,
                "type": "order_status_update",
                "screen": "OrderTracking"
            }
        )

    return {
        "message": f"✅ Order #{str(order_id).zfill(4)} → {new_status}",
        "order_id": order_id,
        "old_status": old_status,
        "new_status": new_status,
        "eta_minutes": eta_minutes,
        "rider_name": rider_name,
        "notification_sent": notif_sent,
        "timestamp": str(datetime.utcnow())
    }


# ============================================
# BUYER CANCEL ORDER
# ============================================
@router.patch("/{order_id}/cancel")
async def buyer_cancel_order(
    order_id: int,
    buyer_id: int,
    reason: Optional[str] = "Changed my mind",
    db: Session = Depends(get_db)
):
    """
    Buyer can only cancel if still PENDING
    Auto-restores stock for market orders
    """
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.buyer_id == buyer_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )
    if order.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot cancel. Order is already "
                f"'{order.status}'. Contact seller."
            )
        )

    old_status = order.status
    order.status = "cancelled"
    order.cancel_reason = reason
    order.cancelled_at = datetime.utcnow()
    order.status_updated_at = datetime.utcnow()

    db.add(OrderStatusHistory(
        order_id=order_id,
        old_status=old_status,
        new_status="cancelled",
        changed_by=buyer_id,
        note=f"Buyer cancelled: {reason}"
    ))

    stock_restored = False
    if order.order_type == "market" and order.product_id:
        product = db.query(Product).filter(
            Product.id == order.product_id
        ).first()
        if product:
            product.quantity += order.quantity
            stock_restored = True

    db.commit()

    seller = db.query(User).filter(
        User.id == order.seller_id
    ).first() if order.seller_id else None

    notif_sent = False
    if seller and seller.push_token:
        notif_sent = await _push(
            token=seller.push_token,
            title="Order Cancelled ❌",
            body=f"Order #{str(order_id).zfill(4)} cancelled. Reason: {reason}",
            data={
                "order_id": order_id,
                "type": "order_cancelled",
                "screen": "SellerOrders"
            }
        )

    return {
        "message": "Order cancelled successfully",
        "order_id": order_id,
        "reason": reason,
        "stock_restored": stock_restored,
        "notification_sent": notif_sent
    }


# ============================================
# ORDER TIMELINE
# ============================================
@router.get("/{order_id}/timeline")
def get_order_timeline(
    order_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404, detail="Order not found"
        )
    if (order.buyer_id != user_id and
            order.seller_id != user_id):
        raise HTTPException(
            status_code=403, detail="Access denied"
        )

    history = db.query(OrderStatusHistory).filter(
        OrderStatusHistory.order_id == order_id
    ).order_by(
        OrderStatusHistory.created_at.asc()
    ).all()

    labels = {
        "pending":    "Order Placed 📝",
        "confirmed":  "Confirmed ✅",
        "preparing":  "Preparing 🍳",
        "ready":      "Ready 📦",
        "delivering": "On The Way 🛵",
        "delivered":  "Delivered 🎉",
        "cancelled":  "Cancelled ❌"
    }

    return {
        "order_id": order_id,
        "order_code": f"#{str(order_id).zfill(4)}",
        "current_status": order.status,
        "timeline": [
            {
                "status": h.new_status,
                "label": labels.get(h.new_status, h.new_status),
                "note": h.note,
                "timestamp": str(h.created_at),
                "completed": True
            }
            for h in history
        ],
        "total_events": len(history)
    }


# ============================================
# SELLER PENDING ALERT (Lightweight)
# ============================================
@router.get("/seller/alert/{seller_id}")
def get_seller_alert(
    seller_id: int,
    db: Session = Depends(get_db)
):
    """
    Super lightweight - just counts
    Seller app polls this for badge count
    ✅ Only fetches counts, not full data
    """
    seller = db.query(User).filter(
        User.id == seller_id
    ).first()
    if not seller:
        raise HTTPException(
            status_code=404, detail="Seller not found"
        )

    pending_orders = db.query(Order).filter(
        Order.seller_id == seller_id,
        Order.status == "pending"
    ).count()

    pending_payments = db.query(Order).filter(
        Order.seller_id == seller_id,
        Order.payment_status == "pending_verification"
    ).count()

    total_urgent = pending_orders + pending_payments

    return {
        "seller_id": seller_id,
        "pending_orders": pending_orders,
        "pending_payments": pending_payments,
        "total_urgent": total_urgent,
        "needs_attention": total_urgent > 0,
        "message": (
            f"🔴 {total_urgent} need attention!"
            if total_urgent > 0 else "✅ All clear!"
        ),
        "checked_at": str(datetime.utcnow())
    }


# ============================================
# LEGACY ENDPOINT (kept for compatibility)
# ============================================
@router.get("/user/{user_id}")
def get_user_orders_legacy(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Legacy - use /orders/user/{id}/history instead"""
    return db.query(Order).filter(
        Order.buyer_id == user_id
    ).order_by(Order.created_at.desc()).all()