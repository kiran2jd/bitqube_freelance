# BitQube Freelance — Operations & Incident Response Runbook

**Version:** 1.0  
**Target Environment:** DigitalOcean Production Droplet  
**Health Check Endpoint:** `/api/v1/health`  
**Logging Protocol:** Structured JSON via Uvicorn & Python logging  

---

## 1. System Telemetry & Health Checks

### 1.1 Health Check API
The backend exposes `/api/v1/health` to monitor service availability:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-19T18:00:00Z",
  "version": "1.0.0",
  "dependencies": {
    "database": "connected",
    "storage": "connected"
  }
}
```
If PostgreSQL is unreachable, the endpoint returns HTTP 503 with `"status": "degraded"`.

### 1.2 Resource Thresholds & Alerts
- **CPU Utilization:** Warning at > 75% for 5 mins; Critical at > 90% for 2 mins.
- **Memory (RAM):** Warning at > 80%; Critical at > 90% (risk of OOM killer).
- **Disk Usage:** Warning at > 75%; Critical at > 85%.
- **PostgreSQL Connection Pool:** Alert if active connections exceed 80% of `max_connections` (default 100).

---

## 2. Structured Logging & Log Management

All application logs are formatted as JSON lines to allow ingestion by tools like Promtail/Loki, Datadog, or DigitalOcean Log Management:

```json
{
  "timestamp": "2026-10-19T18:00:01.123Z",
  "level": "INFO",
  "logger": "app.services.payment_service",
  "request_id": "req-89a3-ff12",
  "actor_id": "c71e06d5-...",
  "message": "Payment confirmed via webhook",
  "payment_id": "90e21a00-...",
  "amount": "500.00",
  "currency": "USD"
}
```

### Log Inspection Commands
```bash
# View live backend logs
docker compose -f deploy/docker-compose.prod.yml logs -f --tail=200 backend

# View live Caddy access & error logs
docker compose -f deploy/docker-compose.prod.yml logs -f --tail=200 caddy

# Search for specific request ID in logs
docker compose -f deploy/docker-compose.prod.yml logs backend | grep "req-89a3-ff12"
```

---

## 3. Incident Response Playbooks

### 3.1 Database Connection Pool Exhaustion
**Symptoms:** HTTP 500 responses with `TimeoutError: QueuePool limit of size 20 overflow 10 reached`.
**Remediation:**
1. Check active database connections:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml exec postgres \
     psql -U postgres -d bitqube_prod -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
   ```
2. Identify long-running idle transactions:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml exec postgres \
     psql -U postgres -d bitqube_prod -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 5;"
   ```
3. Terminate stuck backend connections or restart backend service:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml restart backend
   ```

### 3.2 Failed Payment Webhook Replay
**Symptoms:** Customer funded milestone, but status remains `initiated` in UI due to temporary network glitch during provider callback.
**Remediation:**
1. Locate payment record in database by customer ID or email:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml exec backend \
     python -m app.cli.reconcile_payment --payment-id <PAYMENT_ID>
   ```
2. The CLI queries the payment provider API directly (`stripe.PaymentIntent.retrieve`), verifies authoritative status, executes the ledger entry, and transitions milestone to `funded`.

### 3.3 Storage Disk Space Exhaustion
**Symptoms:** Uploads fail with `IOError: No space left on device`.
**Remediation:**
1. Prune dangling Docker containers and images:
   ```bash
   docker system prune -af --volumes=false
   ```
2. Clear old system logs:
   ```bash
   journalctl --vacuum-time=3d
   ```
