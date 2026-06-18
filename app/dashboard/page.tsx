import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  TrendingUp,
  Package,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

const RevenueChart = dynamic(() => import('@/components/dashboard/RevenueChart').then(m => ({ default: m.RevenueChart })), {
  ssr: false,
  loading: () => <div className="h-64 rounded-2xl bg-white/[0.04] animate-pulse" />
})

const OrderStatusChart = dynamic(() => import('@/components/dashboard/OrderStatusChart').then(m => ({ default: m.OrderStatusChart })), {
  ssr: false,
  loading: () => <div className="h-64 rounded-2xl bg-white/[0.04] animate-pulse" />
})

export const revalidate = 30;


// ──────────────────────────────────────────────────────────
// Sub-component: Recent Orders widget
// ──────────────────────────────────────────────────────────

interface RecentOrder {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  users: { full_name: string; email: string } | null;
}

function RecentOrdersWidget({ orders }: { orders: RecentOrder[] }) {
  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-syne text-white font-bold text-lg">Recent Orders</h3>
          <p className="text-white/40 text-xs mt-0.5">Last 10 orders placed</p>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-violet-400 hover:text-violet-300 text-xs font-semibold transition-colors"
        >
          View all
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-white/30 text-sm">
          No orders yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Order", "Customer", "Date", "Total", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] uppercase tracking-widest text-white/30 pb-3 pr-4 font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-violet-400 text-sm font-mono hover:text-violet-300 transition-colors"
                    >
                      #{order.order_number}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-white/80 text-sm">{order.users?.full_name ?? "Guest"}</p>
                    <p className="text-white/30 text-xs">{order.users?.email ?? ""}</p>
                  </td>
                  <td className="py-3 pr-4 text-white/40 text-sm whitespace-nowrap">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-3 pr-4 text-white text-sm font-semibold">
                    {formatCurrency(order.total_amount ?? 0)}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Sub-component: Top Products widget
// ──────────────────────────────────────────────────────────

interface TopProduct {
  id: string;
  name: string;
  sku: string;
  image: string;
  revenue: number;
  units: number;
}

function TopProductsWidget({ products }: { products: TopProduct[] }) {
  const maxRevenue = products[0]?.revenue ?? 1;

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-syne text-white font-bold text-lg">Top Products</h3>
          <p className="text-white/40 text-xs mt-0.5">By revenue</p>
        </div>
        <Link href="/dashboard/revenue" className="text-violet-400 hover:text-violet-300 text-xs font-semibold transition-colors">
          Details
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-white/30 text-sm">
          No sales data yet
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p, i) => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white/30 text-xs w-4 shrink-0">{i + 1}</span>
                  <span className="text-white/80 text-sm truncate">{p.name}</span>
                </div>
                <span className="text-white font-semibold text-sm ml-2 shrink-0">
                  {formatCurrency(p.revenue)}
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all"
                  style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <p className="text-white/30 text-xs mt-0.5">{p.units} units sold</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Sub-component: Low Stock widget
// ──────────────────────────────────────────────────────────

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  images: string[];
}

function LowStockWidget({ products }: { products: LowStockProduct[] }) {
  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <div>
            <h3 className="font-syne text-white font-bold text-lg">Low Stock Alerts</h3>
            <p className="text-white/40 text-xs mt-0.5">{products.length} products need restocking</p>
          </div>
        </div>
        <Link
          href="/dashboard/inventory?filter=low"
          className="text-violet-400 hover:text-violet-300 text-xs font-semibold transition-colors"
        >
          View all
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="h-24 flex items-center justify-center text-white/30 text-sm">
          All products are well-stocked
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const pct = p.low_stock_threshold > 0
              ? Math.min((p.stock_quantity / p.low_stock_threshold) * 100, 100)
              : 0;
            const isOut = p.stock_quantity === 0;
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm truncate">{p.name}</span>
                    <span
                      className={`text-xs font-semibold ml-2 shrink-0 ${
                        isOut ? "text-rose-400" : "text-amber-400"
                      }`}
                    >
                      {isOut ? "Out of stock" : `${p.stock_quantity} left`}
                    </span>
                  </div>
                  <div className="h-1 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOut ? "bg-rose-500" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <Link
                  href={`/dashboard/products/${p.id}`}
                  className="text-violet-400 hover:text-violet-300 text-xs transition-colors shrink-0"
                >
                  Restock
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Sub-component: Activity Feed widget
// ──────────────────────────────────────────────────────────

async function ActivityFeedWidget() {
  const supabase = createClient();

  const [{ data: recentOrders }, { data: inventoryLogs }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, created_at, total_amount")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("inventory_logs")
      .select("id, product_id, change_amount, reason, created_at, products(name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  type ActivityItem = {
    id: string;
    time: string;
    type: "order" | "inventory";
    label: string;
    sub: string;
  };

  const items: ActivityItem[] = [
    ...(recentOrders ?? []).map((o) => ({
      id: `order-${o.id}`,
      time: o.created_at,
      type: "order" as const,
      label: `Order #${o.order_number} — ${o.status}`,
      sub: formatCurrency(o.total_amount ?? 0),
    })),
    ...(inventoryLogs ?? []).map((l) => {
      const prod = l.products as unknown as { name: string } | null;
      return {
        id: `inv-${l.id}`,
        time: l.created_at,
        type: "inventory" as const,
        label: prod?.name ?? "Unknown product",
        sub: `${l.change_amount > 0 ? "+" : ""}${l.change_amount} units — ${l.reason ?? ""}`,
      };
    }),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
      <h3 className="font-syne text-white font-bold text-lg mb-5">Recent Activity</h3>
      {items.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-white/30 text-sm">No activity yet</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  item.type === "order"
                    ? "bg-violet-500/10"
                    : "bg-cyan-500/10"
                }`}
              >
                {item.type === "order" ? (
                  <ShoppingBag className="h-4 w-4 text-violet-400" />
                ) : (
                  <Package className="h-4 w-4 text-cyan-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-sm truncate">{item.label}</p>
                <p className="text-white/30 text-xs">{item.sub}</p>
              </div>
              <span className="text-white/30 text-xs shrink-0 mt-0.5">
                {formatDate(item.time)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main Page (Server Component)
// ──────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createClient();
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const yesterdayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const [
    todayRevRes,
    yesterdayRevRes,
    thisMonthRevRes,
    lastMonthRevRes,
    todayOrdersRes,
    yesterdayOrdersRes,
    thisMonthOrdersRes,
    lastMonthOrdersRes,
    lowStockCountRes,
    customerCountRes,
    newCustomerRes,
    recentOrdersRes,
    topProductsRes,
    ordersByStatusRes,
    lowStockProductsRes,
  ] = await Promise.all([
    supabase.from("orders").select("total_amount").eq("payment_status", "paid").gte("created_at", todayMidnight),
    supabase.from("orders").select("total_amount").eq("payment_status", "paid").gte("created_at", yesterdayMidnight).lt("created_at", todayMidnight),
    supabase.from("orders").select("total_amount").eq("payment_status", "paid").gte("created_at", thisMonthStart),
    supabase.from("orders").select("total_amount").eq("payment_status", "paid").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayMidnight),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", yesterdayMidnight).lt("created_at", todayMidnight),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", thisMonthStart),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
    supabase.from("products").select("id, stock_quantity, low_stock_threshold").eq("is_active", true),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "customer").gte("created_at", thisMonthStart),
    supabase.from("orders").select("*, users(full_name, email)").order("created_at", { ascending: false }).limit(10),
    supabase.from("order_items").select("product_id, total_price, quantity, products(id, name, sku, images)"),
    supabase.from("orders").select("status"),
    supabase.from("products").select("id, name, stock_quantity, low_stock_threshold, sku, images").eq("is_active", true).order("stock_quantity", { ascending: true }).limit(50),
  ]);

  const todayRevenue = (todayRevRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const yesterdayRevenue = (yesterdayRevRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const thisMonthRevenue = (thisMonthRevRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const lastMonthRevenue = (lastMonthRevRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);

  const todayRevTrend =
    yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 1000) / 10
      : todayRevenue > 0 ? 100 : 0;

  const monthRevTrend =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
      : thisMonthRevenue > 0 ? 100 : 0;

  const todayOrders = todayOrdersRes.count ?? 0;
  const yesterdayOrders = yesterdayOrdersRes.count ?? 0;
  const thisMonthOrders = thisMonthOrdersRes.count ?? 0;
  const lastMonthOrders = lastMonthOrdersRes.count ?? 0;

  const ordersTodayTrend =
    yesterdayOrders > 0
      ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 1000) / 10
      : todayOrders > 0 ? 100 : 0;

  const ordersMonthTrend =
    lastMonthOrders > 0
      ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 1000) / 10
      : thisMonthOrders > 0 ? 100 : 0;

  // Top products
  const productMap: Record<string, TopProduct> = {};
  for (const item of topProductsRes.data ?? []) {
    const prod = item.products as unknown as { id: string; name: string; sku: string; images: string[] } | null;
    if (!prod) continue;
    if (!productMap[item.product_id]) {
      productMap[item.product_id] = { id: prod.id, name: prod.name, sku: prod.sku, image: prod.images?.[0] ?? "", revenue: 0, units: 0 };
    }
    productMap[item.product_id].revenue += item.total_price ?? 0;
    productMap[item.product_id].units += item.quantity ?? 0;
  }
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Orders by status
  const statusMap: Record<string, number> = {};
  for (const o of ordersByStatusRes.data ?? []) {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  }
  const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  const recentOrders = (recentOrdersRes.data ?? []) as RecentOrder[];
  const allProductsForStock = lowStockCountRes.data ?? [];
  const lowStockCount = allProductsForStock.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  ).length;
  const lowStockProducts = (lowStockProductsRes.data ?? [])
    .filter((p) => p.stock_quantity <= p.low_stock_threshold) as LowStockProduct[];
  const customerCount = customerCountRes.count ?? 0;
  const newCustomers = newCustomerRes.count ?? 0;

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-syne text-4xl font-black bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Welcome back — here&apos;s what&apos;s happening with PantryLegend today.
        </p>
      </div>

      {/* Row 1: 6 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          label="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          icon={DollarSign}
          trend={todayRevTrend}
          trendLabel="vs yesterday"
          color="violet"
        />
        <KPICard
          label="Month Revenue"
          value={formatCurrency(thisMonthRevenue)}
          icon={TrendingUp}
          trend={monthRevTrend}
          trendLabel="vs last month"
          color="cyan"
        />
        <KPICard
          label="Orders Today"
          value={String(todayOrders)}
          icon={ShoppingBag}
          trend={ordersTodayTrend}
          trendLabel="vs yesterday"
          color="emerald"
        />
        <KPICard
          label="Orders This Month"
          value={String(thisMonthOrders)}
          icon={ShoppingBag}
          trend={ordersMonthTrend}
          trendLabel="vs last month"
          color="fuchsia"
        />
        <KPICard
          label="Low Stock Alerts"
          value={String(lowStockCount)}
          icon={AlertTriangle}
          sublabel="Products need restocking"
          color="amber"
          onClick={undefined}
        />
        <KPICard
          label="Total Customers"
          value={String(customerCount)}
          icon={Users}
          sublabel={`+${newCustomers} this month`}
          color="rose"
        />
      </div>

      {/* Row 2: Revenue chart (2/3) + Order Status donut (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <OrderStatusChart data={ordersByStatus} />
      </div>

      {/* Row 3: Recent Orders (2/3) + Top Products (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersWidget orders={recentOrders} />
        </div>
        <TopProductsWidget products={topProducts} />
      </div>

      {/* Row 4: Low Stock Alerts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockWidget products={lowStockProducts} />
        <ActivityFeedWidget />
      </div>
    </div>
  );
}
