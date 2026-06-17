import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { ProductForm } from "@/components/dashboard/ProductForm"

export default async function EditDashboardProductPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", params.id).single(),
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name"),
  ])

  if (!product) notFound()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/products"
          className="flex items-center gap-1 text-[#A0A0A0] hover:text-white transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Products
        </Link>
        <span className="text-[#333]">/</span>
        <span className="text-[#555] text-sm truncate max-w-xs">{product.name}</span>
      </div>

      <h1 className="font-syne text-2xl font-bold text-white mb-6">
        Edit: {product.name}
      </h1>

      <ProductForm
        initialData={product}
        categories={categories ?? []}
        mode="edit"
      />
    </div>
  )
}
