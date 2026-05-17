# ============================================
# ZAVARA REVIEW ROUTES
# ============================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Order, Review
from typing import Optional

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


@router.post("")
def create_review(
    user_id: int,
    rating: int,
    comment: Optional[str] = None,
    restaurant_id: Optional[int] = None,
    product_id: Optional[int] = None,
    order_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be 1-5"
        )
    user = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    is_verified = False
    if order_id:
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.buyer_id == user_id,
            Order.status == "delivered"
        ).first()
        if order:
            is_verified = True
            order.is_reviewed = True

    existing = db.query(Review).filter(
        Review.user_id == user_id,
        Review.order_id == order_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already reviewed this order!"
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


@router.get("/restaurant/{restaurant_id}")
def get_restaurant_reviews(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(
        Review.restaurant_id == restaurant_id
    ).order_by(Review.created_at.desc()).all()

    avg = round(
        sum(r.rating for r in reviews) / len(reviews), 1
    ) if reviews else 0

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
            "date": str(review.created_at)
        })
    return {
        "restaurant_id": restaurant_id,
        "total_reviews": len(reviews),
        "average_rating": avg,
        "reviews": result
    }


@router.get("/product/{product_id}")
def get_product_reviews(
    product_id: int,
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(
        Review.product_id == product_id
    ).order_by(Review.created_at.desc()).all()

    avg = round(
        sum(r.rating for r in reviews) / len(reviews), 1
    ) if reviews else 0

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
            "date": str(review.created_at)
        })
    return {
        "product_id": product_id,
        "total_reviews": len(reviews),
        "average_rating": avg,
        "reviews": result
    }


@router.get("/user/{user_id}")
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
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "restaurant_id": r.restaurant_id,
                "product_id": r.product_id,
                "order_id": r.order_id,
                "is_verified": r.is_verified_purchase,
                "date": str(r.created_at)
            }
            for r in reviews
        ]
    }


@router.delete("/{review_id}")
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
            detail="Review not found or not yours"
        )
    db.delete(review)
    db.commit()
    return {"message": "✅ Review deleted!"}