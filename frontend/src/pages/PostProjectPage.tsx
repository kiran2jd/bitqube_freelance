import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../api/marketplace";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  FolderPlus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  IndianRupee,
  Calendar,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export const PostProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState<number | string>("");
  const [budgetMax, setBudgetMax] = useState<number | string>(50000);
  const [deadlineDays, setDeadlineDays] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const activeCatId = categoryId || categories[0]?.id;
    if (!activeCatId) {
      setError("Please select a project category");
      return;
    }

    if (description.trim().length < 20) {
      setError("Project description must be at least 20 characters long");
      return;
    }

    const calculatedDeadline = new Date(
      Date.now() + deadlineDays * 24 * 60 * 60 * 1000
    ).toISOString();

    setIsSubmitting(true);
    try {
      const created = await projectsApi.create({
        category_id: activeCatId,
        title: title.trim(),
        description: description.trim(),
        budget_min: budgetMin !== "" ? Number(budgetMin) : undefined,
        budget_max: Number(budgetMax),
        currency_code: user?.preferred_currency || "INR",
        deadline: calculatedDeadline,
      });

      navigate(`/projects/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post project brief");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard/customer"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-xs text-slate-500">Client Brief Form</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Create a Project Brief</h1>
              <p className="text-xs text-slate-400">
                Publish your requirements to invite bids and proposals from top-rated professionals.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Project Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Enterprise Microservices Architecture Review & Security Audit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Category *
              </label>
              <select
                value={categoryId || categories[0]?.id || ""}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isLoadingCategories}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_regulated ? "(Regulated Services)" : ""}
                  </option>
                ))}
              </select>
              {selectedCategory?.is_regulated && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    Note: Bids for this category are limited to professionals with verified credentials and regulatory licenses.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Detailed Scope of Work & Deliverables *
              </label>
              <textarea
                required
                rows={6}
                placeholder="Describe your project goals, technical or legal requirements, expected timeline, milestones, and deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Minimum Budget (₹ Optional)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 20000"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Maximum Budget (₹ Required) *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    required
                    min={500}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Expected Completion Window (Days) *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  min={3}
                  max={365}
                  required
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Link
                to="/dashboard/customer"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing Brief...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Publish Project Brief
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
