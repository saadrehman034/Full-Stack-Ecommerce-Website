"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number | null;
  images: string[];
  unit: string;
  stock_quantity: number;
  low_stock_threshold?: number;
  is_featured?: boolean;
  categories?: { name: string; slug: string } | null;
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem } = useCartStore();
  const [addState, setAddState] = useState<"idle" | "added">("idle");
  const router = useRouter();

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  const isLowStock = product.low_stock_threshold != null
    ? product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold
    : false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock_quantity <= 0 || addState === "added") return;
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      slug: product.slug,
    });
    toast.success(`${product.name} added to cart`, {
      description: `$${product.price.toFixed(2)}`,
      action: { label: "View Cart", onClick: () => { window.location.href = "/cart"; } },
    });
    setAddState("added");
    setTimeout(() => setAddState("idle"), 2000);
  };

  const imageUrl = product.images?.[0] ||
    "https://images.unsplash.com/photo-1506617564039-2f3b650b7010?q=80&w=600&auto=format&fit=crop";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -4 }}
      className="group"
      onMouseEnter={() => router.prefetch(`/products/${product.slug}`)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image container */}
        <div className="relative overflow-hidden rounded-2xl bg-muted/40 shadow-sm transition-shadow duration-300 group-hover:shadow-md">
          {/* Badges */}
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
            {discount && discount > 0 && (
              <Badge className="bg-[#C8F04B] font-semibold text-black shadow-sm">-{discount}%</Badge>
            )}
            {product.is_featured && !discount && (
              <Badge className="bg-primary text-primary-foreground shadow-sm">Featured</Badge>
            )}
            {product.stock_quantity <= 0 && (
              <Badge variant="destructive" className="shadow-sm">Out of Stock</Badge>
            )}
            {isLowStock && (
              <Badge className="bg-amber-500 text-white shadow-sm">Only {product.stock_quantity} left</Badge>
            )}
          </div>

          {/* Wishlist */}
          <button
            aria-label="Add to wishlist"
            onClick={(e) => { e.preventDefault(); toast.info("Saved to wishlist"); }}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-rose-500"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>

          {/* Image */}
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>

          {/* Quick Add Overlay */}
          <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                addState === "added"
                  ? "bg-green-500 text-white"
                  : "bg-[#C8F04B] text-black hover:bg-[#b8e03a]"
              }`}
            >
              {addState === "added" ? (
                <><Check className="h-4 w-4" /> Added!</>
              ) : (
                <><ShoppingCart className="h-4 w-4" /> Add to Cart</>
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1 px-1">
          {product.categories?.name && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {product.categories.name}
            </p>
          )}
          <h3 className="font-syne text-[15px] font-semibold leading-snug text-foreground line-clamp-2 transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="font-syne text-base font-bold text-foreground">${product.price.toFixed(2)}</span>
            {product.compare_price && (
              <span className="text-xs text-muted-foreground line-through">${product.compare_price.toFixed(2)}</span>
            )}
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
              className={`ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold transition-all disabled:opacity-40 md:hidden ${
                addState === "added" ? "bg-green-500 text-white" : "bg-[#C8F04B] text-black"
              }`}
            >
              {addState === "added" ? "✓" : "+"}
            </button>
            <span className="ml-auto hidden text-[11px] text-muted-foreground md:block">/{product.unit}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
