# ============================================
# ZAVARA ADMIN ROUTES
# ============================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Order, Restaurant, Product, VerificationRequest
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])

ZAVARA_ROLES = {
    "regular":   "Member",
    "producer":  "Harvest Partner",
    "seller":    "Market Seller",
    "transport": "Swift Partner",
    "haven":     "Haven Partner",
    "cuisine":   "Cuisine Partner",
    "admin":     "Overseer"
}


def _check_admin(admin_id: int, db: Session):
    """Reusable admin check"""
    admin = db.query(User).filter(
        User.id == admin_id
    ).first()
    if not admin or admin.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return admin


@router.post("/set-role")
def set_user_role(
    user_id: int,
    new_role: str,
    admin_id: int,
    db: Session = Depends(get_db)
):
    _check_admin(admin_id, db)
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
    user.is_verified = new_role != "regular"
    db.commit()
    return {
        "message": "✅ Role updated!",
        "user_id": user_id,
        "new_role": new_role,
        "role_label": ZAVARA_ROLES.get(new_role)
    }


@router.get("/users")
def get_all_users(
    admin_id: int,
    db: Session = Depends(get_db)
):
    _check_admin(admin_id, db)
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


@router.get("/dashboard")
def get_admin_dashboard(
    admin_id: int,
    db: Session = Depends(get_db)
):
    _check_admin(admin_id, db)

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
    for role, label in ZAVARA_ROLES.items():
        count = db.query(User).filter(
            User.role == role
        ).count()
        role_counts[label] = count

    return {
        "platform": "ZAVARA 🌴",
        "stats": {
            "total_users": total_users,
            "pending_verifications": pending_verifications,
            "total_orders": total_orders,
            "total_restaurants": total_restaurants,
            "total_products": total_products
        },
        "users_by_role": role_counts
    }


@router.get("/verify/pending")
def get_pending_verifications(
    admin_id: int,
    db: Session = Depends(get_db)
):
    _check_admin(admin_id, db)
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
            "role_label": ZAVARA_ROLES.get(req.requested_role),
            "partner_type": req.partner_type,
            "business_name": req.business_name,
            "submitted_at": req.created_at,
            "status": req.status
        })
    return result


@router.post("/verify/approve/{request_id}")
def approve_verification(
    request_id: int,
    admin_id: int,
    db: Session = Depends(get_db)
):
    _check_admin(admin_id, db)
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
    if user:
        user.role = req.requested_role
        user.is_verified = True
    db.commit()
    return {
        "message": "✅ Approved!",
        "user_id": req.user_id,
        "new_role": req.requested_role
    }


@router.post("/verify/reject/{request_id}")
def reject_verification(
    request_id: int,
    admin_id: int,
    reason: str,
    db: Session = Depends(get_db)
):
    _check_admin(admin_id, db)
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