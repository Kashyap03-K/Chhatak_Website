"""Seed the database with initial product data and an admin user."""
from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User
from app.models.product import Product

import app.models  # noqa: F401


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if not db.query(User).filter(User.email == "admin@chhatak.co").first():
        admin = User(
            name="Chhatak Admin",
            email="admin@chhatak.co",
            password_hash=hash_password("admin123"),
            is_admin=True,
        )
        db.add(admin)
        print("Created admin user: admin@chhatak.co / admin123")

    products = [
        {
            "name": "Indian Classic",
            "slug": "indian-classic",
            "description": "The original. Crispy, spicy, unmistakably coastal. A century-old Konkan recipe.",
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

    db.commit()
    db.close()
    print("Seed complete.")


if __name__ == "__main__":
    seed()
