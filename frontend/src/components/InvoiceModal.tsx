import React, { useEffect, useState } from "react";
import { paymentsApi } from "../api/payments";
import { Invoice } from "../types";
import {
  X,
  Printer,
  Loader2,
  AlertCircle,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId?: string;
  milestoneId?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  paymentId,
  milestoneId,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || (!paymentId && !milestoneId)) return;

    const fetchInvoice = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const inv = milestoneId
          ? await paymentsApi.getMilestoneInvoice(milestoneId)
          : await paymentsApi.getInvoice(paymentId!);
        setInvoice(inv);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load tax invoice");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [isOpen, paymentId, milestoneId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <p className="text-xs">Generating tax receipt...</p>
          </div>
        ) : invoice ? (
          <div className="space-y-6 text-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 px-2 py-0.5 rounded-lg bg-white/95 flex items-center justify-center shadow-sm">
                    <img src="/bitqube-logo.png" alt="BitQube Logo" className="h-6 w-auto object-contain" />
                  </div>
                  <span className="font-bold text-lg text-white">Freelance</span>
                </div>
                <p className="text-[11px] text-slate-400">Tax Invoice & Escrow Receipt</p>
                <p className="text-[11px] text-slate-500 font-mono">GSTIN: 29AAAAA0000A1Z5</p>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  <CheckCircle2 className="w-3 h-3" /> {invoice.status}
                </span>
                <p className="text-xs font-mono font-bold text-white pt-1">{invoice.invoice_number}</p>
                <p className="text-[11px] text-slate-400">
                  {new Date(invoice.date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Bill To & Consultant Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Billed To (Client)</span>
                <p className="font-semibold text-white">{invoice.payer_name}</p>
                <p className="text-slate-400">Verified Marketplace Client</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Beneficiary (Consultant)</span>
                <p className="font-semibold text-white">{invoice.payee_name}</p>
                <p className="text-slate-400">Independent Professional</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount ({invoice.currency_code})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="px-4 py-3 text-white font-medium">
                      Milestone: {invoice.milestone_title}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      ₹ {Number(invoice.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-400">
                      Platform Facilitation Fee (10% standard commission)
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400">
                      Included (₹ {Number(invoice.platform_fee).toLocaleString("en-IN")})
                    </td>
                  </tr>
                  <tr className="bg-slate-900/40 font-bold text-sm">
                    <td className="px-4 py-3 text-white">
                      Total Paid
                      <span className="block text-[11px] text-slate-400 font-normal">
                        Settled in INR via Razorpay (1 USD = ₹84.00)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-indigo-400">
                      <div className="flex items-center justify-end font-bold text-base">
                        <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                        {Number(invoice.amount).toLocaleString("en-IN")}
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal block">
                        ~ ${(Number(invoice.amount) / 84).toFixed(2)} USD
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Print and Close controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between print:hidden">
              <span className="text-[11px] text-slate-500">
                Payment Provider: Razorpay (India)
              </span>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
