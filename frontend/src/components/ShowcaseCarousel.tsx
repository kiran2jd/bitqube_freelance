import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bot,
  FileText,
  Star,
  ArrowRight,
  CheckCircle2,
  Lock,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";

interface SlideData {
  id: number;
  categoryBadge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  accentGradient: string;
  glowColor: string;
  mockupType: "credential" | "escrow" | "ai" | "invoice";
}

const SLIDES: SlideData[] = [
  {
    id: 0,
    categoryBadge: "Verified Credentials · Legal & Finance",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    title: "Hire Legally Authorized & Verified Consultants",
    subtitle:
      "Eliminate impersonation and scam risk. In regulated domains like Corporate Law and Chartered Accountancy, every professional's license is verified by platform governance before they can bid.",
    ctaPrimaryText: "Explore Verified Consultants",
    ctaPrimaryLink: "/professionals",
    ctaSecondaryText: "Browse Categories",
    ctaSecondaryLink: "/categories",
    accentGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    glowColor: "shadow-emerald-500/20",
    mockupType: "credential",
  },
  {
    id: 1,
    categoryBadge: "Sovereign Fiat Escrow · USD Display with INR Settlement",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    title: "Zero Financial Risk with Milestone Escrow Vault",
    subtitle:
      "Client funds stay locked safely in an audited holding ledger until you inspect and approve deliverables. Independent consultants work with peace of mind knowing funds are verified upfront.",
    ctaPrimaryText: "How Escrow Works",
    ctaPrimaryLink: "/how-it-works",
    ctaSecondaryText: "Post a Protected Project",
    ctaSecondaryLink: "/projects/new",
    accentGradient: "from-indigo-500/20 via-purple-500/10 to-transparent",
    glowColor: "shadow-indigo-500/20",
    mockupType: "escrow",
  },
  {
    id: 2,
    categoryBadge: "Enterprise AI, Automation & Web3",
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    title: "Deploy Production AI Systems & Intelligent Workflows",
    subtitle:
      "Connect with specialized machine learning engineers, full-stack LLM architects, and smart contract auditors ready to build and scale your technological competitive advantage.",
    ctaPrimaryText: "Browse AI Services",
    ctaPrimaryLink: "/projects",
    ctaSecondaryText: "Find Developers",
    ctaSecondaryLink: "/professionals",
    accentGradient: "from-violet-500/20 via-indigo-500/10 to-transparent",
    glowColor: "shadow-violet-500/20",
    mockupType: "ai",
  },
  {
    id: 3,
    categoryBadge: "Automated GST Invoicing & Compliance",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    title: "Instant Tax Receipts & Double-Entry Ledger",
    subtitle:
      "Never scramble for invoices or accounting reconciliation. BitQube automatically generates legally compliant GST tax receipts with platform fee breakdowns the instant a milestone is released.",
    ctaPrimaryText: "Learn About Platform Governance",
    ctaPrimaryLink: "/about",
    ctaSecondaryText: "Register Free",
    ctaSecondaryLink: "/register",
    accentGradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    glowColor: "shadow-amber-500/20",
    mockupType: "invoice",
  },
];

const ROTATION_INTERVAL_MS = 10000; // 10 seconds

export const ShowcaseCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    setProgress(0);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    setProgress(0);
  }, []);

  const goToSlide = (idx: number) => {
    setCurrentSlide(idx);
    setProgress(0);
  };

  // Timer loop with smooth progress increment
  useEffect(() => {
    if (isPaused) return;

    const tickInterval = 100; // every 100ms
    const step = (tickInterval / ROTATION_INTERVAL_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + step;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const slide = SLIDES[currentSlide];

  return (
    <div
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Outer Floating Glow Frame */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl transition-all duration-700 backdrop-blur-xl ${slide.glowColor}`}
      >
        {/* Ambient Gradient Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${slide.accentGradient} pointer-events-none transition-all duration-700`}
        />

        {/* 10-Second Progress Indicator Bar at Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 z-20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Carousel Content Container */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-14">
          {/* Left Column: Narrative & Actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${slide.badgeColor}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {slide.categoryBadge}
              </span>

              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-full border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Auto-floats every 10s
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              {slide.title}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {slide.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to={slide.ctaPrimaryLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{slide.ctaPrimaryText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to={slide.ctaSecondaryLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700/80 transition-all"
              >
                <span>{slide.ctaSecondaryText}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Mockup Screen Graphic */}
          <div className="lg:col-span-5 flex justify-center">
            {slide.mockupType === "credential" && (
              <div className="w-full max-w-sm bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 relative transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Bar Council Verified</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    BCI/MAH/2015
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/40">
                    AM
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                      Adv. Arjun Mehta
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                    </h4>
                    <p className="text-xs text-indigo-400 font-medium">Senior Legal Counsel</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Specializing in commercial contract audits, DPDP Act compliance, and Web3 protocol frameworks.
                </p>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>4.95</span>
                    <span className="text-slate-500 font-normal">(24 reviews)</span>
                  </div>
                  <span className="font-extrabold text-white">$45 / hr <span className="text-slate-400 font-normal">(~ ₹3,780)</span></span>
                </div>
              </div>
            )}

            {slide.mockupType === "escrow" && (
              <div className="w-full max-w-sm bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 relative transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    <span>Digital Lockbox</span>
                  </div>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                    Escrow Protected
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Milestone 1 Funded</span>
                  <div className="text-2xl font-black text-white flex items-center">
                    $ 300.00 USD
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Razorpay Authorized: ₹ 25,200.00 INR
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Consultant Payout (90%)</span>
                    <strong className="text-white">$ 270.00 (~ ₹22,680)</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>BitQube Platform Fee (10%)</span>
                    <strong className="text-slate-300">$ 30.00 (~ ₹2,520)</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Deliverable Review
                  </span>
                </div>
              </div>
            )}

            {slide.mockupType === "ai" && (
              <div className="w-full max-w-sm bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 relative transform hover:scale-105 transition-transform duration-300 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-400 font-bold uppercase text-[11px]">
                    <Bot className="w-4 h-4" />
                    <span>AI Agent Execution</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2 text-[11px] text-slate-300">
                  <p className="text-indigo-400">$ bitqube agent --audit --precision</p>
                  <p className="text-slate-400">▸ Indexing legal contract corpus...</p>
                  <p className="text-slate-400">▸ Verifying DPDP Act clause compliance...</p>
                  <p className="text-emerald-400 font-bold">✓ 0 Critical Flaws · 99.8% Precision</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Latency</span>
                    <strong className="text-white font-bold">42ms</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Security Audit</span>
                    <strong className="text-emerald-400 font-bold">Passed</strong>
                  </div>
                </div>
              </div>
            )}

            {slide.mockupType === "invoice" && (
              <div className="w-full max-w-sm bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-3 relative transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    <span>Tax Invoice & Receipt</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">INV-BTQ-202610</span>
                </div>

                <div className="border-b border-slate-800 pb-3 space-y-1">
                  <p className="text-xs font-bold text-white">BitQube Freelance Marketplace</p>
                  <p className="text-[10px] text-slate-500 font-mono">GSTIN: 29AAAAA0000A1Z5</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span className="font-bold text-white">$ 270.00 USD <span className="text-slate-400 font-normal">(~ ₹ 22,680)</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Commission (10%):</span>
                    <span className="font-bold text-slate-400">$ 30.00 USD <span className="text-slate-500 font-normal">(~ ₹ 2,520)</span></span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                    <span>Total Settled (Razorpay):</span>
                    <span className="text-emerald-400">$ 300.00 USD <span className="text-slate-300 font-normal">(₹ 25,200.00)</span></span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Authoritative Bank Receipt
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Bottom Control Bar */}
        <div className="relative z-10 px-6 sm:px-10 py-4 bg-slate-950/60 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quick Slide Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => goToSlide(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentSlide === idx
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                    : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                0{idx + 1} {idx === 0 ? "Verified" : idx === 1 ? "Escrow" : idx === 2 ? "AI Tech" : "Invoicing"}
              </button>
            ))}
          </div>

          {/* Interactive Navigation Controls */}
          <div className="flex items-center gap-3">
            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              title={isPaused ? "Resume 10s auto-float" : "Pause auto-float"}
              className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-all"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            </button>

            {/* Left Prev Arrow */}
            <button
              onClick={prevSlide}
              aria-label="Previous slide"
              className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Indicator dots */}
            <div className="flex items-center gap-1.5 px-2">
              {SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? "w-6 bg-indigo-500" : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>

            {/* Right Next Arrow */}
            <button
              onClick={nextSlide}
              aria-label="Next slide"
              className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
