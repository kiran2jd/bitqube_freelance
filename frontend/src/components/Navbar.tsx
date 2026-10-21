import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Globe, User as UserIcon, LogOut, LayoutDashboard, ChevronDown, FileText, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  defaultCurrency?: string;
  defaultCountry?: string;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navLinks = [
    { label: "Find Professionals", href: "/professionals" },
    { label: "Browse Services", href: "/categories" },
    { label: "Projects", href: "/projects" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
  ];

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate("/");
  };

  const isProfessional = user?.roles.includes("professional");
  const isCustomer = user?.roles.includes("customer");
  const isAdmin = user?.roles.includes("administrator");
  const dashboardRoute = isProfessional ? "/dashboard/professional" : "/dashboard/customer";

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 px-2.5 py-1 rounded-xl bg-white/95 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:bg-white transition-all duration-200">
              <img src="/bitqube-logo.png" alt="BitQube Logo" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Freelance <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider font-semibold">Global</span>
              </span>
              <span className="block text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
                $ USD Rates • Razorpay Escrow
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "text-indigo-400 font-semibold"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons & Currency Tag */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Global</span>
              <span className="text-slate-500">·</span>
              <span className="font-semibold text-emerald-400">$ USD</span>
              <span className="text-[10px] text-slate-400">(Settles in ₹ INR)</span>
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {isCustomer && (
                  <Link
                    to="/projects/new"
                    className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
                  >
                    Post a Project
                  </Link>
                )}
                <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-medium transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.first_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-semibold">{user.first_name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isDropdownOpen && (
                  <div
                    onMouseLeave={() => setIsDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-slate-200"
                  >
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {user.roles[0] || "User"}
                      </span>
                    </div>

                    <Link
                      to={dashboardRoute}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                      Dashboard
                    </Link>

                    <Link
                      to="/contracts"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                      <FileText className="w-4 h-4 text-indigo-400" />
                      My Contracts
                    </Link>

                    {isProfessional && (
                      <Link
                        to="/dashboard/professional/profile/edit"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-indigo-400" />
                        Edit Profile
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        Admin Command Center
                      </Link>
                    )}

                    <div className="border-t border-slate-800 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white hidden sm:block"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all duration-150 hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
