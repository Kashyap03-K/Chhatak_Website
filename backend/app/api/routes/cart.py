from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.cart import CartItem
from app.models.product import Product
from app.schemas.cart import CartItemOut, CartItemAdd, CartItemUpdate

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("/", response_model=list[CartItemOut])
def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(CartItem).filter(CartItem.user_id == user.id).all()


@router.post("/", response_model=CartItemOut, status_code=201)
def add_to_cart(body: CartItemAdd, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == body.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock <= 0:
        raise HTTPException(status_code=400, detail="Product is out of stock")

    existing = db.query(CartItem).filter(
        CartItem.user_id == user.id, CartItem.product_id == body.product_id
    ).first()
    if existing:
        new_qty = existing.quantity + body.quantity
        if new_qty > product.stock:
            raise HTTPException(status_code=400, detail=f"Only {product.stock} available")
        existing.quantity = new_qty
        db.commit()
        db.refresh(existing)
        return existing

    if body.quantity > product.stock:
        raise HTTPException(status_code=400, detail=f"Only {product.stock} available")
    item = CartItem(user_id=user.id, product_id=body.product_id, quantity=body.quantity)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=CartItemOut)
def update_cart_item(item_id: int, body: CartItemUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if body.quantity <= 0:
        db.delete(item)
        db.commit()
        return item
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if product and body.quantity > product.stock:
        raise HTTPException(status_code=400, detail=f"Only {product.stock} available")
    item.quantity = body.quantity
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def remove_from_cart(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()


@router.delete("/", status_code=204)
def clear_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
