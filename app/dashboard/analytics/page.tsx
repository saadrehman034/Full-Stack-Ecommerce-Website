import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import {
  SalesVelocityChart,
  PeakHoursChart,
  PeakDaysChart,
  RevenueByCategoryChart,
  NewCustomersChart,
  GeographyTable,
} from "./AnalyticsCharts";

type OrderRow = {
  id: string;
  total_amount: number;
  created_at: string;
  shipping_address?: { city?: string } | null;
};

type OrderItemRow = {
  product_id: string;
  quantity: number;
  total_price: number;
  products: { name: string; categories: { name: string } | null } | null;
};

type UserRow = {
  created_at: string;
};

export default async function AnalyticsPage() {
  const supabase = createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    { data: recentOrders },
    { data: allOrderItems },
    { data: newCustomers },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total_amount, created_at, shipping_address")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at"),
    supabase
      .from("order_items")
      .select("product_id, quantity, total_price, products(name, categories(name))")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("users")
      .select("created_at")
      .eq("role", "customer")
      .gte("created_at", sixMonthsAgo.toISOString()),
  ]);

  const orders: OrderRow[] = recentOrders ?? [];
  const orderItems: OrderItemRow[] = (allOrderItems as unknown as OrderItemRow[]) ?? [];
  const customers: UserRow[] = newCustomers ?? [];

  // --- Orders per day (last 30 days) ---
  const dayMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap[d.toISOString().split("T")[0]] = 0;
  }
  orders.forEach((o) => {
    const day = o.created_at.split("T")[0];
    if (dayMap[day] !== undefined) dayMap[day]++;
  });
  const ordersPerDay = Object.entries(dayMap).map(([date, count]) => ({
    date: date.slice(5), // MM-DD
    orders: count,
  }));

  // --- Orders by hour ---
  const hourCounts = new Array(24).fill(0);
  orders.forEach((o) => {
    const h = new Date(o.created_at).getHours();
    hourCounts[h]++;
  });
  const ordersByHour = hourCounts.map((count, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    orders: count,
  }));

  // --- Orders by day of week ---
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowCounts = new Array(7).fill(0);
  orders.forEach((o) => {
    const dow = new Date(o.created_at).getDay();
    dowCounts[dow]++;
  });
  const ordersByDay = dowCounts.map((count, i) => ({
    day: dayNames[i],
    orders: count,
  }));

  // --- Revenue by category ---
  const categoryRevMap: Record<string, number> = {};
  orderItems.forEach((item) => {
    const catName = item.products?.categories?.name ?? "Uncategorised";
    categoryRevMap[catName] = (categoryRevMap[catName] ?? 0) + (item.total_price ?? 0);
  });
  const categoryRevenue = Object.entries(categoryRevMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // --- Top 10 products by revenue ---
  const productRevMap: Record<string, { name: string; revenue: number; qty: number }> = {};
  orderItems.forEach((item) => {
    const name = item.products?.name ?? "Unknown";
    if (!productRevMap[name]) productRevMap[name] = { name, revenue: 0, qty: 0 };
    productRevMap[name].revenue += item.total_price ?? 0;
    productRevMap[name].qty += item.quantity ?? 0;
  });
  const topProducts = Object.values(productRevMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // --- New customers by month ---
  const monthMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = 0;
  }
  customers.forEach((c) => {
    const key = c.created_at.substring(0, 7);
    if (monthMap[key] !== undefined) monthMap[key]++;
  });
  const customerTrend = Object.entries(monthMap).map(([month, count]) => ({
    month: new Date(month + "-01").toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
    customers: count,
  }));

  // --- Geography ---
  const cityMap: Record<string, { orders: number; revenue: number }> = {};
  orders.forEach((o) => {
    const city =
      (o.shipping_address as { city?: string } | null)?.city ?? "Unknown";
    if (!cityMap[city]) cityMap[city] = { orders: 0, revenue: 0 };
    cityMap[city].orders++;
    cityMap[city].revenue += o.total_amount ?? 0;
  });
  const geographyData = Object.entries(cityMap)
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-syne text-3xl font-bold text-white">Analytics</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">Store performance over the last 30 days</p>
      </div>

      {/* GA4 Notice */}
      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-950/30 flex items-center justify-center shrink-0">
            <span className="text-blue-400 text-xs font-bold">GA</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Connect Google Analytics 4 for visitor data</p>
            <p className="text-xs text-[#555] mt-0.5">
              Traffic, bounce rate, sessions, and source breakdowns require a GA4 integration.
              The data below is from your Supabase database (orders, customers, products).
            </p>
          </div>
        </div>
      </div>

      {/* Sales Velocity */}
      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6">
        <h2 className="font-syne font-bold text-white mb-1">Sales Velocity</h2>
        <p className="text-xs text-[#555] mb-6">Orders per day — last 30 days</p>
        <SalesVelocityChart data={ordersPerDay} />
      </div>

      {/* Peak Hours + Peak Days */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6">
          <h2 className="font-syne font-bold text-white mb-1">Peak Hours</h2>
          <p className="text-xs text-[#555] mb-6">Orders by hour of day</p>
          <PeakHoursChart data={ordersByHour} />
        </div>
        <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6">
          <h2 className="font-syne font-bold text-white mb-1">Peak Days</h2>
          <p className="text-xs text-[#555] mb-6">Orders by day of week</p>
          <PeakDaysChart data={ordersByDay} />
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6">
        <h2 className="font-syne font-bold text-white mb-1">Revenue by Category</h2>
        <p className="text-xs text-[#555] mb-6">Based on order items in last 30 days</p>
        <RevenueByCategoryChart data={categoryRevenue} />
      </div>

      {/* Top Products */}
      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1E1E1E]">
          <h2 className="font-syne font-bold text-white">Top Products</h2>
          <p className="text-xs text-[#555] mt-0.5">By revenue in last 30 days</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[#161616] text-[11px] text-[#666] uppercase tracking-wider">
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Product</th>
              <th className="px-6 py-3 text-left">Units Sold</th>
              <th className="px-6 py-3 text-left">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-[#555] text-sm">
                  No sales data yet
                </td>
              </tr>
            ) : (
              topProducts.map((p, i) => (
                <tr key={p.name} className="border-b border-[#1A1A1A] hover:bg-[#161616] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#555]">#{i + 1}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-[#A0A0A0]">{p.qty}</td>
                  <td className="px-6 py-4 text-sm text-[#C8F04B] font-bold">
                    {formatCurrency(p.revenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Customers Trend */}
      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6">
        <h2 className="font-syne font-bold text-white mb-1">New Customers</h2>
        <p className="text-xs text-[#555] mb-6">Monthly new registrations — last 6 months</p>
        <NewCustomersChart data={customerTrend} />
      </div>

      {/* Geographic Breakdown */}
      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1E1E1E]">
          <h2 className="font-syne font-bold text-white">Geographic Breakdown</h2>
          <p className="text-xs text-[#555] mt-0.5">Top cities by order revenue (last 30 days)</p>
        </div>
        <GeographyTable data={geographyData} formatCurrency={formatCurrency} />
      </div>
    </div>
  );
}
