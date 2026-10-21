import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { contractsApi } from "../api/marketplace";
import { Contract } from "../types";
import { formatAmount } from "../utils/currency";
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";

export const ContractsListPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await contractsApi.list();
        setContracts(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load contracts");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <FileText className="w-3.5 h-3.5" />
            Legally Binding Agreements
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Contract Workspace & <span className="text-indigo-400">Milestone Pipeline</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor active work agreements, milestone deliveries, and project sign-offs.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm font-medium">Loading your agreements...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No active or past contracts found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              When a client accepts a proposal or awards a project, the legally binding contract will appear here.
            </p>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              Browse Open Projects
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((c) => {
              const approvedCount = (c.milestones || []).filter((m) => m.status === "approved").length;
              const totalMilestones = c.milestones?.length || 1;
              const progressPct = Math.round((approvedCount / totalMilestones) * 100);

              return (
                <div
                  key={c.id}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-200 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        Terms v{c.terms_version}
                      </span>
                      {c.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          <Clock className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {c.project_title || "Marketplace Agreement"}
                    </h3>

                    <div className="text-xs text-slate-400 space-y-1 pt-1">
                      <p>
                        Client: <strong className="text-slate-200">{c.customer_name || "Client"}</strong>
                      </p>
                      <p>
                        Consultant:{" "}
                        <strong className="text-slate-200">{c.professional_name || "Professional"}</strong>
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Milestones Progress</span>
                        <span>{approvedCount}/{totalMilestones} Approved</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-4">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Agreed Value (USD)</span>
                      {(() => {
                        const { usdFormatted, inrFormatted } = formatAmount(
                          c.agreed_amount,
                          c.currency_code
                        );
                        return (
                          <>
                            <span className="text-sm font-bold text-emerald-400">
                              {usdFormatted}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ~ {inrFormatted} (INR)
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    <Link
                      to={`/contracts/${c.id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-800 group-hover:bg-indigo-600 text-white text-xs font-semibold transition-all group-hover:shadow-md group-hover:shadow-indigo-600/30"
                    >
                      View Workspace
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
