"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, X, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { slugify } from "@/lib/utils"
import { toast } from "sonner"
import Image from "next/image"

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  barcode: string
  description: string
  price: number
  compare_price: number | null
  category_id: string | null
  images: string[]
  stock_quantity: number
  low_stock_threshold: number
  unit: string
  weight: number | null
  origin: string
  is_featured: boolean
  is_active: boolean
}

interface ProductFormProps {
  initialData?: Partial<Product>
  categories: Category[]
  onSuccess?: (slug: string) => void
  mode: "create" | "edit"
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">
      {children}
    </label>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 space-y-4">
      <h2 className="font-syne font-bold text-white text-base">{title}</h2>
      {children}
    </div>
  )
}

const INPUT_CLASS =
  "w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none placeholder:text-[#555] text-sm"

const SELECT_CLASS =
  "w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none text-sm"

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-[#C8F04B]" : "bg-[#2A2A2A]"
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <span className="text-sm text-white">{label}</span>
    </label>
  )
}

export function ProductForm({ initialData, categories, mode }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // Fields
  const [name, setName] = useState(initialData?.name ?? "")
  const [slug, setSlug] = useState(initialData?.slug ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "")
  const [price, setPrice] = useState<string>(
    initialData?.price !== undefined ? String(initialData.price) : ""
  )
  const [comparePrice, setComparePrice] = useState<string>(
    initialData?.compare_price !== undefined ? String(initialData.compare_price) : ""
  )
  const [sku, setSku] = useState(initialData?.sku ?? "")
  const [barcode, setBarcode] = useState(initialData?.barcode ?? "")
  const [unit, setUnit] = useState(initialData?.unit ?? "each")
  const [weight, setWeight] = useState<string>(
    initialData?.weight !== undefined && initialData.weight !== null
      ? String(initialData.weight)
      : ""
  )
  const [origin, setOrigin] = useState(initialData?.origin ?? "")
  const [images, setImages] = useState<string[]>(
    initialData?.images?.length ? initialData.images : [""]
  )
  const [stockQuantity, setStockQuantity] = useState<string>(
    initialData?.stock_quantity !== undefined ? String(initialData.stock_quantity) : "0"
  )
  const [lowStockThreshold, setLowStockThreshold] = useState<string>(
    initialData?.low_stock_threshold !== undefined
      ? String(initialData.low_stock_threshold)
      : "10"
  )
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false)
  const [slugEdited, setSlugEdited] = useState(mode === "edit")

  function handleNameChange(val: string) {
    setName(val)
    if (!slugEdited) {
      setSlug(slugify(val))
    }
  }

  function addImageSlot() {
    if (images.length < 5) setImages((prev) => [...prev, ""])
  }

  function removeImageSlot(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateImage(idx: number, val: string) {
    setImages((prev) => prev.map((img, i) => (i === idx ? val : img)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!price || isNaN(parseFloat(price))) {
      toast.error("Price is required")
      return
    }

    const finalSku =
      sku.trim() ||
      `${categoryId ? categories.find((c) => c.id === categoryId)?.slug?.slice(0, 3).toUpperCase() ?? "PRD" : "PRD"}-${Date.now().toString(36).toUpperCase()}`

    const payload = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      description: description.trim(),
      category_id: categoryId || null,
      price: parseFloat(price),
      compare_price: comparePrice ? parseFloat(comparePrice) : null,
      sku: finalSku,
      barcode: barcode.trim() || null,
      unit,
      weight: weight ? parseFloat(weight) : null,
      origin: origin.trim() || null,
      images: images.filter((img) => img.trim()),
      stock_quantity: parseInt(stockQuantity) || 0,
      low_stock_threshold: parseInt(lowStockThreshold) || 10,
      is_active: isActive,
      is_featured: isFeatured,
    }

    setLoading(true)
    if (mode === "create") {
      const { error } = await supabase.from("products").insert(payload).select().single()
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Product created")
      router.push("/dashboard/products")
    } else {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", initialData!.id!)
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Product updated")
      router.push("/dashboard/products")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card title="Basic Information">
        <div>
          <Label>Product Name *</Label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Organic Basmati Rice"
            required
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <Label>Slug</Label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugEdited(true)
            }}
            placeholder="organic-basmati-rice"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <Label>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description…"
            rows={4}
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Category</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Unit</Label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={SELECT_CLASS}
            >
              {["each", "kg", "g", "litre", "ml", "pack"].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Pricing */}
      <Card title="Pricing">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Price ($) *</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555] text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                className={`${INPUT_CLASS} pl-7`}
              />
            </div>
          </div>
          <div>
            <Label>Compare Price ($)</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555] text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                placeholder="0.00"
                className={`${INPUT_CLASS} pl-7`}
              />
            </div>
          </div>
        </div>
        {price && comparePrice && parseFloat(comparePrice) > parseFloat(price) && (
          <p className="text-xs text-green-400">
            Saving{" "}
            {Math.round(
              ((parseFloat(comparePrice) - parseFloat(price)) /
                parseFloat(comparePrice)) *
                100
            )}
            % off RRP
          </p>
        )}
      </Card>

      {/* Inventory */}
      <Card title="Inventory">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Stock Quantity</Label>
            <input
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <Label>Low Stock Threshold</Label>
            <input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>SKU</Label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Auto-generated if empty"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <Label>Barcode</Label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="EAN / UPC"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card title="Details">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Weight (g)</Label>
            <input
              type="number"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 500"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <Label>Origin</Label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. India"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </Card>

      {/* Images */}
      <Card title="Images">
        <div className="space-y-3">
          {images.map((url, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateImage(idx, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={INPUT_CLASS}
                />
              </div>
              {url && (
                <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] overflow-hidden relative shrink-0">
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    onError={() => {}}
                  />
                </div>
              )}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageSlot(idx)}
                  className="p-2 text-[#555] hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {images.length < 5 && (
          <button
            type="button"
            onClick={addImageSlot}
            className="flex items-center gap-2 text-sm text-[#C8F04B] hover:text-white transition-colors mt-2"
          >
            <Plus className="w-4 h-4" />
            Add Image URL
          </button>
        )}
        <p className="text-xs text-[#555]">{images.length}/5 images</p>
      </Card>

      {/* Visibility */}
      <Card title="Visibility">
        <div className="space-y-4">
          <Toggle checked={isActive} onChange={setIsActive} label="Active (visible in store)" />
          <Toggle checked={isFeatured} onChange={setIsFeatured} label="Featured product" />
        </div>
      </Card>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-[#080808] border-t border-[#1E1E1E] -mx-8 px-8 py-4 flex items-center justify-between">
        <Link
          href="/dashboard/products"
          className="border border-[#2A2A2A] text-white rounded-full px-5 py-2.5 text-sm hover:border-[#444] transition-all"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-[#C8F04B] text-black rounded-full px-6 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
