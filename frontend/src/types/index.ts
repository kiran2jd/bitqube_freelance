export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  is_regulated: boolean;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Country {
  country_code: string;
  name: string;
  default_currency: string;
  is_enabled: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_enabled: boolean;
}

export interface FeatureFlags {
  btq_payments_enabled: boolean;
  qubex_benefits_enabled: boolean;
}

export interface PublicConfig {
  default_country: string;
  default_currency: string;
  payment_provider: string;
  platform_fee_percentage: number;
  countries: Country[];
  currencies: Currency[];
  feature_flags: FeatureFlags;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    offset: number;
    limit: number;
    total_count: number;
    has_next: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; issue: string }>;
    request_id?: string;
  };
}

export interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  dependencies: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  country_code: string;
  preferred_currency: string;
  roles: string[];
  is_mfa_enabled: boolean;
  email_verified_at: string | null;
  created_at: string;
}

export interface Credential {
  id: string;
  professional_id: string;
  title: string;
  issuing_organization: string;
  credential_identifier?: string;
  document_id?: string;
  verification_status: "pending" | "verified" | "rejected";
  verified_at?: string;
  created_at: string;
}

export interface ProfessionalProfile {
  id: string;
  user_id: string;
  display_name: string;
  title: string;
  biography: string;
  country_code: string;
  hourly_rate?: number;
  currency_code: string;
  skills: string[];
  professional_status: "available" | "busy" | "inactive";
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  rating_average: number;
  total_reviews_count: number;
  created_at: string;
  credentials?: Credential[];
}

export interface ServiceItem {
  id: string;
  professional_id: string;
  category_id: string;
  title: string;
  description: string;
  price_type: "fixed" | "hourly";
  base_price: number;
  currency_code: string;
  delivery_days: number;
  status: "draft" | "active" | "paused" | "archived";
  created_at: string;
}

export interface Project {
  id: string;
  customer_id: string;
  category_id: string;
  title: string;
  description: string;
  budget_min?: number;
  budget_max: number;
  currency_code: string;
  deadline: string;
  status: "draft" | "open" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  category_name?: string;
  customer_name?: string;
  proposals_count: number;
}

export interface Proposal {
  id: string;
  project_id: string;
  professional_id: string;
  amount: number;
  currency_code: string;
  estimated_duration_days: number;
  cover_letter: string;
  status: "submitted" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  professional_name?: string;
  professional_title?: string;
  professional_rating?: number;
  is_verified?: boolean;
}

export interface Milestone {
  id: string;
  contract_id: string;
  title: string;
  description: string;
  amount: number;
  currency_code: string;
  due_at: string;
  status: "pending" | "funded" | "submitted" | "approved" | "disputed";
  submitted_at?: string | null;
  approved_at?: string | null;
  deliverable_notes?: string | null;
  created_at: string;
}

export interface Contract {
  id: string;
  project_id: string;
  proposal_id: string;
  customer_id: string;
  professional_id: string;
  agreed_amount: number;
  currency_code: string;
  terms_version: string;
  status: "active" | "completed" | "disputed" | "cancelled";
  accepted_at: string;
  completed_at?: string | null;
  created_at: string;
  project_title?: string;
  customer_name?: string;
  professional_name?: string;
  milestones: Milestone[];
}

export interface Review {
  id: string;
  contract_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name?: string;
}

export interface PaymentOrder {
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  milestone_title: string;
}

export interface Payment {
  id: string;
  milestone_id: string;
  payer_id: string;
  payee_id: string;
  provider: string;
  provider_reference?: string | null;
  amount: number;
  platform_fee: number;
  currency_code: string;
  status: "initiated" | "requires_action" | "confirmed" | "failed" | "refunded";
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  payment_id?: string | null;
  account_code: string;
  entry_type: "DEBIT" | "CREDIT";
  amount: number;
  currency_code: string;
  description: string;
  created_at: string;
}

export interface Invoice {
  invoice_number: string;
  payment_id: string;
  contract_id: string;
  milestone_title: string;
  payer_name: string;
  payee_name: string;
  amount: number;
  platform_fee: number;
  currency_code: string;
  status: string;
  date: string;
}
