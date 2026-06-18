import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { AdminReportsCharts } from "@/components/admin/AdminReportsCharts";

export const revalidate = 60;

export default async function AdminReportsPage() {
  const supabase = createClient();

  // Last 30 days orders
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: orders } = await supabase
    .from("orders")
    .select("total_amount, source, created_at, status")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .neq("status", "cancelled");

  // Orders by day
  const byDay: Record<string, number> = {};
  (orders || []).forEach(o => {
    const d = new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    byDay[d] = (byDay[d] || 0) + (o.total_amount || 0);
  });
  const dailyData = Object.entries(byDay).map(([date, revenue]) => ({ date, revenue })).slice(-30);

  // Revenue by source
  const onlineRevenue = (orders || []).filter(o => o.source === "online").reduce((s, o) => s + (o.total_amount || 0), 0);
  const posRevenue = (orders || []).filter(o => o.source === "pos").reduce((s, o) => s + (o.total_amount || 0), 0);

  // Orders by category via order_items
  const { data: topProducts } = await supabase
    .from("order_items")
    .select("total_price, products(name, categories(name))")
    .limit(200);

  const byCat: Record<string, number> = {};
  (topProducts || []).forEach((i: any) => {
    const cat = i.products?.categories?.name || "Other";
    byCat[cat] = (byCat[cat] || 0) + (i.total_price || 0);
  });
  const categoryData = Object.entries(byCat).map(([name, revenue]) => ({ name, revenue }));

  const totalRevenue = (orders || []).reduce((s, o) => s + (o.total_amount || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="font-syne text-2xl md:text-3xl font-bold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 30 days performance.</p>
      </div>

      {/* Summary */}
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue) },
          { label: "Online Revenue", value: formatCurrency(onlineRevenue) },
          { label: "POS Revenue", value: formatCurrency(posRevenue) },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-border/30 dark:bg-[#111]">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-syne text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <AdminReportsCharts dailyData={dailyData} categoryData={categoryData} onlineRevenue={onlineRevenue} posRevenue={posRevenue} />
    </div>
  );
}

