import { ApiResponse, Contract, Project, Proposal, Review } from "../types";

const API_BASE = "/api/v1";

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
    throw new Error(json.error?.message || "An error occurred with the request");
  }
  return json.data;
}

export const projectsApi = {
  list: (params?: {
    offset?: number;
    limit?: number;
    category_id?: string;
    customer_id?: string;
    status?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.offset !== undefined) q.append("offset", params.offset.toString());
    if (params?.limit !== undefined) q.append("limit", params.limit.toString());
    if (params?.category_id) q.append("category_id", params.category_id);
    if (params?.customer_id) q.append("customer_id", params.customer_id);
    if (params?.status) q.append("status", params.status);
    if (params?.search) q.append("search", params.search);
    return apiFetch<Project[]>(`/projects?${q.toString()}`);
  },

  getById: (id: string) => apiFetch<Project>(`/projects/${id}`),

  create: (payload: {
    category_id: string;
    title: string;
    description: string;
    budget_min?: number;
    budget_max: number;
    currency_code?: string;
    deadline: string;
  }) =>
    apiFetch<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<Project>) =>
    apiFetch<Project>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getProposals: (projectId: string) =>
    apiFetch<Proposal[]>(`/projects/${projectId}/proposals`),
};

export const proposalsApi = {
  submit: (payload: {
    project_id: string;
    amount: number;
    currency_code?: string;
    estimated_duration_days: number;
    cover_letter: string;
  }) =>
    apiFetch<Proposal>("/proposals", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyProposals: () => apiFetch<Proposal[]>("/proposals/me"),

  accept: (proposalId: string) =>
    apiFetch<Contract>(`/proposals/${proposalId}/accept`, {
      method: "POST",
    }),

  withdraw: (proposalId: string) =>
    apiFetch<Proposal>(`/proposals/${proposalId}/withdraw`, {
      method: "POST",
    }),
};

export const contractsApi = {
  list: () => apiFetch<Contract[]>("/contracts"),

  getById: (contractId: string) => apiFetch<Contract>(`/contracts/${contractId}`),

  fundMilestone: (contractId: string, milestoneId: string) =>
    apiFetch<Contract>(`/contracts/${contractId}/milestones/${milestoneId}/fund`, {
      method: "POST",
    }),

  submitMilestoneDeliverable: (
    contractId: string,
    milestoneId: string,
    deliverable_notes: string
  ) =>
    apiFetch<Contract>(`/contracts/${contractId}/milestones/${milestoneId}/submit`, {
      method: "POST",
      body: JSON.stringify({ deliverable_notes }),
    }),

  approveMilestoneDeliverable: (contractId: string, milestoneId: string) =>
    apiFetch<Contract>(`/contracts/${contractId}/milestones/${milestoneId}/approve`, {
      method: "POST",
      body: JSON.stringify({ confirmed: true }),
    }),
};

export const reviewsApi = {
  submit: (payload: { contract_id: string; rating: number; comment: string }) =>
    apiFetch<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getUserReviews: (userId: string) => apiFetch<Review[]>(`/reviews/user/${userId}`),
};
