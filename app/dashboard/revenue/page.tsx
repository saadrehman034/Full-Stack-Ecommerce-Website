import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DollarSign, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueByCategoryChart } from "./RevenueByCategoryChart";
import { TopProductsTable } from "./TopProductsTable";

export const revalidate = 60;

export default async function RevenuePage() {
  const supabase = createClient();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const [allTimeRes, thisMonthRes, lastMonthRes, orderItemsRes] = await Promise.all([
    supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
    supabase.from("orders").select("total_amount").eq("payment_status", "paid").gte("created_at", thisMonthStart),
    supabase.from("orders").select("total_amount").eq("payment_status", "paid").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
    supabase
      .from("order_items")
      .select("product_id, total_price, quantity, products(id, name, sku, category_id, categories(name))")
      .order("created_at", { ascending: false }),
  ]);

  const allTimeRevenue = (allTimeRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const allTimeCount = (allTimeRes.data ?? []).length;
  const thisMonthRevenue = (thisMonthRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const lastMonthRevenue = (lastMonthRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const avgOrderValue = allTimeCount > 0 ? allTimeRevenue / allTimeCount : 0;

  const monthTrend =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
      : thisMonthRevenue > 0 ? 100 : 0;

  // Aggregate by category
  const categoryMap: Record<string, { name: string; revenue: number; units: number }> = {};
  // Aggregate by product
  const productMap: Record<string, { id: string; name: string; sku: string; revenue: number; units: number }> = {};

  for (const item of orderItemsRes.data ?? []) {
    const prod = item.products as unknown as {
      id: string; name: string; sku: string; category_id: string;
      categories: { name: string } | null;
    } | null;
    if (!prod) continue;

    const catName = prod.categories?.name ?? "Uncategorised";

    if (!categoryMap[catName]) categoryMap[catName] = { name: catName, revenue: 0, units: 0 };
    categoryMap[catName].revenue += item.total_price ?? 0;
    categoryMap[catName].units += item.quantity ?? 0;

    if (!productMap[item.product_id]) {
      productMap[item.product_id] = { id: prod.id, name: prod.name, sku: prod.sku, revenue: 0, units: 0 };
    }
    productMap[item.product_id].revenue += item.total_price ?? 0;
    productMap[item.product_id].units += item.quantity ?? 0;
  }

  const categoryData = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20);

  const totalRevenue = topProducts.reduce((s, p) => s + p.revenue, 0);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-syne text-3xl font-black text-white tracking-tight">Revenue Analytics</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">Detailed breakdown of your store revenue.</p>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="All-Time Revenue"
          value={formatCurrency(allTimeRevenue)}
          icon={DollarSign}
          sublabel={`${allTimeCount} paid orders`}
        />
        <KPICard
          label="This Month"
          value={formatCurrency(thisMonthRevenue)}
          icon={TrendingUp}
          trend={monthTrend}
          trendLabel="vs last month"
        />
        <KPICard
          label="Last Month"
          value={formatCurrency(lastMonthRevenue)}
          icon={TrendingDown}
          color="#3B82F6"
        />
        <KPICard
          label="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          icon={BarChart2}
          color="#8B5CF6"
        />
      </div>

      {/* Revenue Chart (full width, default 30d) */}
      <RevenueChart period="30d" />

      {/* Revenue by Category */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
        <h2 className="font-syne text-white font-bold text-lg mb-6">Revenue by Category</h2>
        {categoryData.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-[#555] text-sm">No sales data yet</div>
        ) : (
          <RevenueByCategoryChart data={categoryData} />
        )}
      </div>

      {/* Top 20 Products table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
        <h2 className="font-syne text-white font-bold text-lg mb-6">Top Products by Revenue</h2>
        {topProducts.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-[#555] text-sm">No sales data yet</div>
        ) : (
          <TopProductsTable products={topProducts} totalRevenue={totalRevenue} />
        )}
      </div>
    </div>
  );
}
