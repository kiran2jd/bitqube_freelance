import React, { useState } from "react";
import { contractsApi } from "../api/marketplace";
import { Contract } from "../types";
import { X, CheckCircle2, Loader2, AlertCircle, FileCheck } from "lucide-react";

interface DeliverableSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  milestoneId: string;
  milestoneTitle: string;
  onSuccess: (updatedContract: Contract) => void;
}

export const DeliverableSubmitModal: React.FC<DeliverableSubmitModalProps> = ({
  isOpen,
  onClose,
  contractId,
  milestoneId,
  milestoneTitle,
  onSuccess,
}) => {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (notes.trim().length < 10) {
      setError("Please describe the deliverables completed (minimum 10 characters)");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await contractsApi.submitMilestoneDeliverable(
        contractId,
        milestoneId,
        notes.trim()
      );
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit deliverable");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Submit Deliverables</h3>
            <p className="text-xs text-slate-400 line-clamp-1">
              Milestone: <span className="text-slate-200 font-semibold">{milestoneTitle}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deliverable Summary & Access Instructions *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Detail the files, staging links, documentation, reports, or repositories ready for client inspection..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Submit for Approval
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
