# BitQube Freelance — Comprehensive Test Strategy & Release Gates

**Version:** 1.0  
**Testing Frameworks:** Pytest (Backend) + Vitest / RTL (Frontend) + Playwright (E2E)  
**CI Integration:** Automated GitHub Actions Pipeline  
**Target Code Coverage:** Backend Core Services >= 85%, Critical Financial/Ledger >= 95%  

---

## 1. Test Pyramid & Scope

```text
       /\
      /  \       E2E Tests (Playwright)
     /    \      - Critical user journeys (Signup -> Project -> Proposal -> Contract -> Payment -> Deliverable -> Review)
    /------\     
   /        \    Integration Tests (Pytest + PostgreSQL test DB)
  /          \   - Real DB schema, Alembic migrations, foreign key cascades, signed webhooks, RBAC/IDOR
 /------------\  
/              \ Unit Tests (Pytest + Vitest)
---------------- - Pydantic validation, Argon2id hashing, state machine logic, Decimal math, React UI components
```

---

## 2. Backend Testing (Pytest)

### 2.1 Unit Tests (`backend/tests/unit/`)
- **Domain State Machines:** Validate permitted and rejected status transitions for Projects, Proposals, Contracts, and Milestones.
- **Financial Decimal Precision:** Test commission fee splits, currency conversion math, and double-entry balancing rules without floating-point inaccuracies.
- **Security Utilities:** Verify password hashing complexity, token expiration logic, and signature verification.

### 2.2 Integration Tests (`backend/tests/integration/`)
- Run against an isolated PostgreSQL instance (test container or dedicated test database `bitqube_test`).
- **Authorization & Ownership (IDOR):** Verify that Customer A cannot read or accept proposals for Customer B's projects; verify non-admins receive 403 on `/admin/*`.
- **Payment & Webhook Idempotency:** Simulate webhook deliveries (valid signature, invalid signature, duplicate event IDs) and verify that ledger records are never duplicated.
- **Alembic Migration Verification:** Execute full `upgrade head` and `downgrade base` cycles to guarantee migration reversibility.

---

## 3. Frontend Testing (Vitest + React Testing Library)

### 3.1 Component & Hook Tests (`frontend/tests/`)
- **Form Validations:** Verify Zod schema validation rules (e.g. invalid email format, budget min > budget max, password complexity).
- **Component States:** Ensure loading skeletons, error alerts, empty states, and pagination controls render accurately.
- **Feature Flags:** Assert that BTQ and QUBEX banners render strictly as informative "Coming Soon" badges and never expose interactive checkout buttons.

---

## 4. End-to-End Tests (Playwright)

Full headless browser tests verifying the complete 13-step marketplace lifecycle:
1. **User Onboarding:** Register Customer Alice and Professional Bob. Verify email confirmation flow.
2. **Project Creation:** Alice publishes a project in *"AI & Automation"* with a USD budget.
3. **Proposal Submission:** Bob searches projects, finds Alice's RFP, and submits a proposal with milestones.
4. **Contract Formation:** Alice accepts Bob's bid; system transitions proposal to `accepted` and generates a binding Contract.
5. **Funding & Delivery:** Alice funds Milestone 1; Bob uploads a mock deliverable document.
6. **Milestone Approval:** Alice reviews and approves the deliverable.
7. **Bilateral Reviews:** Both parties leave 5-star ratings; verify professional profile score update.

---

## 5. Release Quality Gates

Before any build or branch can be merged or deployed to production:

| Gate | Criterion | Enforcement Tool |
| :--- | :--- | :--- |
| **Linting & Code Style** | Zero errors / warnings | `ruff check backend/` & `npm run lint` |
| **Type Checking** | Zero type errors | `mypy backend/app/` & `tsc --noEmit` |
| **Unit & Integration Tests** | 100% passing tests | `pytest backend/tests/` & `npm run test` |
| **Migration Integrity** | Clean reversible migration path | `alembic check` & test migration run |
| **Security Audit** | Zero High/Critical CVEs | `pip-audit` & `npm audit --audit-level=high` |
| **Browser Journey** | Core user journey passes | `npx playwright test` |
