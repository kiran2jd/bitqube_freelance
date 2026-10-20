import React, { useState } from "react";
import { professionalsApi } from "../api/professionals";
import { Category, ServiceItem } from "../types";
import { X, Briefcase, Loader2, AlertCircle } from "lucide-react";

interface ServiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: (service: ServiceItem) => void;
  defaultCurrency?: string;
  isVerified?: boolean;
}

export const ServiceCreateModal: React.FC<ServiceCreateModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
  defaultCurrency = "INR",
  isVerified = false,
}) => {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceType, setPriceType] = useState<"fixed" | "hourly">("fixed");
  const [basePrice, setBasePrice] = useState<number>(5000);
  const [deliveryDays, setDeliveryDays] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedCategory?.is_regulated && !isVerified) {
      setError(
        `Category "${selectedCategory.name}" is regulated. Your professional profile must be verified by administrators before publishing services in this category.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await professionalsApi.createService({
        category_id: categoryId,
        title,
        description,
        price_type: priceType,
        base_price: Number(basePrice),
        currency_code: defaultCurrency,
        delivery_days: Number(deliveryDays),
      });
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create service listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Publish New Service Offering</h3>
            <p className="text-xs text-slate-400">
              Showcase a packaged consultation or fixed deliverable to prospective clients.
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
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Primary Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.is_regulated ? "(Regulated — Verification Required)" : ""}
                </option>
              ))}
            </select>
            {selectedCategory?.is_regulated && (
              <p className="mt-1 text-[11px] text-amber-400">
                ⚠️ Regulated profession: Requires verified license credentials.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Service Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Full-Stack Web Application Architecture Audit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Scope & Deliverables *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe what is included in this service package..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pricing Structure
              </label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as "fixed" | "hourly")}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly Rate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Price ({defaultCurrency}) *
              </label>
              <input
                type="number"
                min={100}
                required
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Estimated Delivery Time (Days) *
            </label>
            <input
              type="number"
              min={1}
              max={180}
              required
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Publish Offering
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
