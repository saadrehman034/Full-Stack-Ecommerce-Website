"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  sublabel?: string;
  color?: string;
  onClick?: () => void;
}

const COLOR_SCHEMES = {
  violet: {
    gradient: "from-violet-500/20 to-purple-600/5",
    icon: "text-violet-400",
    bg: "from-violet-500/10 to-violet-600/5",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/20",
  },
  cyan: {
    gradient: "from-cyan-500/20 to-blue-600/5",
    icon: "text-cyan-400",
    bg: "from-cyan-500/10 to-cyan-600/5",
    border: "border-cyan-500/20",
    glow: "shadow-cyan-500/20",
  },
  emerald: {
    gradient: "from-emerald-500/20 to-teal-600/5",
    icon: "text-emerald-400",
    bg: "from-emerald-500/10 to-teal-600/5",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/20",
  },
  amber: {
    gradient: "from-amber-500/20 to-orange-600/5",
    icon: "text-amber-400",
    bg: "from-amber-500/10 to-orange-600/5",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/20",
  },
  rose: {
    gradient: "from-rose-500/20 to-pink-600/5",
    icon: "text-rose-400",
    bg: "from-rose-500/10 to-pink-600/5",
    border: "border-rose-500/20",
    glow: "shadow-rose-500/20",
  },
  fuchsia: {
    gradient: "from-fuchsia-500/20 to-purple-600/5",
    icon: "text-fuchsia-400",
    bg: "from-fuchsia-500/10 to-purple-600/5",
    border: "border-fuchsia-500/20",
    glow: "shadow-fuchsia-500/20",
  },
} as const;

type ColorKey = keyof typeof COLOR_SCHEMES;

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  sublabel,
  color = "violet",
  onClick,
}: KPICardProps) {
  const scheme = COLOR_SCHEMES[(color as ColorKey) in COLOR_SCHEMES ? (color as ColorKey) : "violet"];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "relative bg-gradient-to-br backdrop-blur-sm border rounded-2xl p-6 overflow-hidden transition-all cursor-default group",
        scheme.gradient,
        scheme.border,
        "shadow-lg",
        scheme.glow,
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between relative z-10">
        <div
          className={cn(
            "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center",
            scheme.bg
          )}
        >
          <Icon className={cn("h-5 w-5", scheme.icon)} />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "text-[11px] font-bold rounded-full px-2.5 py-1 flex items-center gap-1",
              trend >= 0
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400"
            )}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mt-4 relative z-10">
        <p className="font-syne text-3xl font-black text-white tracking-tight">{value}</p>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1.5">{label}</p>
        {trendLabel && <p className="text-xs text-white/30 mt-1">{trendLabel}</p>}
        {sublabel && <p className="text-xs text-white/40 mt-1">{sublabel}</p>}
      </div>
    </motion.div>
  );
}
