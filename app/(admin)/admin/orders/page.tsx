import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  packing: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

export const revalidate = 30;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; source?: string; page?: string };
}) {
  const supabase = createClient();
  const page = parseInt(searchParams.page || "1");
  const pageSize = 25;

  let query = supabase
    .from("orders")
    .select("*, users(full_name, email), order_items(quantity)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.source) query = query.eq("source", searchParams.source);

  const { data: orders, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  const STATUSES = ["pending", "confirmed", "packing", "shipped", "delivered", "cancelled", "refunded"];

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6">
      <div>
        <h1 className="font-syne text-2xl md:text-3xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">{count || 0} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/orders"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${!searchParams.status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
          All
        </Link>
        {STATUSES.map(s => (
          <Link key={s} href={`/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${searchParams.status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {s}
          </Link>
        ))}
        <Link href="/admin/orders?source=pos"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${searchParams.source === "pos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
          POS Only
        </Link>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left">
              {["Order #", "Date", "Customer", "Items", "Total", "Payment", "Status", "Source", ""].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders || []).map((o) => {
              const itemCount = o.order_items?.reduce((n: number, i: any) => n + i.quantity, 0) ?? 0;
              return (
                <tr key={o.id} className="border-b border-border/20 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-primary">{o.order_number}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{(o as any).users?.full_name || "Guest"}</p>
                      <p className="text-[11px] text-muted-foreground">{(o as any).users?.email || ""}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{itemCount}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(o.total_amount)}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{o.payment_status}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLORS[o.status] || ""}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${o.source === "pos" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {o.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/order-confirmation/${o.id}`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link key={p} href={`/admin/orders?page=${p}${searchParams.status ? `&status=${searchParams.status}` : ""}`}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
