import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, ShoppingBag, Package, FolderOpen, Warehouse,
  Users, Tag, UserCheck, Settings, Star, BarChart2, LogOut, Home,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/staff", label: "Staff", icon: UserCheck },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/reports", label: "Reports", icon: BarChart2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  const role = profile?.role;
  if (role !== "admin") redirect("/");

  return (
    <div className="flex h-screen bg-[#F8F8F8] dark:bg-[#0A0A0A]">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border/40 bg-white dark:bg-[#111]">
        <div className="flex h-16 items-center border-b border-border/40 px-6">
          <Link href="/admin" className="font-syne text-lg font-bold text-primary">
            PantryLegend
          </Link>
          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} prefetch={true}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground group">
              <Icon className="h-4 w-4 shrink-0 group-hover:text-primary transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border/40 p-3">
          <div className="mb-2 rounded-xl bg-muted/50 px-3 py-3">
            <p className="text-xs font-semibold text-foreground truncate">{user.email}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{role}</p>
          </div>
          <form action="/api/auth/signout" method="post">
            <button type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Topbar */}
        <header className="h-14 shrink-0 sticky top-0 z-30 flex items-center justify-end px-6 border-b border-border/40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md">
          <Link
            href="/"
            prefetch={true}
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Back to Homepage
          </Link>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
