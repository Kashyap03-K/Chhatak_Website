from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

connect_args = {}
engine_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif "pooler.supabase.com" in settings.DATABASE_URL and ":6543" in settings.DATABASE_URL:
    # Supabase's transaction pooler (Supavisor, port 6543) hands out short-lived
    # connections and does not preserve session state across queries. Disable
    # SQLAlchemy's client-side pool so we don't stack pools on top of each other.
    engine_kwargs["poolclass"] = NullPool
elif "pooler.supabase.com" in settings.DATABASE_URL:
    # Session pooler (port 5432) preserves session state — a normal pool is fine.
    engine_kwargs["pool_pre_ping"] = True
else:
    # Standard Postgres — modest pool with pre-ping for resilience.
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
