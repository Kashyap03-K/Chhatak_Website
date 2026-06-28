from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from app.schemas.product import ProductOut


class OrderStatus(str, Enum):
    pending_payment = "pending_payment"
    confirmed = "confirmed"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float
    product: ProductOut

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    shipping_address: str = Field(..., min_length=1, max_length=1000)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderOut(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    shipping_address: str | None
    created_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}
