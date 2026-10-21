#!/usr/bin/env bash
# ==============================================================================
# BitQube Freelance — Automated Production Database Backup Script
# Reference: docs/BACKUP_AND_RECOVERY.md
# ==============================================================================
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/var/backups/bitqube}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-bitqube_postgres_prod}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-bitqube_prod}"
BACKUP_FILE="${BACKUP_DIR}/bitqube_${POSTGRES_DB}_${TIMESTAMP}.dump"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
GPG_PASSPHRASE="${GPG_PASSPHRASE:-}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting logical PostgreSQL backup of database '${POSTGRES_DB}'..."

# Execute pg_dump in compressed custom format (-Fc)
docker exec -t "${POSTGRES_CONTAINER}" \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc > "${BACKUP_FILE}"

FILESIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Dump generated successfully: ${BACKUP_FILE} (${FILESIZE} bytes)"

# Optional AES-256 symmetric encryption if GPG passphrase is provided
if [ -n "${GPG_PASSPHRASE}" ]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Encrypting dump with GPG AES-256..."
  echo "${GPG_PASSPHRASE}" | gpg --batch --yes --passphrase-fd 0 --symmetric --cipher-algo AES256 \
    --output "${ENCRYPTED_FILE}" "${BACKUP_FILE}"
  rm -f "${BACKUP_FILE}"
  TARGET_FILE="${ENCRYPTED_FILE}"
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Encryption completed: ${TARGET_FILE}"
else
  TARGET_FILE="${BACKUP_FILE}"
fi

# Upload to S3/DigitalOcean Spaces if S3 bucket is configured
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Uploading ${TARGET_FILE} to ${BACKUP_S3_BUCKET}..."
  if command -v aws >/dev/null 2>&1; then
    aws s3 cp "${TARGET_FILE}" "${BACKUP_S3_BUCKET}/"
  elif command -v s3cmd >/dev/null 2>&1; then
    s3cmd put "${TARGET_FILE}" "${BACKUP_S3_BUCKET}/"
  fi
fi

# Cleanup dumps older than 30 days
find "${BACKUP_DIR}" -name "bitqube_*.dump*" -mtime +30 -delete
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup process finished cleanly."
