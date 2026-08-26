import { useTranslation } from "react-i18next";
import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

// ── Default hardcoded admin credentials (no backend needed) ──
const DEFAULT_ADMIN_ID = "prapti.j";
const DEFAULT_ADMIN_PASSWORD = "Scram440";

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const { t } = useTranslation();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Simulate a small delay for realism
    setTimeout(() => {
      if (
        adminId.trim() === DEFAULT_ADMIN_ID &&
        password === DEFAULT_ADMIN_PASSWORD
      ) {
        onLogin();
      } else {
        setError("Invalid Admin ID or Password. Please try again.");
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] px-4 py-10 text-slate-900 dark:text-[#F8FAFC] flex items-center justify-center relative overflow-hidden z-10 transition-colors duration-300">
      {/* Background glows */}
      <div className="absolute top-[15%] left-[5%] h-[35vw] w-[35vw] rounded-full bg-[#6366F1]/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] h-[30vw] w-[30vw] rounded-full bg-[#00F2FE]/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 16 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.section
          animate={shake ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="w-full rounded-2xl border border-white/[0.06] bg-ashoka-navy/5 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl"
        >
          {/* Branding */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#00F2FE] text-lg font-extrabold text-slate-950 shadow-lg shadow-[#6366F1]/25">
              <ShieldCheck className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                Civic<span className="gradient-text-cyan-indigo font-bold">AI</span>
              </h1>
              <p className="text-[9px] uppercase tracking-[0.25em] text-foreground/60">
                Municipal Administration
              </p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Admin Login
          </h2>
          <p className="mt-1.5 text-sm text-foreground/60">
            Authorized personnel only. Enter your credentials to continue.
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Admin ID Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
                Admin ID
              </label>
              <input
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                autoComplete="username"
                placeholder="Enter admin ID"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-[#00F2FE] focus:ring-2 focus:ring-[#00F2FE]/50"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50 py-3 pl-10 pr-12 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-[#00F2FE] focus:ring-2 focus:ring-[#00F2FE]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-600 dark:text-red-400 font-medium"
                role="alert"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#818CF8] py-3.5 text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#6366F1]/25 hover:brightness-110 disabled:cursor-wait disabled:opacity-60 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying...
                </>
              ) : (
                <>
                  Sign in as Admin
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Default credentials hint & Fill Button */}
          <div className="mt-6 rounded-xl border border-[#00F2FE]/20 bg-[#00F2FE]/5 px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#00F2FE] mb-1.5">
                Default Credentials
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                ID: <span className="text-slate-900 dark:text-slate-100 font-semibold">prapti.j</span> &nbsp;|&nbsp; Password: <span className="text-slate-900 dark:text-slate-100 font-semibold">Scram440</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAdminId(DEFAULT_ADMIN_ID);
                setPassword(DEFAULT_ADMIN_PASSWORD);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#00F2FE] bg-[#00F2FE]/10 hover:bg-[#00F2FE]/20 transition-colors border border-[#00F2FE]/20 whitespace-nowrap"
            >
              Fill Demo Credentials
            </button>
          </div>

          {/* Back link */}
          <button
            type="button"
            onClick={onBack}
            className="mt-6 flex w-full items-center justify-center gap-2 text-center text-xs text-foreground/60 hover:text-[#00F2FE] transition-colors duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to role selection
          </button>
        </motion.section>
      </motion.div>
    </main>
  );
}