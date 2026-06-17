"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  sublabel?: string;
  accentColor?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  sublabel,
  accentColor,
  onClick,
}: StatCardProps) {
  const hasTrend = trend !== undefined;
  const isPositive = hasTrend && trend >= 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={[
        "bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/[0.15] transition-all",
        onClick ? "cursor-pointer" : "cursor-default",
      ].join(" ")}
    >
      {/* Top row: icon + trend badge */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-600/20 flex items-center justify-center text-violet-400">
          <Icon
            className="w-5 h-5"
            style={accentColor ? { color: accentColor } : undefined}
          />
        </div>

        {hasTrend && (
          <span
            className={[
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              isPositive
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/25",
            ].join(" ")}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value */}
      <p className="font-syne text-3xl font-black text-white mt-4">{value}</p>

      {/* Label */}
      <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1">
        {label}
      </p>

      {/* Trend label */}
      {hasTrend && trendLabel && (
        <p className="text-xs text-white/30 mt-1">{trendLabel}</p>
      )}

      {/* Sublabel */}
      {sublabel && (
        <p className="text-xs text-white/30 mt-2">{sublabel}</p>
      )}
    </motion.div>
  );
}
