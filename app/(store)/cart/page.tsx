"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, Tag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export default function CartPage() {
  const { items, removeItem, updateQuantity, coupon, applyCoupon, removeCoupon, getSubtotal, getDiscount, getTotal, clearCart } = useCartStore();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = subtotal >= 50 ? 0 : 4.99;
  const total = getTotal() + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        applyCoupon({ code: data.code, type: data.type, discount: data.discount });
        toast.success(`Coupon "${data.code}" applied!`);
        setCouponCode("");
      } else {
        toast.error(data.error || "Invalid coupon code.");
      }
    } catch {
      toast.error("Could not validate coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center bg-transparent">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <ShoppingCart className="h-12 w-12 text-white/25" />
        </div>
        <div>
          <h1 className="font-syne text-3xl font-black text-white">Your cart is empty</h1>
          <p className="mt-2 text-white/50">Looks like you haven&apos;t added anything yet.</p>
        </div>
        <Link
          href="/shop"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#C8F04B] px-8 font-bold text-black transition-all hover:scale-105 shadow-[0_0_30px_rgba(200,240,75,0.25)]"
        >
          Start Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060810] relative">
      {/* Cinematic background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1920&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-[#060810]/83" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060810]/20 via-transparent to-[#060810]/70" />
      </div>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="mb-6 md:mb-10 font-syne text-3xl md:text-4xl font-black text-white md:text-5xl">
          Your <span className="text-[#C8F04B]">Cart</span>
        </h1>

        <div className="grid gap-6 lg:gap-10 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product_id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="flex gap-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-4"
                >
                  <Link href={`/products/${item.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/[0.08]">
                    <Image
                      src={item.image || "https://images.unsplash.com/photo-1506617564039-2f3b650b7010?q=80&w=300&auto=format&fit=crop"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/products/${item.slug}`} className="font-syne font-bold text-white/90 leading-tight hover:text-[#C8F04B] transition-colors">
                          {item.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-white/40">{formatCurrency(item.price)} each</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="rounded-full p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] px-1.5">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="rounded-full p-1.5 text-white/40 transition-colors hover:text-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[28px] text-center text-sm font-bold text-white/90">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="rounded-full p-1.5 text-white/40 transition-colors hover:text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-syne text-lg font-bold text-[#C8F04B]">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={clearCart}
              className="mt-2 text-sm text-white/30 underline-offset-2 hover:text-red-400 hover:underline transition-colors"
            >
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 space-y-5">
              <h2 className="font-syne text-xl font-bold text-white">Order Summary</h2>

              {/* Coupon */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Promo Code</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="Enter code"
                      className="h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.06] pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C8F04B] transition-colors"
                    />
                  </div>
                  {coupon ? (
                    <button onClick={removeCoupon} className="h-10 rounded-xl border border-red-400/50 px-3 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="h-10 rounded-xl bg-white/[0.07] border border-white/[0.12] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.12] disabled:opacity-50"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {coupon && (
                  <p className="text-xs text-[#C8F04B]">Code <strong>{coupon.code}</strong> applied</p>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-white/[0.08] pt-4 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between font-medium text-[#C8F04B]">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/50">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-[#C8F04B] font-medium" : ""}>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between border-t border-white/[0.08] pt-3">
                  <span className="font-syne text-base font-bold text-white">Total</span>
                  <span className="font-syne text-xl font-black text-[#C8F04B]">{formatCurrency(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#C8F04B] font-syne font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(200,240,75,0.25)]"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="text-center text-xs text-white/25">
                Secure checkout — SSL encrypted
              </div>
            </div>

            {/* Free shipping notice */}
            {subtotal < 50 && (
              <div className="rounded-2xl bg-[#C8F04B]/10 border border-[#C8F04B]/20 px-4 py-3 text-sm text-[#C8F04B]">
                Add <strong>{formatCurrency(50 - subtotal)}</strong> more for free shipping!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
