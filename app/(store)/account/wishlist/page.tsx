"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";

// Wishlist is localStorage-based for now (no DB table in spec)
// Show an empty state with a link to shop

export default function WishlistPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-syne text-3xl font-bold">My Wishlist</h1>

      <div className="flex flex-col items-center justify-center gap-6 rounded-3xl bg-card p-16 text-center shadow-sm ring-1 ring-border/30">
        <div className="rounded-full bg-muted p-6">
          <Heart className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-syne text-2xl font-bold">Your wishlist is empty</h2>
          <p className="mt-2 text-muted-foreground">
            Browse the shop and click the heart icon to save products you love.
          </p>
        </div>
        <Link href="/shop"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105">
          Explore Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
