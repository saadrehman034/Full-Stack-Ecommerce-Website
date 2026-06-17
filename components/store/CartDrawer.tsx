"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useShallow } from "zustand/react/shallow";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export function CartDrawer() {
  const {
    items, isOpen, closeCart,
    removeItem, updateQuantity,
    coupon, applyCoupon, removeCoupon,
    getSubtotal, getDiscount, getTotal,
  } = useCartStore(useShallow(state => ({
    items: state.items,
    isOpen: state.isOpen,
    closeCart: state.closeCart,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    coupon: state.coupon,
    applyCoupon: state.applyCoupon,
    removeCoupon: state.removeCoupon,
    getSubtotal: state.getSubtotal,
    getDiscount: state.getDiscount,
    getTotal: state.getTotal,
  })));
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();

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
        toast.success(
          `Coupon "${data.code}" applied — ${
            data.type === "percentage" ? `${data.value}% off` : formatCurrency(data.discount) + " off"
          }`
        );
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 p-5">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <h2 className="font-syne text-lg font-bold">Your Cart</h2>
                {items.length > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                    {items.reduce((n, i) => n + i.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="rounded-full bg-muted p-6">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-syne text-lg font-semibold">Your cart is empty</p>
                    <p className="mt-1 text-sm text-muted-foreground">Add some products to get started.</p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="mt-2 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform hover:scale-105"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.product_id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-3 rounded-2xl bg-muted/40 p-3"
                      >
                        <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={item.image || "https://images.unsplash.com/photo-1506617564039-2f3b650b7010?q=80&w=200&auto=format&fit=crop"}
                            alt={item.name}
                            width={72}
                            height={72}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/products/${item.slug}`}
                              onClick={closeCart}
                              className="font-syne text-sm font-semibold leading-tight hover:text-primary transition-colors line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            <button
                              onClick={() => removeItem(item.product_id)}
                              className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-full border border-border bg-background px-1">
                              <button
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                className="rounded-full p-1 text-muted-foreground transition-colors hover:text-primary"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="min-w-[20px] text-center text-sm font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                className="rounded-full p-1 text-muted-foreground transition-colors hover:text-primary"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="font-syne font-bold">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border/40 p-5 space-y-4">
                {/* Coupon */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="Coupon code"
                      className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  {coupon ? (
                    <button
                      onClick={removeCoupon}
                      className="h-10 rounded-xl border border-destructive px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="h-10 rounded-xl bg-muted px-4 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({coupon?.code})</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-syne text-base font-bold text-foreground border-t border-border/40 pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-syne font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
