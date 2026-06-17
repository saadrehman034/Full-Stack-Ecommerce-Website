import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users } from "lucide-react";

export const revalidate = 60;

export default async function AdminCustomersPage() {
  const supabase = createClient();

  const { data: customers } = await supabase
    .from("users")
    .select("id, full_name, phone, role, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  // Get order stats per customer
  const { data: orderStats } = await supabase
    .from("orders")
    .select("user_id, total_amount")
    .not("user_id", "is", null);

  const statsByUser: Record<string, { count: number; total: number }> = {};
  (orderStats || []).forEach((o) => {
    if (!o.user_id) return;
    if (!statsByUser[o.user_id]) statsByUser[o.user_id] = { count: 0, total: 0 };
    statsByUser[o.user_id].count++;
    statsByUser[o.user_id].total += o.total_amount || 0;
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-syne text-3xl font-bold">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">{customers?.length || 0} registered customers</p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111] overflow-x-auto">
        {!customers?.length ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No customers yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {["Customer", "Phone", "Orders", "Total Spent", "Joined"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const stats = statsByUser[c.id] || { count: 0, total: 0 };
                return (
                  <tr key={c.id} className="border-b border-border/20 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {(c.full_name || "G")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{c.full_name || "Guest"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{stats.count}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(stats.total)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
