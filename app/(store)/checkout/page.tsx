"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2, Lock } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const checkoutSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  line1: z.string().min(3, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/County is required"),
  postal_code: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  notes: z.string().optional(),
  payment_method: z.enum(["card", "cash"]),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const STEPS = ["Shipping", "Payment", "Review"];

// Shared dark input class
const inputClass =
  "h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C8F04B] transition-colors";

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { items, getSubtotal, getDiscount, getTotal, clearCart } = useCartStore();

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = subtotal >= 50 ? 0 : 4.99;
  const total = getTotal() + shipping;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { payment_method: "card", country: "United Kingdom" },
  });

  const paymentMethod = watch("payment_method");

  const onSubmit = async (data: CheckoutFormValues) => {
    if (items.length === 0) { toast.error("Your cart is empty."); return; }
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const orderNumber = `PL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const shippingAddress = {
        full_name: data.full_name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        country: data.country,
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user?.id || null,
          subtotal,
          discount_amount: discount,
          tax_amount: 0,
          shipping_amount: shipping,
          total_amount: total,
          payment_method: data.payment_method,
          payment_status: data.payment_method === "cash" ? "unpaid" : "unpaid",
          shipping_address: shippingAddress,
          billing_address: shippingAddress,
          notes: data.notes,
          status: "pending",
          source: "online",
        })
        .select()
        .single();

      if (orderError || !order) throw new Error("Failed to create order");

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        product_snapshot: { name: item.name, images: [item.image] },
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw new Error("Failed to save order items");

      // If paying by card, redirect to Stripe
      if (data.payment_method === "card") {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, items, total, orderNumber }),
        });
        const { url, error } = await res.json();
        if (error) throw new Error(error);
        if (url) { clearCart(); window.location.href = url; return; }
      }

      clearCart();
      router.push(`/order-confirmation/${order.id}`);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060810] relative">
      {/* Cinematic background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1920&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-[#060810]/84" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#060810]/40 via-transparent to-[#060810]/60" />
      </div>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <Link href="/cart" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Link>

        <div className="grid gap-8 lg:gap-12 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="mb-8 md:mb-10 flex items-center gap-0">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => i < currentStep && setCurrentStep(i)}
                    className={`flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full text-xs md:text-sm font-bold transition-all shrink-0 ${
                      i <= currentStep
                        ? "bg-[#C8F04B] text-black"
                        : "bg-white/[0.06] border border-white/[0.1] text-white/40"
                    } ${i < currentStep ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {i + 1}
                  </button>
                  <span className={`ml-1.5 text-xs md:text-sm font-medium hidden sm:inline ${i === currentStep ? "text-white" : "text-white/40"}`}>
                    {step}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-2 md:mx-4 h-px w-6 md:w-12 ${i < currentStep ? "bg-[#C8F04B]" : "bg-white/[0.1]"}`} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 0: Shipping */}
              {currentStep === 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <h2 className="font-syne text-2xl font-black text-white">Shipping Information</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/70">Full Name *</label>
                      <input {...register("full_name")} placeholder="Jane Doe" className={inputClass} />
                      {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/70">Email *</label>
                      <input {...register("email")} type="email" placeholder="jane@example.com" className={inputClass} />
                      {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Phone (optional)</label>
                    <input {...register("phone")} type="tel" placeholder="+44 7700 900000" className={inputClass} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Address Line 1 *</label>
                    <input {...register("line1")} placeholder="123 High Street" className={inputClass} />
                    {errors.line1 && <p className="text-xs text-red-400">{errors.line1.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Address Line 2</label>
                    <input {...register("line2")} placeholder="Apartment, flat, etc." className={inputClass} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/70">City *</label>
                      <input {...register("city")} placeholder="London" className={inputClass} />
                      {errors.city && <p className="text-xs text-red-400">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/70">State / County *</label>
                      <input {...register("state")} placeholder="England" className={inputClass} />
                      {errors.state && <p className="text-xs text-red-400">{errors.state.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/70">Postal Code *</label>
                      <input {...register("postal_code")} placeholder="EC1A 1BB" className={inputClass} />
                      {errors.postal_code && <p className="text-xs text-red-400">{errors.postal_code.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Country *</label>
                    <input {...register("country")} placeholder="United Kingdom" className={inputClass} />
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#C8F04B] font-bold text-black transition-all hover:scale-[1.01] shadow-[0_0_30px_rgba(200,240,75,0.20)]"
                  >
                    Continue to Payment
                  </button>
                </motion.div>
              )}

              {/* Step 1: Payment */}
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <h2 className="font-syne text-2xl font-black text-white">Payment Method</h2>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { value: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Powered by Stripe" },
                      { value: "cash", label: "Cash on Delivery", icon: null, desc: "Pay when you receive" },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all ${
                          paymentMethod === value
                            ? "border-[#C8F04B] bg-[#C8F04B]/10"
                            : "border-white/[0.1] bg-white/[0.04] hover:border-white/[0.25]"
                        }`}
                      >
                        <input {...register("payment_method")} type="radio" value={value} className="mt-0.5 accent-[#C8F04B]" />
                        <div>
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4 text-white/70" />}
                            <span className="font-medium text-sm text-white/90">{label}</span>
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentMethod === "card" && (
                    <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-sm text-white/50">
                      <Lock className="h-4 w-4 shrink-0 text-[#C8F04B]" />
                      You&apos;ll be redirected to Stripe&apos;s secure payment page.
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Order Notes (optional)</label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      placeholder="Any special instructions..."
                      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C8F04B] transition-colors resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="h-12 flex-1 rounded-2xl bg-white/[0.07] border border-white/[0.12] font-medium text-white transition-colors hover:bg-white/[0.12]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="h-12 flex-1 rounded-2xl bg-[#C8F04B] font-bold text-black transition-all hover:scale-[1.01]"
                    >
                      Review Order
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Review */}
              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <h2 className="font-syne text-2xl font-black text-white">Review &amp; Place Order</h2>

                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-white/70">Order Items</h3>
                    {items.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between text-sm">
                        <span className="text-white/50">{item.name} × {item.quantity}</span>
                        <span className="font-medium text-white/90">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="h-12 flex-1 rounded-2xl bg-white/[0.07] border border-white/[0.12] font-medium text-white transition-colors hover:bg-white/[0.12]"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#C8F04B] font-syne font-bold text-black transition-all hover:scale-[1.01] disabled:opacity-70 shadow-[0_0_30px_rgba(200,240,75,0.20)]"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                        <>{paymentMethod === "card" ? "Pay Now" : "Place Order"}</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-4">
            <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 space-y-4 lg:sticky lg:top-24">
              <h2 className="font-syne text-lg font-bold text-white">Order Summary</h2>
              <div className="space-y-3 max-h-[50vh] lg:max-h-[40vh] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.product_id} className="flex gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/[0.08]">
                      <Image
                        src={item.image || "https://images.unsplash.com/photo-1506617564039-2f3b650b7010?q=80&w=80&auto=format&fit=crop"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C8F04B] text-[9px] font-black text-black">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex flex-1 items-center justify-between text-sm">
                      <span className="font-medium text-white/80 line-clamp-1">{item.name}</span>
                      <span className="shrink-0 font-semibold text-white/90">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/[0.08] pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#C8F04B]">
                    <span>Discount</span><span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/50">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-[#C8F04B] font-medium" : ""}>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between border-t border-white/[0.08] pt-2 font-syne font-bold text-base">
                  <span className="text-white">Total</span>
                  <span className="text-[#C8F04B]">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
