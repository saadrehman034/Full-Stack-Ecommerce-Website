import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Package, MapPin, Heart, ChevronRight } from "lucide-react";

const NAV = [
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="container mx-auto min-h-screen px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/30">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {(profile?.full_name || user.email || "U")[0].toUpperCase()}
              </div>
              <div>
                <p className="font-syne font-semibold">{profile?.full_name || "My Account"}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                </Link>
              ))}
            </nav>

            <div className="mt-6 border-t border-border/40 pt-4">
              <form action="/api/auth/signout" method="post">
                <button type="submit"
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  );
}
