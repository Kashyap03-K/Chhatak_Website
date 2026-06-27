import hmac
import hashlib

import razorpay
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.payment import Payment
from app.schemas.payment import CreatePaymentOrder, PaymentOrderResponse, VerifyPayment, PaymentVerifyResponse

router = APIRouter(prefix="/payments", tags=["payments"])


def get_razorpay_client() -> razorpay.Client:
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


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

    client = get_razorpay_client()
    rz_order = client.order.create({
        "amount": int(order.total_amount * 100),  # paise
        "currency": "INR",
        "receipt": f"order_{order.id}",
    })

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

    if expected_signature != body.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    payment = db.query(Payment).filter(Payment.razorpay_order_id == body.razorpay_order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    payment.razorpay_payment_id = body.razorpay_payment_id
    payment.razorpay_signature = body.razorpay_signature
    payment.status = "captured"

    order = db.query(Order).filter(Order.id == payment.order_id).first()
    if order:
        order.status = "confirmed"

    db.commit()

    return PaymentVerifyResponse(
        status="success",
        order_id=payment.order_id,
        message="Payment verified successfully",
    )
