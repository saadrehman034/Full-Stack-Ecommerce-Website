"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Star, Plus, Minus, Check, Package, Truck, RotateCcw, Shield } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const TRUST_BADGES = [
  { icon: Truck, label: "Free delivery over $50" },
  { icon: RotateCcw, label: "30-day returns" },
  { icon: Shield, label: "Secure checkout" },
  { icon: Package, label: "Premium packaging" },
];

export function ProductDetailClient({ product }: { product: any }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();

  const images: string[] = product.images?.length
    ? product.images
    : ["https://images.unsplash.com/photo-1506617564039-2f3b650b7010?q=80&w=800&auto=format&fit=crop"];

  const price = product.price + (selectedVariant?.price_modifier || 0);
  const discount = product.compare_price
    ? Math.round(((product.compare_price - price) / product.compare_price) * 100)
    : null;

  const avgRating =
    product.reviews?.length
      ? product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length
      : 4.5;

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      price,
      image: product.images?.[0] || "",
      slug: product.slug,
    });
    setAdded(true);
    toast.success(`${product.name} added to cart!`, {
      description: `${quantity} × ${formatCurrency(price)}`,
    });
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-16">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-white/50">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span className="text-white/25">/</span>
        <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
        {product.categories && (
          <>
            <span className="text-white/25">/</span>
            <Link href={`/shop?category=${product.categories.slug}`} className="hover:text-white transition-colors">
              {product.categories.name}
            </Link>
          </>
        )}
        <span className="text-white/25">/</span>
        <span className="text-white/90">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Images */}
        <div className="space-y-3">
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square overflow-hidden rounded-3xl bg-white/[0.04] border border-white/[0.08]"
          >
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {discount && (
              <Badge className="absolute left-4 top-4 bg-[#C8F04B] text-black font-bold shadow border-0">
                -{discount}%
              </Badge>
            )}
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    selectedImage === i
                      ? "border-[#C8F04B]"
                      : "border-white/[0.08] hover:border-white/[0.25]"
                  }`}
                >
                  <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.categories && (
            <Link
              href={`/shop?category=${product.categories.slug}`}
              className="text-xs font-semibold uppercase tracking-widest text-white/50 hover:text-[#C8F04B] transition-colors"
            >
              {product.categories.name}
            </Link>
          )}

          <h1 className="font-syne text-2xl sm:text-3xl font-black leading-tight text-white md:text-5xl">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-[#C8F04B] text-[#C8F04B]" : "text-white/25"}`} />
              ))}
            </div>
            <span className="text-sm font-medium text-white/90">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-white/50">({product.reviews?.length || 0} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-syne text-2xl sm:text-3xl md:text-4xl font-black text-[#C8F04B]">{formatCurrency(price)}</span>
            {product.compare_price && (
              <span className="text-xl text-white/25 line-through">{formatCurrency(product.compare_price)}</span>
            )}
            <span className="text-sm text-white/50">/ {product.unit}</span>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-base leading-relaxed text-white/60">{product.description}</p>
          )}

          {/* Variants */}
          {product.product_variants?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white/90">Size / Variant</p>
              <div className="flex flex-wrap gap-2">
                {product.product_variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                      selectedVariant?.id === v.id
                        ? "border-[#C8F04B] bg-[#C8F04B] text-black font-bold"
                        : "border-white/[0.1] bg-white/[0.04] text-white/70 hover:border-white/[0.25] hover:text-white"
                    }`}
                  >
                    {v.name}
                    {v.price_modifier !== 0 && (
                      <span className="ml-1 text-xs opacity-70">
                        ({v.price_modifier > 0 ? "+" : ""}{formatCurrency(v.price_modifier)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${product.stock_quantity > 0 ? "bg-[#C8F04B]" : "bg-red-500"}`} />
            <span className="text-sm font-medium text-white/70">
              {product.stock_quantity > 0
                ? product.stock_quantity <= product.low_stock_threshold
                  ? `Low stock — only ${product.stock_quantity} left`
                  : "In Stock"
                : "Out of Stock"}
            </span>
          </div>

          {/* Quantity + Add */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="rounded-full p-2 text-white/50 transition-colors hover:text-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[32px] text-center font-semibold text-white/90">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                className="rounded-full p-2 text-white/50 transition-colors hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 font-syne text-base font-bold transition-all ${
                added
                  ? "bg-green-500/80 text-white"
                  : "bg-[#C8F04B] text-black hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_30px_rgba(200,240,75,0.25)]"
              }`}
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <Check className="h-5 w-5" /> Added!
                  </motion.span>
                ) : (
                  <motion.span key="cart" className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" /> Add to Cart
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <button
              aria-label="Wishlist"
              onClick={() => toast.info("Added to wishlist")}
              className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-3.5 text-white/50 transition-colors hover:border-red-400/50 hover:text-red-400"
            >
              <Heart className="h-5 w-5" />
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-white/50">
                <Icon className="h-4 w-4 shrink-0 text-[#C8F04B]" />
                {label}
              </div>
            ))}
          </div>

          {/* SKU / Tags */}
          {(product.sku || product.tags?.length > 0) && (
            <div className="space-y-1 text-xs text-white/25">
              {product.sku && <p>SKU: <span className="font-mono text-white/40">{product.sku}</span></p>}
              {product.tags?.length > 0 && (
                <p>Tags: {product.tags.map((t: string) => (
                  <span key={t} className="ml-1 rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 font-medium text-white/50">{t}</span>
                ))}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-syne text-3xl font-black text-white">
            Customer <span className="text-[#C8F04B]">Reviews</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {product.reviews.slice(0, 6).map((review: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-5 space-y-3"
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? "fill-[#C8F04B] text-[#C8F04B]" : "text-white/25"}`} />
                  ))}
                </div>
                {review.body && <p className="text-sm leading-relaxed text-white/70">{review.body}</p>}
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span className="font-medium text-white/60">{review.users?.full_name || (review as any).reviewer_name || "Verified Buyer"}</span>
                  <span>{new Date(review.created_at).toLocaleDateString("en-GB")}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
