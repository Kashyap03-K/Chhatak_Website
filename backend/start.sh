#!/bin/bash
set -e

echo "Running database migrations..."
python -c "
from sqlalchemy import text
from app.core.database import engine, Base
import app.models
Base.metadata.create_all(bind=engine)
# Idempotent column additions for existing tables
with engine.begin() as conn:
    conn.execute(text('ALTER TABLE landing_sections ADD COLUMN IF NOT EXISTS full_viewport BOOLEAN NOT NULL DEFAULT false'))
    conn.execute(text('ALTER TABLE products ADD COLUMN IF NOT EXISTS long_description TEXT'))
    conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(64)'))
    conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP'))
    conn.execute(text('ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0'))
    conn.execute(text('CREATE INDEX IF NOT EXISTS ix_products_sort_order ON products (sort_order)'))
    conn.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS ix_users_password_reset_token ON users (password_reset_token)'))
    # Seed default shipping rules so admin has rows to edit on day one
    conn.execute(text(\"INSERT INTO shipping_config (payment_method, amount, free_above) VALUES ('cod', 49, 499), ('online', 0, 0) ON CONFLICT (payment_method) DO NOTHING\"))
print('Database tables created.')
"

echo "Seeding products if empty..."
python seed.py || echo "WARNING: seed.py failed, continuing anyway"

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
