import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Bypassing backend fetch API for local demo mode to avoid JSON parse errors on Vercel
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const mockUser = {
        id: "usr-citizen-demo",
        name: "Demo Citizen",
        email: formData.email,
        role: "citizen",
        tenantId: "municipality-sf",
        reputationScore: 100,
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem("civicai-token", "demo-token-12345");
      localStorage.setItem("civicai-user", JSON.stringify(mockUser));
      
      // Dispatch a storage event so App.tsx picks up the user immediately without a reload
      window.dispatchEvent(new Event("storage"));
      
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-50 font-sans flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tl from-blue-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface/80 dark:bg-slate-800/80 dark:border-white/10 backdrop-blur-xl border border-border-subtle rounded-3xl p-8 shadow-2xl shadow-slate-200/50"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white font-bold shadow-md mb-4">
            C
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Welcome Back</h2>
          <p className="text-sm text-foreground/60 mt-2">Sign in to your CivicAI account.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                type="email"
                placeholder="citizen@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-[#00F2FE] focus:ring-2 focus:ring-[#00F2FE]/50 transition-all outline-none text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-[#00F2FE] focus:ring-2 focus:ring-[#00F2FE]/50 transition-all outline-none text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#818CF8] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6366F1]/20 hover:brightness-110 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? "Signing in..." : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo credentials hint & Fill Button */}
        <div className="mt-6 rounded-xl border border-[#00F2FE]/20 bg-[#00F2FE]/5 px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#00F2FE] mb-1.5">
              Demo Credentials
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              Email: <span className="text-slate-900 dark:text-slate-100 font-semibold">citizen@civic.ai</span> <br className="sm:hidden" />
              <span className="hidden sm:inline">&nbsp;|&nbsp;</span> Password: <span className="text-slate-900 dark:text-slate-100 font-semibold">citizen123</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormData({ email: "citizen@civic.ai", password: "citizen123" });
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#00F2FE] bg-[#00F2FE]/10 hover:bg-[#00F2FE]/20 transition-colors border border-[#00F2FE]/20 whitespace-nowrap"
          >
            Auto-fill Credentials
          </button>
        </div>

        <p className="text-center text-sm font-medium text-foreground/60 mt-8">
          Don't have an account? <Link to="/register" className="text-ashoka-navy hover:text-indigo-700 font-bold transition-colors">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
