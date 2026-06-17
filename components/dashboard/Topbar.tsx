"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Home } from "lucide-react";

interface TopbarProps {
  title?: string;
  user?: {
    email: string;
  };
}

function derivePageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1 && segments[0] === "dashboard") return "Dashboard";

  const last = segments[segments.length - 1];
  if (!last || last === "dashboard") return "Dashboard";

  return last
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Topbar({ title, user: _user }: TopbarProps) {
  const pathname = usePathname();
  const pageTitle = title ?? derivePageTitle(pathname);

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <header className="h-16 bg-black/20 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-white/30 text-sm">Dashboard</span>
        {pageTitle !== "Dashboard" && (
          <>
            <span className="text-white/20 text-sm">/</span>
            <span className="text-white font-semibold text-sm">{pageTitle}</span>
          </>
        )}
        {pageTitle === "Dashboard" && (
          <span className="text-white font-semibold text-sm">Overview</span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <span className="bg-white/[0.06] border border-white/[0.1] rounded-full px-3 py-1 text-white/50 text-xs">
          {dateStr}
        </span>
        <Link
          href="/"
          prefetch={true}
          className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.10] text-sm font-medium rounded-xl px-3 py-2 transition-all"
        >
          <Home className="w-4 h-4" />
          Homepage
        </Link>
        <Link
          href="/dashboard/products/new"
          prefetch={true}
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-4 h-4" />
          New Product
        </Link>
      </div>
    </header>
  );
}
