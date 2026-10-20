# Changelog

All notable changes to the BitQube Freelance platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.0-payments] - 2026-10-21

### Added
- **Milestone 5 (Fiat Payment Integration & General Ledger) Completed**:
  - **Authoritative Razorpay Gateway Integration**:
    - `PaymentGateway` abstraction layer (`app/services/payment/base.py`).
    - `RazorpayGateway` adapter (`app/services/payment/razorpay_adapter.py`) with order creation, HMAC-SHA256 signature verification, and webhook signature verification.
  - **Double-Entry General Ledger Service (`app/services/payment/ledger_service.py`)**:
    - Four core balance-sheet ledger accounts: `GATEWAY_SETTLEMENT_RECEIVABLE`, `CUSTOMER_FUNDS_HELD`, `PROFESSIONAL_EARNINGS`, and `PLATFORM_COMMISSION_REVENUE`.
    - Real-time double-entry debit/credit balancing for milestone escrow funding, milestone deliverable completion releases (90% professional / 10% platform fee), and refunds.
  - **Payment & Invoicing REST Endpoints (`app/api/v1/endpoints/payments.py`)**:
    - `POST /api/v1/payments/orders`: Creates Razorpay order for funding milestone.
    - `POST /api/v1/payments/verify`: Verifies payment signature and records ledger entry.
    - `POST /api/v1/payments/webhook`: Handles asynchronous Razorpay event notifications.
    - `GET /api/v1/payments/ledger`: Audit log of immutable journal entries.
    - `GET /api/v1/payments/{payment_id}/invoice`: Generates compliant tax receipt with GSTIN.
    - `GET /api/v1/payments/milestones/{milestone_id}/invoice`: Milestone-specific invoice lookup.
  - **Frontend UI & Interactive Modals**:
    - `RazorpayCheckoutModal.tsx`: Interactive checkout modal with escrow protection notice and live/simulated authorization.
    - `InvoiceModal.tsx`: Printable official tax invoice with GSTIN and platform fee breakdown.
    - Updated `ContractDetailPage.tsx` with one-click Razorpay funding trigger and tax invoice inspection button.
  - **Layman Product Guide & Demo Script**:
    - Created `docs/BITQUBE_PRODUCT_GUIDE_AND_DEMO_WALKTHROUGH.md` and user-facing artifact with plain English explanations, personas (Priya & Arjun), Mermaid architecture & sequence diagrams, and an 8-scene step-by-step promotional demo script.
  - **Testing & Quality Assurance**:
    - 17/17 backend Pytest tests passing in 9.02s (`test_auth.py`, `test_professionals.py`, `test_marketplace.py`, `test_payments.py`).
    - 0 Ruff linting errors.
    - 3/3 frontend Vitest test suites passing.
    - Production Vite build compiled cleanly in 21s (0 errors).

---

## [1.3.0-marketplace] - 2026-10-20

### Added
- **Milestone 4 (Core Marketplace Functionality) Completed**:
  - **Projects & RFPs Engine**:
    - Pydantic v2 schemas: `ProjectCreate`, `ProjectUpdate`, `ProjectResponse` (`app/schemas/project.py`).
    - REST endpoints: `GET /api/v1/projects`, `POST /api/v1/projects`, `GET /api/v1/projects/{id}`, `PATCH /api/v1/projects/{id}`, `GET /api/v1/projects/{id}/proposals`.
    - Integrated filtering by category, search text, client, and status with pagination metadata.
  - **Proposals & Bidding System**:
    - Pydantic v2 schemas: `ProposalCreate`, `ProposalResponse`, `ProposedMilestoneItem` (`app/schemas/proposal.py`).
    - REST endpoints: `POST /api/v1/proposals`, `GET /api/v1/proposals/me`, `POST /api/v1/proposals/{id}/accept`, `POST /api/v1/proposals/{id}/withdraw`.
    - Enforced database-level unique constraint preventing duplicate proposals per professional per project.
  - **Contract & Milestone Orchestration**:
    - Atomic proposal acceptance transaction:
      - Transitions accepted proposal to `accepted`.
      - Automatically transitions competing proposals for same project to `rejected`.
      - Transitions project status to `in_progress`.
      - Generates legally binding `Contract` (standard terms v1.0, agreed amount, currency).
      - Automatically creates initial executable `Milestone` record.
    - REST endpoints:
      - `GET /api/v1/contracts`: List user's contracts (as client or consultant).
      - `GET /api/v1/contracts/{id}`: Detailed contract and milestone tracker.
      - `POST /api/v1/contracts/{id}/milestones/{m_id}/fund`: Milestone funding authorization.
      - `POST /api/v1/contracts/{id}/milestones/{m_id}/submit`: Professional deliverable submission with summary notes.
      - `POST /api/v1/contracts/{id}/milestones/{m_id}/approve`: Customer approval & milestone release. Automatically transitions contract and project to `completed` when all milestones are approved!
  - **Bilateral Reviews & Rating Recalibration**:
    - REST endpoints: `POST /api/v1/reviews`, `GET /api/v1/reviews/user/{user_id}`.
    - Automatic dynamic recalculation of `rating_average` and `total_reviews_count` on `ProfessionalProfile`.
  - **Frontend UI & Interactive Pages**:
    - `BrowseProjectsPage`: Open RFP catalog with search bar, category filtering, budget display (INR ₹), and proposal counts.
    - `PostProjectPage`: Interactive project brief publisher with regulated category alerts and INR defaults.
    - `ProjectDetailPage`: Project requirements view, proposal bidding modal trigger for professionals, and complete proposals comparison & acceptance interface for clients.
    - `SubmitProposalModal`: Professional proposal bid submission modal.
    - `ContractsListPage`: Contract list with milestone progress bars and status indicators.
    - `ContractDetailPage`: Interactive milestone execution pipeline with fund, deliverable submission, and approval actions.
    - `DeliverableSubmitModal`: Deliverable submission modal for professionals.
    - `ReviewModal`: 5-star rating and written review submission modal.
  - **Testing & Quality Assurance**:
    - 16/16 backend Pytest tests passing in 4.56s (`test_auth.py`, `test_professionals.py`, `test_marketplace.py`).
    - 0 Ruff linting errors.
    - 3/3 frontend Vitest test suites passing.
    - Production Vite bundle builds cleanly in 27.49s with zero TypeScript compilation errors.

## [1.2.0-identity] - 2026-10-20

### Added
- **Milestone 3 (Identity, Authentication & Profiles) Completed**:
  - **Backend Security & Cryptography**:
    - Argon2id password hashing with secure parameters (`app.core.security`).
    - RFC 7519 HMAC-SHA256 JWT access and refresh token generation.
    - RFC 6238 Time-Based One-Time Password (TOTP) multi-factor authentication with `pyotp`.
    - Cryptographic SHA-256 token hashing for password reset and email verification tokens.
  - **Backend REST API Endpoints & RBAC**:
    - `/api/v1/auth/register`: User account creation with role validation (Customer vs. Professional), India/INR defaults, and transaction isolation.
    - `/api/v1/auth/login`: Password verification, TOTP MFA challenge-response, and dual JWT issuance (Bearer & HttpOnly cookie).
    - `/api/v1/auth/logout`: JWT cookie revocation and session cleanup.
    - `/api/v1/auth/forgot-password` & `/api/v1/auth/reset-password`: Time-limited secure tokenized credential recovery.
    - `/api/v1/users/me`: Current user profile fetch and patch updates.
    - `/api/v1/users/me/mfa/setup` & `/api/v1/users/me/mfa/enable`: TOTP secret provisioning and verification.
    - `/api/v1/professionals`: Public consultant directory search with text matching, country filters, and verified-only flags.
    - `/api/v1/professionals/me`: Consultant profile fetch and atomic updates (title, bio, skills, hourly rate, currency).
    - `/api/v1/professionals/me/credentials`: Credential and license submissions with administrative verification lifecycle (`pending`, `verified`, `rejected`).
    - `/api/v1/services`: Public service catalog search and consultant service creation/updates.
    - **Regulated Services Security Guard**: Enforced strict HTTP 403 authorization preventing unverified professionals from offering services under regulated categories (Legal, Accounting, Financial Advisory).
  - **Backend Testing & Linting**:
    - 14/14 automated Pytest tests in `test_auth.py` and `test_professionals.py` passing with 100% success.
    - Ruff linting and formatting with 0 errors.
  - **Frontend UI & State Management**:
    - `AuthContext` and `useAuth` hook managing JWT persistence, user profile lifecycle, and role checking.
    - Role-based route guard `ProtectedRoute` enforcing customer/professional/admin access.
    - `Navbar` dynamic authenticated states: user avatar, role badges, dashboard navigation, and logout.
    - `LoginPage`: Email/password form with automatic TOTP multi-factor challenge prompt.
    - `RegisterPage`: Interactive role selector (Customer vs. Independent Professional) with India/INR defaults.
    - `ForgotPasswordPage` & `ResetPasswordPage`: Password recovery flow.
    - `CustomerDashboardPage`: Client overview, project brief creation CTA, active stats, and TOTP MFA setup panel.
    - `ProfessionalDashboardPage`: Consultant overview, hourly rate, rating stats, credential list, and service package showcase.
    - `ProfessionalProfileEditPage`: Full consultant profile editor (skills, bio, rate, status, currency).
    - `FindProfessionalsPage`: Public directory search with filter controls and verified badges.
    - `ProfessionalDetailPage`: Public profile view with verified credentials, skills, and bookable service packages.
    - `CredentialModal` and `ServiceCreateModal`: Clean interactive modals for submitting credentials and publishing service packages.
    - Vitest unit tests for components passing, and `npm run build` (`tsc -b && vite build`) bundling with 0 errors.

## [1.1.0-foundation] - 2026-10-20

### Added
- **Milestone 2 (Foundation & Scaffolding) Completed**:
  - Containerized PostgreSQL 16 on local Docker port 5433 with persistent storage and healthchecks.
  - Initialized FastAPI modular monolith (`backend/app/`) with Python 3.12+ compatibility and Pydantic v2.
  - Authored all 25 SQLAlchemy 2.0 relational models across 15 domain tables with UUID v4 primary keys.
  - Configured Alembic and generated initial migration (`dc2df4d7e9e0`), applying all 25 tables to PostgreSQL.
  - Implemented idempotent database seeder (`app.db.seed`) populating:
    - 15 Master professional categories with slugs, descriptions, icons, and regulated status flags.
    - Supported countries (`IN`, `US`, `GB`, `DE`) with India as default.
    - Supported fiat currencies (`INR`, `USD`, `GBP`, `EUR`) with INR as default.
    - Feature flags (`btq_payments_enabled=false`, `qubex_benefits_enabled=false`).
  - Authored backend Pytest test suite (100% pass) and achieved zero errors with Ruff linter.
  - Scaffolded React 19 + TypeScript + Vite frontend with Tailwind CSS, Lucide icons, and TanStack Query.
  - Implemented `Navbar`, `Footer`, `HomePage`, `CategoriesPage`, `HowItWorksPage`, `AboutPage`, and `ComingSoonBanner`.
  - Configured Razorpay as approved primary fiat payment provider in environment and documentation.
  - Configured official domain `https://www.bitqube.org`.
  - Verified live frontend (`http://127.0.0.1:5173`) and backend (`http://127.0.0.1:8000`) communication via proxy.

## [1.0.0-planning] - 2026-10-19

### Added
- Comprehensive project master documentation suite in `docs/`:
  - `PRODUCT_REQUIREMENTS.md`: Consolidated master product specifications and 15-category definitions.
  - `SYSTEM_ARCHITECTURE.md`: Modular monolith architecture specification (FastAPI + React 19 + PostgreSQL 16 + Caddy).
  - `DATABASE_DESIGN.md`: Detailed schema design with 25 relational tables, UUID primary keys, and immutable double-entry ledger.
  - `ER_DIAGRAM.md`: Complete Mermaid entity-relationship diagram with relationships and foreign key cascades.
  - `API_SPECIFICATION.md`: REST API endpoint specification with unified request/response envelopes and error formats.
  - `SECURITY_THREAT_MODEL.md`: STRIDE threat model, OWASP Top 10 mitigation strategies, and zero-trust file storage architecture.
  - `PAYMENT_FLOW.md`: Multi-currency fiat payment flows, webhook verification sequence, and double-entry accounting ledger rules.
  - `DEPLOYMENT_RUNBOOK.md`: DigitalOcean Droplet deployment runbook with Caddy reverse proxy and auto-TLS.
  - `TEST_STRATEGY.md`: Multi-tier test strategy (Pytest + Vitest + Playwright) and release quality gates.
  - `IMPLEMENTATION_PLAN.md`: Phased roadmap covering Milestones 1 through 8.
  - `BACKUP_AND_RECOVERY.md`: Offsite GPG-encrypted database backup strategy and disaster recovery drill.
  - `OPERATIONS_RUNBOOK.md`: Day-2 operations, system telemetry, structured logging, and incident playbooks.
- Root `README.md` with complete developer onboarding, architecture diagrams, and quick-start instructions.
- Initial `.gitignore` and `.env.example` configurations.

### Changed
- Superseded legacy token-payment assumptions from early initial discussions. Established strict **fiat-only MVP** rail (INR, USD, GBP, EUR).
- Established server-controlled feature flags (`btq_payments_enabled = false`, `qubex_benefits_enabled = false`) and non-functional UI placeholder requirement for BTQ and QUBEX.
