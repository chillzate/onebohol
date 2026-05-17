# ============================================
# ZAVARA UPLOAD ROUTES
# ============================================
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import User, Product, Restaurant, VerificationRequest
from cloudinary_config import (
    upload_image,
    upload_product_image,
    upload_restaurant_image,
    upload_profile_image,
    upload_document
)

router = APIRouter(
    prefix="/upload",
    tags=["Uploads"]
)

ALLOWED_IMAGE_TYPES = [
    "image/jpeg", "image/png",
    "image/jpg", "image/webp"
]
MAX_IMAGE_SIZE = 5 * 1024 * 1024   # 5MB
MAX_DOC_SIZE = 10 * 1024 * 1024    # 10MB


def _validate_image(
    content_type: str,
    file_bytes: bytes
):
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, JPG, WEBP allowed"
        )
    if len(file_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Max 5MB"
        )


@router.post("/profile/{user_id}")
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
    file_bytes = await file.read()
    _validate_image(file.content_type, file_bytes)

    result = upload_profile_image(file_bytes)
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {result.get('error')}"
        )
    user.profile_image = result["url"]
    db.commit()
    return {
        "message": "✅ Profile photo uploaded!",
        "image_url": result["url"],
        "public_id": result["public_id"]
    }


@router.post("/product/{product_id}")
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
    file_bytes = await file.read()
    _validate_image(file.content_type, file_bytes)

    result = upload_product_image(file_bytes)
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail="Upload failed"
        )
    product.image_url = result["url"]
    db.commit()
    return {
        "message": "✅ Product photo uploaded!",
        "image_url": result["url"],
        "public_id": result["public_id"]
    }


@router.post("/restaurant/{restaurant_id}")
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
    file_bytes = await file.read()
    _validate_image(file.content_type, file_bytes)

    result = upload_restaurant_image(file_bytes)
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail="Upload failed"
        )
    restaurant.image_url = result["url"]
    db.commit()
    return {
        "message": "✅ Restaurant photo uploaded!",
        "image_url": result["url"],
        "public_id": result["public_id"]
    }


@router.post("/document/{user_id}")
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
    file_bytes = await file.read()
    if len(file_bytes) > MAX_DOC_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Max 10MB"
        )

    result = upload_document(file_bytes)
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail="Upload failed"
        )

    verification = db.query(VerificationRequest).filter(
        VerificationRequest.user_id == user_id,
        VerificationRequest.status == "pending"
    ).first()
    if verification:
        doc_field_map = {
            "valid_id": "valid_id_url",
            "business_permit": "business_permit_url",
            "selfie": "selfie_url"
        }
        field = doc_field_map.get(doc_type, "document_url")
        setattr(verification, field, result["url"])
        db.commit()

    return {
        "message": f"✅ {doc_type} uploaded!",
        "image_url": result["url"],
        "public_id": result["public_id"],
        "doc_type": doc_type
    }


@router.post("/general")
async def upload_general_image(
    file: UploadFile = File(...)
):
    file_bytes = await file.read()
    _validate_image(file.content_type, file_bytes)

    result = upload_image(
        file_bytes,
        folder="zavara/general"
    )
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail="Upload failed"
        )
    return {
        "message": "✅ Image uploaded!",
        "image_url": result["url"],
        "public_id": result["public_id"]
    }