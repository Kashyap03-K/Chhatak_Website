from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class LandingSection(Base):
    __tablename__ = "landing_sections"

    id = Column(Integer, primary_key=True, index=True)
    # Stable identifier: built-ins use fixed keys ("hero", "products", "reels",
    # "reviews", "story", "specs", "quote"). Custom galleries use "gallery-<n>".
    key = Column(String(64), unique=True, nullable=False)
    kind = Column(String(32), nullable=False, default="builtin")  # builtin | gallery
    title = Column(String(200), nullable=True)
    subtitle = Column(String(500), nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    full_viewport = Column(Boolean, default=False, nullable=False, server_default="false")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    images = relationship(
        "SectionImage",
        back_populates="section",
        cascade="all, delete-orphan",
        order_by="SectionImage.sort_order",
    )


class SectionImage(Base):
    __tablename__ = "section_images"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("landing_sections.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)  # image OR video URL
    media_type = Column(String(16), nullable=False, default="image")  # image | video
    kicker = Column(String(120), nullable=True)
    title = Column(String(200), nullable=True)
    body = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    section = relationship("LandingSection", back_populates="images")
