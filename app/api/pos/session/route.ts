import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic";

// GET — fetch open session for current user
export async function GET() {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: session, error } = await supabase
      .from("pos_sessions")
      .select("*")
      .eq("staff_id", user.id)
      .is("closed_at", null)
      .order("opened_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found — that's fine
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session: session ?? null })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// POST — open a new session
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

    const body = await req.json()
    const opening_cash = typeof body.opening_cash === "number" ? body.opening_cash : 0

    const { data: session, error } = await supabase
      .from("pos_sessions")
      .insert({
        staff_id: user.id,
        opening_cash,
        opened_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to open session" },
        { status: 500 }
      )
    }

    return NextResponse.json({ session })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH — close a session
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { session_id, closing_cash } = body as {
      session_id: string
      closing_cash: number
    }

    if (!session_id) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 })
    }

    const { data: session, error } = await supabase
      .from("pos_sessions")
      .update({
        closed_at: new Date().toISOString(),
        closing_cash: closing_cash ?? 0,
      })
      .eq("id", session_id)
      .eq("staff_id", user.id) // ensure ownership
      .select()
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to close session" },
        { status: 500 }
      )
    }

    return NextResponse.json({ session })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}
