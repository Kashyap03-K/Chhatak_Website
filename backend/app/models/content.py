from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime

from app.core.database import Base


class Reel(Base):
    __tablename__ = "reels"

    id = Column(Integer, primary_key=True, index=True)
    shortcode = Column(String(64), unique=True, nullable=True)
    video_url = Column(String(500), nullable=True)
    poster_url = Column(String(500), nullable=True)
    caption = Column(String(280), nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    author = Column(String(120), nullable=False)
    handle = Column(String(120), nullable=True)
    location = Column(String(120), nullable=True)
    rating = Column(Integer, default=5)
    quote = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
