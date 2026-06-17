"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Pencil, Star, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { ConfirmModal } from "@/components/dashboard/ConfirmModal"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  is_featured: boolean
  images: string[]
  categories?: { name: string; slug: string } | null
}

function stockStatus(p: Product): "in_stock" | "low" | "out" {
  if (p.stock_quantity <= 0) return "out"
  if (p.stock_quantity <= p.low_stock_threshold) return "low"
  return "in_stock"
}

export function ProductsClient({ products }: { products: Product[] }) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [localProducts, setLocalProducts] = useState<Product[]>(products)
  const router = useRouter()
  const supabase = createClient()

  async function toggleActive(product: Product) {
    // Optimistic update
    setLocalProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      )
    )
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id)
    if (error) {
      toast.error("Failed to update product")
      // Revert
      setLocalProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: product.is_active } : p
        )
      )
    } else {
      toast.success(`Product ${!product.is_active ? "activated" : "deactivated"}`)
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteTarget)
    if (error) {
      toast.error("Failed to delete product")
    } else {
      toast.success("Product deleted")
      setLocalProducts((prev) => prev.filter((p) => p.id !== deleteTarget))
      router.refresh()
    }
    setDeleteLoading(false)
    setDeleteTarget(null)
  }

  if (localProducts.length === 0) {
    return (
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl">
        <EmptyState
          title="No products yet"
          description="Add your first product to get started."
          icon={Package}
          action={{ label: "Add Product", href: "/dashboard/products/new" }}
        />
      </div>
    )
  }

  return (
    <>
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E1E1E]">
                <th className="px-4 py-3 text-left text-[#555] font-medium uppercase tracking-wider text-xs">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-[#555] font-medium uppercase tracking-wider text-xs">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-[#555] font-medium uppercase tracking-wider text-xs">
                  Price
                </th>
                <th className="px-4 py-3 text-center text-[#555] font-medium uppercase tracking-wider text-xs">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-[#555] font-medium uppercase tracking-wider text-xs">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-[#555] font-medium uppercase tracking-wider text-xs">
                  Featured
                </th>
                <th className="px-4 py-3 text-right text-[#555] font-medium uppercase tracking-wider text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {localProducts.map((product) => {
                const stock = stockStatus(product)
                const img = product.images?.[0]

                return (
                  <tr key={product.id} className="hover:bg-[#161616] transition-colors">
                    {/* Image + name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] overflow-hidden shrink-0 relative">
                          {img ? (
                            <Image
                              src={img}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-[#555]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{product.name}</p>
                          <p className="text-xs text-[#555]">{product.sku}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-[#A0A0A0]">
                      {product.categories?.name ?? (
                        <span className="text-[#555]">—</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      {formatCurrency(product.price)}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <StatusBadge status={stock} type="stock" />
                        <span className="text-[10px] text-[#555]">
                          {product.stock_quantity} units
                        </span>
                      </div>
                    </td>

                    {/* Active toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          product.is_active ? "bg-[#C8F04B]" : "bg-[#2A2A2A]"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            product.is_active ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Featured */}
                    <td className="px-4 py-3 text-center">
                      <Star
                        className={`w-4 h-4 mx-auto ${
                          product.is_featured
                            ? "text-[#C8F04B] fill-[#C8F04B]"
                            : "text-[#333]"
                        }`}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className="flex items-center gap-1.5 border border-[#2A2A2A] text-white rounded-full px-3 py-1.5 text-xs hover:border-[#444] transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(product.id)}
                          className="border border-red-900/50 text-red-400 rounded-full px-3 py-1.5 text-xs hover:bg-red-900/20 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="This will permanently delete the product. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
      />
    </>
  )
}
