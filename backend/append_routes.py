producer_routes = '''

# ============================================
# PRODUCER DASHBOARD ROUTES
# ============================================

@app.get("/producer/dashboard/{user_id}")
def get_producer_dashboard(
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
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

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


@app.get("/producer/products/{user_id}")
def get_producer_products(
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
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

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
                "created_at": str(p.created_at)
            }
            for p in products
        ]
    }


@app.post("/producer/products/{user_id}")
def add_producer_product(
    user_id: int,
    product: ProductCreate,
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
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

    new_product = Product(
        farmer_id=user_id,
        name=product.name,
        description=product.description,
        price=product.price,
        unit=product.unit,
        quantity=product.quantity,
        category=product.category,
        is_available=True,
        is_approved=False,
        total_sold=0,
        rating=0.0
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product added! Waiting for admin approval.",
        "product_id": new_product.id,
        "name": new_product.name,
        "status": "pending_approval"
    }


@app.put("/producer/products/{product_id}/edit")
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
            detail="Product not found"
        )

    if name is not None:
        product.name = name
    if description is not None:
        product.description = description
    if price is not None:
        product.price = price
    if quantity is not None:
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
        "message": "Product updated!",
        "product_id": product.id,
        "name": product.name
    }


@app.delete("/producer/products/{product_id}/remove")
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
        "message": "Product deleted!",
        "product_id": product_id
    }


@app.get("/producer/orders/{user_id}")
def get_producer_orders(
    user_id: int,
    status: Optional[str] = None,
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
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

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
            "created_at": str(order.created_at)
        })

    return {
        "total": len(result),
        "orders": result
    }


@app.patch("/producer/orders/{order_id}/status")
async def producer_update_order_status(
    order_id: int,
    user_id: int,
    new_status: str,
    note: Optional[str] = None,
    db: Session = Depends(get_db)
):
    valid_statuses = [
        "confirmed", "preparing", "ready",
        "delivering", "delivered", "cancelled"
    ]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Choose: {valid_statuses}"
        )

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == user_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order.status = new_status
    if note:
        order.delivery_notes = note

    if new_status == "delivered":
        if order.product_id:
            product = db.query(Product).filter(
                Product.id == order.product_id
            ).first()
            if product:
                product.total_sold += order.quantity

        seller = db.query(User).filter(
            User.id == user_id
        ).first()
        if seller:
            seller.total_sales += (
                order.grand_total or order.total_price
            )
            seller.total_orders += 1

    db.commit()

    buyer = db.query(User).filter(
        User.id == order.buyer_id
    ).first()

    messages = {
        "confirmed": {
            "title": "Order Confirmed!",
            "body": f"Your order #{str(order_id).zfill(4)} confirmed!"
        },
        "preparing": {
            "title": "Being Prepared!",
            "body": f"Your order #{str(order_id).zfill(4)} is being prepared!"
        },
        "ready": {
            "title": "Order Ready!",
            "body": f"Your order #{str(order_id).zfill(4)} is ready!"
        },
        "delivering": {
            "title": "On The Way!",
            "body": f"Your order #{str(order_id).zfill(4)} is on its way!"
        },
        "delivered": {
            "title": "Order Delivered!",
            "body": f"Your order #{str(order_id).zfill(4)} delivered!"
        },
        "cancelled": {
            "title": "Order Cancelled",
            "body": f"Your order #{str(order_id).zfill(4)} was cancelled."
        }
    }

    if buyer and buyer.push_token:
        msg = messages.get(new_status)
        if msg:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        "https://exp.host/--/api/v2/push/send",
                        json={
                            "to": buyer.push_token,
                            "title": msg["title"],
                            "body": msg["body"],
                            "sound": "default",
                            "badge": 1,
                            "data": {
                                "order_id": order_id,
                                "status": new_status
                            }
                        },
                        headers={
                            "Content-Type": "application/json"
                        }
                    )
            except:
                pass

    return {
        "message": f"Order updated to {new_status}",
        "order_id": order_id,
        "new_status": new_status,
        "notification_sent": True
    }


@app.put("/producer/profile/{user_id}")
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
        "message": "Profile updated!",
        "user_id": user_id,
        "farm_name": user.farm_name,
        "farm_location": user.farm_location
    }


@app.get("/producer/sales/{user_id}")
def get_producer_sales(
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
    if user.role not in ["producer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Producer access only"
        )

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
                "total_sold": p.total_sold,
                "price": p.price,
                "unit": p.unit,
                "revenue": p.total_sold * p.price
            }
            for p in products[:5]
        ]
    }
'''

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

if '/producer/dashboard' in content:
    print("Producer routes already exist!")
else:
    with open('main.py', 'a', encoding='utf-8') as f:
        f.write(producer_routes)
    print("Producer routes added successfully!")