import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") ?? "30d") as "7d" | "30d" | "90d" | "1y";

    const supabase = createClient();
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("created_at, total_amount, source")
      .eq("payment_status", "paid")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Aggregate by period bucket
    const buckets: Record<string, { online: number; pos: number; total: number }> = {};

    for (const order of orders ?? []) {
      const date = new Date(order.created_at);
      let key: string;

      if (period === "1y") {
        // Group by month (YYYY-MM)
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "90d") {
        // Group by week: use Monday of the week
        const day = date.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        const monday = new Date(date);
        monday.setDate(date.getDate() + diff);
        key = monday.toISOString().slice(0, 10);
      } else {
        // Group by day (YYYY-MM-DD)
        key = date.toISOString().slice(0, 10);
      }

      if (!buckets[key]) {
        buckets[key] = { online: 0, pos: 0, total: 0 };
      }

      const amount = order.total_amount ?? 0;
      buckets[key].total += amount;
      if (order.source === "pos") {
        buckets[key].pos += amount;
      } else {
        buckets[key].online += amount;
      }
    }

    // Fill in missing dates/weeks/months with zeros
    const result: Array<{ date: string; online: number; pos: number; total: number }> = [];

    if (period === "1y") {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        result.push({ date: key, ...(buckets[key] ?? { online: 0, pos: 0, total: 0 }) });
      }
    } else if (period === "90d") {
      // Generate week buckets
      const seenKeys = new Set<string>();
      const iter = new Date(startDate);
      // Advance to Monday
      const dayOfWeek = iter.getDay();
      const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
      iter.setDate(iter.getDate() + daysToMonday);
      while (iter <= now) {
        const key = iter.toISOString().slice(0, 10);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          result.push({ date: key, ...(buckets[key] ?? { online: 0, pos: 0, total: 0 }) });
        }
        iter.setDate(iter.getDate() + 7);
      }
    } else {
      const days = period === "7d" ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        result.push({ date: key, ...(buckets[key] ?? { online: 0, pos: 0, total: 0 }) });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Revenue chart error:", error);
    return NextResponse.json(
      { error: "Failed to load revenue chart data" },
      { status: 500 }
    );
  }
}
