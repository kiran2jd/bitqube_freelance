import React, { useState } from "react";
import { reviewsApi } from "../api/marketplace";
import { Review } from "../types";
import { X, Star, Loader2, AlertCircle, MessageSquare } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  counterpartName: string;
  onSuccess: (review: Review) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  contractId,
  counterpartName,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (comment.trim().length < 10) {
      setError("Please write at least 10 characters of feedback");
      return;
    }

    setIsSubmitting(true);
    try {
      const review = await reviewsApi.submit({
        contract_id: contractId,
        rating,
        comment: comment.trim(),
      });
      onSuccess(review);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
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
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Performance Review</h3>
            <p className="text-xs text-slate-400">
              Share your feedback for <span className="text-slate-200 font-semibold">{counterpartName}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled = (hoverRating ?? rating) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        isFilled
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600 hover:text-slate-500"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-sm font-semibold text-slate-200">
                {rating} of 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Written Evaluation & Feedback *
            </label>
            <div className="relative">
              <textarea
                required
                rows={4}
                placeholder="Describe your collaboration, timeliness, professionalism, and quality of deliverables..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
              />
              <MessageSquare className="absolute right-3 bottom-3 w-4 h-4 text-slate-600 pointer-events-none" />
            </div>
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
                  Publishing Review...
                </>
              ) : (
                "Publish Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
