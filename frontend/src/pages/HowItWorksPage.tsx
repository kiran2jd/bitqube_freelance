import React from "react";
import { Link } from "react-router-dom";

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Discover & Post Requirements",
      desc: "Customers post projects with detailed requirements, deliverables, budget bounds, and preferred fiat currency (e.g. INR via Razorpay).",
    },
    {
      num: "02",
      title: "Receive Competitive Proposals",
      desc: "Verified professionals review open RFPs and submit detailed bids covering execution timeline, milestone breakdowns, and cost.",
    },
    {
      num: "03",
      title: "Execute Legally Binding Contracts",
      desc: "Once a proposal is selected, both parties digitally agree to terms of engagement and milestone schedule.",
    },
    {
      num: "04",
      title: "Secure Milestone Funding",
      desc: "Customer deposits milestone funds using supported checkout methods. Funds are tracked in our double-entry ledger.",
    },
    {
      num: "05",
      title: "Submit & Inspect Deliverables",
      desc: "Professionals upload deliverables into private object storage. Customers have 14 days to review and approve.",
    },
    {
      num: "06",
      title: "Settlement & Reciprocal Reviews",
      desc: "Approved milestones immediately allocate earnings to the professional minus platform fee. Both parties submit reviews.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
          How BitQube Freelance Works
        </h1>
        <p className="text-base text-slate-400 max-w-2xl mx-auto">
          An enterprise-grade marketplace designed for high-value professional engagements, milestone safety, and transparent fiat settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step) => (
          <div
            key={step.num}
            className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 relative overflow-hidden"
          >
            <span className="text-4xl font-extrabold text-indigo-500/20 absolute top-6 right-6 select-none">
              {step.num}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              {step.num}
            </div>
            <h3 className="text-lg font-bold text-white">{step.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-8 rounded-3xl bg-indigo-950/40 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div>
          <h3 className="text-xl font-bold text-white">Ready to hire or offer services?</h3>
          <p className="text-xs text-slate-400 mt-1">
            Join hundreds of vetted consultants and businesses on BitQube today.
          </p>
        </div>
        <Link
          to="/categories"
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shrink-0"
        >
          Explore Marketplace
        </Link>
      </div>
    </div>
  );
};
