import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const revalidate = 30;

export async function GET() {
  try {
    const supabase = createClient();

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterdayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const [
      todayRevenueRes,
      yesterdayRevenueRes,
      thisMonthRevenueRes,
      lastMonthRevenueRes,
      todayOrdersRes,
      yesterdayOrdersRes,
      thisMonthOrdersRes,
      lastMonthOrdersRes,
      lowStockRes,
      customerRes,
      newCustomerRes,
      recentOrdersRes,
      topProductsRes,
      ordersByStatusRes,
      lowStockProductsRes,
    ] = await Promise.all([
      // 1. Today's revenue
      supabase
        .from("orders")
        .select("total_amount")
        .eq("payment_status", "paid")
        .gte("created_at", todayMidnight),

      // 2. Yesterday's revenue
      supabase
        .from("orders")
        .select("total_amount")
        .eq("payment_status", "paid")
        .gte("created_at", yesterdayMidnight)
        .lt("created_at", todayMidnight),

      // 3. This month's revenue
      supabase
        .from("orders")
        .select("total_amount")
        .eq("payment_status", "paid")
        .gte("created_at", thisMonthStart),

      // 4. Last month's revenue
      supabase
        .from("orders")
        .select("total_amount")
        .eq("payment_status", "paid")
        .gte("created_at", lastMonthStart)
        .lte("created_at", lastMonthEnd),

      // 5. Today's orders
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayMidnight),

      // 6. Yesterday's orders
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", yesterdayMidnight)
        .lt("created_at", todayMidnight),

      // 7. This month's orders
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thisMonthStart),

      // 8. Last month's orders
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", lastMonthStart)
        .lte("created_at", lastMonthEnd),

      // 9. Low stock products count
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .filter("stock_quantity", "lte", "low_stock_threshold"),

      // 10. Total customer count
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "customer"),

      // 11. New customers this month
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "customer")
        .gte("created_at", thisMonthStart),

      // 12. Recent 10 orders with user info
      supabase
        .from("orders")
        .select("*, users(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(10),

      // 13. Top products by revenue (all order_items with product info)
      supabase
        .from("order_items")
        .select("product_id, total_price, quantity, products(id, name, sku, images)"),

      // 14. Orders by status (for donut chart)
      supabase
        .from("orders")
        .select("status"),

      // 15. Low stock products detail
      supabase
        .from("products")
        .select("id, name, stock_quantity, low_stock_threshold, sku, images")
        .eq("is_active", true)
        .filter("stock_quantity", "lte", "low_stock_threshold")
        .order("stock_quantity", { ascending: true })
        .limit(10),
    ]);

    // Aggregate revenues
    const todayRevenue = (todayRevenueRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
    const yesterdayRevenue = (yesterdayRevenueRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
    const thisMonthRevenue = (thisMonthRevenueRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
    const lastMonthRevenue = (lastMonthRevenueRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);

    // Compute trends
    const todayRevenueTrend =
      yesterdayRevenue > 0
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 1000) / 10
        : todayRevenue > 0 ? 100 : 0;

    const monthRevenueTrend =
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

    // Aggregate top products
    const productMap: Record<string, { id: string; name: string; sku: string; image: string; revenue: number; units: number }> = {};
    for (const item of topProductsRes.data ?? []) {
      const prod = item.products as unknown as { id: string; name: string; sku: string; images: string[] } | null;
      if (!prod) continue;
      if (!productMap[item.product_id]) {
        productMap[item.product_id] = {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          image: prod.images?.[0] ?? "",
          revenue: 0,
          units: 0,
        };
      }
      productMap[item.product_id].revenue += item.total_price ?? 0;
      productMap[item.product_id].units += item.quantity ?? 0;
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Orders by status for donut
    const statusMap: Record<string, number> = {};
    for (const order of ordersByStatusRes.data ?? []) {
      statusMap[order.status] = (statusMap[order.status] ?? 0) + 1;
    }
    const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    return NextResponse.json({
      todayRevenue,
      yesterdayRevenue,
      todayRevenueTrend,
      thisMonthRevenue,
      lastMonthRevenue,
      monthRevenueTrend,
      todayOrders,
      yesterdayOrders,
      ordersTodayTrend,
      thisMonthOrders,
      lastMonthOrders,
      ordersMonthTrend,
      lowStockCount: lowStockRes.count ?? 0,
      customerCount: customerRes.count ?? 0,
      newCustomersThisMonth: newCustomerRes.count ?? 0,
      recentOrders: recentOrdersRes.data ?? [],
      topProducts,
      ordersByStatus,
      lowStockProducts: lowStockProductsRes.data ?? [],
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
