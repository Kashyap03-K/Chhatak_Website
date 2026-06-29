#!/bin/bash
set -e

echo "Running database migrations..."
python -c "
from app.core.database import engine, Base
import app.models
Base.metadata.create_all(bind=engine)
print('Database tables created.')
"

echo "Seeding products if empty..."
python seed.py || true

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
