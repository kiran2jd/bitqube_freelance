import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Sparkles,
  ShieldCheck,
  CreditCard,
  FileCheck,
  ArrowRight,
  PartyPopper,
} from "lucide-react";

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export const WelcomeConfettiModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Check if user has already seen the welcome congratulations modal in this session
    const hasSeen = sessionStorage.getItem("bitqube_confetti_welcome_seen");
    if (!hasSeen) {
      // Show after a brief delay so page renders first
      const timeout = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem("bitqube_confetti_welcome_seen", "true");
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Launch Canvas Confetti Physics Animation
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#6366f1", // Indigo
      "#a855f7", // Purple
      "#10b981", // Emerald
      "#f59e0b", // Amber/Gold
      "#ec4899", // Pink
      "#38bdf8", // Sky Blue
    ];

    const particles: Particle[] = [];
    const particleCount = 130;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 3 + (Math.random() - 0.5) * 50,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: Math.random() * -14 - 4, // Shoot upwards
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;

      for (const p of particles) {
        // Physics update
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.vx *= 0.985; // Drag
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height * 0.7) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0 && p.y < canvas.height) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      {/* Confetti Particle Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Celebratory Modal Card */}
      <div className="relative z-20 bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-lg w-full p-8 shadow-2xl shadow-indigo-500/20 text-center space-y-6 overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-800"
          aria-label="Close welcome modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebratory Icon Header */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 transform hover:scale-105 transition-transform duration-300">
          <PartyPopper className="w-8 h-8 animate-bounce" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to BitQube Freelance</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Congratulations! 🎉
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            You have discovered the world's most trusted professional services marketplace.
            Hire pre-vetted consultants and execute contracts with complete financial safety.
          </p>
        </div>

        {/* Key Platform Value Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="font-bold text-white block text-[11px]">Razorpay Escrow</span>
              <span className="text-[10px] text-slate-400">Zero Risk Lockbox</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block text-[11px]">Verified Licenses</span>
              <span className="text-[10px] text-slate-400">Bar, CA & Tech</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
            <FileCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white block text-[11px]">GST Invoices</span>
              <span className="text-[10px] text-slate-400">1-Click Receipts</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Exploring Marketplace
          </button>

          <Link
            to="/register"
            onClick={() => setIsOpen(false)}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-all inline-flex items-center justify-center gap-1.5"
          >
            <span>Register Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
