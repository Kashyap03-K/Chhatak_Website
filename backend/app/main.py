import logging
import os
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.api.routes import auth, products, cart, orders, payments, addresses, content, landing, newsletter

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(title=settings.PROJECT_NAME, docs_url="/api/docs", redoc_url="/api/redoc")
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    return response

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(products.router, prefix=settings.API_V1_PREFIX)
app.include_router(cart.router, prefix=settings.API_V1_PREFIX)
app.include_router(orders.router, prefix=settings.API_V1_PREFIX)
app.include_router(payments.router, prefix=settings.API_V1_PREFIX)
app.include_router(addresses.router, prefix=settings.API_V1_PREFIX)
app.include_router(content.reviews_router, prefix=settings.API_V1_PREFIX)
app.include_router(landing.router, prefix=settings.API_V1_PREFIX)
app.include_router(landing.uploads_router, prefix=settings.API_V1_PREFIX)
app.include_router(newsletter.router, prefix=settings.API_V1_PREFIX)

# Serve uploaded images at /uploads/<file>
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.on_event("startup")
def on_startup():
    from sqlalchemy import inspect, text
    from app.core.database import engine, Base
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Lightweight column migrations for existing SQLite/Postgres tables
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    false_default = "0" if is_sqlite else "FALSE"
    if "users" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("users")}
        with engine.begin() as conn:
            if "email_verified" not in cols:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT {false_default} NOT NULL"))
            if "verification_token" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN verification_token VARCHAR(64)"))
    if "orders" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("orders")}
        with engine.begin() as conn:
            if "payment_method" not in cols:
                conn.execute(text("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT 'razorpay'"))
    if "section_images" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("section_images")}
        with engine.begin() as conn:
            if "media_type" not in cols:
                conn.execute(text("ALTER TABLE section_images ADD COLUMN media_type VARCHAR(16) DEFAULT 'image' NOT NULL"))
            if "sound_on" not in cols:
                conn.execute(text(f"ALTER TABLE section_images ADD COLUMN sound_on BOOLEAN DEFAULT {false_default} NOT NULL"))
    if "landing_sections" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("landing_sections")}
        with engine.begin() as conn:
            if "full_viewport" not in cols:
                conn.execute(text(f"ALTER TABLE landing_sections ADD COLUMN full_viewport BOOLEAN DEFAULT {false_default} NOT NULL"))
    # Drop the legacy reels table if it lingers from a previous deploy.
    if "reels" in inspector.get_table_names():
        with engine.begin() as conn:
            conn.execute(text("DROP TABLE reels"))

    # Seed default landing sections + starter images
    from app.core.database import SessionLocal
    from app.models.landing import LandingSection, SectionImage
    db = SessionLocal()
    try:
        # Ensure the new built-in section keys exist, in the order the coastal landing renders them.
        new_defaults = [
            ("hero",         "Hero",             "Product visual + intro."),
            ("features",     "Feature Strip",    "Five short brand promises."),
            ("story",        "Story Banner",     "Born on the coast."),
            ("flavours",     "Flavours",         "Bold flavours. Coastal soul."),
            ("perfect-with", "Perfect With",     "When to snack Chhatak."),
            ("why",          "Why Chhatak",      "Not just a snack."),
            ("reviews",      "Reviews",          "What people say."),
            ("gallery",      "Journey Gallery",  "@chhatak.crunch"),
            ("footer",       "Footer",           None),
        ]
        existing_keys = {s.key for s in db.query(LandingSection).all()}
        max_order = (db.query(LandingSection).order_by(LandingSection.sort_order.desc()).first().sort_order + 1) if existing_keys else 0
        for i, (key, title, subtitle) in enumerate(new_defaults):
            if key not in existing_keys:
                db.add(LandingSection(
                    key=key, kind="builtin", title=title, subtitle=subtitle,
                    sort_order=(i if not existing_keys else max_order + i), is_active=True,
                ))
        db.commit()

        # One-time migration: the hero used to hold 9 Coastal Story scenes.
        # The new hero shows pack + bowl. If the hero section still contains
        # the old scene URLs, wipe them so the pack+bowl seed can populate it.
        hero_sec = db.query(LandingSection).filter(LandingSection.key == "hero").first()
        if hero_sec:
            hero_imgs = db.query(SectionImage).filter(SectionImage.section_id == hero_sec.id).all()
            has_scenes = any("/images/scene" in (img.image_url or "") for img in hero_imgs)
            if has_scenes:
                for img in hero_imgs:
                    db.delete(img)
                db.commit()

        # Seed starter images for image-bearing sections that are empty.
        def seed_images(key, items):
            section = db.query(LandingSection).filter(LandingSection.key == key).first()
            if not section:
                return
            if db.query(SectionImage).filter(SectionImage.section_id == section.id).count() > 0:
                return
            for i, (url, kicker, title, body) in enumerate(items):
                db.add(SectionImage(
                    section_id=section.id, image_url=url,
                    kicker=kicker, title=title, body=body, sort_order=i,
                ))

        seed_images("hero", [
            ("/images/packaging-real.JPG", "PACK",  "Indian Classic", "Front-facing product pack for the hero visual."),
            ("/images/bowl.JPG",           "BOWL",  "Ready to snack", "Bowl of Chhatak that sits below the pack."),
        ])
        seed_images("story", [
            ("/images/scene 1.png", "OUR STORY", "Fishermen at dawn in Diu",
             "Wide banner image that anchors the yellow story card. Replace to change the mood."),
        ])
        seed_images("perfect-with", [
            ("/images/bowl.JPG", "WITH DRINKS",   "With Drinks",   "The ultimate bar companion."),
            ("/images/bowl.JPG", "WITH MEALS",    "With Meals",    "Add a crunchy coastal twist."),
            ("/images/bowl.JPG", "DURING TRAVEL", "During Travel", "Light, tasty & easy to carry."),
            ("/images/bowl.JPG", "MOVIE NIGHTS",  "Movie Nights",  "Crunch that steals the show."),
        ])
        seed_images("gallery", [
            ("/images/scene 5.png",         "",       "",                    ""),
            ("/images/bowl.JPG",            "",       "",                    ""),
            ("/images/scene 3.png",         "",       "",                    ""),
            ("/images/scene 8.png",         "",       "",                    ""),
            ("/images/scene 4.png",         "",       "",                    ""),
            ("/images/fort.png",            "",       "",                    ""),
            ("/images/packaging-real.JPG",  "",       "",                    ""),
        ])
        db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "chhatak-api"}
