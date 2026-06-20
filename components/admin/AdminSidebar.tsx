"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, FolderOpen, Warehouse,
  Users, Tag, UserCheck, Settings, Star, BarChart2, LogOut, Home, Menu, X,
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

interface Props {
  email: string;
  role: string;
}

export function AdminSidebar({ email, role }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center border-b border-border/40 px-6">
        <Link href="/admin" onClick={() => setOpen(false)} className="inline-flex items-center">
          <img src="/logo.png" alt="Vinzlu" className="h-8 w-auto object-contain" />
        </Link>
        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Admin</span>
        <button onClick={() => setOpen(false)} className="ml-auto md:hidden text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
              <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-primary" : "group-hover:text-primary"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/40 p-3">
        <div className="mb-2 rounded-xl bg-muted/50 px-3 py-3">
          <p className="text-xs font-semibold text-foreground truncate">{email}</p>
          <p className="text-[11px] text-muted-foreground capitalize">{role}</p>
        </div>
        <Link href="/" onClick={() => setOpen(false)}
          className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Home className="h-4 w-4" /> Back to Store
        </Link>
        <form action="/api/auth/signout" method="post">
          <button type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r border-border/40 bg-white dark:bg-[#111]">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button — rendered inside topbar via portal-like approach */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-40 flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-[#111] border border-border/40 text-muted-foreground shadow-sm hover:text-foreground"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative flex w-72 flex-col bg-white dark:bg-[#111] shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
