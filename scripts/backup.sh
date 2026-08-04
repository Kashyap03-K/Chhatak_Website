#!/usr/bin/env bash
# Nightly Postgres backup — dumps chhatak DB, compresses, keeps last 14 days.
# Run via cron. Assumes docker-compose.prod.yml is one directory above.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${REPO_DIR}/backups"
KEEP_DAYS=14
STAMP="$(date +%Y-%m-%d_%H%M%S)"
OUT="${BACKUP_DIR}/chhatak_${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
cd "$REPO_DIR"

# Read POSTGRES_* from root .env
set -a
# shellcheck disable=SC1091
source .env
set +a

docker compose -f docker-compose.prod.yml exec -T db \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl \
  | gzip > "$OUT"

# Sanity: file must be non-trivial (empty/failed dumps are ~20 bytes gzipped)
if [ "$(stat -c%s "$OUT")" -lt 100 ]; then
    echo "ERROR: backup file suspiciously small, removing: $OUT" >&2
    rm -f "$OUT"
    exit 1
fi

# Rotate: delete backups older than KEEP_DAYS
find "$BACKUP_DIR" -name 'chhatak_*.sql.gz' -type f -mtime +${KEEP_DAYS} -delete

echo "OK: $OUT ($(du -h "$OUT" | cut -f1))"
