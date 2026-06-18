import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  const role = profile?.role;
  if (role !== "admin") redirect("/");

  return (
    <div className="flex h-screen bg-[#F8F8F8] dark:bg-[#0A0A0A]">
      <AdminSidebar email={user.email ?? ""} role={role ?? "admin"} />

      {/* Main */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 shrink-0 sticky top-0 z-30 flex items-center justify-end px-4 md:px-6 border-b border-border/40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md">
          {/* spacer for mobile hamburger */}
          <div className="w-12 md:hidden" />
          <div className="flex-1" />
        </header>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
