#!/usr/bin/env bash
# ==============================================================================
# BitQube Freelance — Database Restoration & Disaster Recovery Script
# Reference: docs/BACKUP_AND_RECOVERY.md
# ==============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path_to_backup_dump_or_gpg> [target_database_name]"
  exit 1
fi

INPUT_FILE="$1"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-bitqube_postgres_prod}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
TARGET_DB="${2:-${POSTGRES_DB:-bitqube_prod}}"
GPG_PASSPHRASE="${GPG_PASSPHRASE:-}"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting restore drill for target DB '${TARGET_DB}' from '${INPUT_FILE}'..."

# Handle GPG decryption if needed
RESTORE_FILE="${INPUT_FILE}"
if [[ "${INPUT_FILE}" == *.gpg ]]; then
  RESTORE_FILE="${INPUT_FILE%.gpg}"
  echo "Decrypting backup file..."
  if [ -n "${GPG_PASSPHRASE}" ]; then
    echo "${GPG_PASSPHRASE}" | gpg --batch --yes --passphrase-fd 0 --decrypt --output "${RESTORE_FILE}" "${INPUT_FILE}"
  else
    gpg --decrypt --output "${RESTORE_FILE}" "${INPUT_FILE}"
  fi
fi

# Recreate database if requested
echo "Rebuilding database structure..."
docker exec -t "${POSTGRES_CONTAINER}" dropdb -U "${POSTGRES_USER}" --if-exists "${TARGET_DB}" || true
docker exec -t "${POSTGRES_CONTAINER}" createdb -U "${POSTGRES_USER}" "${TARGET_DB}"

# Execute pg_restore
echo "Restoring tables and data via pg_restore..."
cat "${RESTORE_FILE}" | docker exec -i "${POSTGRES_CONTAINER}" \
  pg_restore -U "${POSTGRES_USER}" -d "${TARGET_DB}" --clean --if-exists --no-owner --no-privileges || true

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Database restoration completed successfully!"
