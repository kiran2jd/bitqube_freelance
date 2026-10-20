import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../api/marketplace";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Briefcase,
  IndianRupee,
  Clock,
  ArrowRight,
  Loader2,
  FolderPlus,
  Users,
  Filter,
} from "lucide-react";

export const BrowseProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projects", search, categoryId],
    queryFn: () =>
      projectsApi.list({
        search: search.trim() || undefined,
        category_id: categoryId || undefined,
        status: "open",
      }),
  });

  const isCustomer = user?.roles.includes("customer");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Briefcase className="w-3.5 h-3.5" />
              Active Marketplace RFPs
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Explore Available <span className="text-indigo-400">Client Projects</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Discover verified project briefs from funded startups, global enterprises, and private businesses ready to contract top-tier consultants.
            </p>
          </div>

          <div>
            <Link
              to={isCustomer ? "/projects/new" : "/login"}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
            >
              <FolderPlus className="w-4 h-4" />
              Post a Project Brief
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="relative md:col-span-8">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects by keyword (e.g. Legal, Tax, Smart Contracts, DevOps)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative md:col-span-4">
              <div className="absolute left-3.5 top-3 pointer-events-none text-slate-500">
                <Filter className="w-4 h-4" />
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm font-medium">Loading open projects...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm text-rose-400">Failed to load projects. Please refresh.</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No open projects found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Check back soon or be the first to publish a new project requirement.
            </p>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <FolderPlus className="w-4 h-4" /> Post a Project Brief
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 line-clamp-1">
                      {proj.category_name || "General"}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                      ● {proj.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2">
                    {proj.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {proj.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Budget</span>
                      <span className="text-sm font-bold text-white flex items-center">
                        <IndianRupee className="w-3.5 h-3.5 text-indigo-400 mr-0.5" />
                        {proj.budget_min
                          ? `${Number(proj.budget_min).toLocaleString("en-IN")} - `
                          : "Up to "}
                        {Number(proj.budget_max).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-500 block">Proposals</span>
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {proj.proposals_count} bids
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Due {new Date(proj.deadline).toLocaleDateString()}
                    </span>

                    <Link
                      to={`/projects/${proj.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 group-hover:bg-indigo-600 text-white text-xs font-semibold transition-all group-hover:shadow-md group-hover:shadow-indigo-600/30"
                    >
                      View Details
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
