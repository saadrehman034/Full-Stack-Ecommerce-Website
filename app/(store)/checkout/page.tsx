"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const stripeAppearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#C8F04B",
    colorBackground: "#1a1a1a",
    colorText: "#ffffff",
    colorDanger: "#f87171",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(255,255,255,0.1)",
      backgroundColor: "rgba(255,255,255,0.06)",
      color: "#ffffff",
    },
    ".Input:focus": {
      border: "1px solid #C8F04B",
      boxShadow: "none",
    },
    ".Label": { color: "rgba(255,255,255,0.7)", fontSize: "13px" },
  },
};

const shippingSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().min(7, "Phone number is required"),
  line1: z.string().min(3, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postal_code: z.string().min(3, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
  notes: z.string().optional(),
});

type ShippingValues = z.infer<typeof shippingSchema>;

const inputClass =
  "h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C8F04B] transition-colors";

// ─── Inner payment form (must be inside <Elements>) ──────────────────────────
function CardPaymentForm({
  formData,
  total,
  subtotal,
  discount,
  shipping,
  onBack,
}: {
  formData: ShippingValues;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { items, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const orderNumber = `PL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const shippingAddress = {
        full_name: formData.full_name,
        phone: formData.phone,
        line1: formData.line1,
        line2: formData.line2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
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
          payment_method: "card",
          payment_status: "pending",
          shipping_address: shippingAddress,
          billing_address: shippingAddress,
          notes: formData.notes,
          status: "pending",
          source: "online",
        })
        .select()
        .single();

      if (orderError || !order) throw new Error("Failed to create order");

      await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: (order as any).id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          product_snapshot: { name: item.name, images: [item.image] },
        }))
      );

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation/${(order as any).id}`,
          payment_method_data: {
            billing_details: {
              name: formData.full_name,
              phone: formData.phone,
              email: formData.email || undefined,
              address: {
                line1: formData.line1,
                line2: formData.line2 || undefined,
                city: formData.city,
                state: formData.state,
                postal_code: formData.postal_code,
                country: "US",
              },
            },
          },
        },
      });

      if (stripeError) {
        // Roll back the order if payment fails
        await supabase.from("orders").delete().eq("id", (order as any).id);
        throw new Error(stripeError.message || "Payment failed");
      }

      clearCart();
    } catch (err: any) {
      toast.error(err.message || "Payment failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <h2 className="font-syne text-2xl font-black text-white">Payment Details</h2>

      {/* Stripe PaymentElement */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <PaymentElement
          onReady={() => setPaymentReady(true)}
          options={{
            layout: "tabs",
            fields: { billingDetails: "never" },
          }}
        />
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-xs text-white/50">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#C8F04B]" />
        Your card details are encrypted and processed securely by Stripe. We never store your card information.
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="h-12 flex-1 rounded-2xl bg-white/[0.07] border border-white/[0.12] font-medium text-white transition-colors hover:bg-white/[0.12] disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={!stripe || !paymentReady || isLoading}
          className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-[#C8F04B] font-syne font-bold text-black transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(200,240,75,0.25)]"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Pay {formatCurrency(total)}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main checkout page ───────────────────────────────────────────────────────
const STEPS = ["Shipping", "Payment"];

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [clientSecret, setClientSecret] = useState("");
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [shippingData, setShippingData] = useState<ShippingValues | null>(null);
  const { items, getSubtotal, getDiscount, getTotal } = useCartStore();

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = subtotal >= 50 ? 0 : 4.99;
  const total = getTotal() + shipping;

  const { register, handleSubmit, formState: { errors } } = useForm<ShippingValues>({
    resolver: zodResolver(shippingSchema),
    mode: "onSubmit",
    defaultValues: { country: "United States" },
  });

  const handleContinueToPayment = async (data: ShippingValues) => {
    setShippingData(data);
    setIsCreatingIntent(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(total * 100) }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setClientSecret(json.clientSecret);
      setCurrentStep(1);
    } catch (err: any) {
      toast.error(err.message || "Could not initialise payment. Try again.");
    } finally {
      setIsCreatingIntent(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060810] relative">
      {/* Cinematic background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1920&auto=format&fit=crop')" }} />
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
            {/* Step indicators */}
            <div className="mb-8 flex items-center gap-0">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className={`flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full text-xs md:text-sm font-bold shrink-0 ${
                    i <= currentStep ? "bg-[#C8F04B] text-black" : "bg-white/[0.06] border border-white/[0.1] text-white/40"
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`ml-1.5 text-xs md:text-sm font-medium hidden sm:inline ${i === currentStep ? "text-white" : "text-white/40"}`}>
                    {step}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-2 md:mx-4 h-px w-6 md:w-12 ${i < currentStep ? "bg-[#C8F04B]" : "bg-white/[0.1]"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 0: Shipping */}
            {currentStep === 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <h2 className="font-syne text-2xl font-black text-white">Shipping Information</h2>

                <form onSubmit={handleSubmit(handleContinueToPayment)} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/70">Full Name *</label>
                      <input {...register("full_name")} placeholder="Jane Doe" className={inputClass} />
                      {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/70">Email (optional)</label>
                      <input {...register("email")} type="email" placeholder="jane@example.com" className={inputClass} />
                      {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Phone *</label>
                    <input {...register("phone")} type="tel" placeholder="+1 555 000 0000" className={inputClass} />
                    {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Address Line 1 *</label>
                    <input {...register("line1")} placeholder="123 Main Street" className={inputClass} />
                    {errors.line1 && <p className="text-xs text-red-400">{errors.line1.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Address Line 2</label>
                    <input {...register("line2")} placeholder="Apartment, suite, etc." className={inputClass} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/70">City *</label>
                      <input {...register("city")} placeholder="New York" className={inputClass} />
                      {errors.city && <p className="text-xs text-red-400">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/70">State *</label>
                      <input {...register("state")} placeholder="NY" className={inputClass} />
                      {errors.state && <p className="text-xs text-red-400">{errors.state.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/70">ZIP Code *</label>
                      <input {...register("postal_code")} placeholder="10001" className={inputClass} />
                      {errors.postal_code && <p className="text-xs text-red-400">{errors.postal_code.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Country *</label>
                    <input {...register("country")} placeholder="United States" className={inputClass} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Order Notes (optional)</label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      placeholder="Any special instructions..."
                      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C8F04B] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingIntent}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#C8F04B] font-syne font-bold text-black transition-all hover:scale-[1.01] disabled:opacity-60 shadow-[0_0_30px_rgba(200,240,75,0.20)]"
                  >
                    {isCreatingIntent ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Setting up payment…</>
                    ) : (
                      <><CreditCard className="h-4 w-4" /> Continue to Payment</>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 1: Embedded card payment */}
            {currentStep === 1 && clientSecret && shippingData && (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: stripeAppearance }}
              >
                <CardPaymentForm
                  formData={shippingData}
                  total={total}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  onBack={() => setCurrentStep(0)}
                />
              </Elements>
            )}
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

              {/* Stripe badge */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <Lock className="h-3 w-3 text-white/30" />
                <span className="text-[11px] text-white/30">Secured by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
