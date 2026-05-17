# ============================================
# ZAVARA MAIN.PY - CLEAN VERSION
# All routes are in routes/ folder
# This file just connects everything
# ============================================
from fastapi import FastAPI
from database import Base, engine
from models import (
    User, Product, Order, Restaurant,
    MenuItem, RideRequest, JobPost,
    SosAlert, VerificationRequest,
    Review, OrderStatusHistory
)

# Import all routers
from routes.auth_routes import router as auth_router
from routes.admin_routes import router as admin_router
from routes.order_routes import router as order_router
from routes.product_routes import router as product_router
from routes.restaurant_routes import router as restaurant_router
from routes.producer_routes import router as producer_router
from routes.cuisine_routes import router as cuisine_router
from routes.payment_routes import router as payment_router
from routes.upload_routes import router as upload_router
from routes.review_routes import router as review_router
from routes.misc_routes import router as misc_router

# ============================================
# APP SETUP
# ============================================
app = FastAPI(
    title="ZAVARA API 🌴",
    description="Bohol's Super App Platform",
    version="2.0.0"
)

# Create all tables
Base.metadata.create_all(bind=engine)

# ============================================
# REGISTER ALL ROUTERS
# ============================================
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(order_router)
app.include_router(product_router)
app.include_router(restaurant_router)
app.include_router(producer_router)
app.include_router(cuisine_router)
app.include_router(payment_router)
app.include_router(upload_router)
app.include_router(review_router)
app.include_router(misc_router)


# ============================================
# HOME
# ============================================
@app.get("/")
def read_root():
    return {
        "Platform": "ZAVARA",
        "Tagline": "The Island's Pulse 🌴",
        "Status": "Online",
        "Version": "2.0.0",
        "Docs": "/docs",
        "Roles": {
            "regular":   "Member",
            "producer":  "Harvest Partner",
            "seller":    "Market Seller",
            "transport": "Swift Partner",
            "haven":     "Haven Partner",
            "cuisine":   "Cuisine Partner",
            "admin":     "Overseer"
        }
    }


# ============================================
# DEV RESET (keep here - top level admin)
# ============================================
@app.delete("/dev/reset-users")
def reset_all_users(
    secret: str,
    db=None
):
    from database import SessionLocal
    from models import OrderStatusHistory
    if secret != "zavara_reset_2024":
        from fastapi import HTTPException
        raise HTTPException(
            status_code=403,
            detail="Invalid secret"
        )
    db = SessionLocal()
    try:
        db.query(OrderStatusHistory).delete()
        db.query(Order).delete()
        db.query(VerificationRequest).delete()
        db.query(Product).delete()
        db.query(User).delete()
        db.commit()
        return {
            "message": "✅ All data cleared!",
            "status": "Fresh start!"
        }
    finally:
        db.close()