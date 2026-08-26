import { useTranslation } from "react-i18next";
import { ArrowRight, Building2, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import { motion, useMotionValue, useTransform, useSpring, type Variants } from "motion/react";
import { useRef } from "react";

type SelectedRole = "user" | "admin";

interface RoleSelectionScreenProps {
  onSelectRole: (role: SelectedRole) => void;
}

export default function RoleSelectionScreen({ onSelectRole }: RoleSelectionScreenProps) {
  const { t } = useTranslation();
  // Stagger Container for high-end entrance animations
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 80, 
        damping: 14 
      } 
    },
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-[#F8FAFC] sm:px-10 lg:px-16 flex items-center relative overflow-hidden z-10">
      {/* Decorative dynamic neon lights behind login portal */}
      <div className="absolute top-[20%] left-[10%] h-[30vw] w-[30vw] rounded-full bg-[#00F2FE]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] h-[30vw] w-[30vw] rounded-full bg-[#6366F1]/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-6xl flex-col justify-between relative z-10">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00F2FE] to-[#6366F1] text-xl font-extrabold text-slate-950 shadow-lg shadow-[#00F2FE]/20">
              C
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">
                Civic<span className="gradient-text-cyan-indigo font-bold">AI</span>
              </p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-foreground/60">
                Accessible Civic Services
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-foreground/60 sm:flex bg-ashoka-navy/5 border border-border-subtle px-3.5 py-1.5 rounded-full backdrop-blur-md">
            <CheckCircle2 className="h-4 w-4 text-[#00F2FE]" /> Secure public workspace
          </div>
        </motion.header>

        {/* Content Section */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto w-full max-w-4xl py-12 text-center"
        >
          <motion.p variants={itemVariants} className="text-xs font-bold uppercase tracking-[0.3em] text-[#00F2FE]">
            Welcome to CivicAI
          </motion.p>
          
          <motion.h1 
            variants={itemVariants} 
            className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight text-[#F8FAFC] sm:text-6xl"
          >
            How would you like to enter?
          </motion.h1>
          
          <motion.p 
            variants={itemVariants} 
            className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-foreground/60"
          >
            Choose your workspace to report civic issues, follow progress, or coordinate a faster response across your community.
          </motion.p>

          {/* Cards Grid */}
          <motion.div variants={itemVariants} className="mt-12 grid gap-6 md:grid-cols-2">
            <RoleButton
              icon={<Users className="h-7 w-7 text-[#00F2FE]" />}
              eyebrow="For residents"
              title="Login as User"
              description="Report a grievance, track complaints, and help your neighborhood stay informed."
              onClick={() => onSelectRole("user")}
              glowColor="hover:border-[#00F2FE]/40 hover:shadow-[#00F2FE]/5"
              btnStyle="btn-glass-cyan"
            />
            <RoleButton
              icon={<Building2 className="h-7 w-7 text-[#6366F1]" />}
              eyebrow="For civic teams"
              title="Login as Admin"
              description="Review incoming issues, coordinate departments, and monitor city-wide performance."
              onClick={() => onSelectRole("admin")}
              glowColor="hover:border-[#6366F1]/40 hover:shadow-[#6366F1]/5"
              btnStyle="btn-glass-indigo"
            />
          </motion.div>
        </motion.section>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex items-center justify-center gap-2 border-t border-border-subtle pt-5 text-xs text-foreground/60"
        >
          <ShieldCheck className="h-4 w-4 text-[#00F2FE]" /> Your secure civic workspace is active and encrypted.
        </motion.footer>
      </div>
    </main>
  );
}

interface RoleButtonProps {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  onClick: () => void;
  glowColor: string;
  btnStyle: string;
}

function RoleButton({
  icon,
  eyebrow,
  title,
  description,
  onClick,
  glowColor,
  btnStyle,
}: RoleButtonProps) {
  const cardRef = useRef<HTMLButtonElement>(null);

  // Mouse tilt parameters
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [10, -10]);
  const rotateY = useTransform(x, [0, 1], [-10, 10]);

  // Spring animations for tilt
  const springRotateX = useSpring(rotateX, { stiffness: 120, damping: 18 });
  const springRotateY = useSpring(rotateY, { stiffness: 120, damping: 18 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.975 }}
      className={`group rounded-2xl border border-border-subtle bg-surface/35 p-8 text-left shadow-2xl backdrop-blur-2xl transition-colors duration-300 hover:bg-surface/50 focus:outline-none focus:ring-2 focus:ring-saffron/50 relative overflow-hidden ${glowColor}`}
    >
      {/* Dynamic iridescent gradient backing */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#00F2FE]/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-[#6366F1]/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Tilt Layer 1 (TranslateZ 30px) */}
      <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} className="flex items-start justify-between relative z-10 w-full">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ashoka-navy/5 border border-border-subtle hover:border-foreground/20 text-foreground shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:border-[#00F2FE]/30 group-hover:shadow-[#00F2FE]/5">
          {icon}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/50 border border-border-subtle text-foreground/60 transition-all duration-300 group-hover:text-[#00F2FE] group-hover:bg-[#00F2FE]/10 group-hover:border-[#00F2FE]/20">
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
      
      {/* Tilt Layer 2 (TranslateZ 20px) */}
      <div style={{ transform: "translateZ(20px)" }} className="relative z-10 w-full">
        <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60">
          {eyebrow}
        </p>
        
        <h2 className="mt-2 text-2xl font-black text-foreground tracking-tight">
          {title}
        </h2>
      </div>
      
      {/* Tilt Layer 3 (TranslateZ 10px) */}
      <div style={{ transform: "translateZ(10px)" }} className="relative z-10 w-full">
        <p className="mt-3 text-xs leading-relaxed text-foreground/60 min-h-[3rem]">
          {description}
        </p>
        
        <div className="mt-6 flex items-center">
          <span className={`inline-flex rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-md ${btnStyle}`}>
            Continue
          </span>
        </div>
      </div>
    </motion.button>
  );
}
