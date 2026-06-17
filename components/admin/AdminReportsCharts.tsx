"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";

interface Props {
  dailyData: { date: string; revenue: number }[];
  categoryData: { name: string; revenue: number }[];
  onlineRevenue: number;
  posRevenue: number;
}

const COLORS = ["#0D3B2E", "#C8F04B", "#6B5CE7", "#F59E0B", "#EF4444", "#06B6D4"];

export function AdminReportsCharts({ dailyData, categoryData, onlineRevenue, posRevenue }: Props) {
  const sourceData = [
    { name: "Online", value: onlineRevenue },
    { name: "POS", value: posRevenue },
  ];

  return (
    <div className="grid gap-6">
      {/* Daily revenue line chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111]">
        <h2 className="mb-4 font-syne text-base font-bold">Revenue — Last 30 Days</h2>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={3} />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `£${v}`} />
              <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} formatter={(v) => [`£${Number(v).toFixed(2)}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#0D3B2E" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category bar chart */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111]">
          <h2 className="mb-4 font-syne text-base font-bold">Revenue by Category</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `£${v}`} />
                <Tooltip formatter={(v) => [`£${Number(v).toFixed(2)}`, "Revenue"]} contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="revenue" fill="#C8F04B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source pie chart */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111]">
          <h2 className="mb-4 font-syne text-base font-bold">Online vs POS Revenue</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={4} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => `£${Number(v).toFixed(2)}`} contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
