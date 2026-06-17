"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  BarChart2,
  ShoppingBag,
  Package,
  Layers,
  Tag,
  TrendingUp,
  Banknote,
  Receipt,
  Monitor,
  Users,
  User,
  Star,
  Ticket,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    email: string;
    full_name?: string;
  };
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
    ],
  },
  {
    label: "STORE",
    items: [
      { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
      { href: "/dashboard/products", label: "Products", icon: Package },
      { href: "/dashboard/inventory", label: "Inventory", icon: Layers },
      { href: "/dashboard/categories", label: "Categories", icon: Tag },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { href: "/dashboard/revenue", label: "Revenue", icon: TrendingUp },
      { href: "/dashboard/payouts", label: "Payouts", icon: Banknote },
      { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { href: "/dashboard/pos", label: "POS Terminal", icon: Monitor },
      { href: "/dashboard/staff", label: "Staff", icon: Users },
      { href: "/dashboard/customers", label: "Customers", icon: User },
      { href: "/dashboard/reviews", label: "Reviews", icon: Star },
      { href: "/dashboard/coupons", label: "Coupons", icon: Ticket },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { href: "/dashboard/settings", label: "Store Settings", icon: Settings },
    ],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Eagerly prefetch every dashboard route on mount so clicks are instant
  useEffect(() => {
    const allRoutes = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.href));
    allRoutes.forEach((href) => router.prefetch(href));
  }, [router]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const displayName = user.full_name ?? user.email.split("@")[0];

  return (
    <aside className="w-[260px] shrink-0 h-screen bg-black/50 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-white/[0.08] shrink-0">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="font-syne font-black text-xl text-white tracking-tight">
            Pantry
          </span>
          <span className="font-syne font-black text-xl text-violet-400 tracking-tight">
            Legend.
          </span>
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 ml-1" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] px-4 mt-6 mb-1.5">
              {section.label}
            </p>
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
                    active
                      ? "bg-gradient-to-r from-violet-500/20 to-transparent text-white border border-violet-500/30 shadow-lg shadow-violet-500/10"
                      : "text-white/50 hover:bg-white/[0.06] hover:text-white/90 border border-transparent"
                  )}
                >
                  {active ? (
                    <span className="text-violet-400">
                      <Icon className="w-4 h-4 shrink-0" />
                    </span>
                  ) : (
                    <Icon className="w-4 h-4 shrink-0 text-white/40" />
                  )}
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="mt-auto pb-3 px-3 shrink-0 space-y-2">
        {/* User card */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20 rounded-2xl p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{displayName}</p>
              <p className="text-white/40 text-xs truncate">{user.email}</p>
            </div>
            <span className="bg-violet-500/20 text-violet-300 text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0">
              Admin
            </span>
          </div>
        </div>

        {/* View live store */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Store
        </Link>

        {/* Sign out */}
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-rose-400/70 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
