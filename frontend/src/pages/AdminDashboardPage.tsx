import React, { useEffect, useState } from "react";
import { adminApi } from "../api/admin";
import {
  AuditLogEntry,
  Dispute,
  FeatureFlag,
  PendingCredential,
  PlatformMetrics,
} from "../types";
import {
  ShieldAlert,
  Users,
  Briefcase,
  TrendingUp,
  FileCheck2,
  AlertTriangle,
  History,
  Sliders,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Loader2,
  AlertCircle,
  RotateCw,
} from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "credentials" | "disputes" | "flags" | "logs"
  >("overview");

  // State
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [pendingCredentials, setPendingCredentials] = useState<PendingCredential[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      const [m, c, d, f, l] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getPendingCredentials(),
        adminApi.getDisputes(),
        adminApi.getFeatureFlags(),
        adminApi.getAuditLogs(30),
      ]);
      setMetrics(m);
      setPendingCredentials(c);
      setDisputes(d);
      setFeatureFlags(f);
      setAuditLogs(l);
    } catch (err: unknown) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load admin telemetry",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewCredential = async (
    credId: string,
    status: "verified" | "rejected"
  ) => {
    let reason: string | undefined = undefined;
    if (status === "rejected") {
      const input = window.prompt("Reason for rejecting credential:");
      if (!input) return;
      reason = input;
    }
    setActionLoading(`cred-${credId}`);
    try {
      await adminApi.reviewCredential(credId, status, reason);
      setNotification({
        type: "success",
        message: `Credential ${status === "verified" ? "approved" : "rejected"} successfully`,
      });
      loadData();
    } catch (err: unknown) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to review credential",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveDispute = async (
    disputeId: string,
    action: "refund_customer" | "release_to_professional" | "dismiss"
  ) => {
    const notes = window.prompt(
      `Enter resolution justification for action '${action.replace("_", " ")}':`
    );
    if (!notes) return;

    setActionLoading(`disp-${disputeId}`);
    try {
      await adminApi.resolveDispute(disputeId, action, notes);
      setNotification({
        type: "success",
        message: `Dispute resolved with action '${action}'`,
      });
      loadData();
    } catch (err: unknown) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to resolve dispute",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFlag = async (key: string, currentValue: boolean) => {
    setActionLoading(`flag-${key}`);
    try {
      await adminApi.updateFeatureFlag(key, !currentValue);
      setNotification({
        type: "success",
        message: `Feature flag '${key}' updated to ${!currentValue}`,
      });
      loadData();
    } catch (err: unknown) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update feature flag",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium">Loading administrative telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Administrative Command Center
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Platform Operations & Governance</h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Real-time authority over credential verifications, dispute resolutions, sovereign
              ledger monitoring, and platform ecosystem flags.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Telemetry
          </button>
        </div>

        {/* Notifications banner */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Platform Overview
          </button>

          <button
            onClick={() => setActiveTab("credentials")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "credentials"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FileCheck2 className="w-4 h-4" /> Verification Queue
            {pendingCredentials.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center">
                {pendingCredentials.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("disputes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "disputes"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Disputes & Resolutions
            {disputes.filter((d) => d.status === "opened").length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center">
                {disputes.filter((d) => d.status === "opened").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("flags")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "flags"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Sliders className="w-4 h-4" /> Feature Flags
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "logs"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <History className="w-4 h-4" /> Audit Trail
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase">Total Users</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{metrics.total_users}</div>
                <div className="text-[11px] text-slate-500">
                  {metrics.total_clients} Clients · {metrics.total_professionals} Consultants
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase">Contracts Executed</span>
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{metrics.total_contracts}</div>
                <div className="text-[11px] text-slate-500">Active marketplace agreements</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase">Gross Volume (GMV)</span>
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-white flex items-center">
                  <IndianRupee className="w-6 h-6 text-emerald-400 mr-1" />
                  {Number(metrics.total_gmv).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-500">Total contractual commitment</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase">Commission Revenue</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 flex items-center">
                  <IndianRupee className="w-6 h-6 mr-1" />
                  {Number(metrics.platform_commission_revenue).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-500">10% platform realized revenue</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  Pending Verifications Action Queue
                </h3>
                <p className="text-xs text-slate-400">
                  {pendingCredentials.length} professional credential submissions require administrative review.
                </p>
                <button
                  onClick={() => setActiveTab("credentials")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Open Verification Queue →
                </button>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Marketplace Disputes Queue
                </h3>
                <p className="text-xs text-slate-400">
                  {disputes.filter((d) => d.status === "opened").length} open disputes require
                  escrow adjudication and ledger resolution.
                </p>
                <button
                  onClick={() => setActiveTab("disputes")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Open Dispute Adjudication →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Credential Queue */}
        {activeTab === "credentials" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-400" />
              Professional Credential Review Queue ({pendingCredentials.length})
            </h2>

            {pendingCredentials.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No pending credential submissions in queue. All consultant licenses are reviewed!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Credential Title</th>
                      <th className="py-3 px-4">Issuing Authority</th>
                      <th className="py-3 px-4">Identifier / License</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pendingCredentials.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/80">
                        <td className="py-4 px-4 font-medium text-white">
                          <div>{c.professional_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.professional_email}</div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-indigo-300">{c.title}</td>
                        <td className="py-4 px-4">{c.issuing_organization}</td>
                        <td className="py-4 px-4 font-mono text-[11px]">{c.credential_identifier || "N/A"}</td>
                        <td className="py-4 px-4 text-slate-500 text-[11px]">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleReviewCredential(c.id, "verified")}
                            disabled={actionLoading === `cred-${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReviewCredential(c.id, "rejected")}
                            disabled={actionLoading === `cred-${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Disputes */}
        {activeTab === "disputes" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Marketplace Dispute Adjudication ({disputes.length})
            </h2>

            {disputes.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Zero active disputes recorded. Platform operations healthy!
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((d) => (
                  <div
                    key={d.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-start md:justify-between gap-6"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            d.status === "opened"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : d.status.startsWith("resolved")
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {d.status}
                        </span>
                        <h4 className="text-base font-bold text-white">{d.reason}</h4>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                        {d.description}
                      </p>

                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>Raised by: <strong className="text-slate-300">{d.raised_by_name || "Counterparty"}</strong></span>
                        <span>·</span>
                        <span>Contract ID: <span className="font-mono text-slate-400">{d.contract_id.slice(0, 8)}...</span></span>
                        <span>·</span>
                        <span>Lodged on {new Date(d.created_at).toLocaleDateString()}</span>
                      </div>

                      {d.resolution_notes && (
                        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-xs">
                          <strong>Admin Resolution Notes:</strong> {d.resolution_notes}
                        </div>
                      )}
                    </div>

                    {d.status === "opened" && (
                      <div className="shrink-0 flex flex-col gap-2">
                        <button
                          onClick={() => handleResolveDispute(d.id, "refund_customer")}
                          disabled={actionLoading === `disp-${d.id}`}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-sm"
                        >
                          Refund Client
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d.id, "release_to_professional")}
                          disabled={actionLoading === `disp-${d.id}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm"
                        >
                          Release Payout
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d.id, "dismiss")}
                          disabled={actionLoading === `disp-${d.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all border border-slate-700"
                        >
                          Dismiss Dispute
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Feature Flags */}
        {activeTab === "flags" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                Platform Feature Flags & Ecosystem Toggles
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure runtime feature availability without altering codebase or initiating deployments.
              </p>
            </div>

            <div className="space-y-4">
              {featureFlags.map((f) => (
                <div
                  key={f.key}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">{f.key}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          f.value
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {f.value ? "Active" : "Disabled (MVP Constraint)"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{f.description}</p>
                    <span className="text-[10px] text-slate-500 block pt-1">
                      Last Updated: {new Date(f.updated_at).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(f.key, f.value)}
                    disabled={actionLoading === `flag-${f.key}`}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      f.value ? "bg-indigo-600" : "bg-slate-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        f.value ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Audit Logs */}
        {activeTab === "logs" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Administrative Audit Trail ({auditLogs.length} recent events)
            </h2>

            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No administrative actions logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Entity Type</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-900/80">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(l.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-indigo-400 font-bold">{l.action}</td>
                        <td className="py-3 px-4 text-slate-300">{l.actor_email || "System"}</td>
                        <td className="py-3 px-4 uppercase text-[10px] text-slate-400">
                          {l.entity_type}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{l.ip_address || "127.0.0.1"}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                          {JSON.stringify(l.metadata)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
