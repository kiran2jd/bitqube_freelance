import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { professionalsApi } from "../api/professionals";
import {
  Search,
  ShieldCheck,
  Star,
  Tag,
  Loader2,
  Users,
  MapPin,
  ArrowRight,
} from "lucide-react";

export const FindProfessionalsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const {
    data: professionals = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["professionals", searchQuery, countryFilter, verifiedOnly],
    queryFn: () =>
      professionalsApi.list({
        query: searchQuery.trim() || undefined,
        country: countryFilter || undefined,
        verified_only: verifiedOnly ? true : undefined,
      }),
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            Verified Professional Network
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Find World-Class <span className="text-indigo-400">Independent Experts</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Discover verified legal consultants, financial advisors, blockchain architects, and technology leaders ready to deliver high-impact results.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="relative md:col-span-6">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, expertise, or skill (e.g. Tax, Smart Contracts, AI)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Countries</option>
                <option value="IN">India (IN)</option>
                <option value="US">United States (US)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="AE">United Arab Emirates (AE)</option>
                <option value="SG">Singapore (SG)</option>
              </select>
            </div>

            <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3 px-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                Verified Only
              </label>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm font-medium">Discovering matching professionals...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm text-rose-400">Failed to load professional directory. Please refresh.</p>
          </div>
        ) : professionals.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No professionals found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your search criteria or removing filter constraints.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map((prof) => (
              <div
                key={prof.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-600/30">
                        {prof.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {prof.display_name}
                        </h3>
                        <p className="text-xs text-slate-400">{prof.title}</p>
                      </div>
                    </div>

                    {prof.verification_status === "verified" && (
                      <span
                        title="Identity & Credentials Verified by BitQube"
                        className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {prof.biography}
                  </p>

                  {/* Skills tags */}
                  {prof.skills && prof.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {prof.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                        >
                          <Tag className="w-2.5 h-2.5 text-indigo-400" />
                          {skill}
                        </span>
                      ))}
                      {prof.skills.length > 4 && (
                        <span className="text-[11px] text-slate-500 self-center">
                          +{prof.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold mb-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{prof.rating_average ? prof.rating_average.toFixed(1) : "5.0"}</span>
                      <span className="text-slate-500 font-normal">({prof.total_reviews_count || 0})</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {prof.country_code}
                      {prof.hourly_rate && (
                        <span className="ml-1 text-slate-200 font-semibold">
                          · {prof.currency_code} {prof.hourly_rate}/hr
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/professionals/${prof.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold transition-all group-hover:shadow-md group-hover:shadow-indigo-600/30"
                  >
                    View Profile
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
