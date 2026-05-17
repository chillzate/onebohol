# ============================================
# ZAVARA PAYMENT ROUTES
# ============================================
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import User, Order, Product, MenuItem, OrderStatusHistory
from cloudinary_config import upload_image
from typing import Optional
from datetime import datetime
import httpx

router = APIRouter(
    prefix="/payment",
    tags=["Payments"]
)


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


@router.post("/gcash/initiate")
def initiate_gcash_payment(
    order_id: int,
    buyer_id: int,
    db: Session = Depends(get_db)
):
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
    seller = db.query(User).filter(
        User.id == order.seller_id
    ).first()
    if not seller:
        raise HTTPException(
            status_code=404,
            detail="Seller not found"
        )
    if not seller.gcash_number:
        raise HTTPException(
            status_code=400,
            detail="Seller has no GCash number set"
        )
    return {
        "message": "Send payment to this GCash number",
        "order_id": order_id,
        "order_code": f"#{str(order_id).zfill(4)}",
        "amount": order.grand_total or order.total_price,
        "seller_gcash_number": seller.gcash_number,
        "seller_gcash_name": seller.gcash_name,
        "instruction": (
            "1. Open GCash\n"
            "2. Send Money\n"
            "3. Screenshot receipt\n"
            "4. Upload screenshot below"
        )
    }


@router.post("/gcash/upload/{order_id}")
async def upload_gcash_screenshot(
    order_id: int,
    buyer_id: int,
    gcash_reference: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
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

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Max 5MB"
        )

    result = upload_image(
        file_bytes,
        folder="zavara/gcash_screenshots"
    )
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail="Upload failed"
        )

    order.gcash_screenshot = result["url"]
    order.gcash_reference = gcash_reference
    order.payment_method = "gcash"
    order.payment_status = "pending_verification"
    db.commit()

    seller = db.query(User).filter(
        User.id == order.seller_id
    ).first()
    if seller and seller.push_token:
        await _push(
            token=seller.push_token,
            title="GCash Payment Received! 💰",
            body=(
                f"Order #{str(order_id).zfill(4)} "
                f"- Please verify payment!"
            ),
            data={
                "order_id": order_id,
                "type": "payment_verification",
                "screen": "PendingPayments"
            }
        )

    return {
        "message": "Screenshot uploaded! Waiting for verification.",
        "order_id": order_id,
        "screenshot_url": result["url"],
        "gcash_reference": gcash_reference,
        "payment_status": "pending_verification"
    }


@router.post("/gcash/verify/{order_id}")
async def verify_gcash_payment(
    order_id: int,
    seller_id: int,
    approved: bool,
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
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
        order.payment_status = "paid"
        order.status = "confirmed"
        order.confirmed_at = datetime.utcnow()
        order.status_updated_at = datetime.utcnow()

        db.add(OrderStatusHistory(
            order_id=order_id,
            old_status="pending",
            new_status="confirmed",
            changed_by=seller_id,
            note="GCash payment verified by seller"
        ))
        db.commit()

        if buyer and buyer.push_token:
            await _push(
                token=buyer.push_token,
                title="Payment Verified! ✅",
                body=(
                    f"GCash payment for order "
                    f"#{str(order_id).zfill(4)} verified!"
                ),
                data={
                    "order_id": order_id,
                    "type": "payment_approved",
                    "screen": "OrderTracking"
                }
            )
        return {
            "message": "✅ Payment verified! Order confirmed.",
            "order_id": order_id,
            "payment_status": "paid",
            "order_status": "confirmed"
        }
    else:
        order.payment_status = "unpaid"
        order.gcash_screenshot = None
        order.gcash_reference = None
        db.commit()

        if buyer and buyer.push_token:
            await _push(
                token=buyer.push_token,
                title="Payment Rejected ❌",
                body=(
                    f"Payment for order "
                    f"#{str(order_id).zfill(4)} rejected. "
                    f"{reason or 'Please try again.'}"
                ),
                data={
                    "order_id": order_id,
                    "type": "payment_rejected",
                    "screen": "OrderTracking"
                }
            )
        return {
            "message": "Payment rejected.",
            "order_id": order_id,
            "payment_status": "unpaid",
            "reason": reason
        }


@router.get("/gcash/pending/{seller_id}")
def get_pending_payments(
    seller_id: int,
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(
        Order.seller_id == seller_id,
        Order.payment_status == "pending_verification",
        Order.payment_method == "gcash"
    ).order_by(Order.created_at.desc()).all()

    result = []
    for order in orders:
        buyer = db.query(User).filter(
            User.id == order.buyer_id
        ).first()
        item_name = "Unknown"
        if order.product_id:
            p = db.query(Product).filter(
                Product.id == order.product_id
            ).first()
            if p:
                item_name = p.name
        elif order.menu_item_id:
            m = db.query(MenuItem).filter(
                MenuItem.id == order.menu_item_id
            ).first()
            if m:
                item_name = m.name

        result.append({
            "order_id": order.id,
            "order_code": f"#{str(order.id).zfill(4)}",
            "buyer_name": buyer.name if buyer else "Unknown",
            "buyer_phone": buyer.phone if buyer else "",
            "item_name": item_name,
            "quantity": order.quantity,
            "amount": order.grand_total or order.total_price,
            "gcash_screenshot": order.gcash_screenshot,
            "gcash_reference": order.gcash_reference,
            "payment_status": order.payment_status,
            "order_type": order.order_type,
            "created_at": str(order.created_at)
        })

    return {
        "total_pending": len(result),
        "pending_payments": result
    }


@router.get("/status/{order_id}")
def get_payment_status(
    order_id: int,
    buyer_id: int,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.buyer_id == buyer_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )
    return {
        "order_id": order_id,
        "order_code": f"#{str(order_id).zfill(4)}",
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "gcash_reference": order.gcash_reference,
        "gcash_screenshot": order.gcash_screenshot,
        "order_status": order.status,
        "amount": order.grand_total or order.total_price
    }