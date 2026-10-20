import { ApiResponse, User } from "../types";

const API_BASE = "/api/v1";

function getStoredToken(): string | null {
  return localStorage.getItem("bitqube_token");
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem("bitqube_token", token);
  } else {
    localStorage.removeItem("bitqube_token");
  }
}

async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    throw new Error(json.error?.message || "An authentication error occurred");
  }
  return json.data;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: "customer" | "professional";
  country_code?: string;
  preferred_currency?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  totp_code?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in_seconds: number;
  user: User;
  requires_mfa: boolean;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    authFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    authFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () =>
    authFetch<{ message: string }>("/auth/logout", {
      method: "POST",
    }),

  getMe: () => authFetch<User>("/users/me"),

  updateMe: (payload: { first_name?: string; last_name?: string; preferred_currency?: string }) =>
    authFetch<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  setupMfa: () =>
    authFetch<{ secret: string; otpauth_url: string }>("/users/me/mfa/setup", {
      method: "POST",
    }),

  enableMfa: (totp_code: string) =>
    authFetch<{ message: string }>("/users/me/mfa/enable", {
      method: "POST",
      body: JSON.stringify({ totp_code }),
    }),

  forgotPassword: (email: string) =>
    authFetch<{ message: string; dev_reset_token?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    authFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),
};
