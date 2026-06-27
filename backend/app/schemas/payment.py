from pydantic import BaseModel


class CreatePaymentOrder(BaseModel):
    order_id: int


class PaymentOrderResponse(BaseModel):
    razorpay_order_id: str
    razorpay_key_id: str
    amount: int
    currency: str
    order_id: int


class VerifyPayment(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentVerifyResponse(BaseModel):
    status: str
    order_id: int
    message: str
