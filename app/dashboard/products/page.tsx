import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ProductsClient } from "./ProductsClient"

interface SearchParams {
  q?: string
  stock?: string
  category_id?: string
}

export default async function DashboardProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()

  let query = supabase
    .from("products")
    .select("*, categories(name, slug)", { count: "exact" })
    .order("created_at", { ascending: false })

  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`)
  if (searchParams.stock === "active") query = query.eq("is_active", true)
  if (searchParams.stock === "inactive") query = query.eq("is_active", false)
  if (searchParams.category_id) query = query.eq("category_id", searchParams.category_id)

  const { data: products, count } = await query

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name")

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-bold text-white">Products</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">{count ?? 0} products</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Filter bar */}
      <form className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Search products…"
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none placeholder:text-[#555] text-sm w-56"
        />
        <select
          name="category_id"
          defaultValue={searchParams.category_id ?? ""}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none text-sm"
        >
          <option value="">All Categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="stock"
          defaultValue={searchParams.stock ?? ""}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Draft</option>
        </select>
        <button
          type="submit"
          className="bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all"
        >
          Filter
        </button>
        {(searchParams.q || searchParams.stock || searchParams.category_id) && (
          <Link
            href="/dashboard/products"
            className="border border-[#2A2A2A] text-white rounded-full px-5 py-2.5 text-sm hover:border-[#444] transition-all"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Products table */}
      <ProductsClient products={products ?? []} />
    </div>
  )
}
