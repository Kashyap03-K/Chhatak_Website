#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Pulling latest code..."
git pull --ff-only

echo "==> Building and starting containers..."
docker compose -f docker-compose.prod.yml up -d --build

echo "==> Cleaning old images..."
docker image prune -f

echo "==> Deployed. Status:"
docker compose -f docker-compose.prod.yml ps
