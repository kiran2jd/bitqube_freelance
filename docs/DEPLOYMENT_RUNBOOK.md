# BitQube Freelance — DigitalOcean Deployment Runbook

**Version:** 1.0  
**Target Environment:** DigitalOcean Droplet (Docker Compose Architecture)  
**Operating System:** Ubuntu 24.04 LTS x64  
**Ingress & TLS:** Caddy Server (Automated HTTPS via Let's Encrypt)  
**Database:** PostgreSQL 16 (Private Container Network -> Managed Database Migration Path)  
**Object Storage:** DigitalOcean Spaces (S3-Compatible)  

---

## 1. Droplet Sizing & Infrastructure Requirements

### Recommended Minimum Specifications (MVP)
- **Droplet Type:** Basic or General Purpose Droplet
- **vCPU:** 2 vCPU
- **RAM:** 4 GB (provides buffer for PostgreSQL buffer pool + Python uvicorn workers)
- **Disk:** 50 GB NVMe SSD
- **Datacenter Region:** Bangalore (BLR1) / Frankfurt (FRA1) / New York (NYC1) based on target primary users
- **DigitalOcean Spaces Bucket:** 1 private bucket (e.g. `bitqube-documents-prod`) in the same region
- **DigitalOcean Cloud Firewall:** Allow inbound ports `22` (SSH - restricted to admin IP), `80` (HTTP), `443` (HTTPS). Block all external access to `5432`.

---

## 2. Production Docker Architecture

```text
Host Droplet (Ubuntu 24.04)
├── Caddy (Port 80/443 Public)
│   ├── Serves React 19 SPA static assets (/var/www/html)
│   └── Reverse proxies /api/* -> backend:8000
├── backend (FastAPI, Port 8000 Internal Only)
│   └── Multi-worker Uvicorn + Python 3.12+
└── postgres (PostgreSQL 16, Port 5432 Internal Only)
    └── Docker persistent volume: postgres_data
```

---

## 3. Initial Server Setup Instructions

### 3.1 Provisioning the Droplet
1. SSH into the server:
   ```bash
   ssh root@<DROPLET_IP>
   ```
2. Update packages and configure basic security:
   ```bash
   apt update && apt upgrade -y
   apt install -y curl git ufw fail2ban jq
   ufw default deny incoming
   ufw default allow outgoing
   ufw allow ssh
   ufw allow http
   ufw allow https
   ufw --force enable
   ```
3. Install Docker Engine & Compose v2:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   systemctl enable --now docker
   ```

### 3.2 Application Deployment
1. Create application directory and clone repository:
   ```bash
   mkdir -p /opt/bitqube && cd /opt/bitqube
   git clone <REPO_URL> .
   ```
2. Populate `/opt/bitqube/.env` with production secrets:
   ```bash
   cp .env.example .env
   chmod 600 .env
   # Edit secrets: POSTGRES_PASSWORD, SECRET_KEY, STRIPE_SECRET_KEY, SPACES_SECRET_KEY, etc.
   nano .env
   ```
3. Launch services via Docker Compose:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml up -d --build
   ```
4. Execute initial database migrations and seeds:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml exec backend alembic upgrade head
   docker compose -f deploy/docker-compose.prod.yml exec backend python -m app.db.seed
   ```

---

## 4. Production Caddy Configuration

File: `deploy/Caddyfile`
```caddy
{
    email admin@bitqube.org
}

bitqube.org, www.bitqube.org {
    encode zstd gzip

    # Strict Security Headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    }

    # API Reverse Proxy
    handle /api/* {
        reverse_proxy backend:8000 {
            header_up X-Forwarded-Proto {scheme}
            header_up X-Real-IP {remote_host}
        }
    }

    # React 19 SPA Frontend
    handle {
        root * /var/www/html
        try_files {path} /index.html
        file_server
    }
}
```

---

## 5. Maintenance, Updates & Rollback

### Deploying New Code (Zero-Downtime Migration)
```bash
cd /opt/bitqube
git pull origin main
docker compose -f deploy/docker-compose.prod.yml build backend frontend
docker compose -f deploy/docker-compose.prod.yml exec backend alembic upgrade head
docker compose -f deploy/docker-compose.prod.yml up -d --no-deps backend frontend
```

### Rollback Procedure
If a breaking regression occurs:
1. Revert Git commit:
   ```bash
   git checkout <PREVIOUS_STABLE_COMMIT_SHA>
   ```
2. Re-apply schema migration downgrade if required:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml exec backend alembic downgrade -1
   ```
3. Rebuild and restart containers:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml up -d --build
   ```

---

## 6. Migration Path: DigitalOcean Managed PostgreSQL
When workload scales beyond 1,000 active concurrent users:
1. Provision a DigitalOcean Managed Database (PostgreSQL 16) in the same VPC.
2. Place app in maintenance mode: `touch /var/www/html/maintenance.html`.
3. Export data: `pg_dump -Fc bitqube_prod > bitqube_backup.dump`.
4. Restore to Managed Database: `pg_restore -d <MANAGED_DB_URL> bitqube_backup.dump`.
5. Update `DATABASE_URL` in `/opt/bitqube/.env` to point to the managed cluster over private VPC.
6. Restart backend: `docker compose -f deploy/docker-compose.prod.yml restart backend`.
7. Decommission containerized postgres service from `docker-compose.prod.yml`.
