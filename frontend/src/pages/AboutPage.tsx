import React from "react";
import { ShieldCheck, Globe, Scale, Lock } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-14">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
          About BitQube Freelance
        </h1>
        <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The premier global marketplace connecting enterprises, startups, and innovators with top-tier consultants, independent professionals, and specialist service firms.
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-300 leading-relaxed bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
        <h2 className="text-xl font-bold text-white">Our Mission</h2>
        <p>
          BitQube Freelance was established to bring enterprise-grade integrity, regulatory rigor, and transparent financial accounting to the global freelance and consulting economy.
        </p>
        <p>
          Unlike legacy platforms plagued by opaque dispute systems and unqualified providers in regulated fields, BitQube enforces professional credential verification, immutable double-entry ledger bookkeeping, and compliant fiat payment rails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Globe className="w-5 h-5" />
            <span>Official Ecosystem</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Part of the BitQube ecosystem hosted at <a href="https://www.bitqube.org" target="_blank" rel="noreferrer" className="text-indigo-400 underline">https://www.bitqube.org</a>.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Compliance & Regulation</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Legal, financial, tax, and investment advice is offered exclusively by licensed professionals verified in their jurisdiction.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Lock className="w-5 h-5" />
            <span>Zero-Trust Security</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Argon2id password hashing, mandatory admin MFA, presigned time-limited S3 object storage, and tamper-evident audit logging.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <Scale className="w-5 h-5" />
            <span>Fiat Payment Guarantee</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            MVP payments are executed strictly in authorized fiat currencies (INR via Razorpay) with authoritative webhook verification.
          </p>
        </div>
      </div>
    </div>
  );
};
