import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name, images, slug))")
    .eq("id", params.id)
    .single();

  if (!order) notFound();

  return (
    <div className="container mx-auto min-h-[80vh] max-w-2xl px-4 py-16 text-center">
      {/* Success Icon */}
      <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="font-syne text-4xl font-bold">Order Confirmed!</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Thank you for your order. We're getting it ready for you!
      </p>

      <div className="mt-8 rounded-3xl bg-card p-6 text-left shadow-sm ring-1 ring-border/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-syne text-lg font-bold text-primary">{order.order_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Package className="h-3 w-3" />
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Payment</p>
            <p className="font-medium capitalize">{order.payment_method}</p>
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-border/40 pt-4 space-y-3">
          <p className="text-sm font-semibold">Items Ordered</p>
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{item.quantity}×</span>
                <span>{item.products?.name || "Product"}</span>
              </div>
              <span className="font-semibold">{formatCurrency(item.total_price)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-border/40 pt-4 space-y-2 text-sm">
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>{order.shipping_amount === 0 ? "Free" : formatCurrency(order.shipping_amount)}</span>
          </div>
          <div className="flex justify-between font-syne text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        {/* Delivery Address */}
        {order.shipping_address && (
          <div className="border-t border-border/40 pt-4">
            <p className="mb-1 text-sm font-semibold">Delivery Address</p>
            <p className="text-sm text-muted-foreground">
              {order.shipping_address.line1}
              {order.shipping_address.line2 && `, ${order.shipping_address.line2}`}
              <br />
              {order.shipping_address.city}, {order.shipping_address.postal_code}
              <br />
              {order.shipping_address.country}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {user && (
          <Link
            href="/account/orders"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-8 font-medium transition-colors hover:bg-muted"
          >
            Track My Orders
          </Link>
        )}
        <Link
          href="/shop"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
