import { ApiResponse, Category, HealthStatus, PublicConfig } from "../types";

const API_BASE = "/api/v1";

async function request<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "An unexpected error occurred");
  }
  return json.data;
}

export const api = {
  getCategories: () => request<Category[]>("/categories"),
  getCategoryBySlug: (slug: string) => request<Category>(`/categories/${slug}`),
  getPublicConfig: () => request<PublicConfig>("/config/public"),
  getHealth: () => request<HealthStatus>("/health"),
};
