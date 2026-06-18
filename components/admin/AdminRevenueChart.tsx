"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props {
  data: { date: string; revenue: number }[];
}

export function AdminRevenueChart({ data }: Props) {
  const lastWeek = data.slice(-7);

  return (
    <div className="mt-2 h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={lastWeek} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
            formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
          />
          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
