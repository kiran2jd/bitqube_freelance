import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { contractsApi } from "../api/marketplace";
import { Contract } from "../types";
import { useAuth } from "../context/AuthContext";
import { DeliverableSubmitModal } from "../components/DeliverableSubmitModal";
import { ReviewModal } from "../components/ReviewModal";
import { RazorpayCheckoutModal } from "../components/RazorpayCheckoutModal";
import { InvoiceModal } from "../components/InvoiceModal";
import { formatAmount } from "../utils/currency";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Star,
  FileCheck,
  CreditCard,
  FileText,
} from "lucide-react";

export const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals state
  const [activeDeliverableMilestone, setActiveDeliverableMilestone] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [checkoutMilestone, setCheckoutMilestone] = useState<{
    id: string;
    title: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [invoiceMilestoneId, setInvoiceMilestoneId] = useState<string | null>(null);

  const loadContract = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await contractsApi.getById(id);
      setContract(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load contract details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContract();
  }, [id]);

  const isCustomer = user && contract && user.id === contract.customer_id;
  const isProfessional =
    user &&
    contract &&
    user.roles.includes("professional") &&
    contract.customer_id !== user.id;

  const handleApproveMilestone = async (milestoneId: string) => {
    if (!id) return;
    if (!window.confirm("Approve this milestone deliverable and authorize completion?")) {
      return;
    }
    setActionLoading(`approve-${milestoneId}`);
    setError(null);
    try {
      const updated = await contractsApi.approveMilestoneDeliverable(id, milestoneId);
      setContract(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve deliverable");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium">Loading contract workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Contract Not Accessible</h2>
        <p className="text-sm text-slate-400 mb-6">{error || "Could not retrieve agreement."}</p>
        <Link
          to="/contracts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Link>
      </div>
    );
  }

  const counterpartName = isCustomer
    ? contract.professional_name || "Consultant"
    : contract.customer_name || "Client";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link
          to="/contracts"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Contracts
        </Link>

        {/* Contract Header */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Terms v{contract.terms_version}
              </span>
              {contract.status === "completed" ? (
                <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Contract Completed
                </span>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> In Execution
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {contract.project_title || "Marketplace Professional Services Agreement"}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span>
                Client: <strong className="text-slate-200">{contract.customer_name || "Client"}</strong>
              </span>
              <span>·</span>
              <span>
                Consultant:{" "}
                <strong className="text-slate-200">{contract.professional_name || "Professional"}</strong>
              </span>
              <span>·</span>
              <span>
                Accepted: <strong className="text-slate-200">{new Date(contract.accepted_at).toLocaleDateString()}</strong>
              </span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shrink-0 min-w-[220px] text-center space-y-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
              Agreed Contract Value
            </span>
            <div className="text-2xl font-extrabold text-white flex items-center justify-center">
              {formatAmount(contract.agreed_amount, contract.currency_code).display}
            </div>
            {formatAmount(contract.agreed_amount, contract.currency_code).conversionNote && (
              <p className="text-[11px] text-amber-400 font-medium">
                ~ {formatAmount(contract.agreed_amount, contract.currency_code).conversionNote}
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              Payment Rail: <span className="text-slate-200 font-medium">{contract.currency_code} (Settles in INR)</span>
            </p>

            {contract.status === "completed" && (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-md shadow-amber-500/20"
              >
                <Star className="w-3.5 h-3.5 fill-slate-950" />
                {reviewSubmitted ? "Review Submitted" : "Submit Review"}
              </button>
            )}
          </div>
        </div>

        {/* Milestone Deliverables & Execution */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                Milestone Deliverables ({contract.milestones?.length || 0})
              </h2>
              <p className="text-xs text-slate-400">
                Track deliverables, milestone funding, and client approvals.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {contract.milestones?.map((m, idx) => (
              <div
                key={m.id}
                className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-start md:justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-white">{m.title}</h4>
                    {/* Status badge */}
                    {m.status === "approved" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {m.status === "submitted" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Clock className="w-3 h-3" /> Submitted for Review
                      </span>
                    )}
                    {m.status === "funded" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <CreditCard className="w-3 h-3" /> Authorized & Funded
                      </span>
                    )}
                    {m.status === "pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Pending Funding
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>

                  {/* Deliverable Notes if submitted */}
                  {m.deliverable_notes && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                        Submitted Deliverable Summary
                      </span>
                      <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                        {m.deliverable_notes}
                      </p>
                      {m.submitted_at && (
                        <span className="text-[10px] text-slate-500 block pt-1">
                          Submitted on {new Date(m.submitted_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Target Date: {new Date(m.due_at).toLocaleDateString()}
                    </span>
                    {m.approved_at && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved on{" "}
                          {new Date(m.approved_at).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end justify-between self-stretch">
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-500 block">Milestone Amount</span>
                    <span className="text-lg font-bold text-white block">
                      {formatAmount(m.amount, m.currency_code || contract.currency_code).display}
                    </span>
                    {formatAmount(m.amount, m.currency_code || contract.currency_code).conversionNote && (
                      <span className="text-[10px] text-amber-400 font-medium block">
                        ~ {formatAmount(m.amount, m.currency_code || contract.currency_code).conversionNote}
                      </span>
                    )}
                  </div>

                  {/* Actions depending on role and status */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
                    {/* Customer funds pending milestone via Razorpay */}
                    {isCustomer && m.status === "pending" && (
                      <button
                        onClick={() =>
                          setCheckoutMilestone({
                            id: m.id,
                            title: m.title,
                            amount: Number(m.amount),
                            currency: m.currency_code || contract.currency_code,
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Authorize & Fund
                      </button>
                    )}

                    {/* View Tax Invoice when milestone has confirmed funding or approval */}
                    {(m.status === "funded" || m.status === "approved") && (
                      <button
                        onClick={() => setInvoiceMilestoneId(m.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/80 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        Tax Invoice
                      </button>
                    )}

                    {/* Professional submits deliverable */}
                    {isProfessional && (m.status === "funded" || m.status === "pending") && (
                      <button
                        onClick={() =>
                          setActiveDeliverableMilestone({ id: m.id, title: m.title })
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        Submit Deliverable
                      </button>
                    )}

                    {/* Customer approves submitted deliverable */}
                    {isCustomer && m.status === "submitted" && (
                      <button
                        onClick={() => handleApproveMilestone(m.id)}
                        disabled={actionLoading === `approve-${m.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                      >
                        {actionLoading === `approve-${m.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Approve & Release
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deliverable Submit Modal */}
      {activeDeliverableMilestone && (
        <DeliverableSubmitModal
          isOpen={!!activeDeliverableMilestone}
          onClose={() => setActiveDeliverableMilestone(null)}
          contractId={contract.id}
          milestoneId={activeDeliverableMilestone.id}
          milestoneTitle={activeDeliverableMilestone.title}
          onSuccess={(updated) => setContract(updated)}
        />
      )}

      {/* Performance Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        contractId={contract.id}
        counterpartName={counterpartName}
        onSuccess={() => setReviewSubmitted(true)}
      />

      {/* Razorpay Escrow Checkout Modal */}
      {checkoutMilestone && (
        <RazorpayCheckoutModal
          isOpen={!!checkoutMilestone}
          onClose={() => setCheckoutMilestone(null)}
          milestoneId={checkoutMilestone.id}
          milestoneTitle={checkoutMilestone.title}
          amount={checkoutMilestone.amount}
          currencyCode={checkoutMilestone.currency}
          onSuccess={() => {
            setCheckoutMilestone(null);
            loadContract();
          }}
        />
      )}

      {/* Official Tax Invoice & Escrow Receipt Modal */}
      {invoiceMilestoneId && (
        <InvoiceModal
          isOpen={!!invoiceMilestoneId}
          onClose={() => setInvoiceMilestoneId(null)}
          milestoneId={invoiceMilestoneId}
        />
      )}
    </div>
  );
};
