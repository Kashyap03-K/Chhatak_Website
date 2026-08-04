"""One-off: copy every row from the local SQLite DB into a target Postgres DB.

Usage:
    # From the backend/ directory, with venv active
    python migrate_local_to_prod.py \\
        --src sqlite:///./chhatak.db \\
        --dst "postgresql://postgres.xxx:PASS@aws-1-...pooler.supabase.com:5432/postgres?sslmode=require"

Safe to run against an empty target. If the target already has rows for a
given table, this script will SKIP that table (to avoid duplicate PKs).
Pass --force to truncate the target table before inserting.
"""
import argparse
import sys

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# All models must be imported so Base.metadata knows about them.
from app.core.database import Base
import app.models  # noqa: F401
from app.models.user import User
from app.models.product import Product
from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.address import Address
from app.models.content import Reel, Review
from app.models.landing import LandingSection, SectionImage

# Copy order matters: parents before children (FK constraints).
COPY_ORDER = [
    User,
    Address,
    Product,
    CartItem,
    Order,
    OrderItem,
    Payment,
    Reel,
    Review,
    LandingSection,
    SectionImage,
]


def row_to_dict(row):
    return {c.name: getattr(row, c.name) for c in row.__table__.columns}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="Source DB URL (usually sqlite:///./chhatak.db)")
    ap.add_argument("--dst", required=True, help="Destination DB URL (Supabase Postgres)")
    ap.add_argument("--force", action="store_true", help="Truncate target tables before copying")
    args = ap.parse_args()

    src_engine = create_engine(args.src, connect_args={"check_same_thread": False} if args.src.startswith("sqlite") else {})
    dst_engine = create_engine(args.dst)

    print(f"Source: {args.src}")
    print(f"Target: {args.dst.split('@')[-1] if '@' in args.dst else args.dst}")
    print()

    # Ensure destination tables exist.
    Base.metadata.create_all(bind=dst_engine)

    SrcSession = sessionmaker(bind=src_engine)
    DstSession = sessionmaker(bind=dst_engine)

    with SrcSession() as src, DstSession() as dst:
        for Model in COPY_ORDER:
            table = Model.__tablename__
            src_rows = src.query(Model).all()
            if not src_rows:
                print(f"  [skip] {table}: no rows in source")
                continue

            existing = dst.query(Model).count()
            if existing > 0 and not args.force:
                print(f"  [skip] {table}: target already has {existing} rows (use --force to overwrite)")
                continue

            if args.force and existing > 0:
                print(f"  [wipe] {table}: deleting {existing} existing rows")
                dst.query(Model).delete()
                dst.commit()

            print(f"  [copy] {table}: {len(src_rows)} rows -> target")
            for row in src_rows:
                data = row_to_dict(row)
                dst.add(Model(**data))
            dst.commit()

    print("\nDone.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
