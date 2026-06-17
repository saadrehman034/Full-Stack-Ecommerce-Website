import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AdminEditProductForm } from "@/components/admin/AdminEditProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", params.id).single(),
    supabase.from("categories").select("id, name, slug").eq("is_active", true).order("name"),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl p-8">
      <AdminEditProductForm product={product} categories={categories || []} />
    </div>
  );
}
