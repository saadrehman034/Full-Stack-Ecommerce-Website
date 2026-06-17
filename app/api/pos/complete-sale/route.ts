import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface CartItem {
  product_id: string
  name: string
  price: number
  image: string
  slug: string
  quantity: number
}

interface RequestBody {
  items: CartItem[]
  customerId?: string
  paymentMethod: "cash" | "card"
  discountAmount: number
  vatAmount: number
  subtotal: number
  total: number
  sessionId: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as RequestBody
    const {
      items,
      customerId,
      paymentMethod,
      discountAmount,
      vatAmount,
      subtotal,
      total,
      sessionId,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `PL-POS-${Date.now().toString(36).toUpperCase()}`

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: customerId ?? null,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: vatAmount,
        shipping_amount: 0,
        total_amount: total,
        payment_status: "paid",
        payment_method: paymentMethod,
        status: "confirmed",
        source: "pos",
        staff_id: user.id,
        notes: null,
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message ?? "Failed to create order" },
        { status: 500 }
      )
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      product_snapshot: {
        name: item.name,
        price: item.price,
        image: item.image,
        slug: item.slug,
      },
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      )
    }

    // Decrement stock and log inventory for each item
    for (const item of items) {
      // Try RPC first (best-effort)
      await supabase.rpc("decrement_stock", {
        product_id: item.product_id,
        amount: item.quantity,
      })

      // Insert inventory log
      await supabase.from("inventory_logs").insert({
        product_id: item.product_id,
        change_amount: -item.quantity,
        reason: "sale",
        staff_id: user.id,
      })
    }

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}
