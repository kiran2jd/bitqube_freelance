import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { professionalsApi } from "../api/professionals";
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2, User } from "lucide-react";

export const ProfessionalProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [biography, setBiography] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number | string>("");
  const [currencyCode, setCurrencyCode] = useState("INR");
  const [countryCode, setCountryCode] = useState("IN");
  const [skillsString, setSkillsString] = useState("");
  const [status, setStatus] = useState<"available" | "busy" | "inactive">("available");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const p = await professionalsApi.getMyProfile();
        setDisplayName(p.display_name || "");
        setTitle(p.title || "");
        setBiography(p.biography || "");
        setHourlyRate(p.hourly_rate ?? "");
        setCurrencyCode(p.currency_code || "INR");
        setCountryCode(p.country_code || "IN");
        setSkillsString(p.skills ? p.skills.join(", ") : "");
        setStatus(p.professional_status || "available");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const skillsArray = skillsString
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      await professionalsApi.updateMyProfile({
        display_name: displayName.trim(),
        title: title.trim(),
        biography: biography.trim(),
        country_code: countryCode,
        hourly_rate: hourlyRate !== "" ? Number(hourlyRate) : undefined,
        currency_code: currencyCode,
        skills: skillsArray,
        professional_status: status,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard/professional");
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium">Loading profile editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard/professional"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-xs text-slate-500">Professional Settings</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Edit Professional Profile</h1>
              <p className="text-xs text-slate-400">
                Update how you appear to prospective enterprise clients and businesses.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Profile updated successfully! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Display / Firm Name *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Professional Title / Specialization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Tax Consultant & Corporate Law Advisor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Executive Biography & Track Record *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Highlight your domain experience, key achievements, regulatory accreditations, and advisory approach..."
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Availability Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "available" | "busy" | "inactive")}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="available">Available for Projects</option>
                  <option value="busy">Busy / High Load</option>
                  <option value="inactive">Inactive / Not Taking Work</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Currency
                </label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hourly Rate ({currencyCode})
                </label>
                <input
                  type="number"
                  min={0}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Skills & Expertise Tags
                </label>
                <span className="text-[11px] text-slate-500">Comma-separated</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Corporate Tax, GST Filing, Financial Auditing, IFRS, Mergers & Acquisitions"
                value={skillsString}
                onChange={(e) => setSkillsString(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Link
                to="/dashboard/professional"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
