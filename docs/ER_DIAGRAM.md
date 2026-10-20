# BitQube Freelance — Entity-Relationship (ER) Diagram

**Version:** 1.0  
**Format:** Mermaid ER Diagram  
**Primary Identifiers:** UUID v4  
**Ledger Policy:** Append-only Immutable Double-Entry  

---

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    USERS ||--o| PROFESSIONAL_PROFILES : has
    USERS ||--o{ SESSIONS : authenticates
    USERS ||--o{ PROJECTS : posts_as_customer
    USERS ||--o{ DOCUMENTS : owns
    USERS ||--o{ AUDIT_LOGS : performs

    SUPPORTED_COUNTRIES ||--o{ USERS : country_of
    SUPPORTED_CURRENCIES ||--o{ USERS : prefers_currency

    CATEGORIES ||--o{ CATEGORIES : subcategory_of
    CATEGORIES ||--o{ SERVICES : categorizes
    CATEGORIES ||--o{ PROJECTS : classified_under

    PROFESSIONAL_PROFILES ||--o{ PROFESSIONAL_CREDENTIALS : holds
    PROFESSIONAL_PROFILES ||--o{ SERVICES : publishes
    PROFESSIONAL_PROFILES ||--o{ PROPOSALS : submits
    PROFESSIONAL_PROFILES ||--o{ CONTRACTS : contracts_as_pro

    PROJECTS ||--o{ PROPOSALS : receives
    PROJECTS ||--o| CONTRACTS : originates
    PROPOSALS ||--o| CONTRACTS : binds

    CONTRACTS ||--o{ MILESTONES : contains
    CONTRACTS ||--o{ REVIEWS : evaluated_by
    CONTRACTS ||--o{ DISPUTES : subject_of

    MILESTONES ||--o{ PAYMENTS : funded_by
    PAYMENTS ||--o{ LEDGER_ENTRIES : posts_to
    PAYMENTS ||--o{ REFUNDS : refunded_via

    WEBHOOK_EVENTS {
        uuid id PK
        string provider
        string event_id UK
        string event_type
        jsonb payload
        string processed_status
        timestamp created_at
    }

    FEATURE_FLAGS {
        string key PK
        boolean value
        string description
        timestamp updated_at
    }

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string status
        char2 country_code FK
        char3 preferred_currency FK
        boolean is_mfa_enabled
        timestamp email_verified_at
        timestamp created_at
    }

    USER_ROLES {
        uuid id PK
        uuid user_id FK
        string role
        timestamp created_at
    }

    PROFESSIONAL_PROFILES {
        uuid id PK
        uuid user_id FK,UK
        string display_name
        string title
        text biography
        char2 country_code FK
        numeric hourly_rate
        char3 currency_code FK
        string professional_status
        string verification_status
        numeric rating_average
        integer total_reviews_count
    }

    CATEGORIES {
        uuid id PK
        string name
        string slug UK
        text description
        string icon_name
        boolean is_regulated
        uuid parent_id FK
        boolean is_active
        integer sort_order
    }

    SERVICES {
        uuid id PK
        uuid professional_id FK
        uuid category_id FK
        string title
        text description
        string price_type
        numeric base_price
        char3 currency_code FK
        integer delivery_days
        string status
    }

    PROJECTS {
        uuid id PK
        uuid customer_id FK
        uuid category_id FK
        string title
        text description
        numeric budget_min
        numeric budget_max
        char3 currency_code FK
        timestamp deadline
        string status
        timestamp created_at
    }

    PROPOSALS {
        uuid id PK
        uuid project_id FK
        uuid professional_id FK
        numeric amount
        char3 currency_code FK
        integer estimated_duration_days
        text cover_letter
        string status
        timestamp created_at
    }

    CONTRACTS {
        uuid id PK
        uuid project_id FK
        uuid proposal_id FK,UK
        uuid customer_id FK
        uuid professional_id FK
        numeric agreed_amount
        char3 currency_code FK
        string terms_version
        string status
        timestamp accepted_at
        timestamp completed_at
    }

    MILESTONES {
        uuid id PK
        uuid contract_id FK
        string title
        text description
        numeric amount
        char3 currency_code FK
        timestamp due_at
        string status
        timestamp submitted_at
        timestamp approved_at
    }

    PAYMENTS {
        uuid id PK
        uuid milestone_id FK
        uuid payer_id FK
        uuid payee_id FK
        string provider
        string provider_reference
        string idempotency_key UK
        numeric amount
        numeric platform_fee
        char3 currency_code FK
        string status
        timestamp created_at
    }

    LEDGER_ENTRIES {
        uuid id PK
        uuid payment_id FK
        string account_code
        string entry_type
        numeric amount
        char3 currency_code FK
        text description
        timestamp created_at
    }

    REVIEWS {
        uuid id PK
        uuid contract_id FK
        uuid reviewer_id FK
        uuid reviewee_id FK
        smallint rating
        text comment
        timestamp created_at
    }

    DISPUTES {
        uuid id PK
        uuid contract_id FK
        uuid milestone_id FK
        uuid raised_by_id FK
        string reason
        text description
        string status
        text resolution_notes
        uuid resolved_by FK
        timestamp resolved_at
    }

    DOCUMENTS {
        uuid id PK
        uuid owner_id FK
        string storage_key UK
        string original_filename
        string detected_content_type
        bigint file_size_bytes
        string classification
        string scan_status
        timestamp created_at
    }
```
