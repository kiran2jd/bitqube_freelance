# BitQube Freelance — REST API Specification

**Version:** 1.0  
**Base URL:** `/api/v1`  
**Protocol:** HTTPS only  
**Data Format:** JSON (`application/json`)  
**Authentication:** HTTP-only Secure SameSite Cookie with JWT or `Authorization: Bearer <token>`  
**CSRF Protection:** Required on state-changing methods via `X-CSRF-Token` header when using cookies  

---

## 1. Unified Response & Error Envelopes

### Success Envelope (Single Resource)
```json
{
  "success": true,
  "data": { ... }
}
```

### Success Envelope (Paginated List)
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total_count": 142,
    "has_next": true
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Project with id 'b538e1a1-...' does not exist.",
    "details": [],
    "request_id": "req-9b88-12ab"
  }
}
```

---

## 2. API Endpoints by Domain

### 2.1 Authentication & Session (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register customer or professional |
| `POST` | `/auth/login` | Public | Authenticate with email/password; returns session cookies |
| `POST` | `/auth/mfa/challenge` | Public | Verify MFA TOTP code if enabled |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for fresh access token |
| `POST` | `/auth/logout` | Authenticated | Invalidate active session and clear cookies |
| `POST` | `/auth/verify-email` | Public | Confirm email address via verification token |
| `POST` | `/auth/forgot-password` | Public | Initiate password reset email |
| `POST` | `/auth/reset-password` | Public | Complete password reset with secure token |

---

### 2.2 Users & Preferences (`/api/v1/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | Authenticated | Retrieve current user profile, roles, and settings |
| `PATCH` | `/users/me` | Authenticated | Update user name, display preferences |
| `PATCH` | `/users/me/currency` | Authenticated | Change preferred display currency |
| `POST` | `/users/me/mfa/setup` | Authenticated | Generate TOTP secret and QR code |
| `POST` | `/users/me/mfa/enable` | Authenticated | Confirm TOTP and enable MFA |

---

### 2.3 Professional Profiles & Credentials (`/api/v1/professionals`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/professionals` | Public | Search/filter professional profiles (country, skill, rating) |
| `GET` | `/professionals/{id}` | Public | Public professional profile with portfolio & verified badges |
| `GET` | `/professionals/me` | Professional | Retrieve professional's own profile settings |
| `PUT` | `/professionals/me` | Professional | Update bio, title, hourly rate, skills, availability |
| `POST` | `/professionals/me/credentials` | Professional | Submit license or certification for verification |
| `GET` | `/professionals/me/credentials` | Professional | List submitted credentials and review statuses |

---

### 2.4 Categories & Taxonomy (`/api/v1/categories`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Public | List all 15 root categories with subcategories and icons |
| `GET` | `/categories/{slug}` | Public | Category details, active services count, and guidelines |
| `POST` | `/categories` | Admin | Create a category or subcategory |
| `PATCH` | `/categories/{id}` | Admin | Update category details, status, or regulated flag |

---

### 2.5 Services & Catalog (`/api/v1/services`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/services` | Public | Search catalog by category, price, keywords |
| `GET` | `/services/{id}` | Public | Detailed service offering with deliverables and pricing |
| `POST` | `/services` | Professional | Create a new service listing |
| `PUT` | `/services/{id}` | Professional (Owner)| Update existing service package |
| `DELETE`| `/services/{id}` | Professional (Owner)| Archive/delete service package |

---

### 2.6 Projects (RFPs) (`/api/v1/projects`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects` | Public | Browse open client project RFPs |
| `GET` | `/projects/{id}` | Public / Auth | Project specification details |
| `POST` | `/projects` | Customer | Publish a new project with budget and deadline |
| `PATCH` | `/projects/{id}` | Customer (Owner)| Edit draft or open project details |
| `POST` | `/projects/{id}/close` | Customer (Owner)| Close project to new bids |

---

### 2.7 Proposals & Bidding (`/api/v1/proposals`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/{id}/proposals` | Customer (Owner)| List received proposals for a project |
| `POST` | `/projects/{id}/proposals` | Professional | Submit a bid with price, timeline, and cover letter |
| `GET` | `/proposals/mine` | Professional | List all proposals submitted by the professional |
| `POST` | `/proposals/{id}/accept` | Customer (Owner)| Accept proposal, locks bids, and generates draft contract |
| `POST` | `/proposals/{id}/withdraw` | Professional (Owner)| Withdraw proposal prior to acceptance |

---

### 2.8 Contracts & Milestones (`/api/v1/contracts`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/contracts/{id}` | Participant | Retrieve contract terms, milestones, and status |
| `GET` | `/contracts` | Authenticated | List user's active and completed contracts |
| `POST` | `/contracts/{id}/accept`| Participant | Digitally sign / agree to terms of engagement |
| `POST` | `/contracts/{id}/milestones/{mId}/submit` | Professional | Submit milestone deliverables and work proof |
| `POST` | `/contracts/{id}/milestones/{mId}/approve` | Customer | Approve milestone and authorize payout settlement |
| `POST` | `/contracts/{id}/milestones/{mId}/revision`| Customer | Request milestone modifications with feedback |

---

### 2.9 Payments & Webhooks (`/api/v1/payments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/payments/checkout-session` | Customer | Create provider checkout session for a milestone |
| `GET` | `/payments/{id}` | Participant | Retrieve payment status, invoice, and breakdown |
| `POST` | `/payments/webhooks/{provider}` | Webhook (Signed) | Process signed provider callbacks idempotently |

---

### 2.10 Reviews & Disputes (`/api/v1/reviews`, `/api/v1/disputes`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/contracts/{id}/reviews` | Participant | Submit bilateral review for completed contract |
| `GET` | `/reviews/professional/{id}` | Public | Paginated reviews and ratings for a professional |
| `POST` | `/contracts/{id}/disputes` | Participant | Initiate formal dispute on disputed milestone |
| `GET` | `/disputes/{id}` | Participant / Admin| Retrieve dispute history and submitted evidence |

---

### 2.11 Documents & Presigned URLs (`/api/v1/documents`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/documents/presign-upload` | Authenticated | Request presigned S3 PUT URL with size/MIME rules |
| `POST` | `/documents/{id}/complete-upload` | Authenticated | Confirm upload, trigger MIME magic byte verification |
| `GET` | `/documents/{id}/download` | Authorized Owner | Generate short-lived presigned GET download URL |

---

### 2.12 Administration (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/stats` | Admin | High-level GMV, active users, open disputes stats |
| `GET` | `/admin/verifications` | Admin | Queue of pending professional credentials |
| `POST` | `/admin/verifications/{id}/review` | Admin | Approve or reject credential with rationale |
| `POST` | `/admin/disputes/{id}/adjudicate` | Admin | Rule on dispute: full refund, full release, or split |
| `GET` | `/admin/audit-logs` | Admin | Filterable, immutable security and audit trails |
| `PATCH` | `/admin/currencies/{code}` | Admin | Enable/disable supported fiat currency |
| `PATCH` | `/admin/feature-flags/{key}` | Admin | Toggle runtime feature flags (e.g. BTQ/QUBEX) |

---

### 2.13 Public Configuration (`/api/v1/config`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/config/public` | Public | Returns supported countries, currencies, and feature flags (`btq_payments_enabled: false`, `qubex_benefits_enabled: false`) |
