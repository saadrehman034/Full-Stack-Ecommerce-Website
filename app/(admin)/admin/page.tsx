import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, ShoppingBag, AlertTriangle, Users } from "lucide-react";
import { AdminRevenueChart } from "@/components/admin/AdminRevenueChart";
import { AdminRecentOrders } from "@/components/admin/AdminRecentOrders";

export const revalidate = 60;

async function getDashboardStats() {
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { data: todayOrders },
    { data: allOrders },
    { data: lowStockProducts },
    { data: customers },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("orders").select("total_amount").gte("created_at", today.toISOString()),
    supabase.from("orders").select("total_amount, created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("products").select("id, name, stock_quantity, low_stock_threshold").filter("stock_quantity", "lte", "low_stock_threshold"),
    supabase.from("users").select("id, created_at").eq("role", "customer"),
    supabase.from("orders").select("*, order_items(quantity, products(name))").order("created_at", { ascending: false }).limit(10),
  ]);

  const todayRevenue = (todayOrders || []).reduce((s, o) => s + (o.total_amount || 0), 0);
  const todayOrderCount = todayOrders?.length || 0;
  const customerCount = customers?.length || 0;
  const lowStockCount = lowStockProducts?.length || 0;

  // Build last 30 days revenue chart data
  const chartData: { date: string; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    const revenue = (allOrders || [])
      .filter(o => new Date(o.created_at) >= dayStart && new Date(o.created_at) <= dayEnd)
      .reduce((s, o) => s + (o.total_amount || 0), 0);
    chartData.push({ date: label, revenue });
  }

  return { todayRevenue, todayOrderCount, customerCount, lowStockCount, chartData, recentOrders: recentOrders || [], lowStockProducts: lowStockProducts || [] };
}

export default async function AdminDashboard() {
  const { todayRevenue, todayOrderCount, customerCount, lowStockCount, chartData, recentOrders, lowStockProducts } = await getDashboardStats();

  const KPI = [
    { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Orders Today", value: todayOrderCount.toString(), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Low Stock Items", value: lowStockCount.toString(), icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Total Customers", value: customerCount.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="font-syne text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Detailed information about your store.</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPI.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-border/30 dark:bg-[#111]">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-2.5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-syne text-2xl font-bold">{value}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111]">
          <h2 className="mb-1 font-syne text-base font-bold">Revenue this week</h2>
          <AdminRevenueChart data={chartData} />
        </div>

        {/* Low stock alerts */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111]">
          <h2 className="mb-4 font-syne text-base font-bold">Inventory Alerts</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products are well stocked!</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 8).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between">
                  <p className="text-sm font-medium line-clamp-1 flex-1">{p.name}</p>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${p.stock_quantity <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {p.stock_quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111]">
        <div className="border-b border-border/40 px-6 py-4">
          <h2 className="font-syne text-base font-bold">Recent Orders</h2>
        </div>
        <AdminRecentOrders orders={recentOrders as any[]} />
      </div>
    </div>
  );
}
