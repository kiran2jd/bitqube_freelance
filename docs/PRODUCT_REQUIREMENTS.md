# BitQube Freelance — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Approved for Implementation  
**Target Platform:** Global Professional Services Marketplace  
**Primary Architecture:** Modular Monolith (FastAPI + React 19 + PostgreSQL)  
**Initial Payment Rail:** Country-based Fiat Currency Only  

---

## 1. Executive Summary & Vision

BitQube Freelance is a premium, secure, and responsive global professional services marketplace designed to connect businesses, entrepreneurs, and individuals with vetted independent professionals, specialist consultants, and boutique service firms.

The platform streamlines discovery, proposal evaluation, milestones negotiation, fiat-based transaction processing, deliverable reviews, bilateral ratings, and dispute management.

### Strategic Scope Decision (MVP)
The MVP operates **strictly on fiat currencies** (e.g., INR, USD, GBP, EUR) supported by regulated payment providers. 

**BTQ and QUBEX Policy:**
- BTQ (payment currency) and QUBEX (loyalty/discount utility) are planned future ecosystem integrations.
- **Under no circumstances** are BTQ or QUBEX to be implemented as active payment mechanisms, crypto wallets, on-chain transactions, token rewards, or automatic discounts in this release.
- Feature flags `btq_payments_enabled` and `qubex_benefits_enabled` must default to `false`.
- UI surfaces may display informational, non-clickable "Coming Soon" badges/banners only.

---

## 2. Professional Service Categories

The platform launches with 15 core professional categories seeded idempotently into PostgreSQL. Each category contains a human-readable name, unique slug, description, UI icon identifier, active status, and optional subcategories:

1. **Legal Services:** Contract drafting, corporate documentation, IP protection, regulatory compliance support (Requires jurisdictional authorization).
2. **Business Advisory:** Startup consulting, strategic planning, business development, market expansion research.
3. **Financial Advisory:** Financial modeling, corporate budgeting, valuation, investment advisory (Restricted to verified professionals).
4. **Web3 & Blockchain Developers:** Smart contracts, decentralized applications, protocols, audits, and blockchain integrations.
5. **IT Consultancy:** Enterprise software architecture, cloud infrastructure, cybersecurity audits, DevOps.
6. **Web & Mobile Development:** Full-stack web platforms, iOS/Android apps, SaaS architectures, API design.
7. **Digital Marketing:** Search engine optimization (SEO), performance marketing, social media campaigns, brand positioning.
8. **AI & Automation:** Machine learning workflows, LLM fine-tuning, workflow automations, intelligent data pipelines.
9. **Design & Creative Services:** UI/UX design systems, brand identities, graphic assets, multimedia production.
10. **Accounting & Taxation:** Bookkeeping, statutory filing, international tax structuring, financial auditing.
11. **HR & Recruitment:** Executive talent acquisition, technical recruitment, HR policy development.
12. **Real Estate & Business Projects:** Feasibility studies, commercial project advisory, asset due diligence.
13. **Education & Training:** Corporate workshops, executive coaching, technical skills training.
14. **Translation & Documentation:** Multilingual technical translation, legal transcription, localization.
15. **Other Professional Services:** Specialized consulting across emerging domains.

> [!IMPORTANT]
> **Regulated Services Governance:** Legal, financial, tax, and investment advice are classified as *Regulated Services*. The platform enforces credential submission and administrative verification before awarding verification badges or granting permission to bid on regulated category RFPs.

---

## 3. User Roles & Permission Matrix

The platform enforces Role-Based Access Control (RBAC) and record-level ownership checks across three principal roles.

| Capability / Action | Customer | Professional | Administrator |
| :--- | :---: | :---: | :---: |
| **Authentication & Profile Management** | ✅ | ✅ | ✅ (MFA Required) |
| **Browse Professionals & Services** | ✅ | ✅ | ✅ |
| **Publish Service Listings & Portfolio** | ❌ | ✅ | ✅ (Review & Moderate) |
| **Create & Publish Projects (RFPs)** | ✅ | ❌ | ✅ (Moderate) |
| **Submit Proposals (Bids)** | ❌ | ✅ (If verified) | ❌ |
| **Accept Proposal & Form Contract** | ✅ | ❌ | ❌ |
| **Submit Milestone Deliverables** | ❌ | ✅ | ❌ |
| **Approve Milestone & Release Payment** | ✅ | ❌ | ❌ |
| **Initiate Disputes** | ✅ | ✅ | Administer & Resolve |
| **Submit Bilateral Review** | ✅ | ✅ | Moderate |
| **Upload Credentials / Verification Proof**| ❌ | ✅ | Review & Approve/Reject |
| **Configure System Fees & Currencies** | ❌ | ❌ | ✅ |
| **Inspect Financial Ledger & Webhooks** | ❌ | ❌ | ✅ |
| **Access Audit Logs & Security Events** | ❌ | ❌ | ✅ |

---

## 4. End-to-End Marketplace Lifecycle (13-Step Workflow)

1. **Discovery:** Customer browses category taxonomies or searches professionals by country, skill, budget, and rating.
2. **Project Posting:** Customer posts a project with title, description, category, deadline, budget bounds, and currency.
3. **Proposal Submission:** Eligible professionals review open projects and submit formal proposals specifying delivery schedule, milestones, price, and proposal cover letter.
4. **Proposal Selection:** Customer compares proposals, reviews professional portfolios, and selects the winning proposal.
5. **Contract Agreement:** Both parties execute a binding digital contract containing agreed scope, milestone schedule, total fiat amount, currency, and dispute terms.
6. **Milestone Creation:** Contract milestones are established with individual deliverables, target completion dates, and fractional payment allocations.
7. **Payment Authorization:** Customer funds the milestone via a supported fiat checkout session (e.g., card, net banking, SEPA).
8. **Authoritative Confirmation:** Backend confirms transaction receipt via signed payment gateway webhook and records an immutable double-entry ledger entry.
9. **Execution & Delivery:** Professional works on the milestone and submits deliverables (links, documents stored in private object storage).
10. **Review & Approval:** Customer inspects deliverables. Customer either approves milestone completion or requests revisions with feedback.
11. **Settlement & Payout Allocation:** Upon approval, milestone funds are transitioned to professional earnings balance minus platform commission.
12. **Bilateral Reviews:** Upon contract completion, customer and professional leave mutual 1–5 star ratings and written reviews (double-blind until both submitted or window expires).
13. **Dispute Handling:** If an impasse occurs, either party can trigger formal dispute proceedings; authorized administrators examine evidence and adjudicate fund allocation.

---

## 5. Multi-Currency Fiat Specifications

- **Supported Initial Currencies:** INR (Indian Rupee), USD (US Dollar), GBP (British Pound), EUR (Euro).
- **Precision Guarantee:** All monetary amounts are handled using PostgreSQL `NUMERIC(14, 2)` (or `18, 4` for rates) and Python `Decimal`. Floating-point operations (`float`) are prohibited.
- **Contract Currency Invariance:** Changing the user's UI display currency *never* modifies the agreed currency of an active proposal or contract.
- **Currency Conversion Transparency:** If cross-currency estimation is shown in the UI, exchange rate source, conversion timestamp, and provider foreign exchange fees must be explicitly itemized.

---

## 6. Non-Functional Requirements

- **Performance:** P95 API response times under 200ms for cached and indexed read operations; under 500ms for transactional writes.
- **Availability:** 99.9% uptime target on DigitalOcean Droplet infrastructure with health probes and automatic container restart policies.
- **Security:** OWASP Top 10 compliance, Argon2id password hashing, mandatory Admin MFA, signed payment webhooks, private object storage with expiring presigned download URLs, CSP headers, rate-limiting on sensitive endpoints.
- **Responsiveness:** Fluid adaptation across mobile (< 640px), tablet (640px - 1024px), and desktop (> 1024px) screen resolutions.
- **Auditability:** Complete, immutable ledger and tamper-evident audit trails for all financial events, administrative decisions, and access elevations.
