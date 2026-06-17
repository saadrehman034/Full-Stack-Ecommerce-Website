"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  packing: "#8B5CF6",
  shipped: "#06B6D4",
  delivered: "#10B981",
  cancelled: "#6B7280",
  refunded: "#F43F5E",
}

interface Props {
  data: Array<{ status: string; count: number }>
}

export function OrderStatusChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 h-full">
      <h3 className="font-syne text-lg font-bold text-white mb-1">Orders by Status</h3>
      <p className="text-white/40 text-xs mb-4">{total} total orders</p>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-white/30 text-sm">
          No orders yet
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#6B7280"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d0d25",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "8px 12px",
                }}
                itemStyle={{ color: "#fff", fontSize: 12 }}
                labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 mt-2">
            {data.map((d) => (
              <div key={d.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[d.status] ?? "#6B7280" }}
                  />
                  <span className="text-white/60 text-xs capitalize">{d.status}</span>
                </div>
                <span className="bg-white/[0.06] text-white/60 text-xs rounded-full px-2 py-0.5 font-medium">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
