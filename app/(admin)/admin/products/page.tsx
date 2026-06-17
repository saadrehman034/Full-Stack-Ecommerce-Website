import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Plus, Package } from "lucide-react";
import { AdminProductActions } from "@/components/admin/AdminProductActions";

export const revalidate = 30;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; stock?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("products")
    .select("*, categories(name, slug)")
    .order("created_at", { ascending: false });

  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  if (searchParams.category) query = query.eq("categories.slug", searchParams.category);
  if (searchParams.stock === "low") query = query.lte("stock_quantity", 5);
  if (searchParams.stock === "out") query = query.eq("stock_quantity", 0);

  const { data: products } = await query.limit(100);
  const { data: categories } = await supabase.from("categories").select("id, name, slug").eq("is_active", true);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">{products?.length || 0} products</p>
        </div>
        <Link href="/admin/products/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form method="get" action="/admin/products" className="flex gap-2">
          <input name="q" defaultValue={searchParams.q} placeholder="Search products…"
            className="h-9 rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-ring dark:bg-[#111]" />
          <select name="category" defaultValue={searchParams.category}
            className="h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none dark:bg-[#111]">
            <option value="">All Categories</option>
            {(categories || []).map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <select name="stock" defaultValue={searchParams.stock}
            className="h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none dark:bg-[#111]">
            <option value="">All Stock</option>
            <option value="low">Low Stock (≤5)</option>
            <option value="out">Out of Stock</option>
          </select>
          <button type="submit" className="h-9 rounded-xl bg-muted px-4 text-sm font-medium hover:bg-muted/70">Filter</button>
        </form>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111] overflow-x-auto">
        {!products?.length ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {["Product", "Category", "Price", "Stock", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const img = p.images?.[0] || "";
                const stockStatus = p.stock_quantity <= 0 ? "out" : p.stock_quantity <= p.low_stock_threshold ? "low" : "ok";
                return (
                  <tr key={p.id} className="border-b border-border/20 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {img ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                            <Image src={img} alt={p.name} fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{(p as any).categories?.name || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${stockStatus === "out" ? "bg-red-100 text-red-700" : stockStatus === "low" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {p.stock_quantity} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {p.is_active ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AdminProductActions productId={p.id} slug={p.slug} isActive={p.is_active} />
                    </td>
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
