"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  Search,
  X,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  LogOut,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { POSShiftModal } from "@/components/dashboard/POSShiftModal"
import { POSPaymentModal } from "@/components/dashboard/POSPaymentModal"
import { POSReceiptModal } from "@/components/dashboard/POSReceiptModal"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
  stock_quantity: number
  low_stock_threshold: number
  barcode?: string
  categories?: { name: string; slug: string } | null
}

interface CartItem {
  product_id: string
  name: string
  price: number
  image: string
  slug: string
  quantity: number
  maxQty: number
}

interface POSSession {
  id: string
  staff_id: string
  opening_cash: number
  opened_at: string
  closing_cash?: number
  closed_at?: string
}

interface Customer {
  id: string
  full_name: string
  email: string
}

interface HeldOrder {
  id: string
  label: string
  items: CartItem[]
  customer: Customer | null
  discountAmount: number
  couponCode: string
}

interface CompletedOrder {
  order_number: string
  items: CartItem[]
  subtotal: number
  discountAmount: number
  vatAmount: number
  total: number
  paymentMethod: "cash" | "card"
  created_at: string
}

// ─── POS PAGE ─────────────────────────────────────────────────────────────────
export default function POSPage() {
  const supabase = createClient()

  // Session
  const [session, setSession] = useState<POSSession | null>(null)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [showEndShiftModal, setShowEndShiftModal] = useState(false)
  const [sessionSales, setSessionSales] = useState(0)
  const [sessionOrderCount, setSessionOrderCount] = useState(0)

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [search, setSearch] = useState("")

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Customer
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const customerSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Discount
  const [discountTab, setDiscountTab] = useState<"coupon" | "manual">("coupon")
  const [couponCode, setCouponCode] = useState("")
  const [couponData, setCouponData] = useState<{
    code: string
    discount: number
    type: "fixed" | "percent"
  } | null>(null)
  const [manualDiscount, setManualDiscount] = useState<number>(0)
  const [vatEnabled, setVatEnabled] = useState(false)

  // Payment
  const [paymentModal, setPaymentModal] = useState<"cash" | "card" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Receipt
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastOrder, setLastOrder] = useState<CompletedOrder | null>(null)

  // Held orders
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [showHeld, setShowHeld] = useState(false)

  // Search input ref for barcode focus
  const searchRef = useRef<HTMLInputElement>(null)

  // ─── On mount ────────────────────────────────────────────────────────────────
  useEffect(() => {
    checkSession()
    fetchProducts()
    // Keyboard shortcuts
    function onKey(e: KeyboardEvent) {
      if (e.key === "F3") {
        e.preventDefault()
        if (cartItems.length > 0) setPaymentModal("cash")
      }
      if (e.key === "F4") {
        e.preventDefault()
        if (cartItems.length > 0) setPaymentModal("card")
      }
      if (e.key === "Escape") {
        setPaymentModal(null)
        setShowHeld(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-attach keyboard listener when cartItems changes so F3/F4 sees fresh cart
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F3") {
        e.preventDefault()
        if (cartItems.length > 0) setPaymentModal("cash")
      }
      if (e.key === "F4") {
        e.preventDefault()
        if (cartItems.length > 0) setPaymentModal("card")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [cartItems])

  async function checkSession() {
    const res = await fetch("/api/pos/session")
    if (res.ok) {
      const data = await res.json()
      if (data.session) {
        setSession(data.session)
        fetchSessionStats(data.session.id, data.session.staff_id)
      } else {
        setShowShiftModal(true)
      }
    }
  }

  async function fetchSessionStats(sessionId: string, staffId: string) {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("source", "pos")
      .eq("staff_id", staffId)
      .gte("created_at", `${today}T00:00:00`)
    if (data) {
      setSessionOrderCount(data.length)
      setSessionSales(data.reduce((s, o) => s + (o.total_amount ?? 0), 0))
    }
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("is_active", true)
      .limit(200)
    if (error) {
      toast.error("Failed to load products")
      return
    }
    setProducts(data ?? [])
    // Derive categories
    const seen = new Set<string>()
    const cats: { id: string; name: string; slug: string }[] = []
    for (const p of data ?? []) {
      if (p.categories && !seen.has(p.categories.slug)) {
        seen.add(p.categories.slug)
        cats.push({ id: p.categories.slug, name: p.categories.name, slug: p.categories.slug })
      }
    }
    setCategories(cats)
  }

  // ─── Cart operations ─────────────────────────────────────────────────────────
  function addToCart(product: Product) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error("Not enough stock")
          return prev
        }
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      if (product.stock_quantity <= 0) {
        toast.error("Out of stock")
        return prev
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] ?? "",
          slug: product.slug,
          quantity: 1,
          maxQty: product.stock_quantity,
        },
      ]
    })
  }

  function removeFromCart(productId: string) {
    setCartItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  function updateQty(productId: string, delta: number) {
    setCartItems((prev) =>
      prev
        .map((i) => {
          if (i.product_id !== productId) return i
          const next = i.quantity + delta
          if (next <= 0) return null
          if (next > i.maxQty) {
            toast.error("Not enough stock")
            return i
          }
          return { ...i, quantity: next }
        })
        .filter(Boolean) as CartItem[]
    )
  }

  function clearCart() {
    setCartItems([])
    setCustomer(null)
    setCouponData(null)
    setManualDiscount(0)
    setCouponCode("")
  }

  // ─── Barcode scan (Enter in search box) ─────────────────────────────────────
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && search.trim()) {
      const match = products.find(
        (p) =>
          p.barcode === search.trim() ||
          p.name.toLowerCase() === search.trim().toLowerCase()
      )
      if (match) {
        addToCart(match)
        setSearch("")
      } else {
        toast.error("Product not found")
      }
    }
  }

  // ─── Customer search (debounced) ─────────────────────────────────────────────
  function handleCustomerSearch(val: string) {
    setCustomerSearch(val)
    setShowCustomerDropdown(true)
    if (customerSearchRef.current) clearTimeout(customerSearchRef.current)
    if (!val.trim()) {
      setCustomerResults([])
      return
    }
    customerSearchRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${val}%,email.ilike.%${val}%`)
        .limit(5)
      setCustomerResults(data ?? [])
    }, 300)
  }

  // ─── Coupon validation ────────────────────────────────────────────────────────
  async function applyCoupon() {
    if (!couponCode.trim()) return
    // Attempt to find coupon in coupons table (best-effort)
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("is_active", true)
      .single()

    if (!data) {
      toast.error("Invalid or expired coupon")
      return
    }
    setCouponData({
      code: data.code,
      discount: data.type === "percent" ? (subtotal * data.value) / 100 : data.value,
      type: data.type,
    })
    toast.success(`Coupon applied: ${data.code}`)
  }

  // ─── Totals ───────────────────────────────────────────────────────────────────
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discountAmount = couponData
    ? Math.min(couponData.discount, subtotal)
    : manualDiscount > 0
    ? subtotal * (manualDiscount / 100)
    : 0
  const vatAmount = vatEnabled ? (subtotal - discountAmount) * 0.2 : 0
  const total = subtotal - discountAmount + vatAmount

  // ─── Complete sale ────────────────────────────────────────────────────────────
  async function completeSale(method: "cash" | "card") {
    if (!session) {
      toast.error("No active session")
      return
    }
    if (cartItems.length === 0) return
    setIsProcessing(true)
    try {
      const res = await fetch("/api/pos/complete-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          customerId: customer?.id,
          paymentMethod: method,
          discountAmount,
          vatAmount,
          subtotal,
          total,
          sessionId: session.id,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to complete sale")
      }
      const { order_number } = await res.json()

      const completed: CompletedOrder = {
        order_number,
        items: [...cartItems],
        subtotal,
        discountAmount,
        vatAmount,
        total,
        paymentMethod: method,
        created_at: new Date().toISOString(),
      }
      setLastOrder(completed)
      clearCart()
      setPaymentModal(null)
      setShowReceipt(true)
      setSessionOrderCount((n) => n + 1)
      setSessionSales((s) => s + total)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sale failed")
    } finally {
      setIsProcessing(false)
    }
  }

  // ─── Hold order ───────────────────────────────────────────────────────────────
  function holdOrder() {
    if (cartItems.length === 0) return
    const held: HeldOrder = {
      id: Date.now().toString(),
      label: `Hold ${heldOrders.length + 1} — ${cartItems.length} item(s)`,
      items: [...cartItems],
      customer,
      discountAmount,
      couponCode,
    }
    setHeldOrders((prev) => [...prev, held])
    clearCart()
    toast.success("Order held")
  }

  function recallHeld(held: HeldOrder) {
    setCartItems(held.items)
    setCustomer(held.customer)
    setCouponCode(held.couponCode)
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id))
    setShowHeld(false)
  }

  // ─── Shift open/close ─────────────────────────────────────────────────────────
  async function handleOpenShift(openingCash: number) {
    const res = await fetch("/api/pos/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opening_cash: openingCash }),
    })
    if (!res.ok) {
      toast.error("Failed to open shift")
      return
    }
    const data = await res.json()
    setSession(data.session)
    setShowShiftModal(false)
    toast.success("Shift opened")
  }

  async function handleCloseShift(closingCash: number) {
    if (!session) return
    const res = await fetch("/api/pos/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: session.id, closing_cash: closingCash }),
    })
    if (!res.ok) {
      toast.error("Failed to close shift")
      return
    }
    setSession(null)
    setShowEndShiftModal(false)
    setShowShiftModal(true)
    toast.success("Shift closed")
  }

  // ─── Filtered products (memoized — no Supabase call per search) ──────────────
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(search))
      const matchesCategory =
        activeCategory === "all" ||
        p.categories?.slug === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, activeCategory])

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0A0A0A]">
      {/* Topbar */}
      <div className="h-14 bg-[#0D0D0D] border-b border-[#1A1A1A] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-syne font-bold text-[#C8F04B] text-lg">POS Terminal</h1>
          {session && (
            <div className="flex items-center gap-4 text-xs text-[#555]">
              <span>
                Opened{" "}
                {new Date(session.opened_at).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-[#333]">|</span>
              <span className="text-[#A0A0A0]">
                {sessionOrderCount} orders · {formatCurrency(sessionSales)} today
              </span>
            </div>
          )}
        </div>
        {session && (
          <button
            onClick={() => setShowEndShiftModal(true)}
            className="flex items-center gap-2 border border-[#2A2A2A] text-[#A0A0A0] hover:text-white hover:border-[#444] rounded-full px-4 py-1.5 text-xs transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            End Shift
          </button>
        )}
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Product browser */}
        <div className="flex-[60] flex flex-col bg-[#111] border-r border-[#1A1A1A] min-w-0">
          {/* Search */}
          <div className="h-14 border-b border-[#1A1A1A] flex items-center px-3 gap-2 shrink-0">
            <Search className="w-4 h-4 text-[#555] shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search products or scan barcode…"
              className="flex-1 bg-transparent text-white outline-none text-sm placeholder:text-[#555]"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="w-4 h-4 text-[#555] hover:text-white" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="border-b border-[#1A1A1A] flex overflow-x-auto scrollbar-hide shrink-0">
            {[{ id: "all", name: "All" }, ...categories].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#C8F04B] text-black"
                    : "text-[#555] hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2 lg:grid-cols-4 content-start">
            {filteredProducts.map((p) => {
              const outOfStock = p.stock_quantity <= 0
              const lowStock =
                !outOfStock && p.stock_quantity <= p.low_stock_threshold
              return (
                <button
                  key={p.id}
                  disabled={outOfStock}
                  onClick={() => addToCart(p)}
                  className="relative rounded-xl bg-[#1A1A1A] border border-[#222] overflow-hidden text-left transition-all hover:border-[#C8F04B]/50 active:scale-95 disabled:opacity-40"
                >
                  {/* Image */}
                  <div className="aspect-square relative bg-[#222]">
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#333] text-2xl">
                        🛒
                      </div>
                    )}
                    {/* Stock badge */}
                    {outOfStock && (
                      <span className="absolute top-1 right-1 bg-red-900/90 text-red-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        Out
                      </span>
                    )}
                    {lowStock && !outOfStock && (
                      <span className="absolute top-1 right-1 bg-amber-900/90 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {p.stock_quantity} left
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-2">
                    <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2">
                      {p.name}
                    </p>
                    <p className="font-syne text-sm font-black text-[#C8F04B] mt-0.5">
                      {formatCurrency(p.price)}
                    </p>
                  </div>
                </button>
              )
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-4 py-16 text-center text-[#555] text-sm">
                No products found.
              </div>
            )}
          </div>
        </div>

        {/* Right panel — Cart & checkout */}
        <div className="flex-[40] flex flex-col bg-[#0D0D0D] min-w-0">
          {/* Cart header */}
          <div className="h-12 border-b border-[#1A1A1A] flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">Current Order</span>
              {cartItems.length > 0 && (
                <span className="bg-[#C8F04B] text-black text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-[#555] hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#333]">
                <div className="text-5xl mb-3">🛒</div>
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs text-[#2A2A2A] mt-1">
                  Click a product or scan a barcode
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-[#1A1A1A] rounded-xl p-3 flex items-center gap-3"
                >
                  {/* Image */}
                  <div className="w-9 h-9 rounded-lg bg-[#222] overflow-hidden relative shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2A2A2A]" />
                    )}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{item.name}</p>
                    <p className="text-[#555] text-[10px]">{formatCurrency(item.price)} each</p>
                  </div>
                  {/* Qty stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="w-6 h-6 rounded-lg bg-[#222] flex items-center justify-center text-white hover:bg-[#2A2A2A] transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-white text-xs font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="w-6 h-6 rounded-lg bg-[#222] flex items-center justify-center text-white hover:bg-[#2A2A2A] transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {/* Line total */}
                  <p className="font-syne font-bold text-white text-sm shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-[#333] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Customer section */}
          <div className="border-t border-[#1A1A1A] p-3 relative">
            <p className="text-[#555] text-[10px] uppercase tracking-wider font-semibold mb-2">
              Customer
            </p>
            {customer ? (
              <div className="flex items-center justify-between bg-[#1A1A1A] rounded-xl px-3 py-2">
                <div>
                  <p className="text-white text-xs font-semibold">{customer.full_name}</p>
                  <p className="text-[#555] text-[10px]">{customer.email}</p>
                </div>
                <button
                  onClick={() => {
                    setCustomer(null)
                    setCustomerSearch("")
                  }}
                  className="text-[#555] hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer…"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3 py-2 text-white text-xs focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
                />
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden z-10">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCustomer(c)
                          setCustomerSearch("")
                          setCustomerResults([])
                          setShowCustomerDropdown(false)
                        }}
                        className="w-full px-3 py-2.5 text-left hover:bg-[#222] transition-colors"
                      >
                        <p className="text-white text-xs font-medium">{c.full_name}</p>
                        <p className="text-[#555] text-[10px]">{c.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Discount section */}
          <div className="border-t border-[#1A1A1A] p-3">
            <p className="text-[#555] text-[10px] uppercase tracking-wider font-semibold mb-2">
              Discount
            </p>
            {/* Tabs */}
            <div className="flex gap-1 mb-2">
              {(["coupon", "manual"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDiscountTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    discountTab === tab
                      ? "bg-[#C8F04B] text-black"
                      : "bg-[#1A1A1A] text-[#555]"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {discountTab === "coupon" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="COUPON CODE"
                  className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3 py-2 text-white text-xs focus:border-[#C8F04B] outline-none placeholder:text-[#555] font-mono"
                />
                <button
                  onClick={applyCoupon}
                  disabled={!couponCode.trim()}
                  className="bg-[#C8F04B] text-black rounded-[10px] px-3 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Apply
                </button>
                {couponData && (
                  <button
                    onClick={() => {
                      setCouponData(null)
                      setCouponCode("")
                    }}
                    className="text-[#555] hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={manualDiscount || ""}
                  onChange={(e) => setManualDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3 py-2 text-white text-xs focus:border-[#C8F04B] outline-none"
                />
                <span className="text-[#555] text-xs">%</span>
                {manualDiscount > 0 && (
                  <button
                    onClick={() => setManualDiscount(0)}
                    className="text-[#555] hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {manualDiscount > 0 && (
                  <span className="text-green-400 text-xs">
                    -{formatCurrency(subtotal * (manualDiscount / 100))}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="border-t border-[#1A1A1A] p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#555]">Subtotal</span>
              <span className="text-white">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#555]">
                  Discount{couponData ? ` (${couponData.code})` : manualDiscount ? ` (${manualDiscount}%)` : ""}
                </span>
                <span className="text-green-400">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs items-center">
              <button
                onClick={() => setVatEnabled(!vatEnabled)}
                className={`flex items-center gap-1.5 text-[#555] hover:text-white transition-colors`}
              >
                <div
                  className={`w-7 h-3.5 rounded-full transition-colors relative ${
                    vatEnabled ? "bg-[#C8F04B]" : "bg-[#2A2A2A]"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform ${
                      vatEnabled ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </div>
                VAT (20%)
              </button>
              <span className="text-white">{formatCurrency(vatAmount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#555]">Shipping</span>
              <span className="text-[#555]">£0.00</span>
            </div>
            <div className="border-t border-[#1E1E1E] pt-2 flex justify-between items-center">
              <span className="text-white font-bold text-sm">Total</span>
              <span className="font-syne text-2xl font-black text-white">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Payment buttons */}
          <div className="p-3 border-t border-[#1A1A1A] grid grid-cols-3 gap-2">
            <button
              onClick={() => cartItems.length > 0 && setPaymentModal("cash")}
              disabled={cartItems.length === 0}
              className="h-14 rounded-xl bg-[#C8F04B] text-black font-black text-sm flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span>💵</span>
              <span className="text-[10px] font-bold">CASH (F3)</span>
            </button>
            <button
              onClick={() => cartItems.length > 0 && setPaymentModal("card")}
              disabled={cartItems.length === 0}
              className="h-14 rounded-xl border border-[#2A2A2A] text-white font-bold text-sm flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 hover:border-[#444] active:scale-95 transition-all"
            >
              <span>💳</span>
              <span className="text-[10px]">CARD (F4)</span>
            </button>
            <button
              onClick={holdOrder}
              disabled={cartItems.length === 0}
              className="h-14 rounded-xl border border-[#2A2A2A] text-[#A0A0A0] text-sm flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 hover:border-[#444] active:scale-95 transition-all"
            >
              <PauseCircle className="w-4 h-4" />
              <span className="text-[10px]">HOLD</span>
            </button>
          </div>

          {/* Held orders */}
          {heldOrders.length > 0 && (
            <div className="px-3 pb-3">
              <button
                onClick={() => setShowHeld(!showHeld)}
                className="w-full py-2 border border-[#2A2A2A] text-[#A0A0A0] rounded-xl text-xs hover:border-[#444] transition-all"
              >
                Recall ({heldOrders.length})
              </button>
              {showHeld && (
                <div className="mt-2 space-y-1.5 bg-[#1A1A1A] rounded-xl p-2">
                  {heldOrders.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between gap-2 px-2 py-1.5"
                    >
                      <span className="text-white text-xs">{h.label}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => recallHeld(h)}
                          className="bg-[#C8F04B] text-black rounded-full px-3 py-1 text-[10px] font-bold"
                        >
                          Load
                        </button>
                        <button
                          onClick={() =>
                            setHeldOrders((prev) => prev.filter((x) => x.id !== h.id))
                          }
                          className="border border-red-900/50 text-red-400 rounded-full px-3 py-1 text-[10px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showShiftModal && !session && (
        <POSShiftModal
          mode="open"
          onOpen={handleOpenShift}
          onClose={() => {}}
        />
      )}

      {showEndShiftModal && session && (
        <POSShiftModal
          mode="close"
          session={session}
          totalSales={sessionSales}
          totalOrders={sessionOrderCount}
          onOpen={() => {}}
          onClose={handleCloseShift}
          onCancel={() => setShowEndShiftModal(false)}
        />
      )}

      <POSPaymentModal
        mode={paymentModal}
        total={total}
        onClose={() => setPaymentModal(null)}
        onComplete={completeSale}
        isProcessing={isProcessing}
      />

      <POSReceiptModal
        order={showReceipt ? lastOrder : null}
        onClose={() => {
          setShowReceipt(false)
          setLastOrder(null)
        }}
      />
    </div>
  )
}
