from datetime import datetime

from pydantic import BaseModel

from app.schemas.product import ProductOut


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float
    product: ProductOut

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    shipping_address: str


class OrderStatusUpdate(BaseModel):
    status: str


class OrderOut(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    shipping_address: str | None
    created_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}
