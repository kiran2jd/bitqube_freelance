import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { professionalsApi } from "../api/professionals";
import { ProfessionalProfile, ServiceItem } from "../types";
import {
  ShieldCheck,
  Star,
  Tag,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Award,
  Package,
  Loader2,
  FolderPlus,
  AlertCircle,
} from "lucide-react";

export const ProfessionalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [prof, servs] = await Promise.all([
          professionalsApi.getById(id),
          professionalsApi.listServices({ professional_id: id }),
        ]);
        setProfile(prof);
        setServices(servs);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load consultant profile");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium">Loading consultant profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Professional Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error || "Could not find profile."}</p>
        <Link
          to="/professionals"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link
          to="/professionals"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Professionals
        </Link>

        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-600/30 shrink-0">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white">{profile.display_name}</h1>
                {profile.verification_status === "verified" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4" /> Verified Consultant
                  </span>
                )}
              </div>
              <p className="text-base text-indigo-400 font-medium">{profile.title}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {profile.country_code}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {profile.rating_average ? profile.rating_average.toFixed(1) : "5.0"}
                  <span className="text-slate-500 font-normal">({profile.total_reviews_count || 0} reviews)</span>
                </span>
                {profile.hourly_rate && (
                  <>
                    <span>·</span>
                    <span className="text-slate-200 font-semibold">
                      {profile.currency_code} {profile.hourly_rate} / hour
                    </span>
                  </>
                )}
                <span>·</span>
                <span className="text-emerald-400 font-medium capitalize">
                  ● {profile.professional_status}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col gap-3">
            <Link
              to="/categories"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              Invite to Project
            </Link>
          </div>
        </div>

        {/* Executive Bio & Background */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-3">
              About & Advisory Background
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {profile.biography}
            </p>
          </div>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="pt-6 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Core Competencies & Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-indigo-300 border border-slate-700"
                  >
                    <Tag className="w-3 h-3 text-indigo-400" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Verified Credentials */}
        {profile.credentials && profile.credentials.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              Verified Credentials & Accreditations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">{cred.title}</h4>
                    <p className="text-xs text-slate-400">{cred.issuing_organization}</p>
                    {cred.credential_identifier && (
                      <p className="text-[11px] font-mono text-slate-500">License: {cred.credential_identifier}</p>
                    )}
                  </div>
                  {cred.verification_status === "verified" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Published Services Packages */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
          <h2 className="text-base font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Service Offerings & Packages
          </h2>

          {services.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">This consultant has not listed fixed packages yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                You can invite them directly to submit a custom proposal for your project requirements.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {srv.price_type === "fixed" ? "Fixed Price" : "Hourly"}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {srv.delivery_days} days
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-2">{srv.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Price</span>
                      <span className="text-base font-bold text-white">
                        ₹ {srv.base_price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <Link
                      to="/categories"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                    >
                      Book Service
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
