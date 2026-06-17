"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "#C8F04B", "#67E8F9", "#C4B5FD", "#93C5FD", "#FCD34D",
  "#6EE7B7", "#FDA4AF", "#FED7AA", "#A5B4FC", "#86EFAC",
];

const tooltipStyle = {
  backgroundColor: "#1A1A1A",
  border: "1px solid #2A2A2A",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "12px",
};

const tickStyle = { fill: "#555", fontSize: 11 };

// --- Sales Velocity ---
export function SalesVelocityChart({ data }: { data: { date: string; orders: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C8F04B" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#C8F04B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1A1A1A" vertical={false} />
        <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} interval={4} />
        <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#2A2A2A" }} />
        <Area
          type="monotone"
          dataKey="orders"
          stroke="#C8F04B"
          strokeWidth={2}
          fill="url(#ordersGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#C8F04B" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// --- Peak Hours ---
export function PeakHoursChart({ data }: { data: { hour: string; orders: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#1A1A1A" vertical={false} />
        <XAxis
          dataKey="hour"
          tick={tickStyle}
          axisLine={false}
          tickLine={false}
          interval={3}
        />
        <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1A1A1A" }} />
        <Bar dataKey="orders" fill="#C8F04B" radius={[4, 4, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Peak Days ---
export function PeakDaysChart({ data }: { data: { day: string; orders: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#1A1A1A" vertical={false} />
        <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
        <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1A1A1A" }} />
        <Bar dataKey="orders" fill="#67E8F9" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Revenue by Category ---
export function RevenueByCategoryChart({
  data,
}: {
  data: { name: string; revenue: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-[#555] text-sm">
        No category revenue data
      </div>
    );
  }
  return (
    <div className="flex items-center gap-8">
      <div style={{ width: 260, height: 260, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="revenue"
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) =>
                new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(val)
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-sm text-[#A0A0A0] flex-1 truncate">{item.name}</span>
            <span className="text-sm text-white font-semibold">
              {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(item.revenue)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- New Customers ---
export function NewCustomersChart({
  data,
}: {
  data: { month: string; customers: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#1A1A1A" vertical={false} />
        <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
        <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1A1A1A" }} />
        <Bar dataKey="customers" fill="#C4B5FD" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Geography Table ---
export function GeographyTable({
  data,
  formatCurrency,
}: {
  data: { city: string; orders: number; revenue: number }[];
  formatCurrency: (n: number) => string;
}) {
  if (data.length === 0) {
    return (
      <div className="p-10 text-center text-[#555] text-sm">
        No geographic data available (requires shipping addresses on orders)
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="divide-y divide-[#1A1A1A]">
      {data.map((row, i) => (
        <div key={row.city} className="px-6 py-4 flex items-center gap-4">
          <span className="text-xs text-[#555] w-5 text-right">{i + 1}</span>
          <span className="text-sm text-white font-semibold flex-1">{row.city}</span>
          <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden max-w-[200px]">
            <div
              className="h-full bg-[#C8F04B] rounded-full"
              style={{ width: `${(row.revenue / maxRevenue) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[#555] w-16 text-right">{row.orders} orders</span>
          <span className="text-sm text-[#C8F04B] font-bold w-20 text-right">
            {formatCurrency(row.revenue)}
          </span>
        </div>
      ))}
    </div>
  );
}
