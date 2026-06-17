import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  packing: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

export function AdminRecentOrders({ orders }: { orders: any[] }) {
  if (!orders.length) {
    return <p className="px-6 py-8 text-center text-sm text-muted-foreground">No orders yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 text-left">
            {["Order #", "Date", "Items", "Total", "Payment", "Status", "Source"].map(h => (
              <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const itemCount = o.order_items?.reduce((n: number, i: any) => n + i.quantity, 0) ?? 0;
            return (
              <tr key={o.id} className="border-b border-border/20 transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link href={`/order-confirmation/${o.id}`} className="font-mono font-semibold text-primary hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(o.created_at)}</td>
                <td className="px-4 py-3">{itemCount}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(o.total_amount)}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{o.payment_status}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLORS[o.status] || ""}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${o.source === "pos" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {o.source}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
