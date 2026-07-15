import logging

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.api.routes import auth, products, cart, orders, payments, addresses, content

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
app.include_router(content.reels_router, prefix=settings.API_V1_PREFIX)
app.include_router(content.reviews_router, prefix=settings.API_V1_PREFIX)


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


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "chhatak-api"}
