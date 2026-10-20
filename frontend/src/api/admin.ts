import {
  ApiResponse,
  AuditLogEntry,
  Dispute,
  FeatureFlag,
  PendingCredential,
  PlatformMetrics,
} from "../types";

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
    throw new Error(json.error?.message || "An administrative operation failed");
  }
  return json.data;
}

export const adminApi = {
  getMetrics: () => apiFetch<PlatformMetrics>("/admin/metrics"),

  getPendingCredentials: () =>
    apiFetch<PendingCredential[]>("/admin/credentials/pending"),

  reviewCredential: (
    credentialId: string,
    status: "verified" | "rejected",
    rejectionReason?: string
  ) =>
    apiFetch<PendingCredential>(`/admin/credentials/${credentialId}/review`, {
      method: "POST",
      body: JSON.stringify({
        status,
        rejection_reason: rejectionReason,
      }),
    }),

  getDisputes: (statusFilter?: string) => {
    const q = statusFilter ? `?status_filter=${statusFilter}` : "";
    return apiFetch<Dispute[]>(`/admin/disputes${q}`);
  },

  resolveDispute: (
    disputeId: string,
    action: "refund_customer" | "release_to_professional" | "dismiss",
    resolutionNotes: string
  ) =>
    apiFetch<Dispute>(`/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      body: JSON.stringify({
        action,
        resolution_notes: resolutionNotes,
      }),
    }),

  getFeatureFlags: () => apiFetch<FeatureFlag[]>("/admin/feature-flags"),

  updateFeatureFlag: (key: string, value: boolean, description?: string) =>
    apiFetch<FeatureFlag>(`/admin/feature-flags/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ value, description }),
    }),

  getAuditLogs: (limit = 50, action?: string) => {
    const q = new URLSearchParams({ limit: limit.toString() });
    if (action) q.append("action", action);
    return apiFetch<AuditLogEntry[]>(`/admin/audit-logs?${q.toString()}`);
  },

  createDispute: (payload: {
    contract_id: string;
    milestone_id?: string;
    reason: string;
    description: string;
  }) =>
    apiFetch<Dispute>("/disputes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
