"""Seed the database with initial product data and an admin user."""
import os

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User
from app.models.product import Product
from app.models.content import Review

import app.models  # noqa: F401


ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@chhatak.co")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@2026")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Chhatak Admin")


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if admin is None:
        admin = User(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            is_admin=True,
        )
        db.add(admin)
        print(f"Created admin user: {ADMIN_EMAIL}")
    else:
        admin.password_hash = hash_password(ADMIN_PASSWORD)
        admin.is_admin = True
        print(f"Updated admin credentials: {ADMIN_EMAIL}")

    products = [
        {
            "name": "Indian Classic",
            "slug": "indian-classic",
            "description": "The original. Crispy, spicy, unmistakably coastal. A century-old Diu recipe.",
            "price": 199.0,
            "compare_at_price": None,
            "weight": "100g",
            "model_url": "/models/chhatak.glb",
            "flavor": "Indian Classic",
            "stock": 100,
            "is_active": True,
            "is_featured": True,
        },
        {
            "name": "Peri Peri Blaze",
            "slug": "peri-peri-blaze",
            "description": "African heat meets Indian coast. For the brave.",
            "price": 219.0,
            "compare_at_price": None,
            "weight": "100g",
            "model_url": "/models/chhatak.glb",
            "flavor": "Peri Peri Blaze",
            "stock": 80,
            "is_active": True,
            "is_featured": True,
        },
        {
            "name": "Mint & Lime",
            "slug": "mint-lime",
            "description": "Cool, tangy, refreshingly different.",
            "price": 219.0,
            "compare_at_price": None,
            "weight": "100g",
            "model_url": "/models/chhatak.glb",
            "flavor": "Mint & Lime",
            "stock": 0,
            "is_active": False,
            "is_featured": False,
        },
        {
            "name": "Combo Pack — 3x Indian Classic",
            "slug": "combo-3x-classic",
            "description": "Pack of three Indian Classic pouches. 100g each.",
            "price": 549.0,
            "compare_at_price": 699.0,
            "weight": "300g",
            "model_url": "/models/chhatak.glb",
            "flavor": "Indian Classic",
            "stock": 50,
            "is_active": True,
            "is_featured": True,
        },
    ]

    for p in products:
        if not db.query(Product).filter(Product.slug == p["slug"]).first():
            db.add(Product(**p))
            print(f"Created product: {p['name']}")

    reviews = [
        {"author": "Aarti Kulkarni", "location": "Mumbai, MH",  "rating": 5,
         "quote": "Tastes exactly like the bombil my nani used to make. Finished the pouch before dinner.",
         "sort_order": 1},
        {"author": "Rohan Mehta",    "location": "Bengaluru, KA", "rating": 5,
         "quote": "The crunch is unreal. Perfect with an evening chai — one pouch is genuinely never enough.",
         "sort_order": 2},
        {"author": "Priya Nair",     "location": "Diu, DD",       "rating": 5,
         "quote": "Grew up in Diu — this is the closest anything store-bought has come to the real thing.",
         "sort_order": 3},
        {"author": "Ishaan Shah",    "location": "Ahmedabad, GJ", "rating": 4,
         "quote": "Spice level is spot-on for the Classic. Ordered the combo, kept two for myself.",
         "sort_order": 4},
    ]
    for rv in reviews:
        if not db.query(Review).filter(Review.author == rv["author"]).first():
            db.add(Review(**rv))
            print(f"Created review: {rv['author']}")

    db.commit()
    db.close()
    print("Seed complete.")


if __name__ == "__main__":
    seed()
