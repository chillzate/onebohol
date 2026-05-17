# ============================================
# ZAVARA ROUTES - connects everything to main
# ============================================
from .auth_routes import router as auth_router
from .admin_routes import router as admin_router
from .order_routes import router as order_router
from .product_routes import router as product_router
from .restaurant_routes import router as restaurant_router
from .producer_routes import router as producer_router
from .cuisine_routes import router as cuisine_router
from .payment_routes import router as payment_router
from .upload_routes import router as upload_router
from .review_routes import router as review_router
from .misc_routes import router as misc_router