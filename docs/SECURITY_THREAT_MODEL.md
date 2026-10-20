# BitQube Freelance — Security Architecture & STRIDE Threat Model

**Version:** 1.0  
**Methodology:** Microsoft STRIDE & OWASP Top 10 (2021)  
**Classification:** Financial & Professional Services Marketplace  
**Review Status:** Pre-Implementation Baseline  

---

## 1. Security Architecture Principles

1. **Defense in Depth:** Security controls are layered across network, host, reverse proxy (Caddy), application middleware, domain services, database constraints, and external storage.
2. **Principle of Least Privilege:** Database roles, S3 IAM credentials, and user role tokens possess strictly minimal required permissions.
3. **Fail Closed:** Any authorization uncertainty, signature failure, or currency mismatch immediately aborts execution and logs a security event.
4. **Zero Trust File Handling:** All user-uploaded documents (resumes, contracts, licenses, deliverables) are treated as untrusted binary payloads, never stored on the public web server, and served only via time-limited presigned URLs.

---

## 2. STRIDE Threat Analysis Matrix

| Threat Category | Potential Attack Vector | Applied Countermeasure / Control | Residual Risk & Ongoing Mitigation |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Credential stuffing, brute-forcing user passwords, forging sessions. | Argon2id password hashing; account lockout / rate limiting on auth endpoints; JWT with ephemeral access lifetimes; TOTP MFA mandatory for admins; HTTP-only SameSite cookies. | Weak user passwords; mitigated by enforcing minimum 12-char complexity and entropy checks. |
| **Tampering** | Forging payment confirmations; altering milestone amounts in transit; parameter tampering. | All payment status changes require cryptographic webhook signature verification (HMAC-SHA256); milestone prices locked once contract is executed; database check constraints on financial amounts. | Compromise of payment webhook secret; mitigated by storing secrets in encrypted environment variables outside git. |
| **Repudiation** | User denies posting project, submitting bid, or approving payment. | Append-only `audit_logs` table capturing `actor_id`, `ip_address`, `timestamp`, `action`, and JSON diff; immutable `ledger_entries` table. | Log tampering on host; mitigated by streaming logs offsite and restricting SSH droplet access. |
| **Information Disclosure** | IDOR on contracts or proposals; leaking database errors or stack traces; public S3 access. | Strict object-level ownership checks (`customer_id == user.id OR professional_id == user.id`); custom exception handlers returning generic error envelopes; private S3 buckets. | Unintended data leakage in logs; mitigated by sanitizing PII and secrets in structured JSON logger. |
| **Denial of Service** | Volumetric HTTP floods; heavy search queries; large malicious file uploads. | Caddy connection limits; application rate limiting (slowapi); query pagination limits (max 100 items); 15MB file upload limit; direct-to-S3 presigned uploads. | Distributed L7 DDoS; mitigated by Cloudflare or DigitalOcean Cloud Firewalls in production. |
| **Elevation of Privilege** | Customer modifying role to admin; professional viewing competing bids. | Backend RBAC middleware verifying roles directly against DB/verified JWT; explicit permission guards on all `/admin/*` routes; hidden bids until project deadline. | Logic flaw in authorization middleware; mitigated by automated Pytest security test suites for every endpoint. |

---

## 3. Detailed Security Controls

### 3.1 Authentication & Credential Storage
- **Algorithm:** Passwords hashed with **Argon2id** (`time_cost=3`, `memory_cost=65536`, `parallelism=4`).
- **MFA:** Time-based One-Time Passwords (TOTP RFC 6238). Enforced for all `administrator` role actions. Optional for customers and professionals.
- **Session Tokens:** Access tokens expire in 15 minutes. Refresh tokens stored as SHA-256 hashes in PostgreSQL with explicit revocation support (`revoked_at`).

### 3.2 Authorization & IDOR Defense
Every API route that accesses a resource by ID must enforce an ownership predicate:
```python
# Canonical Authorization Pattern:
contract = await contract_repo.get(contract_id)
if not contract:
    raise ResourceNotFoundException("Contract not found")

if current_user.role != UserRole.ADMIN:
    if current_user.id != contract.customer_id and current_user.id != contract.professional_id:
        raise ForbiddenException("Access denied to this contract")
```

### 3.3 File Upload & Object Storage Security
- **No Direct Uploads to App Server:** Uploads are streamed directly to private S3 buckets via presigned PUT URLs valid for 15 minutes.
- **MIME & Magic Byte Validation:** Upon upload completion callback, the backend inspects the initial file magic bytes to verify genuine PDF, PNG, JPEG, or DOCX signatures before marking `documents.scan_status = 'clean'`.
- **Private Access:** Downloads require authenticated requests generating presigned GET URLs with a 5-minute time-to-live (TTL).

### 3.4 Payment & Ledger Integrity
- **Webhook Authenticity:** Payment webhooks must match the cryptographic HMAC signature header sent by the provider. Unsigned or invalid payloads are rejected with HTTP 400.
- **Idempotency:** Webhook event IDs and client payment requests require unique idempotency keys (`idempotency_key` constraint). Duplicate incoming webhooks return HTTP 200 without re-executing ledger entries.
- **Double-Entry Balancing:** Every monetary event creates debit and credit entries that must balance to zero:
  $$\sum \text{Debit} - \sum \text{Credit} = 0$$

### 3.5 Infrastructure & Network Hardening
- **Non-root Containers:** Backend and frontend containers run as unprivileged `appuser` (UID 10001).
- **Network Isolation:** PostgreSQL and backend communicate across a private internal Docker bridge. PostgreSQL port 5432 is never exposed to the public Internet.
- **HTTP Security Headers (via Caddy):**
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';`
