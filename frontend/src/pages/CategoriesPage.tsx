import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Award, ArrowRight } from "lucide-react";
import { api } from "../api/client";
import { CategoryIcon } from "../components/CategoryIcon";

export const CategoriesPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filterRegulated, setFilterRegulated] = useState<boolean | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: api.getCategories,
  });

  const filtered = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filterRegulated === null ? true : cat.is_regulated === filterRegulated;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Explore Professional Categories
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl">
          Browse verified independent consultants, specialized agencies, and technical specialists across 15 core disciplines.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800/80 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Filter categories by name or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterRegulated(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterRegulated === null
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All Categories ({categories.length})
          </button>
          <button
            onClick={() => setFilterRegulated(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              filterRegulated === true
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Regulated Services
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                    <CategoryIcon name={category.icon_name} className="w-6 h-6" />
                  </div>
                  {category.is_regulated && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Authorized Only
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{category.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {category.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400">
                <span>View Listings</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
