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
print('Database tables created.')
"

echo "Seeding products if empty..."
python seed.py || echo "WARNING: seed.py failed, continuing anyway"

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
