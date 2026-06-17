"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CategoryData {
  name: string;
  revenue: number;
  units: number;
}

const COLORS = ["#C8F04B", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#F97316", "#10B981"];

export function RevenueByCategoryChart({ data }: { data: CategoryData[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 48, 200)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 80, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatCurrency(v)}
          tick={{ fill: "#555", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "#A0A0A0", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1A1A1A",
            border: "1px solid #2A2A2A",
            borderRadius: "12px",
            padding: "10px 14px",
          }}
          itemStyle={{ color: "#fff", fontSize: 12 }}
          labelStyle={{ color: "#A0A0A0", fontSize: 11, marginBottom: 4 }}
          formatter={(value: number) => [formatCurrency(value), "Revenue"]}
        />
        <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={32}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
