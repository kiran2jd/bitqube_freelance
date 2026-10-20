import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layers, Lock, Mail, User, Briefcase, UserCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState<"customer" | "professional">("customer");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [preferredCurrency, setPreferredCurrency] = useState("INR");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
        country_code: countryCode,
        preferred_currency: preferredCurrency,
      });

      if (res.user.roles.includes("professional")) {
        navigate("/dashboard/professional", { replace: true });
      } else {
        navigate("/dashboard/customer", { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-8 bg-slate-900/90 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create your BitQube account
          </h2>
          <p className="text-xs text-slate-400">
            Join the global professional services network
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Switcher Cards */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
              role === "customer"
                ? "bg-indigo-600/15 border-indigo-500 text-white"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <UserCheck className={`w-5 h-5 ${role === "customer" ? "text-indigo-400" : "text-slate-500"}`} />
              {role === "customer" && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
            </div>
            <div>
              <div className="text-sm font-bold">I'm a Customer</div>
              <div className="text-[11px] text-slate-400">Post projects & hire verified specialists</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole("professional")}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
              role === "professional"
                ? "bg-indigo-600/15 border-indigo-500 text-white"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <Briefcase className={`w-5 h-5 ${role === "professional" ? "text-indigo-400" : "text-slate-500"}`} />
              {role === "professional" && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
            </div>
            <div>
              <div className="text-sm font-bold">I'm a Professional</div>
              <div className="text-[11px] text-slate-400">Offer consulting & publish services</div>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password (Min 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Country
              </label>
              <select
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  if (e.target.value === "IN") setPreferredCurrency("INR");
                  else if (e.target.value === "US") setPreferredCurrency("USD");
                  else if (e.target.value === "GB") setPreferredCurrency("GBP");
                  else if (e.target.value === "DE") setPreferredCurrency("EUR");
                }}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="IN">India (IN)</option>
                <option value="US">United States (US)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="DE">Germany (DE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Preferred Currency
              </label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ US Dollar)</option>
                <option value="GBP">GBP (£ British Pound)</option>
                <option value="EUR">EUR (€ Euro)</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 pt-2 leading-relaxed">
            By creating an account, you agree to our Terms of Service, Privacy Policy, and understand that regulated services require license verification.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all duration-150 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? "Creating Account..." : `Register as ${role === "customer" ? "Customer" : "Professional"}`}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
