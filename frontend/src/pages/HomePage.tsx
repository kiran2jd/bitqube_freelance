import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  Search,
  Sparkles,
  Award,
} from "lucide-react";
import { api } from "../api/client";
import { CategoryIcon } from "../components/CategoryIcon";
import { ComingSoonBanner } from "../components/ComingSoonBanner";
import { ShowcaseCarousel } from "../components/ShowcaseCarousel";

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: api.getCategories,
  });

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Global Talent Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Hire Top Independent Professionals & Consulting Firms.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            From corporate legal counsel and AI automation to blockchain engineering and management consultancy—execute mission-critical projects with milestone-backed security.
          </p>

          {/* Search Box */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur">
              <div className="flex items-center gap-3 px-3 py-2 w-full">
                <Search className="w-5 h-5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search 15 categories, skills, or specialized services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <Link
                to="/categories"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shrink-0 text-center"
              >
                Search
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
              <span>Popular:</span>
              <span className="text-slate-400 hover:text-indigo-400 cursor-pointer" onClick={() => setSearchQuery("AI")}>AI & Automation</span>
              <span className="text-slate-400 hover:text-indigo-400 cursor-pointer" onClick={() => setSearchQuery("Legal")}>Legal Services</span>
              <span className="text-slate-400 hover:text-indigo-400 cursor-pointer" onClick={() => setSearchQuery("Web3")}>Web3 Developers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic 10-Second Floating Showcase Carousel */}
      <section className="relative -mt-6">
        <ShowcaseCarousel />
      </section>

      {/* BTQ & QUBEX Informational Notice Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ComingSoonBanner />
      </section>

      {/* 15 Professional Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Briefcase className="w-4 h-4" />
              <span>Comprehensive Services Ecosystem</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              15 Master Professional Categories
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-md">
            Verified expertise across corporate advisory, technology, creative, and regulatory-compliant domains.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-6"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center">
            Failed to load service categories. Ensure the backend server is running.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="group relative rounded-2xl bg-slate-900/50 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 p-6 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                      <CategoryIcon name={category.icon_name} className="w-6 h-6" />
                    </div>
                    {category.is_regulated && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                        <Award className="w-3 h-3" />
                        Verified / Regulated
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {category.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {category.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-indigo-400 transition-colors">
                  <span>Explore Specialists</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4-Step Marketplace Flow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-14">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
              Structured Engagement Process
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              How BitQube Freelance Works
            </h2>
            <p className="text-sm text-slate-400 mt-3">
              Protected, transparent engagements backed by digital contracts, funded milestones, and immutable accounting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500 text-indigo-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="text-base font-bold text-white">Post Your Project</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Define scope, required skills, budget range, and timeline in your preferred fiat currency (INR, USD, etc.).
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500 text-indigo-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="text-base font-bold text-white">Compare Proposals</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive proposals from verified professionals. Evaluate credentials, portfolios, and proposed milestones.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500 text-indigo-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="text-base font-bold text-white">Fund Milestones</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Execute binding digital contracts. Authorize milestone payments securely via compliant fiat checkout.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500 text-indigo-400 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h4 className="text-base font-bold text-white">Review & Settle</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect deliverables in private storage. Approve to release funds, followed by reciprocal bilateral reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantees */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Credential Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Professionals offering legal, tax, or financial advisory undergo strict identity and license verification before receiving verified badges.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Double-Entry Accounting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every financial transaction writes immutable balancing ledger entries. Zero floating-point rounding errors and complete audit trails.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <Clock className="w-8 h-8 text-amber-400" />
            <h3 className="text-base font-bold text-white">Fair Dispute Resolution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              14-day deliverable inspection window and structured administrative dispute adjudication for complete confidence.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
