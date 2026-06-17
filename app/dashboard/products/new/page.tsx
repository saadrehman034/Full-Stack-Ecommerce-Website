import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ProductForm } from "@/components/dashboard/ProductForm"

export default async function NewDashboardProductPage() {
  const supabase = createClient()
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name")

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
        <span className="text-[#555] text-sm">New Product</span>
      </div>

      <div className="mb-6">
        <h1 className="font-syne text-2xl font-bold text-white">New Product</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">
          Fill in the details below to add a new product to your store.
        </p>
      </div>

      <ProductForm categories={categories ?? []} mode="create" />
    </div>
  )
}
