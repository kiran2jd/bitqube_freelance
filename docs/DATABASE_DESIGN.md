# BitQube Freelance — Database Design & Schema Specification

**Version:** 1.0  
**Database Engine:** PostgreSQL 16+  
**ORM:** SQLAlchemy 2.0  
**Migrations:** Alembic  
**Identifiers:** UUID v4 across all operational tables  
**Timestamps:** Timezone-aware UTC (`TIMESTAMP WITH TIME ZONE`)  
**Currency/Monetary:** PostgreSQL `NUMERIC(14, 2)` (amounts) and `NUMERIC(18, 6)` (rates)  

---

## 1. Design Principles

1. **No Floating Point for Financials:** Never use `FLOAT`, `DOUBLE PRECISION`, or `REAL` for monetary amounts. Always use `NUMERIC(14, 2)` or integer minor units to guarantee zero precision loss.
2. **Explicit UUIDs:** All entity tables use UUID primary keys (`gen_random_uuid()`) to prevent enumeration attacks and simplify distributed or offline generation.
3. **Immutable Double-Entry Financial Ledger:** The `ledger_entries` table is append-only. No records may be updated or deleted. Corrections must be written as compensating credit/debit entries.
4. **Referential Integrity:** Enforce foreign keys with intentional cascade or restrict rules (e.g., prevent user deletion if financial ledger records exist).
5. **Auditing & Traceability:** All core tables include `created_at` and `updated_at`. State transitions log previous and new states along with actor IDs in `audit_logs`.

---

## 2. Table Specifications

### 2.1 Identity, Users & Roles

#### `users`
Represents platform identity across customers, professionals, and administrators.
- `id`: `UUID` (PK, default `gen_random_uuid()`)
- `email`: `VARCHAR(255)` (UNIQUE, NOT NULL, indexed lowercase)
- `password_hash`: `VARCHAR(255)` (NOT NULL, Argon2id format)
- `first_name`: `VARCHAR(100)` (NOT NULL)
- `last_name`: `VARCHAR(100)` (NOT NULL)
- `status`: `VARCHAR(30)` (NOT NULL, default `'active'` — `pending_verification`, `active`, `suspended`, `deactivated`)
- `country_code`: `CHAR(2)` (NOT NULL, FK -> `supported_countries.country_code`)
- `preferred_currency`: `CHAR(3)` (NOT NULL, FK -> `supported_currencies.code`)
- `is_mfa_enabled`: `BOOLEAN` (NOT NULL, default `FALSE`)
- `mfa_secret`: `VARCHAR(255)` (NULLABLE, encrypted at rest)
- `email_verified_at`: `TIMESTAMPTZ` (NULLABLE)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- `updated_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `user_roles`
Enforces user permissions and multi-role capabilities.
- `id`: `UUID` (PK)
- `user_id`: `UUID` (NOT NULL, FK -> `users.id` ON DELETE CASCADE)
- `role`: `VARCHAR(30)` (NOT NULL — `'customer'`, `'professional'`, `'administrator'`)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- *Constraint:* `UNIQUE (user_id, role)`

#### `sessions`
Tracks active authenticated sessions with automatic revocation.
- `id`: `UUID` (PK)
- `user_id`: `UUID` (NOT NULL, FK -> `users.id` ON DELETE CASCADE)
- `refresh_token_hash`: `VARCHAR(255)` (NOT NULL, indexed)
- `ip_address`: `INET` (NULLABLE)
- `user_agent`: `TEXT` (NULLABLE)
- `expires_at`: `TIMESTAMPTZ` (NOT NULL)
- `revoked_at`: `TIMESTAMPTZ` (NULLABLE)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `email_verification_tokens` & `password_reset_tokens`
- `id`: `UUID` (PK)
- `user_id`: `UUID` (NOT NULL, FK -> `users.id` ON DELETE CASCADE)
- `token_hash`: `VARCHAR(255)` (NOT NULL, UNIQUE, indexed)
- `expires_at`: `TIMESTAMPTZ` (NOT NULL)
- `used_at`: `TIMESTAMPTZ` (NULLABLE)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

---

### 2.2 Professional Profiles & Services

#### `professional_profiles`
Extended profile for independent professionals, consultants, and agencies.
- `id`: `UUID` (PK)
- `user_id`: `UUID` (NOT NULL, UNIQUE, FK -> `users.id` ON DELETE CASCADE)
- `display_name`: `VARCHAR(150)` (NOT NULL)
- `title`: `VARCHAR(200)` (NOT NULL)
- `biography`: `TEXT` (NOT NULL)
- `country_code`: `CHAR(2)` (NOT NULL, FK -> `supported_countries.country_code`)
- `hourly_rate`: `NUMERIC(14, 2)` (NULLABLE)
- `currency_code`: `CHAR(3)` (NOT NULL, FK -> `supported_currencies.code`)
- `skills`: `TEXT[]` (NOT NULL, default `'{}'`)
- `professional_status`: `VARCHAR(30)` (NOT NULL, default `'available'` — `'available'`, `'busy'`, `'inactive'`)
- `verification_status`: `VARCHAR(30)` (NOT NULL, default `'unverified'` — `'unverified'`, `'pending'`, `'verified'`, `'rejected'`)
- `rating_average`: `NUMERIC(3, 2)` (NOT NULL, default `0.00`)
- `total_reviews_count`: `INTEGER` (NOT NULL, default `0`)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- `updated_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `professional_credentials`
Proof of professional licensure, certifications, and compliance for regulated services.
- `id`: `UUID` (PK)
- `professional_id`: `UUID` (NOT NULL, FK -> `professional_profiles.id` ON DELETE CASCADE)
- `title`: `VARCHAR(200)` (NOT NULL)
- `issuing_organization`: `VARCHAR(200)` (NOT NULL)
- `credential_identifier`: `VARCHAR(100)` (NULLABLE)
- `document_id`: `UUID` (NULLABLE, FK -> `documents.id`)
- `verification_status`: `VARCHAR(30)` (NOT NULL, default `'pending'` — `'pending'`, `'verified'`, `'rejected'`)
- `verified_by`: `UUID` (NULLABLE, FK -> `users.id`)
- `verified_at`: `TIMESTAMPTZ` (NULLABLE)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `categories`
Marketplace taxonomy initialized with the 15 master categories.
- `id`: `UUID` (PK)
- `name`: `VARCHAR(100)` (NOT NULL)
- `slug`: `VARCHAR(120)` (NOT NULL, UNIQUE, indexed)
- `description`: `TEXT` (NOT NULL)
- `icon_name`: `VARCHAR(50)` (NOT NULL)
- `is_regulated`: `BOOLEAN` (NOT NULL, default `FALSE`)
- `parent_id`: `UUID` (NULLABLE, FK -> `categories.id` ON DELETE SET NULL)
- `is_active`: `BOOLEAN` (NOT NULL, default `TRUE`)
- `sort_order`: `INTEGER` (NOT NULL, default `0`)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `services`
Packaged service offerings published by professionals.
- `id`: `UUID` (PK)
- `professional_id`: `UUID` (NOT NULL, FK -> `professional_profiles.id` ON DELETE CASCADE)
- `category_id`: `UUID` (NOT NULL, FK -> `categories.id`)
- `title`: `VARCHAR(200)` (NOT NULL)
- `description`: `TEXT` (NOT NULL)
- `price_type`: `VARCHAR(20)` (NOT NULL — `'fixed'`, `'hourly'`)
- `base_price`: `NUMERIC(14, 2)` (NOT NULL)
- `currency_code`: `CHAR(3)` (NOT NULL, FK -> `supported_currencies.code`)
- `delivery_days`: `INTEGER` (NOT NULL, default `7`)
- `status`: `VARCHAR(30)` (NOT NULL, default `'active'` — `'draft'`, `'active'`, `'paused'`, `'archived'`)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- `updated_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

---

### 2.3 Marketplace RFPs, Proposals, Contracts & Milestones

#### `projects`
Project RFPs posted by customers.
- `id`: `UUID` (PK)
- `customer_id`: `UUID` (NOT NULL, FK -> `users.id`)
- `category_id`: `UUID` (NOT NULL, FK -> `categories.id`)
- `title`: `VARCHAR(250)` (NOT NULL)
- `description`: `TEXT` (NOT NULL)
- `budget_min`: `NUMERIC(14, 2)` (NULLABLE)
- `budget_max`: `NUMERIC(14, 2)` (NOT NULL)
- `currency_code`: `CHAR(3)` (NOT NULL, FK -> `supported_currencies.code`)
- `deadline`: `TIMESTAMPTZ` (NOT NULL)
- `status`: `VARCHAR(30)` (NOT NULL, default `'open'` — `'draft'`, `'open'`, `'in_progress'`, `'completed'`, `'cancelled'`)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- `updated_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `proposals`
Bids submitted by professionals for projects.
- `id`: `UUID` (PK)
- `project_id`: `UUID` (NOT NULL, FK -> `projects.id` ON DELETE CASCADE)
- `professional_id`: `UUID` (NOT NULL, FK -> `professional_profiles.id`)
- `amount`: `NUMERIC(14, 2)` (NOT NULL)
- `currency_code`: `CHAR(3)` (NOT NULL, FK -> `supported_currencies.code`)
- `estimated_duration_days`: `INTEGER` (NOT NULL)
- `cover_letter`: `TEXT` (NOT NULL)
- `status`: `VARCHAR(30)` (NOT NULL, default `'submitted'` — `'submitted'`, `'accepted'`, `'rejected'`, `'withdrawn'`)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- *Constraint:* `UNIQUE (project_id, professional_id)`

#### `contracts`
Legally agreed project engagements between customer and professional.
- `id`: `UUID` (PK)
- `project_id`: `UUID` (NOT NULL, FK -> `projects.id`)
- `proposal_id`: `UUID` (NOT NULL, UNIQUE, FK -> `proposals.id`)
- `customer_id`: `UUID` (NOT NULL, FK -> `users.id`)
- `professional_id`: `UUID` (NOT NULL, FK -> `professional_profiles.id`)
- `agreed_amount`: `NUMERIC(14, 2)` (NOT NULL)
- `currency_code`: `CHAR(3)` (NOT NULL, FK -> `supported_currencies.code`)
- `terms_version`: `VARCHAR(50)` (NOT NULL)
- `status`: `VARCHAR(30)` (NOT NULL, default `'active'` — `'active'`, `'completed'`, `'disputed'`, `'cancelled'`)
- `accepted_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- `completed_at`: `TIMESTAMPTZ` (NULLABLE)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `milestones`
Segmented deliverables within a contract.
- `id`: `UUID` (PK)
- `contract_id`: `UUID` (NOT NULL, FK -> `contracts.id` ON DELETE CASCADE)
- `title`: `VARCHAR(200)` (NOT NULL)
- `description`: `TEXT` (NOT NULL)
- `amount`: `NUMERIC(14, 2)` (NOT NULL)
- `currency_code`: `CHAR(3)` (NOT NULL, FK -> `supported_currencies.code`)
- `due_at`: `TIMESTAMPTZ` (NOT NULL)
- `status`: `VARCHAR(30)` (NOT NULL, default `'pending'` — `'pending'`, `'funded'`, `'submitted'`, `'approved'`, `'disputed'`)
- `submitted_at`: `TIMESTAMPTZ` (NULLABLE)
- `approved_at`: `TIMESTAMPTZ` (NULLABLE)
- `deliverable_notes`: `TEXT` (NULLABLE)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

---

### 2.4 Payments, Double-Entry Ledger & Refunds

#### `payments`
Tracks authorized fiat payments for milestones.
- `id`: `UUID` (PK)
- `milestone_id`: `UUID` (NOT NULL, FK -> `milestones.id`)
- `payer_id`: `UUID` (NOT NULL, FK -> `users.id`)
- `payee_id`: `UUID` (NOT NULL, FK -> `users.id`)
- `provider`: `VARCHAR(50)` (NOT NULL — e.g. `'stripe'`, `'razorpay'`)
- `provider_reference`: `VARCHAR(255)` (NULLABLE, indexed)
- `idempotency_key`: `VARCHAR(100)` (NOT NULL, UNIQUE, indexed)
- `amount`: `NUMERIC(14, 2)` (NOT NULL)
- `platform_fee`: `NUMERIC(14, 2)` (NOT NULL, default `0.00`)
- `currency_code`: `CHAR(3)` (NOT NULL, FK -> `supported_currencies.code`)
- `status`: `VARCHAR(30)` (NOT NULL, default `'initiated'` — `'initiated'`, `'requires_action'`, `'confirmed'`, `'failed'`, `'refunded'`)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- `updated_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `ledger_entries`
Immutable double-entry general ledger.
- `id`: `UUID` (PK)
- `payment_id`: `UUID` (NULLABLE, FK -> `payments.id`)
- `account_code`: `VARCHAR(60)` (NOT NULL — `'CUSTOMER_FUNDS_HELD'`, `'PROFESSIONAL_EARNINGS'`, `'PLATFORM_COMMISSION'`, `'GATEWAY_SETTLEMENT'`)
- `entry_type`: `VARCHAR(10)` (NOT NULL — `'DEBIT'`, `'CREDIT'`)
- `amount`: `NUMERIC(14, 2)` (NOT NULL, CHECK `amount > 0`)
- `currency_code`: `CHAR(3)` (NOT NULL, FK -> `supported_currencies.code`)
- `description`: `TEXT` (NOT NULL)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- *Rule:* Sum of DEBITs must equal sum of CREDITs for any financial transaction batch. No updates or deletes permitted.

#### `refunds`
- `id`: `UUID` (PK)
- `payment_id`: `UUID` (NOT NULL, FK -> `payments.id`)
- `amount`: `NUMERIC(14, 2)` (NOT NULL)
- `currency_code`: `CHAR(3)` (NOT NULL)
- `reason`: `TEXT` (NOT NULL)
- `provider_refund_reference`: `VARCHAR(255)` (NULLABLE)
- `status`: `VARCHAR(30)` (NOT NULL, default `'pending'` — `'pending'`, `'succeeded'`, `'failed'`)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

---

### 2.5 Reviews, Disputes & Platform Governance

#### `reviews`
Bilateral rating and review between customer and professional.
- `id`: `UUID` (PK)
- `contract_id`: `UUID` (NOT NULL, FK -> `contracts.id`)
- `reviewer_id`: `UUID` (NOT NULL, FK -> `users.id`)
- `reviewee_id`: `UUID` (NOT NULL, FK -> `users.id`)
- `rating`: `SMALLINT` (NOT NULL, CHECK `rating BETWEEN 1 AND 5`)
- `comment`: `TEXT` (NOT NULL)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- *Constraint:* `UNIQUE (contract_id, reviewer_id)` (One review per party per contract)

#### `disputes`
- `id`: `UUID` (PK)
- `contract_id`: `UUID` (NOT NULL, FK -> `contracts.id`)
- `milestone_id`: `UUID` (NULLABLE, FK -> `milestones.id`)
- `raised_by_id`: `UUID` (NOT NULL, FK -> `users.id`)
- `reason`: `VARCHAR(100)` (NOT NULL)
- `description`: `TEXT` (NOT NULL)
- `status`: `VARCHAR(30)` (NOT NULL, default `'opened'` — `'opened'`, `'under_investigation'`, `'resolved_refund'`, `'resolved_release'`, `'dismissed'`)
- `resolution_notes`: `TEXT` (NULLABLE)
- `resolved_by`: `UUID` (NULLABLE, FK -> `users.id`)
- `resolved_at`: `TIMESTAMPTZ` (NULLABLE)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `documents`
Encapsulates metadata for files stored in private object storage.
- `id`: `UUID` (PK)
- `owner_id`: `UUID` (NOT NULL, FK -> `users.id`)
- `storage_key`: `VARCHAR(500)` (NOT NULL, UNIQUE)
- `original_filename`: `VARCHAR(255)` (NOT NULL)
- `detected_content_type`: `VARCHAR(100)` (NOT NULL)
- `file_size_bytes`: `BIGINT` (NOT NULL)
- `classification`: `VARCHAR(50)` (NOT NULL — `'credential'`, `'deliverable'`, `'dispute_evidence'`, `'invoice'`)
- `scan_status`: `VARCHAR(30)` (NOT NULL, default `'clean'` — `'pending'`, `'clean'`, `'flagged'`)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `audit_logs`
Tamper-evident audit trail for system events and sensitive operations.
- `id`: `UUID` (PK)
- `actor_id`: `UUID` (NULLABLE, FK -> `users.id`)
- `action`: `VARCHAR(100)` (NOT NULL — e.g. `'user.login'`, `'contract.accept'`, `'admin.verify_credential'`)
- `entity_type`: `VARCHAR(50)` (NOT NULL — `'user'`, `'contract'`, `'payment'`, `'dispute'`)
- `entity_id`: `UUID` (NULLABLE)
- `ip_address`: `INET` (NULLABLE)
- `request_id`: `VARCHAR(100)` (NULLABLE)
- `metadata`: `JSONB` (NOT NULL, default `'{}'`)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)

#### `webhook_events`
Incoming payment provider webhooks for signature validation and idempotency.
- `id`: `UUID` (PK)
- `provider`: `VARCHAR(50)` (NOT NULL)
- `event_id`: `VARCHAR(255)` (NOT NULL)
- `event_type`: `VARCHAR(100)` (NOT NULL)
- `payload`: `JSONB` (NOT NULL)
- `processed_status`: `VARCHAR(30)` (NOT NULL, default `'pending'` — `'pending'`, `'processed'`, `'ignored'`, `'failed'`)
- `error_message`: `TEXT` (NULLABLE)
- `created_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- *Constraint:* `UNIQUE (provider, event_id)`

#### `supported_countries` & `supported_currencies`
- `country_code`: `CHAR(2)` (PK — ISO 3166-1 alpha-2, e.g. `'IN'`, `'US'`, `'GB'`, `'DE'`)
- `name`: `VARCHAR(100)` (NOT NULL)
- `default_currency`: `CHAR(3)` (NOT NULL)
- `is_enabled`: `BOOLEAN` (NOT NULL, default `TRUE`)

- `code`: `CHAR(3)` (PK — ISO 4217, e.g. `'INR'`, `'USD'`, `'GBP'`, `'EUR'`)
- `name`: `VARCHAR(50)` (NOT NULL)
- `symbol`: `VARCHAR(10)` (NOT NULL)
- `is_enabled`: `BOOLEAN` (NOT NULL, default `TRUE`)

#### `feature_flags`
Controls progressive rollout of platform capabilities.
- `key`: `VARCHAR(100)` (PK)
- `value`: `BOOLEAN` (NOT NULL, default `FALSE`)
- `description`: `TEXT` (NOT NULL)
- `updated_at`: `TIMESTAMPTZ` (NOT NULL, default `NOW()`)
- *Defaults:*
  - `btq_payments_enabled`: `FALSE`
  - `qubex_benefits_enabled`: `FALSE`
