from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from sqlalchemy import func

from app.services.invoice import generate_invoice_pdf

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.models.product import Product
from app.schemas.order import OrderOut, OrderCreate, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/", response_model=list[OrderOut])
def list_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(body: OrderCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pending = db.query(Order).filter(
        Order.user_id == user.id, Order.status == "pending_payment"
    ).first()
    if pending:
        pending.shipping_address = body.shipping_address
        db.commit()
        db.refresh(pending)
        return pending

    cart_items = db.query(CartItem).filter(CartItem.user_id == user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = 0
    order_items = []
    for ci in cart_items:
        product = db.query(Product).filter(Product.id == ci.product_id).first()
        if not product or not product.is_active:
            raise HTTPException(status_code=400, detail=f"Product {ci.product_id} unavailable")
        if product.stock < ci.quantity:
            raise HTTPException(status_code=400, detail=f"{product.name} has only {product.stock} left in stock")
        line_total = product.price * ci.quantity
        total += line_total
        order_items.append(OrderItem(
            product_id=product.id,
            quantity=ci.quantity,
            unit_price=product.price,
            total_price=line_total,
        ))

    order = Order(
        user_id=user.id,
        total_amount=total,
        shipping_address=body.shipping_address,
        status="pending_payment",
    )
    order.items = order_items
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}/invoice")
def download_invoice(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "pending_payment":
        raise HTTPException(status_code=400, detail="Invoice available after payment")
    pdf = generate_invoice_pdf(order)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=chhatak-invoice-{order.id}.pdf"},
    )


@router.get("/admin/all", response_model=list[OrderOut])
def admin_list_orders(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(Order).order_by(Order.created_at.desc()).all()


@router.get("/admin/stats")
def admin_stats(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total_orders = db.query(func.count(Order.id)).scalar()
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(Order.status == "confirmed").scalar()
    pending_orders = db.query(func.count(Order.id)).filter(Order.status == "pending_payment").scalar()
    total_users = db.query(func.count(User.id)).scalar()
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar()
    return {
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "pending_orders": pending_orders,
        "total_users": total_users,
        "total_products": total_products,
    }


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(order_id: int, body: OrderStatusUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = body.status
    db.commit()
    db.refresh(order)
    return order
