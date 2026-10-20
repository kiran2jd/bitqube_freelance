import React from "react";
import { Sparkles } from "lucide-react";

export const ComingSoonBanner: React.FC = () => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl my-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-slate-100">
                Future Ecosystem Roadmap
              </h4>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium border border-slate-700">
                Informational Notice
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              The MVP operates strictly on compliant fiat currencies (INR via Razorpay). Planned ecosystem features will activate post-regulatory approvals.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">BTQ Payments</span>
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
              Coming Soon
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">QUBEX Benefits</span>
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold bg-indigo-400/10 px-1.5 py-0.5 rounded">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
