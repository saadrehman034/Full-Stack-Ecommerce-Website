"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Search, ShoppingCart, Plus, Minus, Trash2, X,
  CreditCard, Banknote, Clock, LogOut, PauseCircle, PlayCircle,
  Barcode, Loader2, Check
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";
import { usePOSStore } from "@/store/pos";
import { toast } from "sonner";

const CATEGORY_MAP: Record<string, string> = {
  all: "All",
  "candy-treats": "Candy",
  "snacks-nuts": "Snacks",
  beverages: "Beverages",
  "spreads-condiments": "Spreads",
  "baking-essentials": "Baking",
  household: "Household",
  "pet-supplies": "Pet",
  electronics: "Electronics",
};

type Product = {
  id: string; name: string; slug: string; price: number; images: string[];
  stock_quantity: number; unit: string; sku: string; barcode: string;
  categories: { name: string; slug: string } | null;
};

const supabase = createClient();

export default function POSPage() {
  const { session, heldOrders, startSession, endSession, holdOrder, removeHeldOrder } = usePOSStore();
  const { items, addItem, removeItem, updateQuantity, clearCart, getSubtotal } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showOpenShift, setShowOpenShift] = useState(!session);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [showCash, setShowCash] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [discount, setDiscount] = useState(0);
  const [mobileTab, setMobileTab] = useState<"products" | "order">("products");
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const subtotal = getSubtotal();
  const taxAmount = taxEnabled ? subtotal * 0.1 : 0;
  const discountAmount = discount > 0 ? (subtotal + taxAmount) * (discount / 100) : 0;
  const total = subtotal + taxAmount - discountAmount;
  const change = cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0;

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    let q = supabase.from("products").select("*, categories!inner(name, slug)").eq("is_active", true);
    if (activeCategory !== "all") q = q.eq("categories.slug", activeCategory);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data } = await q.limit(60);
    setProducts((data as unknown as Product[]) ?? []);
    setIsLoadingProducts(false);
  }, [activeCategory, search]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Barcode scan listener (keyboard input mode)
  useEffect(() => {
    let buffer = "";
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && buffer.length > 4) {
        handleBarcode(buffer);
        buffer = "";
        return;
      }
      if (e.key.length === 1) buffer += e.key;
      clearTimeout(timer);
      timer = setTimeout(() => { buffer = ""; }, 200);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const handleBarcode = async (code: string) => {
    const { data } = await supabase.from("products").select("*, categories(name, slug)")
      .eq("barcode", code).eq("is_active", true).single();
    if (data) {
      const d = data as any;
      addItem({ product_id: d.id, name: d.name, price: d.price, image: d.images?.[0] || "", slug: d.slug });
      toast.success(`${d.name} added`);
    } else {
      toast.error("Product not found for barcode: " + code);
    }
  };

  const openShift = async () => {
    if (!openingCash || isNaN(parseFloat(openingCash))) { toast.error("Enter opening cash amount"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("pos_sessions").insert({
      staff_id: user.id,
      opening_cash: parseFloat(openingCash),
    }).select().single();

    if (error || !data) { toast.error("Failed to open shift"); return; }
    startSession({ id: (data as any).id, staffId: user.id, openedAt: (data as any).opened_at, openingCash: parseFloat(openingCash) });
    setShowOpenShift(false);
    toast.success("Shift opened!");
  };

  const closeShift = async () => {
    if (!session) return;
    const cc = parseFloat(closingCash);
    if (isNaN(cc)) { toast.error("Enter closing cash"); return; }

    await supabase.from("pos_sessions").update({
      closed_at: new Date().toISOString(),
      closing_cash: cc,
    }).eq("id", session.id);

    endSession();
    clearCart();
    setShowCloseShift(false);
    toast.success("Shift closed.");
    setShowOpenShift(true);
  };

  const placeOrder = async (method: "cash" | "card") => {
    if (items.length === 0) { toast.error("No items in order"); return; }
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const orderNumber = `PL-POS-${Date.now().toString(36).toUpperCase()}`;

      const { data: order, error } = await supabase.from("orders").insert({
        order_number: orderNumber,
        user_id: null,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        shipping_amount: 0,
        total_amount: total,
        payment_status: "paid",
        payment_method: method,
        status: "confirmed",
        source: "pos",
        staff_id: user?.id,
      }).select().single();

      if (error || !order) throw new Error("Failed to create order");

      await supabase.from("order_items").insert(
        items.map(item => ({
          order_id: (order as any).id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          product_snapshot: { name: item.name, images: [item.image] },
        }))
      );

      // Decrement stock
      for (const item of items) {
        await supabase.rpc("decrement_stock", { product_id: item.product_id, amount: item.quantity }).maybeSingle();
      }

      clearCart();
      setDiscount(0);
      setCashReceived("");
      setShowCash(false);
      toast.success(`Order ${orderNumber} completed!`);
    } catch (err: any) {
      toast.error(err.message || "Order failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const holdCurrentOrder = () => {
    if (items.length === 0) return;
    holdOrder({ id: Date.now().toString(), items: [...items], total, heldAt: new Date().toISOString() });
    clearCart();
    toast.success("Order held.");
  };

  if (showOpenShift) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
        <a href="/" className="absolute top-4 right-4 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 transition-colors">
          ← Homepage
        </a>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-3xl bg-[#111] border border-[#1E1E1E] p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Clock className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-syne text-2xl font-bold text-white">Open Shift</h2>
            <p className="mt-1 text-sm text-white/50">Enter your opening cash float</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70">Opening Cash ($)</label>
              <input value={openingCash} onChange={e => setOpeningCash(e.target.value)} type="number" step="0.01" placeholder="0.00"
                className="mt-1.5 h-12 w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-primary placeholder:text-white/20" />
            </div>
            <button onClick={openShift}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-transform hover:scale-[1.01]">
              Open Shift
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#F5F5F5] dark:bg-[#0A0A0A] overflow-hidden">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1E1E1E] bg-[#111] px-3 md:px-4">
        <div className="flex items-center gap-2">
          <span className="font-syne text-base font-bold text-white hidden sm:inline">PantryLegend POS</span>
          <span className="font-syne text-sm font-bold text-white sm:hidden">POS</span>
          {session && (
            <span className="rounded-full bg-[#C8F04B]/15 px-2 py-0.5 text-[11px] font-medium text-[#C8F04B]">
              <span className="hidden sm:inline">Shift open · </span>{new Date(session.openedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowHeld(true)}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs font-medium text-white hover:bg-white/15">
            <PauseCircle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Held</span> ({heldOrders.length})
          </button>
          <button onClick={() => setShowCloseShift(true)}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs font-medium text-white hover:bg-white/15">
            <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">End Shift</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Product browser */}
        <div className={`flex flex-col border-r border-border/40 bg-white dark:bg-[#111] ${mobileTab === "products" ? "flex" : "hidden"} md:flex md:w-[58%] w-full`}>
          {/* Search */}
          <div className="border-b border-border/40 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search or scan barcode…"
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <Barcode className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border/40 p-2 scrollbar-none">
            {Object.entries(CATEGORY_MAP).map(([slug, label]) => (
              <button key={slug} onClick={() => setActiveCategory(slug)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeCategory === slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {isLoadingProducts ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="font-semibold">No products found</p>
                <p className="text-sm text-muted-foreground">Try a different search or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <button key={p.id} onClick={() => { addItem({ product_id: p.id, name: p.name, price: p.price, image: p.images?.[0] || "", slug: p.slug }); }}
                    disabled={p.stock_quantity <= 0}
                    className="group relative flex flex-col overflow-hidden rounded-xl bg-muted/40 text-left transition-all hover:shadow-md hover:ring-2 hover:ring-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                    <div className="relative aspect-square w-full">
                      <Image src={p.images?.[0] || "https://images.unsplash.com/photo-1506617564039-2f3b650b7010?q=80&w=300&auto=format&fit=crop"}
                        alt={p.name} fill className="object-cover" sizes="150px" />
                      {p.stock_quantity <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-white">Out</span>
                        </div>
                      )}
                      {p.stock_quantity > 0 && p.stock_quantity <= 5 && (
                        <span className="absolute right-1 top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {p.stock_quantity} left
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 text-[11px] font-semibold leading-tight">{p.name}</p>
                      <p className="mt-0.5 font-syne text-sm font-bold text-primary">${p.price.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Active order */}
        <div className={`flex flex-col bg-white dark:bg-[#111] ${mobileTab === "order" ? "flex" : "hidden"} md:flex md:w-[42%] w-full`}>
          {/* Order header */}
          <div className="border-b border-border/40 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="font-syne font-bold">Current Order</h2>
            </div>
            {items.length > 0 && (
              <button onClick={clearCart} className="text-xs text-destructive hover:underline">Clear</button>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Tap a product or scan a barcode to add it</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.product_id}
                    className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { if (item.quantity > 1) { updateQuantity(item.product_id, item.quantity - 1); } else { removeItem(item.product_id); } }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground transition-colors hover:text-primary">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground transition-colors hover:text-primary">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="w-16 text-right font-syne text-sm font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeItem(item.product_id)}
                      className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order footer */}
          <div className="border-t border-border/40 p-3 md:p-4 space-y-3">
            {/* Discount */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground shrink-0">Discount %</label>
              <input type="number" min="0" max="100" value={discount || ""} onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-8 w-20 rounded-lg border border-border px-2 text-sm outline-none focus:ring-1 focus:ring-ring" />
              <label className="flex items-center gap-1.5 ml-auto text-xs font-medium">
                <input type="checkbox" checked={taxEnabled} onChange={e => setTaxEnabled(e.target.checked)} className="rounded" />
                Tax (10%)
              </label>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {taxEnabled && <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>${taxAmount.toFixed(2)}</span></div>}
              {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({discount}%)</span><span>-${discountAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between border-t border-border/40 pt-2 font-syne text-lg font-bold">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowCash(true)} disabled={items.length === 0 || isProcessing}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-green-600 font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-50">
                <Banknote className="h-4 w-4" /> Cash
              </button>
              <button onClick={() => placeOrder("card")} disabled={items.length === 0 || isProcessing}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="h-4 w-4" /> Card</>}
              </button>
            </div>

            <button onClick={holdCurrentOrder} disabled={items.length === 0}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-border text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50">
              <PauseCircle className="h-3.5 w-3.5" /> Hold Order
            </button>
          </div>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden flex shrink-0 border-t border-[#1E1E1E] bg-[#111]">
        <button
          onClick={() => setMobileTab("products")}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors ${mobileTab === "products" ? "text-[#C8F04B]" : "text-white/40"}`}
        >
          <Search className="h-5 w-5" />
          Products
        </button>
        <button
          onClick={() => setMobileTab("order")}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors relative ${mobileTab === "order" ? "text-[#C8F04B]" : "text-white/40"}`}
        >
          <ShoppingCart className="h-5 w-5" />
          Order
          {items.length > 0 && (
            <span className="absolute top-1.5 right-1/4 h-4 w-4 rounded-full bg-[#C8F04B] text-[10px] font-black text-black flex items-center justify-center">
              {items.length}
            </span>
          )}
        </button>
      </div>

      {/* Cash payment modal */}
      <AnimatePresence>
        {showCash && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-syne text-xl font-bold">Cash Payment</h2>
                <button onClick={() => setShowCash(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Due</p>
                  <p className="font-syne text-4xl font-black text-primary">${total.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Cash Received ($)</label>
                  <input type="number" step="0.01" value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                    placeholder="0.00" autoFocus
                    className="mt-1.5 h-12 w-full rounded-xl border border-border px-4 text-xl font-bold outline-none focus:ring-2 focus:ring-ring" />
                </div>
                {cashReceived && parseFloat(cashReceived) >= total && (
                  <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
                    <p className="text-sm text-green-700">Change Due</p>
                    <p className="font-syne text-3xl font-black text-green-600">${change.toFixed(2)}</p>
                  </div>
                )}
                <button onClick={() => placeOrder("cash")} disabled={!cashReceived || parseFloat(cashReceived) < total || isProcessing}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 font-bold text-white transition-all hover:bg-green-700 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5" /> Confirm Payment</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Close shift modal */}
      <AnimatePresence>
        {showCloseShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-syne text-xl font-bold text-gray-900">Close Shift</h2>
                <button onClick={() => setShowCloseShift(false)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-gray-100 p-4 text-sm space-y-2">
                  <p className="text-gray-500">Shift started: <span className="font-medium text-gray-800">{session && new Date(session.openedAt).toLocaleTimeString()}</span></p>
                  <p className="text-gray-500">Opening cash: <span className="font-medium text-gray-800">${session?.openingCash.toFixed(2)}</span></p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Closing Cash ($)</label>
                  <input type="number" step="0.01" value={closingCash} onChange={e => setClosingCash(e.target.value)} placeholder="0.00"
                    className="mt-1.5 h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-gray-900 outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400" />
                </div>
                <div className="space-y-2">
                  <button onClick={closeShift}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-500 font-semibold text-white hover:bg-red-600 transition-colors">
                    <LogOut className="h-4 w-4" /> Close Shift
                  </button>
                  <button onClick={() => setShowCloseShift(false)}
                    className="h-10 w-full rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Held orders modal */}
      <AnimatePresence>
        {showHeld && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-syne text-xl font-bold">Held Orders</h2>
                <button onClick={() => setShowHeld(false)}><X className="h-5 w-5" /></button>
              </div>
              {heldOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No held orders</p>
              ) : (
                <div className="space-y-3">
                  {heldOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                      <div>
                        <p className="font-semibold">{o.items.length} items · ${o.total?.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.heldAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          o.items.forEach((i: any) => addItem({ product_id: i.product_id, name: i.name, price: i.price, image: i.image || "", slug: i.slug || "" }));
                          removeHeldOrder(o.id);
                          setShowHeld(false);
                          toast.success("Order recalled");
                        }} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                          <PlayCircle className="h-3 w-3" /> Recall
                        </button>
                        <button onClick={() => removeHeldOrder(o.id)}
                          className="rounded-lg border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
