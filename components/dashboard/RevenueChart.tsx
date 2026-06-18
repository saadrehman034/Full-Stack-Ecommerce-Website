"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type Period = "7d" | "30d" | "90d" | "1y";

interface ChartPoint {
  date: string;
  online: number;
  pos: number;
  total: number;
}

interface RevenueChartProps {
  data?: ChartPoint[];
  period?: Period;
  onPeriodChange?: (period: Period) => void;
}

const PERIODS: { label: string; value: Period }[] = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "1Y", value: "1y" },
];

function formatXAxisTick(value: string, period: Period): string {
  if (period === "1y") {
    const [year, month] = value.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleString("en-US", { month: "short" });
  }
  if (period === "90d") {
    const d = new Date(value);
    return d.toLocaleString("en-US", { day: "numeric", month: "short" });
  }
  const d = new Date(value);
  return d.toLocaleString("en-US", { day: "numeric", month: "short" });
}

function CustomTooltip({
  active,
  payload,
  label,
  period,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  period: Period;
}) {
  if (!active || !payload || !payload.length || !label) return null;

  let displayDate = label;
  try {
    if (period === "1y") {
      const [year, month] = label.split("-");
      const d = new Date(Number(year), Number(month) - 1, 1);
      displayDate = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    } else if (period === "90d") {
      const d = new Date(label);
      displayDate = `Week of ${d.toLocaleString("en-US", { day: "numeric", month: "short" })}`;
    } else {
      const d = new Date(label);
      displayDate = d.toLocaleString("en-US", { day: "numeric", month: "long" });
    }
  } catch {
    displayDate = label;
  }

  const total = payload.reduce((s, p) => s + p.value, 0);

  return (
    <div
      style={{
        backgroundColor: "#0d0d25",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        padding: "12px",
      }}
      className="shadow-xl"
    >
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 8 }}>{displayDate}</p>
      {payload.map((p) => (
        <div
          key={p.name}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, fontSize: 12, marginBottom: 4 }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: p.color, display: "inline-block" }} />
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.name === "online" ? "Online" : "POS"}</span>
          </span>
          <span style={{ fontWeight: 600, color: "#fff" }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 8, paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>Total</span>
        <span style={{ fontWeight: 700, color: "#fff" }}>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export function RevenueChart({ data: initialData, period: initialPeriod = "30d", onPeriodChange }: RevenueChartProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [data, setData] = useState<ChartPoint[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/dashboard/revenue-chart?period=${period}`)
      .then((r) => r.json())
      .then((d: ChartPoint[]) => {
        if (!cancelled) {
          setData(Array.isArray(d) ? d : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [period]);

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    onPeriodChange?.(p);
  }

  const tickInterval = period === "7d" ? 0 : period === "30d" ? 4 : period === "90d" ? 1 : 1;

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-syne text-xl font-bold text-white">Revenue Overview</h3>
          <p className="text-white/40 text-xs mt-0.5">Online vs POS breakdown</p>
        </div>
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={
                period === p.value
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-violet-500/30 transition-all"
                  : "text-white/40 text-xs px-3 py-1.5 hover:text-white/70 transition-colors rounded-lg"
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-72 flex items-center justify-center">
          <div className="space-y-3 w-full">
            <div className="h-3 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-3 bg-white/[0.06] rounded animate-pulse w-4/5" />
            <div className="h-3 bg-white/[0.06] rounded animate-pulse w-3/5" />
            <div className="h-40 bg-white/[0.06] rounded-xl animate-pulse mt-4" />
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={288}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="posGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatXAxisTick(v, period)}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip
              content={<CustomTooltip period={period} />}
              cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="online"
              name="online"
              stroke="#8B5CF6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#onlineGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#8B5CF6", stroke: "#030014", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="pos"
              name="pos"
              stroke="#06B6D4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#posGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#06B6D4", stroke: "#030014", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
          <span className="text-white/50 text-xs">Online</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#06B6D4]" />
          <span className="text-white/50 text-xs">POS</span>
        </div>
      </div>
    </div>
  );
}
