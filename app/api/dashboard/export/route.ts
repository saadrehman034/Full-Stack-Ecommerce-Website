import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(row: unknown[]): string {
  return row.map(escapeCsv).join(",");
}

function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(","), ...rows.map(rowToCsv)];
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "orders";
    const supabase = createClient();
    const dateStr = new Date().toISOString().slice(0, 10);

    let csvContent = "";

    if (type === "orders") {
      const { data, error } = await supabase
        .from("orders")
        .select("*, users(full_name, email), order_items(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const headers = [
        "Order#", "Date", "Customer", "Email",
        "Items", "Subtotal", "Discount", "Shipping",
        "Total", "Payment Status", "Order Status", "Source",
      ];
      const rows = (data ?? []).map((o) => {
        const user = o.users as unknown as { full_name: string; email: string } | null;
        return [
          o.order_number,
          new Date(o.created_at).toLocaleDateString("en-GB"),
          user?.full_name ?? "Guest",
          user?.email ?? "",
          Array.isArray(o.order_items) ? o.order_items.length : 0,
          o.subtotal ?? 0,
          o.discount_amount ?? 0,
          o.shipping_amount ?? 0,
          o.total_amount ?? 0,
          o.payment_status,
          o.status,
          o.source ?? "online",
        ];
      });
      csvContent = buildCsv(headers, rows);

    } else if (type === "products") {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("name", { ascending: true });
      if (error) throw error;

      const headers = ["Name", "SKU", "Price", "Stock", "Category", "Active"];
      const rows = (data ?? []).map((p) => {
        const cat = p.categories as unknown as { name: string } | null;
        return [
          p.name,
          p.sku ?? "",
          p.price ?? 0,
          p.stock_quantity ?? 0,
          cat?.name ?? "",
          p.is_active ? "Yes" : "No",
        ];
      });
      csvContent = buildCsv(headers, rows);

    } else if (type === "customers") {
      const { data: customers, error } = await supabase
        .from("users")
        .select("id, full_name, email, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch order stats per customer
      const { data: orderStats } = await supabase
        .from("orders")
        .select("user_id, total_amount")
        .eq("payment_status", "paid");

      const statsMap: Record<string, { orders: number; spent: number }> = {};
      for (const o of orderStats ?? []) {
        if (!statsMap[o.user_id]) statsMap[o.user_id] = { orders: 0, spent: 0 };
        statsMap[o.user_id].orders += 1;
        statsMap[o.user_id].spent += o.total_amount ?? 0;
      }

      const headers = ["Name", "Email", "Orders", "Total Spent", "Joined"];
      const rows = (customers ?? []).map((c) => {
        const stats = statsMap[c.id] ?? { orders: 0, spent: 0 };
        return [
          c.full_name ?? "",
          c.email ?? "",
          stats.orders,
          stats.spent.toFixed(2),
          new Date(c.created_at).toLocaleDateString("en-GB"),
        ];
      });
      csvContent = buildCsv(headers, rows);

    } else if (type === "inventory") {
      const { data, error } = await supabase
        .from("products")
        .select("name, sku, stock_quantity, low_stock_threshold, is_active")
        .order("name", { ascending: true });
      if (error) throw error;

      const headers = ["Product", "SKU", "Current Stock", "Threshold", "Status"];
      const rows = (data ?? []).map((p) => {
        const isLow = (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 0);
        const status = !p.is_active ? "Inactive" : (p.stock_quantity ?? 0) === 0 ? "Out of Stock" : isLow ? "Low Stock" : "OK";
        return [
          p.name,
          p.sku ?? "",
          p.stock_quantity ?? 0,
          p.low_stock_threshold ?? 0,
          status,
        ];
      });
      csvContent = buildCsv(headers, rows);

    } else {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${type}-export-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
