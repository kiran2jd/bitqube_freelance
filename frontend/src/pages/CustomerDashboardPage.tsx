import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/auth";
import { projectsApi, contractsApi } from "../api/marketplace";
import { Project, Contract } from "../types";
import { formatAmount } from "../utils/currency";
import {
  FolderPlus,
  Briefcase,
  Users,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
} from "lucide-react";

export const CustomerDashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // MFA Setup state
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaData, setMfaData] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMsg, setMfaMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
      setIsLoadingData(true);
      try {
        const [projList, contList] = await Promise.all([
          projectsApi.list({ customer_id: user.id }),
          contractsApi.list(),
        ]);
        setProjects(projList);
        setContracts(contList);
      } catch {
        // Fallback to empty states gracefully
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleStartMfaSetup = async () => {
    setMfaLoading(true);
    setMfaMsg(null);
    try {
      const data = await authApi.setupMfa();
      setMfaData(data);
      setShowMfaSetup(true);
    } catch (err: unknown) {
      setMfaMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to initiate MFA setup" });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaMsg(null);
    try {
      await authApi.enableMfa(totpCode);
      setMfaMsg({ type: "success", text: "Multi-Factor Authentication enabled successfully!" });
      setShowMfaSetup(false);
      await refreshUser();
    } catch (err: unknown) {
      setMfaMsg({ type: "error", text: err instanceof Error ? err.message : "Invalid verification code" });
    } finally {
      setMfaLoading(false);
    }
  };

  const totalProposalsReceived = projects.reduce((acc, p) => acc + (p.proposals_count || 0), 0);
  const activeContractsCount = contracts.filter((c) => c.status === "active").length;
  const totalAgreedAmount = contracts.reduce((acc, c) => acc + Number(c.agreed_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Customer Workspace
              </span>
              <span className="text-xs text-slate-400">
                Country: <strong className="text-slate-200">{user?.country_code}</strong> · Currency: <strong className="text-slate-200">{user?.preferred_currency}</strong>
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome back, {user?.first_name} {user?.last_name}!
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your project briefs, evaluate proposals, and track milestone deliverables.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all duration-150 hover:-translate-y-0.5"
            >
              <FolderPlus className="w-4 h-4" />
              Post a Project
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{projects.length}</div>
            <p className="text-xs text-slate-500 mt-1">Open client briefs</p>
          </div>

          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Proposals Received</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalProposalsReceived}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting your evaluation</p>
          </div>

          <Link
            to="/contracts"
            className="p-6 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-colors block"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Contracts</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{activeContractsCount}</div>
            <p className="text-xs text-slate-500 mt-1">In progress agreements &rarr;</p>
          </Link>

          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Contracted</span>
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatAmount(totalAgreedAmount, "USD").display}
            </div>
            {formatAmount(totalAgreedAmount, "USD").conversionNote && (
              <p className="text-[11px] text-amber-400 font-medium mt-0.5">
                ~ {formatAmount(totalAgreedAmount, "USD").conversionNote}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">Total committed value</p>
          </div>
        </div>

        {/* Security & Account Protection Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              {user?.is_mfa_enabled ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Account Security
                  {user?.is_mfa_enabled ? (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      MFA Enabled
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      MFA Recommended
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Protect your contract authorizations and business payments with Time-Based One-Time Passwords (TOTP).
                </p>
              </div>
            </div>

            {!user?.is_mfa_enabled && !showMfaSetup && (
              <button
                onClick={handleStartMfaSetup}
                disabled={mfaLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700"
              >
                {mfaLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                Setup Two-Factor Auth
              </button>
            )}
          </div>

          {mfaMsg && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                mfaMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
              }`}
            >
              {mfaMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{mfaMsg.text}</span>
            </div>
          )}

          {showMfaSetup && mfaData && (
            <div className="mt-6 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-sm font-semibold text-white">Configure Authenticator App</h4>
              <p className="text-xs text-slate-400">
                1. Add the secret key below to Google Authenticator, Authy, or 1Password:
              </p>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300 select-all break-all">
                {mfaData.secret}
              </div>
              <form onSubmit={handleConfirmMfa} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    2. Enter 6-digit verification code from your app:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-40 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-center font-mono tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={mfaLoading || totpCode.length !== 6}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {mfaLoading ? "Verifying..." : "Verify & Enable MFA"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMfaSetup(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Projects & Activity Workspace */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Your Project Postings</h2>
              <p className="text-xs text-slate-400">Manage client requests and track incoming proposals.</p>
            </div>
            <Link
              to="/projects"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
            >
              Browse All Projects <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoadingData ? (
            <div className="py-12 flex justify-center items-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              <span className="text-xs">Loading projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No project briefs published yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Publish your first project requirements to connect with verified legal, financial, and technical consultants.
              </p>
              <Link
                to="/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                Create Project Brief
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                        {proj.category_name || "General"}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded capitalize">
                        ● {proj.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{proj.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{proj.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Proposals</span>
                      <span className="text-xs font-bold text-slate-200">
                        {proj.proposals_count} received
                      </span>
                    </div>

                    <Link
                      to={`/projects/${proj.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors"
                    >
                      Manage Brief
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
