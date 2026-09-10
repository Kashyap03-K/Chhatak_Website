from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime

from app.core.database import Base


class ShippingConfig(Base):
    """One row per payment method (cod, online).

    amount is charged when order subtotal < free_above. If free_above == 0, the
    threshold is disabled and amount is always charged.
    """
    __tablename__ = "shipping_config"

    id = Column(Integer, primary_key=True, index=True)
    payment_method = Column(String(20), unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    free_above = Column(Float, nullable=False, default=0.0)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
