from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    compare_at_price = Column(Float, nullable=True)
    weight = Column(String(50), default="100g")
    image_url = Column(String(500), nullable=True)
    model_url = Column(String(500), nullable=True)
    category = Column(String(100), default="snacks")
    flavor = Column(String(100), nullable=True)
    stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
