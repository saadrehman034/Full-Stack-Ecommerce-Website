import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

serve(async (req) => {
  try {
    const { orderId } = await req.json();

    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images))")
      .eq("id", orderId)
      .single();

    if (!order) return new Response("Order not found", { status: 404 });

    const customerEmail = order.shipping_address?.email || order.billing_address?.email;
    if (!customerEmail) return new Response("No email on order", { status: 200 });

    const itemsHtml = (order.order_items || []).map((item: any) => `
      <tr>
        <td style="padding:8px 16px;border-bottom:1px solid #f0f0f0;">
          ${item.products?.name || "Product"} &times; ${item.quantity}
        </td>
        <td style="padding:8px 16px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">
          $${item.total_price.toFixed(2)}
        </td>
      </tr>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Order Confirmation</title></head>
      <body style="font-family:Inter,sans-serif;background:#FDF6EC;margin:0;padding:40px 20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background:#0D3B2E;padding:32px;text-align:center;">
            <h1 style="color:#C8F04B;font-size:28px;font-weight:800;margin:0;">PantryLegend.</h1>
            <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">Premium Pantry Delivered</p>
          </div>

          <!-- Body -->
          <div style="padding:32px;">
            <h2 style="color:#0D3B2E;font-size:22px;margin:0 0 8px;">Order Confirmed! 🎉</h2>
            <p style="color:#666;margin:0 0 24px;">Thank you for your order. We're getting it ready for you.</p>

            <div style="background:#f9f9f9;border-radius:12px;padding:16px;margin-bottom:24px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:#999;font-size:13px;">Order Number</span>
                <span style="color:#0D3B2E;font-weight:700;font-size:13px;">${order.order_number}</span>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:#999;font-size:13px;">Payment</span>
                <span style="color:#0D3B2E;font-weight:600;font-size:13px;text-transform:capitalize;">${order.payment_method}</span>
              </div>
            </div>

            <!-- Items -->
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <thead>
                <tr style="background:#f0f0f0;">
                  <th style="padding:8px 16px;text-align:left;font-size:12px;text-transform:uppercase;color:#999;">Item</th>
                  <th style="padding:8px 16px;text-align:right;font-size:12px;text-transform:uppercase;color:#999;">Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <!-- Totals -->
            <div style="border-top:2px solid #f0f0f0;padding-top:16px;space-y:8px;">
              ${order.discount_amount > 0 ? `<div style="display:flex;justify-content:space-between;color:#16a34a;margin-bottom:6px;"><span>Discount</span><span>-$${order.discount_amount.toFixed(2)}</span></div>` : ""}
              <div style="display:flex;justify-content:space-between;color:#666;margin-bottom:6px;"><span>Shipping</span><span>${order.shipping_amount === 0 ? "Free" : `$${order.shipping_amount.toFixed(2)}`}</span></div>
              <div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px;color:#0D3B2E;margin-top:8px;">
                <span>Total</span><span>$${order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-top:32px;">
              <a href="${Deno.env.get("NEXT_PUBLIC_APP_URL")}/order-confirmation/${order.id}"
                style="display:inline-block;background:#C8F04B;color:#000;font-weight:700;padding:14px 32px;border-radius:100px;text-decoration:none;font-size:15px;">
                Track Your Order →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background:#f9f9f9;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} PantryLegend. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PantryLegend <orders@pantrylegende.com>",
        to: [customerEmail],
        subject: `Order Confirmed — ${order.order_number}`,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
