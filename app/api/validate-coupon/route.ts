import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) return NextResponse.json({ valid: false, error: "Coupon code is required" }, { status: 400 });

    const supabase = createClient();
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", String(code).toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !coupon) return NextResponse.json({ valid: false, error: "Invalid or expired coupon code" });

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "This coupon has expired" });
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit" });
    }
    if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
      return NextResponse.json({ valid: false, error: `Minimum order of £${coupon.min_order_amount.toFixed(2)} required` });
    }

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = subtotal * (coupon.value / 100);
      if (coupon.max_discount_amount) discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
    } else {
      discountAmount = Math.min(coupon.value, subtotal);
    }

    return NextResponse.json({
      valid: true,
      discount: Math.round(discountAmount * 100) / 100,
      value: coupon.value,
      type: coupon.type,
      code: coupon.code,
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
