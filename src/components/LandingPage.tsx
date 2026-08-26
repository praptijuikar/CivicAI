import { useTranslation } from "react-i18next";
import { ArrowRight, MapPin, Search, BarChart3, AlertCircle, Droplets, Map, CheckCircle2, Users } from "lucide-react";
import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

interface LandingPageProps {
  onSelectRole: (role: "user" | "admin") => void;
}

export default function LandingPage({ onSelectRole }: LandingPageProps) {
  const { t } = useTranslation();
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 80, damping: 15 },
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-ashoka-navy/100/20 relative overflow-hidden flex flex-col">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-tr from-saffron/10 to-saffron/5 rounded-full blur-[100px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-ashoka-navy/10 to-ashoka-navy/5 rounded-full blur-[100px] pointer-events-none -z-10 -translate-x-1/3 translate-y-1/3" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle/50 bg-surface/70 dark:bg-slate-800/80 dark:border-white/10 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold shadow-sm">
                C
              </div>
              <span className="text-xl font-black tracking-tight text-foreground">
                Civic<span className="text-ashoka-navy">AI</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#" className="text-foreground hover:text-ashoka-navy transition-colors">Home</a>
              <a href="#" onClick={() => onSelectRole("user")} className="hover:text-ashoka-navy transition-colors">{t('Report Issue')}</a>
              <a href="#" onClick={() => onSelectRole("user")} className="hover:text-ashoka-navy transition-colors">Track Issue</a>
              <a href="#" className="hover:text-ashoka-navy transition-colors">Dashboard</a>
              <a href="#" className="hover:text-ashoka-navy transition-colors">About Us</a>
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onSelectRole("admin")}
                className="hidden text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors md:block"
              >
                Admin Login
              </button>
              <button
                onClick={() => onSelectRole("user")}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out"
              >
                Report Issue +
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* Left Column - Copy & CTA */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8 text-center lg:text-left pt-10 lg:pt-0"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs font-bold text-purple-700 uppercase tracking-widest shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            AI Powered
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
            Report. Detect.<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Resolve.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="max-w-xl mx-auto lg:mx-0 text-lg sm:text-xl text-slate-600 leading-relaxed">
            Empower your community with AI-driven civic reporting. Instantly log infrastructure defects, route them to the right departments, and track real-time resolution.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              onClick={() => onSelectRole("user")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-in-out group"
            >
              Report an Issue
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onSelectRole("user")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-surface px-8 py-4 text-base font-bold text-foreground shadow-sm border border-border-subtle hover:bg-background hover:scale-105 transition-all duration-300 ease-in-out"
            >
              Track an Issue
              <Search className="w-5 h-5 text-slate-400" />
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center justify-center lg:justify-start gap-4 pt-6 border-t border-border-subtle/60 mt-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-white shadow-sm bg-slate-${200 + i*100} overflow-hidden`}>
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt={`Citizen ${i}`} className="w-full h-full object-cover opacity-80" />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-slate-600">
              Join <strong className="text-foreground">2,500+ citizens</strong><br /> making a difference.
            </p>
          </motion.div>
        </motion.div>

        {/* Right Column - Visual Canvas */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: "spring", delay: 0.3 }}
          className="relative w-full aspect-square max-w-lg mx-auto flex items-center justify-center"
        >
          {/* Futuristic Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02MCAwaC0xdjYwaDFWMEg2MHoiIGZpbGw9InJnYmEoMCwwLDAsMC4wMikiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPgo8cGF0aCBkPSJNNjAgNjBIMFY1OWg2MHYxeiIgZmlsbD0icmdiYSgwLDAsMCwwLjAyKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+Cjwvc3ZnPg==')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />

          {/* Central Glowing Asset */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-surface shadow-2xl shadow-purple-500/20 border border-slate-100 flex items-center justify-center z-10 animate-pulse-glow">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-100 to-orange-50 opacity-50"></div>
            <Map className="w-24 h-24 text-slate-300 absolute" strokeWidth={1} />
            <div className="absolute inset-2 rounded-full border border-slate-100/50"></div>
            <div className="absolute inset-6 rounded-full border border-border-subtle/30 border-dashed animate-[spin_20s_linear_infinite]"></div>
          </div>

          {/* Floating Micro-Cards */}
          <div className="absolute top-10 right-4 sm:right-10 z-20 animate-float-slow">
            <div className="flex items-center gap-3 bg-surface/80 dark:bg-slate-800/80 dark:border-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl shadow-slate-200/50 border border-white">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Detected</p>
                <p className="text-sm font-bold text-slate-800">Pothole Damage</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-20 left-0 sm:-left-4 z-20 animate-float-medium">
            <div className="flex items-center gap-3 bg-surface/80 dark:bg-slate-800/80 dark:border-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl shadow-slate-200/50 border border-white">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Reported</p>
                <p className="text-sm font-bold text-slate-800">Waterlogging</p>
              </div>
            </div>
          </div>

          {/* Map Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] z-30 animate-bounce">
            <div className="relative">
              <MapPin className="w-10 h-10 text-ashoka-navy drop-shadow-md fill-white" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 blur-sm rounded-full"></div>
            </div>
          </div>

        </motion.div>
      </main>

      {/* Bottom Stats Bar */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-8 relative z-20 mt-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-surface/80 dark:bg-slate-800/80 dark:border-white/10 backdrop-blur-xl border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/50 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100"
        >
          <StatItem icon={<AlertCircle className="w-5 h-5" />} color="purple" value="12,458" label="Issues Reported" />
          <StatItem icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" value="8,974" label="Issues Resolved" className="pt-6 md:pt-0" />
          <StatItem icon={<Users className="w-5 h-5" />} color="orange" value="2,500+" label="Active Citizens" className="pt-6 md:pt-0 md:pl-4" />
          <StatItem icon={<BarChart3 className="w-5 h-5" />} color="blue" value="24 hrs" label="Avg. Resolution" className="pt-6 md:pt-0 md:pl-4" />
        </motion.div>
      </div>
    </div>
  );
}

function StatItem({ icon, color, value, label, className = "" }: { icon: ReactNode, color: string, value: string, label: string, className?: string }) {
  const colorMap: Record<string, string> = {
    purple: "bg-purple-100 text-purple-600",
    emerald: "bg-emerald-100 text-emerald-600",
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3 shadow-sm`}>
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{value}</p>
      <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
