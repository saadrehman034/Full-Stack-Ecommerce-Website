import { createClient } from "@/lib/supabase/server";
import { AdminCouponsClient } from "@/components/admin/AdminCouponsClient";

export const revalidate = 30;

export default async function AdminCouponsPage() {
  const supabase = createClient();
  const { data: coupons } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-syne text-3xl font-bold">Coupons</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage discount codes and promotions.</p>
      </div>
      <AdminCouponsClient initialCoupons={coupons || []} />
    </div>
  );
}
