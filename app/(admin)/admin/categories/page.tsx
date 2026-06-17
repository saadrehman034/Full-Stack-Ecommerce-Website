import { createClient } from "@/lib/supabase/server";
import { AdminCategoriesClient } from "@/components/admin/AdminCategoriesClient";

export const revalidate = 30;

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-syne text-3xl font-bold">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage and reorder product categories.</p>
      </div>
      <AdminCategoriesClient initialCategories={categories || []} />
    </div>
  );
}
