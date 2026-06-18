"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Check, X, Plus, Upload, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

interface Category { id: string; name: string; slug: string }
interface Product {
  id: string; name: string; slug: string; sku: string; description: string | null;
  price: number; compare_price: number | null; category_id: string | null;
  stock_quantity: number; low_stock_threshold: number; unit: string;
  weight: number | null; origin: string | null; images: string[];
  is_featured: boolean; is_active: boolean;
}

export function AdminEditProductForm({ product, categories }: { product: Product; categories: Category[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(product.images?.length ? product.images : [""]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku || "",
    description: product.description || "",
    price: String(product.price),
    compare_price: product.compare_price ? String(product.compare_price) : "",
    category_id: product.category_id || "",
    stock_quantity: String(product.stock_quantity),
    low_stock_threshold: String(product.low_stock_threshold),
    unit: product.unit || "each",
    weight: product.weight ? String(product.weight) : "",
    origin: product.origin || "",
    is_featured: product.is_featured,
    is_active: product.is_active,
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function uploadImage(file: File, idx: number) {
    setUploadingIdx(idx);
    try {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      const next = [...images];
      next[idx] = data.publicUrl;
      setImages(next);
    } catch (err: any) {
      alert("Image upload failed: " + err.message + "\n\nMake sure the 'product-images' bucket exists in Supabase Storage with public access.");
    } finally {
      setUploadingIdx(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.category_id || !form.price) return;
    setLoading(true);
    try {
      const filteredImages = images.filter(Boolean);
      const { error } = await supabase.from("products").update({
        name: form.name.trim(),
        sku: form.sku.trim() || product.sku,
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        category_id: form.category_id,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        unit: form.unit.trim() || "each",
        weight: form.weight ? parseFloat(form.weight) : null,
        origin: form.origin.trim() || null,
        images: filteredImages,
        is_featured: form.is_featured,
        is_active: form.is_active,
      }).eq("id", product.id);
      if (error) throw error;
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted transition-colors hover:bg-muted/70">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-syne text-2xl font-bold">Edit Product</h1>
          <p className="text-sm text-muted-foreground truncate max-w-xs">{product.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <fieldset className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111] space-y-4">
          <legend className="px-1 font-syne font-bold">Basic Information</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Product Name *</label>
              <input required value={form.name} onChange={e => set("name", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">SKU</label>
              <input value={form.sku} onChange={e => set("sku", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={3} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category *</label>
            <select required value={form.category_id} onChange={e => set("category_id", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </fieldset>

        {/* Pricing */}
        <fieldset className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111] space-y-4">
          <legend className="px-1 font-syne font-bold">Pricing</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Price ($) *</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={e => set("price", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Compare Price ($) — shows sale badge</label>
              <input type="number" step="0.01" min="0" value={form.compare_price} onChange={e => set("compare_price", e.target.value)}
                placeholder="Leave blank to remove sale"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </fieldset>

        {/* Inventory */}
        <fieldset className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111] space-y-4">
          <legend className="px-1 font-syne font-bold">Inventory</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Stock Quantity</label>
              <input type="number" min="0" value={form.stock_quantity} onChange={e => set("stock_quantity", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Low Stock Alert at</label>
              <input type="number" min="0" value={form.low_stock_threshold} onChange={e => set("low_stock_threshold", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Unit</label>
              <input value={form.unit} onChange={e => set("unit", e.target.value)}
                placeholder="each, kg, g, l…"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </fieldset>

        {/* Details */}
        <fieldset className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111] space-y-4">
          <legend className="px-1 font-syne font-bold">Details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Weight (g)</label>
              <input type="number" min="0" value={form.weight} onChange={e => set("weight", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Origin</label>
              <input value={form.origin} onChange={e => set("origin", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </fieldset>

        {/* Images */}
        <fieldset className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111] space-y-3">
          <legend className="px-1 font-syne font-bold">Images</legend>
          <p className="text-xs text-muted-foreground">Upload a photo from your computer, or paste an image URL.</p>

          {images.map((url, i) => (
            <div key={i} className="space-y-2">
              <div className="flex gap-2">
                {/* URL input */}
                <input
                  value={url}
                  onChange={e => {
                    const next = [...images];
                    next[i] = e.target.value;
                    setImages(next);
                  }}
                  placeholder="Paste image URL, or click Upload below"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => fileRefs.current[i]?.click()}
                  disabled={uploadingIdx === i}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/70 disabled:opacity-50 whitespace-nowrap"
                >
                  {uploadingIdx === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadingIdx === i ? "Uploading…" : "Upload"}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={el => { fileRefs.current[i] = el; }}
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, i);
                    e.target.value = "";
                  }}
                />
                {/* Remove button */}
                {images.length > 1 && (
                  <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted hover:bg-red-100 hover:text-red-600 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Preview */}
              {url && (
                <div className="ml-1 flex items-center gap-2">
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">{url}</span>
                </div>
              )}
            </div>
          ))}

          <button type="button" onClick={() => setImages([...images, ""])}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add another image
          </button>
        </fieldset>

        {/* Visibility */}
        <fieldset className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111] space-y-3">
          <legend className="px-1 font-syne font-bold">Visibility</legend>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)}
              className="h-4 w-4 rounded accent-primary" />
            <span className="text-sm font-medium">Active (visible in store)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)}
              className="h-4 w-4 rounded accent-primary" />
            <span className="text-sm font-medium">Featured (highlighted on homepage)</span>
          </label>
        </fieldset>

        <div className="flex gap-3 justify-end pb-4">
          <Link href="/admin/products"
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90 transition-opacity">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </>
  );
}
