import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Mock Registration Logic
      const existingUsersStr = localStorage.getItem("civicai-users");
      const users = existingUsersStr ? JSON.parse(existingUsersStr) : [];
      
      const userExists = users.some((u: any) => u.email === formData.email || (formData.phone && u.phone === formData.phone));
      if (userExists) {
        throw new Error("User with this email or phone already exists.");
      }
      
      const user = {
        id: `usr-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: "citizen",
        tenantId: "municipality-sf",
        reputationScore: 100,
        createdAt: new Date().toISOString(),
      };
      
      users.push({ ...user, password: formData.password });
      localStorage.setItem("civicai-users", JSON.stringify(users));
      const token = `mock-token-${Date.now()}`;
      
      // Store token
      localStorage.setItem("civicai-token", token as string);
      localStorage.setItem("civicai-user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-purple-500/10 to-orange-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface/80 dark:bg-slate-800/80 dark:border-white/10 backdrop-blur-xl border border-border-subtle rounded-3xl p-8 shadow-2xl shadow-slate-200/50"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white font-bold shadow-md mb-4">
            C
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Create Account</h2>
          <p className="text-sm text-foreground/60 mt-2">Join citizens making a difference.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border-subtle focus:border-saffron focus:ring-2 focus:ring-saffron/50 transition-all outline-none text-sm font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border-subtle focus:border-saffron focus:ring-2 focus:ring-saffron/50 transition-all outline-none text-sm font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1">Phone (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                placeholder="+1 555-0123"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border-subtle focus:border-saffron focus:ring-2 focus:ring-saffron/50 transition-all outline-none text-sm font-medium placeholder:text-slate-400"
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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border-subtle focus:border-saffron focus:ring-2 focus:ring-saffron/50 transition-all outline-none text-sm font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border-subtle focus:border-saffron focus:ring-2 focus:ring-saffron/50 transition-all outline-none text-sm font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? "Registering..." : "Create Account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-sm font-medium text-foreground/60 mt-8">
          Already have an account? <Link to="/login" className="text-ashoka-navy hover:text-indigo-700 font-bold transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
