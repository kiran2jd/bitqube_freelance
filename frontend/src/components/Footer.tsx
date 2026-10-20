import React from "react";
import { Link } from "react-router-dom";
import { Layers, ShieldCheck, CreditCard, Lock } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                BitQube <span className="text-indigo-400 font-normal">Freelance</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Connecting enterprises, high-growth startups, and entrepreneurs with verified independent professionals, specialized consultants, and boutique service firms worldwide.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Talent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span>Compliant Fiat Rails</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Double-Entry Ledger</span>
              </div>
            </div>
          </div>

          {/* Categories Column 1 */}
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-200 mb-4">
              Top Categories
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/categories" className="hover:text-white transition">Legal Services</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">Business Advisory</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">Financial Advisory</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">Web3 & Blockchain Developers</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">IT Consultancy</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">Web & Mobile Development</Link></li>
            </ul>
          </div>

          {/* Categories Column 2 */}
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-200 mb-4">
              Specialist Consulting
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/categories" className="hover:text-white transition">AI & Automation</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">Digital Marketing</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">Design & Creative Services</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">Accounting & Taxation</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">HR & Recruitment</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">Real Estate & Business Projects</Link></li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-200 mb-4">
              Platform & Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/how-it-works" className="hover:text-white transition">How It Works</Link></li>
              <li><Link to="/about" className="hover:text-white transition">About BitQube</Link></li>
              <li><Link to="/about" className="hover:text-white transition">Trust & Security</Link></li>
              <li><Link to="/about" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link to="/about" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><a href="https://www.bitqube.org" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 transition">Visit bitqube.org</a></li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimers & Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-900 space-y-4">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Regulated Services Notice:</strong> Legal, financial, tax, and investment advisory services must be provided strictly by qualified and authorized professionals in their respective jurisdictions. BitQube Freelance operates as an enabling discovery and transaction management platform.
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Fiat Currency & Ecosystem Notice:</strong> All initial transactions, milestone funding, and payouts are conducted in sovereign fiat currencies (defaulting to INR in India via Razorpay). BTQ and QUBEX are non-operational roadmap placeholders and are not active payment mechanisms or investment assets in this release.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 pt-4">
            <p>© {new Date().getFullYear()} BitQube Freelance (https://www.bitqube.org). All rights reserved.</p>
            <p>Engineered for high-trust global engagements.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
