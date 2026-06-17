import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  packing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(quantity, products(name))")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-3xl bg-card p-16 text-center shadow-sm ring-1 ring-border/30">
        <div className="rounded-full bg-muted p-6">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-syne text-2xl font-bold">No orders yet</h2>
          <p className="mt-2 text-muted-foreground">Start shopping and your orders will appear here.</p>
        </div>
        <Link href="/shop"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105">
          Shop Now <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-syne text-3xl font-bold">My Orders</h1>

      <div className="space-y-3">
        {orders.map((order) => {
          const itemCount = order.order_items?.reduce((n: number, i: any) => n + i.quantity, 0) ?? 0;
          const statusClass = STATUS_COLORS[order.status] || STATUS_COLORS.pending;

          return (
            <Link key={order.id} href={`/order-confirmation/${order.id}`}
              className="group flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/30 transition-all hover:shadow-md hover:ring-primary/30 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-syne font-bold text-primary">{order.order_number}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusClass}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.created_at)} · {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-syne text-lg font-bold">{formatCurrency(order.total_amount)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{order.payment_status}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
