import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import('@/components/dashboard/Sidebar').then(m => ({ default: m.Sidebar })), {
  ssr: false,
  loading: () => <div className="w-[260px] h-screen bg-black/50 shrink-0" />
})

const Topbar = dynamic(() => import('@/components/dashboard/Topbar').then(m => ({ default: m.Topbar })), {
  ssr: false,
  loading: () => <div className="h-16 w-full bg-black/20" />
})

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/");

  const userObj = {
    email: profile.email ?? user.email ?? "",
    full_name: profile.full_name ?? undefined,
  };

  return (
    <div className="flex h-screen bg-[#030014] overflow-hidden relative">
      {/* Gradient orb background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-fuchsia-600/10 rounded-full blur-[80px]" />
      </div>
      <Sidebar user={userObj} />
      <div className="flex flex-col flex-1 ml-[260px] min-w-0">
        <Topbar user={userObj} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
