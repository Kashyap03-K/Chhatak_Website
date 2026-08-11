import hmac
import hashlib
import json
import logging

import razorpay
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.models.product import Product
from app.models.payment import Payment
from app.schemas.payment import CreatePaymentOrder, PaymentOrderResponse, VerifyPayment, PaymentVerifyResponse
from app.services.invoice import generate_invoice_pdf
from app.services.email import send_order_confirmation

router = APIRouter(prefix="/payments", tags=["payments"])


def get_razorpay_client() -> razorpay.Client:
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _finalize_paid_order(payment: Payment, order: Order, db: Session) -> bool:
    """Mark payment captured, confirm order, decrement stock, clear cart.

    Returns True if this call was the one that flipped the order to confirmed
    (so the caller can send the invoice email). Safe to call repeatedly.
    """
    already_confirmed = order.status == "confirmed"
    payment.status = "captured"
    if already_confirmed:
        db.commit()
        return False

    order.status = "confirmed"
    for item in db.query(OrderItem).filter(OrderItem.order_id == order.id).all():
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock = max(0, product.stock - item.quantity)
    db.query(CartItem).filter(CartItem.user_id == order.user_id).delete()
    db.commit()
    return True


@router.post("/create-order", response_model=PaymentOrderResponse)
def create_payment_order(
    body: CreatePaymentOrder,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == body.order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "pending_payment":
        raise HTTPException(status_code=400, detail="Order is not awaiting payment")

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product and product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"{product.name} has only {product.stock} left in stock. Please update your order.",
            )

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway not configured. Please contact support.")

    client = get_razorpay_client()
    try:
        rz_order = client.order.create({
            "amount": int(order.total_amount * 100),  # paise
            "currency": "INR",
            "receipt": f"order_{order.id}",
        })
    except Exception:
        raise HTTPException(status_code=502, detail="Payment gateway error. Please try again later.")

    payment = Payment(
        order_id=order.id,
        razorpay_order_id=rz_order["id"],
        amount=order.total_amount,
        status="created",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return PaymentOrderResponse(
        razorpay_order_id=rz_order["id"],
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
        amount=int(order.total_amount * 100),
        currency="INR",
        order_id=order.id,
    )


@router.post("/verify", response_model=PaymentVerifyResponse)
def verify_payment(
    body: VerifyPayment,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    payment = db.query(Payment).filter(Payment.razorpay_order_id == body.razorpay_order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    order = db.query(Order).filter(Order.id == payment.order_id).first()
    if not order or order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    payment.razorpay_payment_id = body.razorpay_payment_id
    payment.razorpay_signature = body.razorpay_signature
    newly_confirmed = _finalize_paid_order(payment, order, db)

    if newly_confirmed:
        try:
            pdf = generate_invoice_pdf(order)
            send_order_confirmation(order, pdf)
        except Exception:
            logger.exception("Failed to send order confirmation email for order %s", order.id)

    return PaymentVerifyResponse(
        status="success",
        order_id=payment.order_id,
        message="Payment verified successfully",
    )


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Razorpay webhook receiver.

    Configure at Razorpay Dashboard → Settings → Webhooks. Subscribe to
    payment.captured and payment.failed at minimum; order.paid is also handled.
    """
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured")
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing signature header")

    raw_body = await request.body()
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = payload.get("event", "")
    entities = payload.get("payload", {})
    payment_entity = entities.get("payment", {}).get("entity") or {}
    order_entity = entities.get("order", {}).get("entity") or {}

    rz_order_id = payment_entity.get("order_id") or order_entity.get("id")
    if not rz_order_id:
        return {"status": "ignored", "reason": "no order id in payload"}

    payment = db.query(Payment).filter(Payment.razorpay_order_id == rz_order_id).first()
    if not payment:
        logger.warning("Webhook %s for unknown razorpay order %s", event, rz_order_id)
        return {"status": "ignored", "reason": "unknown order"}

    order = db.query(Order).filter(Order.id == payment.order_id).first()
    if not order:
        return {"status": "ignored", "reason": "order missing"}

    if event in ("payment.captured", "order.paid"):
        rz_payment_id = payment_entity.get("id")
        if rz_payment_id and not payment.razorpay_payment_id:
            payment.razorpay_payment_id = rz_payment_id
        newly_confirmed = _finalize_paid_order(payment, order, db)
        if newly_confirmed:
            try:
                pdf = generate_invoice_pdf(order)
                send_order_confirmation(order, pdf)
            except Exception:
                logger.exception("Failed to send order confirmation email for order %s", order.id)
    elif event == "payment.failed":
        if payment.status != "captured":
            payment.status = "failed"
            db.commit()
    else:
        return {"status": "ignored", "reason": f"unhandled event {event}"}

    return {"status": "ok", "event": event, "order_id": order.id}


@router.get("/admin/all")
def admin_list_payments(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    rows = (
        db.query(Payment, Order, User)
        .join(Order, Order.id == Payment.order_id)
        .join(User, User.id == Order.user_id)
        .order_by(Payment.created_at.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "order_id": p.order_id,
            "razorpay_order_id": p.razorpay_order_id,
            "razorpay_payment_id": p.razorpay_payment_id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "order_status": o.status,
            "order_total": o.total_amount,
            "user_email": u.email,
            "user_name": u.full_name,
        }
        for (p, o, u) in rows
    ]


@router.get("/admin/stats")
def admin_payment_stats(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    from sqlalchemy import func

    total = db.query(func.count(Payment.id)).scalar() or 0
    captured = db.query(func.count(Payment.id)).filter(Payment.status == "captured").scalar() or 0
    failed = db.query(func.count(Payment.id)).filter(Payment.status == "failed").scalar() or 0
    created = db.query(func.count(Payment.id)).filter(Payment.status == "created").scalar() or 0
    captured_amount = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == "captured")
        .scalar()
    )
    return {
        "total": total,
        "captured": captured,
        "failed": failed,
        "pending": created,
        "captured_amount": float(captured_amount),
    }
