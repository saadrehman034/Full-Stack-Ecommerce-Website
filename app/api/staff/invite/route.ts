import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    // Verify the calling user is authenticated and is admin
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check caller's role
    const { data: callerProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse body
    const body = await req.json();
    const {
      email,
      full_name,
      role,
      phone,
    }: { email: string; full_name: string; role: "staff" | "admin"; phone?: string } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: "email, full_name, and role are required" },
        { status: 400 }
      );
    }

    if (!["staff", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be staff or admin" },
        { status: 400 }
      );
    }

    // Invite via Supabase Admin
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name, role },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      });

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      );
    }

    // Upsert user in public.users table
    const { error: upsertError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: inviteData.user?.id,
          email,
          full_name,
          role,
          phone: phone ?? null,
        },
        { onConflict: "email" }
      );

    if (upsertError) {
      // Non-fatal: log but don't fail the request
      // The auth invite succeeded; profile will be created on first sign-in
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
