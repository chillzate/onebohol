# ============================================
# ZAVARA RESTAURANT ROUTES
# ============================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Restaurant, MenuItem
from schemas import (
    RestaurantCreate, RestaurantResponse,
    MenuItemCreate, MenuItemResponse
)
from typing import List

router = APIRouter(
    prefix="/restaurants",
    tags=["Restaurants"]
)


@router.post("", response_model=RestaurantResponse)
def create_restaurant(
    restaurant: RestaurantCreate,
    owner_id: int,
    db: Session = Depends(get_db)
):
    new_restaurant = Restaurant(
        owner_id=owner_id,
        name=restaurant.name,
        description=restaurant.description,
        address=restaurant.address,
        category=restaurant.category,
        delivery_range_km=restaurant.delivery_range_km,
        delivery_fee=restaurant.delivery_fee,
        image_url=restaurant.image_url
    )
    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)
    return new_restaurant


@router.get("", response_model=List[RestaurantResponse])
def get_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).filter(
        Restaurant.is_open == True
    ).all()


@router.delete("/{restaurant_id}")
def delete_restaurant(
    restaurant_id: int,
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
    db.delete(restaurant)
    db.commit()
    return {"message": "✅ Restaurant deleted!"}


@router.patch("/{restaurant_id}")
def update_restaurant(
    restaurant_id: int,
    delivery_range_km: float,
    delivery_fee: float,
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
    restaurant.delivery_range_km = delivery_range_km
    restaurant.delivery_fee = delivery_fee
    db.commit()
    return {"message": "✅ Restaurant updated!"}


@router.post(
    "/{restaurant_id}/menu",
    response_model=MenuItemResponse
)
def add_menu_item(
    restaurant_id: int,
    item: MenuItemCreate,
    db: Session = Depends(get_db)
):
    new_item = MenuItem(
        restaurant_id=restaurant_id,
        name=item.name,
        description=item.description,
        price=item.price,
        category=item.category,
        image_url=item.image_url
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.get(
    "/{restaurant_id}/menu",
    response_model=List[MenuItemResponse]
)
def get_menu(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    return db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id,
        MenuItem.is_available == True
    ).all()


@router.delete("/menu/{item_id}")
def delete_menu_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id
    ).first()
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found"
        )
    db.delete(item)
    db.commit()
    return {"message": "✅ Menu item deleted!"}