import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { projectsApi, proposalsApi } from "../api/marketplace";
import { Project, Proposal } from "../types";
import { useAuth } from "../context/AuthContext";
import { SubmitProposalModal } from "../components/SubmitProposalModal";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  IndianRupee,
  Users,
  ShieldCheck,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  const isOwner = user && project && user.id === project.customer_id;
  const isProfessional = user?.roles.includes("professional");

  const loadProjectData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const proj = await projectsApi.getById(id);
      setProject(proj);

      if (user && (user.id === proj.customer_id || user.roles.includes("administrator"))) {
        const props = await projectsApi.getProposals(id);
        setProposals(props);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project brief");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id, user]);

  const handleAcceptProposal = async (proposalId: string) => {
    if (!window.confirm("Accept this proposal and generate formal contract milestones?")) {
      return;
    }

    setIsAccepting(proposalId);
    setError(null);
    try {
      const contract = await proposalsApi.accept(proposalId);
      navigate(`/contracts/${contract.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept proposal");
      setIsAccepting(null);
    }
  };

  const handleProposalSubmitted = (newProposal: Proposal) => {
    setProposals((prev) => [newProposal, ...prev]);
    if (project) {
      setProject({
        ...project,
        proposals_count: project.proposals_count + 1,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium">Loading project brief...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Project Brief Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error || "Could not find requested project."}</p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Project Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Projects
        </Link>

        {/* Project Header Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {project.category_name || "General"}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ● {project.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {project.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span>
                Posted by <strong className="text-slate-200">{project.customer_name || "Client"}</strong>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Due {new Date(project.deadline).toLocaleDateString()}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                {project.proposals_count} Proposals Received
              </span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shrink-0 min-w-[220px] text-center space-y-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
              Allocated Budget
            </span>
            <div className="text-2xl font-extrabold text-white flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-indigo-400 mr-1" />
              {Number(project.budget_max).toLocaleString("en-IN")}
            </div>
            {project.budget_min && (
              <p className="text-[11px] text-slate-400">
                Min: ₹{Number(project.budget_min).toLocaleString("en-IN")}
              </p>
            )}

            {isProfessional && project.status === "open" && (
              <button
                onClick={() => setIsProposalModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all duration-150"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Proposal
              </button>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Sign In to Bid
              </Link>
            )}
          </div>
        </div>

        {/* Project Description */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Scope of Work & Deliverables
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>

        {/* Client Proposals Management Section (Only visible to project owner) */}
        {isOwner && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Received Proposals ({proposals.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Compare bids from independent experts and award the project contract.
                </p>
              </div>
            </div>

            {proposals.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No proposals submitted yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Qualified consultants are reviewing your brief. Bids will appear here once submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-start md:justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                          {prop.professional_name ? prop.professional_name.charAt(0).toUpperCase() : "P"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">
                              {prop.professional_name || "Independent Professional"}
                            </h4>
                            {prop.is_verified && (
                              <span className="p-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{prop.professional_title || "Consultant"}</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                        {prop.cover_letter}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {prop.professional_rating ? prop.professional_rating.toFixed(1) : "5.0"}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Estimated {prop.estimated_duration_days} days
                        </span>
                        <span>·</span>
                        <span className="capitalize text-slate-300 font-medium">
                          Status: {prop.status}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end justify-between self-stretch">
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-500 block">Bid Amount</span>
                        <span className="text-xl font-extrabold text-white flex items-center">
                          <IndianRupee className="w-4 h-4 text-indigo-400 mr-0.5" />
                          {Number(prop.amount).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {project.status === "open" && prop.status === "submitted" && (
                        <button
                          onClick={() => handleAcceptProposal(prop.id)}
                          disabled={isAccepting === prop.id}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 mt-4"
                        >
                          {isAccepting === prop.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accept Proposal
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Proposal Modal */}
      {project && (
        <SubmitProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          projectId={project.id}
          projectTitle={project.title}
          defaultCurrency={project.currency_code}
          onSuccess={handleProposalSubmitted}
        />
      )}
    </div>
  );
};
