import { ApiResponse, Credential, ProfessionalProfile, ServiceItem } from "../types";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

function getStoredToken(): string | null {
  return localStorage.getItem("bitqube_token");
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "An error occurred");
  }
  return json.data;
}

export const professionalsApi = {
  list: (params?: { offset?: number; limit?: number; query?: string; country?: string; verified_only?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.offset !== undefined) q.append("offset", params.offset.toString());
    if (params?.limit !== undefined) q.append("limit", params.limit.toString());
    if (params?.query) q.append("query", params.query);
    if (params?.country) q.append("country", params.country);
    if (params?.verified_only) q.append("verified_only", "true");
    return apiFetch<ProfessionalProfile[]>(`/professionals?${q.toString()}`);
  },

  getById: (id: string) => apiFetch<ProfessionalProfile>(`/professionals/${id}`),

  getMyProfile: () => apiFetch<ProfessionalProfile>("/professionals/me"),

  updateMyProfile: (payload: {
    display_name?: string;
    title?: string;
    biography?: string;
    country_code?: string;
    hourly_rate?: number;
    currency_code?: string;
    skills?: string[];
    professional_status?: string;
  }) =>
    apiFetch<ProfessionalProfile>("/professionals/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  submitCredential: (payload: {
    title: string;
    issuing_organization: string;
    credential_identifier?: string;
    document_id?: string;
  }) =>
    apiFetch<Credential>("/professionals/me/credentials", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyCredentials: () => apiFetch<Credential[]>("/professionals/me/credentials"),

  listServices: (params?: { category_id?: string; professional_id?: string; query?: string }) => {
    const q = new URLSearchParams();
    if (params?.category_id) q.append("category_id", params.category_id);
    if (params?.professional_id) q.append("professional_id", params.professional_id);
    if (params?.query) q.append("query", params.query);
    return apiFetch<ServiceItem[]>(`/services?${q.toString()}`);
  },

  createService: (payload: {
    category_id: string;
    title: string;
    description: string;
    price_type: "fixed" | "hourly";
    base_price: number;
    currency_code?: string;
    delivery_days: number;
  }) =>
    apiFetch<ServiceItem>("/services", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateService: (id: string, payload: Partial<ServiceItem>) =>
    apiFetch<ServiceItem>(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  archiveService: (id: string) =>
    apiFetch<{ message: string }>(`/services/${id}`, {
      method: "DELETE",
    }),
};
