# BitQube Freelance — Backup & Disaster Recovery Strategy

**Version:** 1.0  
**Target RPO (Recovery Point Objective):** < 1 Hour  
**Target RTO (Recovery Time Objective):** < 2 Hours  
**Primary Database:** PostgreSQL 16 (DigitalOcean Droplet / Managed Database)  
**Offsite Backup Storage:** DigitalOcean Spaces (S3-Compatible) with GPG Encryption  

---

## 1. Backup Strategy Overview

To safeguard financial ledger data, user agreements, and transactional history, BitQube Freelance uses an automated, encrypted, multi-tier backup strategy:

1. **Daily Full Logical Backups:** Scheduled nightly `pg_dump` execution in custom compressed format (`-Fc`).
2. **Encrypted Offsite Replication:** Dumps are compressed, encrypted using AES-256 / GPG with a key stored outside the Droplet, and streamed directly to a separate DigitalOcean Spaces bucket.
3. **Continuous Document Durability:** User deliverables, contracts, and credentials reside in DigitalOcean Spaces with bucket versioning enabled.
4. **Retention Schedule:**
   - Daily backups retained for **30 days**.
   - Weekly snapshots retained for **12 weeks**.
   - Monthly compliance archives retained for **7 years** (for tax & financial auditing).

---

## 2. Automated Backup Execution Script

File: `deploy/scripts/backup.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/postgres"
BACKUP_FILE="${BACKUP_DIR}/bitqube_backup_${TIMESTAMP}.dump"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
S3_BUCKET="s3://bitqube-backups-secure/database"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting PostgreSQL database backup..."
docker compose -f /opt/bitqube/deploy/docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres -d bitqube_prod -Fc > "${BACKUP_FILE}"

echo "[$(date)] Encrypting backup with GPG..."
gpg --batch --yes --encrypt --recipient "${BACKUP_GPG_RECIPIENT}" \
  --output "${ENCRYPTED_FILE}" "${BACKUP_FILE}"

echo "[$(date)] Uploading encrypted backup to DigitalOcean Spaces..."
s3cmd put "${ENCRYPTED_FILE}" "${S3_BUCKET}/"

echo "[$(date)] Cleaning up local temporary unencrypted dump..."
rm -f "${BACKUP_FILE}"

# Remove encrypted local backups older than 7 days
find "${BACKUP_DIR}" -name "*.dump.gpg" -mtime +7 -delete

echo "[$(date)] Backup completed successfully."
```

---

## 3. Disaster Recovery & Restoration Runbook

In the event of total server loss, disk corruption, or unintended data corruption:

### Step 1: Provision Replacement Droplet
Deploy a fresh Ubuntu 24.04 Droplet and install Docker following [`docs/DEPLOYMENT_RUNBOOK.md`](file:///c:/Users/PathipatiKirankumar/personal/Projects/BITQUBE%20Freelance%20Website-2026/BITQUBE%20Freelance%20Website/docs/DEPLOYMENT_RUNBOOK.md).

### Step 2: Download & Decrypt Backup
```bash
# Retrieve latest encrypted dump from DigitalOcean Spaces
s3cmd get s3://bitqube-backups-secure/database/bitqube_backup_YYYYMMDD_HHMMSS.dump.gpg /tmp/restore.dump.gpg

# Decrypt using the disaster recovery GPG private key
gpg --decrypt --output /tmp/restore.dump /tmp/restore.dump.gpg
```

### Step 3: Restore Database Schema & Data
```bash
# Ensure postgres container is running
docker compose -f /opt/bitqube/deploy/docker-compose.prod.yml up -d postgres

# Drop existing database and restore fresh
docker compose -f /opt/bitqube/deploy/docker-compose.prod.yml exec -T postgres \
  dropdb -U postgres --if-exists bitqube_prod

docker compose -f /opt/bitqube/deploy/docker-compose.prod.yml exec -T postgres \
  createdb -U postgres bitqube_prod

cat /tmp/restore.dump | docker compose -f /opt/bitqube/deploy/docker-compose.prod.yml exec -T postgres \
  pg_restore -U postgres -d bitqube_prod --clean --if-exists --no-owner
```

### Step 4: Verification & Integrity Audit
```bash
# Verify ledger balancing
docker compose -f /opt/bitqube/deploy/docker-compose.prod.yml exec -T backend \
  python -m app.services.ledger_audit

# Remove temporary decrypted dump
rm -f /tmp/restore.dump /tmp/restore.dump.gpg
```

### Step 5: Start Application Services
```bash
docker compose -f /opt/bitqube/deploy/docker-compose.prod.yml up -d
```
