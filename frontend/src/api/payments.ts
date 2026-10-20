import { ApiResponse, Invoice, LedgerEntry, Payment, PaymentOrder } from "../types";

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
    throw new Error(json.error?.message || "An error occurred with payment processing");
  }
  return json.data;
}

export const paymentsApi = {
  createOrder: (milestone_id: string) =>
    apiFetch<PaymentOrder>("/payments/orders", {
      method: "POST",
      body: JSON.stringify({ milestone_id }),
    }),

  verifyPayment: (payload: {
    payment_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    apiFetch<Payment>("/payments/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getInvoice: (payment_id: string) =>
    apiFetch<Invoice>(`/payments/${payment_id}/invoice`),

  getMilestoneInvoice: (milestone_id: string) =>
    apiFetch<Invoice>(`/payments/milestones/${milestone_id}/invoice`),

  getLedgerEntries: (payment_id?: string) => {
    const q = payment_id ? `?payment_id=${payment_id}` : "";
    return apiFetch<LedgerEntry[]>(`/payments/ledger${q}`);
  },
};
