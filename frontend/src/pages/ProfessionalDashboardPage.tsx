import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { professionalsApi } from "../api/professionals";
import { proposalsApi, contractsApi } from "../api/marketplace";
import { api } from "../api/client";
import { ProfessionalProfile, Credential, ServiceItem, Category, Contract, Proposal } from "../types";
import { CredentialModal } from "../components/CredentialModal";
import { ServiceCreateModal } from "../components/ServiceCreateModal";
import {
  Award,
  CheckCircle2,
  Clock,
  Plus,
  Briefcase,
  Edit3,
  Star,
  ShieldCheck,
  AlertCircle,
  IndianRupee,
  Loader2,
  Tag,
  Package,
} from "lucide-react";

export const ProfessionalDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [myContracts, setMyContracts] = useState<Contract[]>([]);
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profData, credsData, catsData, propsData, contsData] = await Promise.all([
        professionalsApi.getMyProfile(),
        professionalsApi.getMyCredentials(),
        api.getCategories(),
        proposalsApi.getMyProposals().catch(() => []),
        contractsApi.list().catch(() => []),
      ]);
      setProfile(profData);
      setCredentials(credsData);
      setCategories(catsData);
      setMyProposals(propsData);
      setMyContracts(contsData);

      if (profData?.id) {
        const servs = await professionalsApi.listServices({ professional_id: profData.id });
        setServices(servs);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCredentialAdded = (newCred: Credential) => {
    setCredentials((prev) => [newCred, ...prev]);
  };

  const handleServiceAdded = (newService: ServiceItem) => {
    setServices((prev) => [newService, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium">Loading professional workspace...</p>
        </div>
      </div>
    );
  }

  const isVerified = profile?.verification_status === "verified";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-600/30">
              {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : user?.first_name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">
                  {profile?.display_name || `${user?.first_name} ${user?.last_name}`}
                </h1>
                {/* Verification Badge */}
                {profile?.verification_status === "verified" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Consultant
                  </span>
                )}
                {profile?.verification_status === "pending" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" /> Verification Pending
                  </span>
                )}
                {profile?.verification_status === "unverified" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-sm text-indigo-400 font-medium">
                {profile?.title || "Professional Consultant"}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span>Country: <strong className="text-slate-200">{profile?.country_code}</strong></span>
                <span>·</span>
                <span>
                  Rate:{" "}
                  <strong className="text-slate-200">
                    {profile?.hourly_rate
                      ? `${profile.currency_code} ${profile.hourly_rate}/hr`
                      : "Not specified"}
                  </strong>
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {profile?.rating_average ? Number(profile.rating_average).toFixed(1) : "5.0"}
                  <span className="text-slate-500 font-normal">({profile?.total_reviews_count || 0})</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
            >
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Browse Projects
            </Link>
            <Link
              to="/dashboard/professional/profile/edit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Link>
            <button
              onClick={() => setIsCredentialModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 font-semibold text-xs transition-colors border border-indigo-500/30"
            >
              <Award className="w-4 h-4 text-indigo-400" />
              Submit Credential
            </button>
            <button
              onClick={() => setIsServiceModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              Publish Service
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            to="/contracts"
            className="p-6 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-colors block"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Contracts</span>
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {myContracts.filter((c) => c.status === "active").length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Ongoing assignments &rarr;</p>
          </Link>

          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Proposals Sent</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{myProposals.length}</div>
            <p className="text-xs text-slate-500 mt-1">Submitted client bids</p>
          </div>

          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Earnings</span>
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              ₹{" "}
              {myContracts
                .filter((c) => c.status === "completed")
                .reduce((acc, c) => acc + Number(c.agreed_amount || 0), 0)
                .toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-500 mt-1">Completed milestone payouts</p>
          </div>

          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Services Listed</span>
              <Package className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{services.length}</div>
            <p className="text-xs text-slate-500 mt-1">Active client offerings</p>
          </div>
        </div>

        {/* Bio & Skills Preview */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-2">Professional Biography</h2>
          <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {profile?.biography || "No biography provided yet. Click 'Edit Profile' to add your background."}
          </p>

          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Specialized Skills
            </h3>
            {profile?.skills && profile.skills.length > 0 ? (
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
            ) : (
              <p className="text-xs text-slate-500 italic">No skills listed yet.</p>
            )}
          </div>
        </div>

        {/* Credentials & Verification Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                Professional Credentials & Licenses
              </h2>
              <p className="text-xs text-slate-400">
                Required for offering regulated services (Legal, Accounting, Financial Advisory).
              </p>
            </div>
            <button
              onClick={() => setIsCredentialModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Credential
            </button>
          </div>

          {credentials.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
              <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No professional credentials submitted yet.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Submit your bar council license, CPA accreditation, or degrees to receive verified status.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">{cred.title}</h4>
                    <p className="text-xs text-slate-400">{cred.issuing_organization}</p>
                    {cred.credential_identifier && (
                      <p className="text-[11px] font-mono text-slate-500">ID: {cred.credential_identifier}</p>
                    )}
                  </div>
                  <div>
                    {cred.verification_status === "verified" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {cred.verification_status === "pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" /> In Review
                      </span>
                    )}
                    {cred.verification_status === "rejected" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Services & Offerings Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                Service Offerings & Fixed Packages
              </h2>
              <p className="text-xs text-slate-400">
                Published packages allow clients to purchase defined scopes directly.
              </p>
            </div>
            <button
              onClick={() => setIsServiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Publish Offering
            </button>
          </div>

          {services.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No service offerings published yet.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Create structured packages to showcase your deliverables, turnaround times, and prices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {service.price_type === "fixed" ? "Fixed Price" : "Hourly"}
                      </span>
                      <span className="text-xs text-slate-400">{service.delivery_days} days delivery</span>
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-2">{service.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-3">{service.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Starting at</span>
                      <span className="text-base font-bold text-white">
                        ₹ {Number(service.base_price).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CredentialModal
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        onSuccess={handleCredentialAdded}
      />
      <ServiceCreateModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        categories={categories}
        onSuccess={handleServiceAdded}
        defaultCurrency={profile?.currency_code || "INR"}
        isVerified={isVerified}
      />
    </div>
  );
};
