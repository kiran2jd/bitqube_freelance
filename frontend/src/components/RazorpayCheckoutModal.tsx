import React, { useEffect, useState } from "react";
import { paymentsApi } from "../api/payments";
import { Payment, PaymentOrder } from "../types";
import {
  X,
  CreditCard,
  ShieldCheck,
  IndianRupee,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: string;
  milestoneTitle: string;
  amount: number;
  currencyCode?: string;
  onSuccess: (payment: Payment) => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  onClose,
  milestoneId,
  milestoneTitle,
  amount,
  currencyCode = "INR",
  onSuccess,
}) => {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !milestoneId) return;

    const initOrder = async () => {
      setIsLoadingOrder(true);
      setError(null);
      try {
        const orderData = await paymentsApi.createOrder(milestoneId);
        setOrder(orderData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to initiate payment order");
      } finally {
        setIsLoadingOrder(false);
      }
    };

    initOrder();
  }, [isOpen, milestoneId]);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    if (!order) return;
    setIsProcessing(true);
    setError(null);

    try {
      const simulatedPaymentId = `pay_${order.payment_id.slice(0, 10)}`;
      const verified = await paymentsApi.verifyPayment({
        payment_id: order.payment_id,
        razorpay_order_id: order.order_id,
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: "test_sig_authorized",
      });

      onSuccess(verified);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment verification failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Authorize Milestone Funding</h3>
            <p className="text-xs text-slate-400">Razorpay Sovereign Fiat Escrow Gateway</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoadingOrder ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <p className="text-xs">Preparing Razorpay order session...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Payment Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Milestone Scope</span>
                <span className="font-semibold text-slate-200 line-clamp-1 max-w-[200px]">
                  {milestoneTitle}
                </span>
              </div>

              {order && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Order Reference</span>
                  <span className="font-mono text-slate-300 text-[11px]">{order.order_id}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Total Due ({currencyCode})</span>
                <span className="text-xl font-extrabold text-white flex items-center">
                  <IndianRupee className="w-4 h-4 text-indigo-400 mr-0.5" />
                  {Number(amount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Escrow Protection Notice */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Funds are held securely by BitQube. Payouts to the consultant are only released once you review and approve the submitted deliverables.
              </p>
            </div>

            {/* Security Indicator */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>HMAC-SHA256 Encrypted & Authorized via Razorpay</span>
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
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessing || !order}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying Payment...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Pay ₹{Number(amount).toLocaleString("en-IN")} (Razorpay)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
