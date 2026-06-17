import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json([]);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, price, images, categories(name, slug)")
    .eq("is_active", true)
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .order("is_featured", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
