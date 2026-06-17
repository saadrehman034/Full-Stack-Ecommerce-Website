import { createClient } from "@/lib/supabase/server";
import { AdminInventoryClient } from "@/components/admin/AdminInventoryClient";

export const revalidate = 30;

export default async function AdminInventoryPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku, stock_quantity, low_stock_threshold, unit, is_active")
    .order("stock_quantity", { ascending: true })
    .limit(100);

  const { data: logs } = await supabase
    .from("inventory_logs")
    .select("*, products(name), users(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-syne text-3xl font-bold">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">Stock levels and adjustment history.</p>
      </div>
      <AdminInventoryClient products={products || []} logs={logs || []} />
    </div>
  );
}
