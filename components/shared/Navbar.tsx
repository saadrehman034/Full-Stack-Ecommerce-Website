"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, Menu, X, User, LogOut, Package, ChevronDown, LayoutDashboard, Monitor } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { CartDrawer } from "@/components/store/CartDrawer";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Category { id: string; name: string; slug: string }

const BASE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/shop" },
  { label: "Best Sellers", href: "/shop?view=collections" },
];

export function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("customer");
  const itemCount = useCartStore(state => state.getItemCount());
  const openCart = useCartStore(state => state.openCart);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) fetchRole(data.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
      else setUserRole("customer");
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase.from("users").select("role").eq("id", userId).single();
    setUserRole(data?.role ?? "customer");
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.from("categories").select("id, name, slug").eq("is_active", true).order("sort_order")
      .then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const userInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";
  const userName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Account";

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#060810]/80 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-300">
        <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-4">

          {/* Logo */}
          <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <Link href="/" className="flex shrink-0 items-center">
              <Image src="/logo.png" alt="Vinzlu" width={160} height={64} className="object-contain h-14 w-auto" priority />
            </Link>
          </motion.div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {BASE_LINKS.map(l => (
              <motion.div key={l.href} whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Link
                  href={l.href}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
            {categories.length > 0 && (
              <div className="relative" onMouseEnter={() => setCategoriesOpen(true)} onMouseLeave={() => setCategoriesOpen(false)}>
                <button className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
                  Categories <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", categoriesOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {categoriesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-2 w-52 rounded-2xl border border-white/[0.08] bg-[#0c0f1a]/95 backdrop-blur-xl p-2 shadow-xl"
                    >
                      {categories.map(cat => (
                        <Link
                          key={cat.id}
                          href={`/shop/${cat.slug}`}
                          className="block rounded-xl px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(!searchOpen)}
              className="rounded-full p-2 text-white/60 hover:text-white transition-colors hover:bg-white/[0.06]"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8F04B] text-xs font-bold text-black ring-2 ring-transparent transition-all hover:ring-[#C8F04B]/30"
                >
                  {userInitial}
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/[0.08] bg-[#0c0f1a]/95 backdrop-blur-xl p-2 shadow-xl"
                    >
                      <div className="border-b border-white/[0.08] px-3 pb-2.5 mb-1.5">
                        <p className="truncate text-sm font-semibold text-white/90">{userName}</p>
                        <p className="truncate text-xs text-white/50">{user.email}</p>
                      </div>
                      <Link href="/account/orders" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
                        <Package className="h-4 w-4" /> My Orders
                      </Link>
                      <Link href="/account/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      {userRole === "admin" && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
                          <LayoutDashboard className="h-4 w-4" /> Admin Panel
                        </Link>
                      )}
                      {(userRole === "staff" || userRole === "admin") && (
                        <Link href="/pos" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
                          <Monitor className="h-4 w-4" /> POS Terminal
                        </Link>
                      )}
                      <div className="mt-1.5 border-t border-white/[0.08] pt-1.5">
                        <button onClick={handleSignOut}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10">
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden h-8 items-center rounded-xl bg-white/[0.07] border border-white/[0.12] px-4 text-xs font-semibold text-white transition-all hover:bg-white/[0.12] sm:flex"
              >
                Sign in
              </Link>
            )}

            {/* Cart */}
            <button
              aria-label="Cart"
              onClick={openCart}
              className="relative rounded-full p-2 text-white/60 hover:text-white transition-colors hover:bg-white/[0.06]"
            >
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 bg-[#C8F04B] text-black text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              aria-label="Menu"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="ml-1 rounded-full p-2 text-white/60 hover:text-white transition-colors hover:bg-white/[0.06] md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-white/[0.06] bg-[#060810]/95"
            >
              <form action="/shop" method="get" className="container mx-auto flex items-center gap-3 px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-white/40" />
                <input
                  ref={searchRef}
                  name="q"
                  placeholder="Search products…"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
                <button type="button" onClick={() => setSearchOpen(false)}>
                  <X className="h-4 w-4 text-white/40 hover:text-white transition-colors" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile nav — full-screen dark overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-white/[0.06] bg-[#060810]/98 backdrop-blur-xl md:hidden"
            >
              <div className="container mx-auto flex flex-col gap-1 px-4 py-4">
                {BASE_LINKS.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {l.label}
                  </Link>
                ))}
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/shop/${cat.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {cat.name}
                  </Link>
                ))}
                <div className="mt-3 space-y-1 border-t border-white/[0.08] pt-3">
                  {user ? (
                    <>
                      <Link
                        href="/account/orders"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <Package className="h-4 w-4" /> My Orders
                      </Link>
                      <button
                        onClick={() => { handleSignOut(); setMobileOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <User className="h-4 w-4" /> Sign in
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center rounded-xl bg-[#C8F04B] px-3 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02]"
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer />
    </>
  );
}
