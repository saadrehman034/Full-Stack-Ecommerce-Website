"use client"

import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { toast } from "sonner"

// ─── ANIMATION VARIANTS ─────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.25, 0.4, 0.25, 1]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_price?: number | null
  images?: string[]
  is_featured?: boolean
  categories?: { name: string } | null
}

interface Category {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

interface Review {
  id: string
  rating: number
  body: string
  created_at?: string
  users?: { full_name: string } | null
}

// ─── FALLBACK DATA ───────────────────────────────────────────────────────────

const FALLBACK_CATEGORIES: Category[] = [
  { id: "1", name: "Candy & Treats", slug: "candy-treats", image_url: "https://images.pexels.com/photos/16365469/pexels-photo-16365469.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "2", name: "Snacks & Nuts", slug: "snacks-nuts", image_url: "https://images.pexels.com/photos/18153178/pexels-photo-18153178.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "3", name: "Beverages", slug: "beverages", image_url: "https://images.pexels.com/photos/32354655/pexels-photo-32354655.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "4", name: "Spreads & Condiments", slug: "spreads-condiments", image_url: "https://images.pexels.com/photos/6659901/pexels-photo-6659901.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "5", name: "Baking Essentials", slug: "baking-essentials", image_url: "https://images.pexels.com/photos/5441079/pexels-photo-5441079.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "6", name: "Household", slug: "household", image_url: "https://images.pexels.com/photos/5217897/pexels-photo-5217897.jpeg?auto=compress&cs=tinysrgb&w=800" },
]

const FALLBACK_PRODUCTS: Product[] = [
  { id: "1", name: "Saffron Threads", slug: "saffron-threads", price: 45, compare_price: 55, images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=600&auto=format&fit=crop"], categories: { name: "Spices & Herbs" } },
  { id: "2", name: "Extra Virgin Olive Oil", slug: "evoo-premium", price: 24, images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600&auto=format&fit=crop"], categories: { name: "Oils & Vinegars" } },
  { id: "3", name: "Matcha Green Tea", slug: "matcha-powder", price: 28, compare_price: 34, images: ["https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=600&auto=format&fit=crop"], categories: { name: "Beverages" } },
  { id: "4", name: "Balsamic Vinegar", slug: "balsamic-modena", price: 32, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop"], categories: { name: "Oils & Vinegars" } },
  { id: "5", name: "Organic Quinoa", slug: "organic-quinoa", price: 6.5, images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600&auto=format&fit=crop"], categories: { name: "Grains & Pulses" } },
  { id: "6", name: "Roasted Macadamia", slug: "macadamia-nuts", price: 16.5, images: ["https://images.unsplash.com/photo-1545987796-200677ee1011?q=80&w=600&auto=format&fit=crop"], categories: { name: "Snacks & Nuts" } },
  { id: "7", name: "Dark Chocolate Callets", slug: "dark-chocolate-callets", price: 18, compare_price: 22, images: ["https://images.unsplash.com/photo-1606312619070-d48b4c652a52?q=80&w=600&auto=format&fit=crop"], categories: { name: "Baking Essentials" } },
  { id: "8", name: "Single Origin Espresso", slug: "espresso-beans", price: 19, images: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop"], categories: { name: "Beverages" } },
]

const FALLBACK_REVIEWS: Review[] = [
  { id: "1", body: "The quality of their spices is absolutely incredible. The Himalayan pink salt has become a staple in my kitchen — nothing else comes close.", users: { full_name: "Sarah M." }, rating: 5 },
  { id: "2", body: "Fast delivery and everything was packed so well. The ceremonial matcha is divine — better than anything I've had at a café.", users: { full_name: "James K." }, rating: 5 },
  { id: "3", body: "PantryLegend has completely transformed how I cook. The variety and quality is unmatched. Highly recommend to anyone who takes food seriously.", users: { full_name: "Priya R." }, rating: 5 },
]

const BENEFITS = [
  { icon: "🚀", title: "Next Day Delivery", desc: "Order before 2pm for next day delivery on all orders over £30.", color: "from-violet-500/20 to-violet-600/5", border: "border-violet-500/20" },
  { icon: "🌍", title: "Globally Sourced", desc: "Ingredients handpicked from 20+ countries for authentic flavour.", color: "from-cyan-500/20 to-cyan-600/5", border: "border-cyan-500/20" },
  { icon: "✓", title: "Quality Assured", desc: "Every product rigorously tested for freshness and purity before it reaches you.", color: "from-emerald-500/20 to-emerald-600/5", border: "border-emerald-500/20" },
  { icon: "♻", title: "Eco Packaging", desc: "All orders packed in 100% recyclable, sustainably sourced materials.", color: "from-lime-500/20 to-lime-600/5", border: "border-lime-500/20" },
]

const STATS = [
  { number: 30, suffix: "+", label: "Premium Products" },
  { number: 6, suffix: "", label: "Product Categories" },
  { number: 3, suffix: "", label: "Coupons Available" },
  { number: 100, suffix: "%", label: "Quality Guarantee" },
]

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  const [adding, setAdding] = useState(false)

  const handleAdd = () => {
    setAdding(true)
    onAddToCart(product)
    setTimeout(() => setAdding(false), 800)
  }

  return (
    <div className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#C8F04B]/60 hover:shadow-md transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">🌿</div>
        )}
        {product.compare_price && (
          <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 z-10">
            SALE
          </div>
        )}
        {/* Quick add overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
          <button
            onClick={handleAdd}
            className="bg-[#C8F04B] text-black font-bold text-sm px-4 py-2 rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg"
          >
            {adding ? "✓ Added!" : "Quick Add"}
          </button>
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <p className="text-gray-400 text-xs mb-1">{product.categories?.name}</p>
        <h3 className="font-syne font-bold text-gray-900 text-sm leading-tight mb-2 truncate">{product.name}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-syne font-black text-[#5a7a00]">{formatCurrency(product.price)}</span>
            {product.compare_price && (
              <span className="text-gray-400 text-xs line-through">{formatCurrency(product.compare_price)}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="w-8 h-8 rounded-lg bg-[#C8F04B]/20 border border-[#C8F04B]/40 flex items-center justify-center text-[#5a7a00] hover:bg-[#C8F04B] hover:text-black transition-all text-lg leading-none font-bold"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  useEffect(() => {
    if (!isInView) return
    const duration = 1500
    const steps = 40
    const increment = target / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, interval)
    return () => clearInterval(timer)
  }, [isInView, target])

  return (
    <span ref={ref} className="font-syne text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent tabular-nums">
      {count}{suffix}
    </span>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("newsletter_subscribers").insert({ email })
      if (error && !error.message.includes("duplicate")) {
        toast.error("Something went wrong. Please try again.")
      } else {
        setSubmitted(true)
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="w-16 h-16 rounded-full bg-[#C8F04B]/20 border border-[#C8F04B]/30 flex items-center justify-center text-2xl">
          ✓
        </div>
        <p className="font-syne text-xl font-bold text-white">You&apos;re subscribed!</p>
        <p className="text-white/50 text-sm">Watch your inbox for great things.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        required
        className="flex-1 h-13 bg-white/[0.06] border border-white/[0.12] rounded-2xl px-5 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#C8F04B]/50 focus:bg-white/[0.08] transition-all"
        style={{ height: "52px" }}
      />
      <button
        type="submit"
        disabled={loading}
        className="h-13 bg-[#C8F04B] text-black font-bold px-7 rounded-2xl hover:scale-105 transition-all disabled:opacity-60 whitespace-nowrap shadow-[0_0_30px_rgba(200,240,75,0.25)]"
        style={{ height: "52px" }}
      >
        {loading ? "..." : "Subscribe"}
      </button>
    </form>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Homepage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeReview, setActiveReview] = useState(0)

  // Section refs for scroll reveal
  const catRef = useRef(null)
  const prodRef = useRef(null)
  const benefitsRef = useRef(null)
  const statsRef = useRef(null)
  const reviewsRef = useRef(null)
  const promoRef = useRef(null)
  const newsletterRef = useRef(null)

  const catInView = useInView(catRef, { once: true, margin: "-100px" })
  const prodInView = useInView(prodRef, { once: true, margin: "-100px" })
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-100px" })
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" })
  const reviewsInView = useInView(reviewsRef, { once: true, margin: "-100px" })
  const promoInView = useInView(promoRef, { once: true, margin: "-100px" })
  const newsletterInView = useInView(newsletterRef, { once: true, margin: "-100px" })

  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      slug: product.slug,
    })
    toast.success(`${product.name} added to cart!`)
  }

  // Fetch data from Supabase
  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order").limit(6),
      supabase.from("products").select("id,name,slug,price,compare_price,images,is_featured,categories(name)").eq("is_active", true).eq("is_featured", true).limit(8),
      supabase.from("reviews").select("id,rating,body,created_at,users(full_name)").eq("is_verified_purchase", true).limit(6),
    ]).then(([catRes, prodRes, revRes]) => {
      setCategories(catRes.data && catRes.data.length > 0 ? (catRes.data as any) : FALLBACK_CATEGORIES)
      setProducts(prodRes.data && prodRes.data.length > 0 ? (prodRes.data as any) : FALLBACK_PRODUCTS)
      setReviews(revRes.data && revRes.data.length > 0 ? (revRes.data as any) : FALLBACK_REVIEWS)
    }).catch(() => {
      setCategories(FALLBACK_CATEGORIES)
      setProducts(FALLBACK_PRODUCTS)
      setReviews(FALLBACK_REVIEWS)
    })
  }, [])

  // Auto-rotate testimonials
  const displayReviews = reviews.length > 0 ? reviews : FALLBACK_REVIEWS
  useEffect(() => {
    if (displayReviews.length === 0) return
    const timer = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % displayReviews.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [displayReviews.length])

  const displayProducts = products.length > 0 ? products : FALLBACK_PRODUCTS
  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES

  return (
    <main className="min-h-screen bg-[#060810]">

      {/* ─── SECTION 1: HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#1a2433]">
        {/* Hero background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/2.jpg')" }}
        >
          <div className="absolute inset-0 bg-[#060810]/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#C8F04B]/8 via-transparent to-transparent" />
        </div>

        {/* Animated gradient orbs on top of image */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-[#C8F04B]/10 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2, ease: "easeInOut" }}
            className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]"
          />
          <div className="absolute top-[30%] right-[30%] w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[80px]" />
        </div>

        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-[#C8F04B]/10 border border-[#C8F04B]/25 rounded-full px-4 py-1.5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8F04B] animate-pulse" />
            <span className="text-[#C8F04B] text-sm font-semibold">Premium Pantry Essentials</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: EASE }}
            className="font-syne text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight mb-6"
          >
            Stock Your Pantry
            <br />
            <span className="bg-gradient-to-r from-[#C8F04B] via-[#86EFAC] to-[#C8F04B] bg-clip-text text-transparent">
              Like a Legend.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white/50 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Premium spices, grains, oils and pantry staples sourced from around the world.
            Delivered fresh to your door.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/shop"
              className="group relative inline-flex items-center gap-2 bg-[#C8F04B] text-black font-bold text-base px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(200,240,75,0.3)]"
            >
              <span>Shop Now</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>
            <Link
              href="/shop?featured=true"
              className="inline-flex items-center gap-2 bg-white/[0.07] border border-white/[0.12] text-white font-semibold text-base px-8 py-4 rounded-2xl hover:bg-white/[0.12] transition-all backdrop-blur-sm"
            >
              Explore Collections
            </Link>
          </motion.div>

          {/* Floating product showcase */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="relative flex items-end justify-center gap-3 md:gap-5 mt-6 px-4"
          >
            {/* LEFT CARD — tilted left, lime glow */}
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0 }}
              className="relative shrink-0"
              style={{ transform: "rotate(-6deg)" }}
            >
              <Link href="/shop" className="block group">
                <div className="relative w-32 h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden border border-[#C8F04B]/25 bg-white/[0.05] backdrop-blur-sm shadow-[0_8px_40px_rgba(200,240,75,0.2)]">
                  <Image
                    src={displayProducts[0]?.images?.[0] || "https://images.unsplash.com/photo-1634900839777-df4c3c037d8a?q=80&w=400&auto=format&fit=crop"}
                    alt={displayProducts[0]?.name || "Premium Spice"}
                    fill className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="160px"
                  />
                  {/* Shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-[#C8F04B]/20 group-hover:ring-[#C8F04B]/50 transition-all duration-300" />
                  {/* Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-[#C8F04B] text-black text-[9px] font-black rounded-full px-2 py-0.5 uppercase tracking-wide">
                    Bestseller
                  </div>
                </div>
                {/* Price + name pill */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                  <div className="bg-[#060810]/95 border border-[#C8F04B]/30 rounded-xl px-3 py-1.5 text-center backdrop-blur-md shadow-lg whitespace-nowrap">
                    <p className="text-white text-[10px] font-semibold truncate max-w-[110px]">{displayProducts[0]?.name || "Himalayan Salt"}</p>
                    <p className="text-[#C8F04B] text-xs font-black">{formatCurrency(displayProducts[0]?.price || 3.49)}</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* CENTER CARD — bigger, straight, emerald glow, elevated */}
            <motion.div
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="relative shrink-0 -mt-6"
            >
              <Link href="/shop" className="block group">
                <div className="relative w-36 h-48 md:w-48 md:h-64 rounded-3xl overflow-hidden border border-emerald-400/30 bg-white/[0.05] backdrop-blur-sm shadow-[0_12px_60px_rgba(52,211,153,0.25)]">
                  <Image
                    src={displayProducts[1]?.images?.[0] || "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400&auto=format&fit=crop"}
                    alt={displayProducts[1]?.name || "Organic Grains"}
                    fill className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="200px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-emerald-400/25 group-hover:ring-emerald-400/60 transition-all duration-300" />
                  {/* Glow pulse dot */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-[9px] font-bold">In Stock</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                  <div className="bg-[#060810]/95 border border-emerald-400/30 rounded-xl px-3 py-1.5 text-center backdrop-blur-md shadow-lg whitespace-nowrap">
                    <p className="text-white text-[10px] font-semibold truncate max-w-[130px]">{displayProducts[1]?.name || "Basmati Rice"}</p>
                    <p className="text-emerald-400 text-xs font-black">{formatCurrency(displayProducts[1]?.price || 4.49)}</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* RIGHT CARD — tilted right, violet glow */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="relative shrink-0"
              style={{ transform: "rotate(6deg)" }}
            >
              <Link href="/shop" className="block group">
                <div className="relative w-32 h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden border border-violet-400/25 bg-white/[0.05] backdrop-blur-sm shadow-[0_8px_40px_rgba(167,139,250,0.2)]">
                  <Image
                    src={displayProducts[2]?.images?.[0] || "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?q=80&w=400&auto=format&fit=crop"}
                    alt={displayProducts[2]?.name || "Tri-Colour Quinoa"}
                    fill className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="160px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-violet-400/20 group-hover:ring-violet-400/50 transition-all duration-300" />
                  {/* Sale badge */}
                  <div className="absolute top-2.5 left-2.5 bg-violet-500 text-white text-[9px] font-black rounded-full px-2 py-0.5 uppercase tracking-wide">
                    New
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="bg-[#060810]/95 border border-violet-400/30 rounded-xl px-3 py-1.5 text-center backdrop-blur-md shadow-lg whitespace-nowrap">
                    <p className="text-white text-[10px] font-semibold truncate max-w-[110px]">{displayProducts[2]?.name || "Tri-Colour Quinoa"}</p>
                    <p className="text-violet-400 text-xs font-black">{formatCurrency(displayProducts[2]?.price || 5.49)}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>

      {/* ─── SECTION 2: MARQUEE TICKER ──────────────────────────────────── */}
      <section className="relative mt-6 py-3 bg-[#C8F04B] overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap items-center">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex shrink-0 items-center">
              {/* Logo: leaf */}
              <span className="inline-flex items-center mx-6 gap-1.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                <span className="font-black text-xs tracking-widest text-black uppercase">PantryLegend</span>
              </span>
              <span className="text-black/30 mx-2">◆</span>
              <span className="inline-block mx-6 text-black font-bold text-sm tracking-wide">Free Delivery Over £50</span>
              <span className="text-black/30 mx-2">◆</span>
              {/* Logo: Twinings-style */}
              <span className="inline-flex items-center mx-6 gap-1.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="black"><path d="M17 8C8 10 5.9 16.17 3.82 22H5.5c.74-1.9 1.66-3.77 3-5.27C10.24 18.5 12 20 12 20s1.76-1.5 3.5-3.27c1.34 1.5 2.26 3.37 3 5.27h1.68C18.1 16.17 16 10 17 8z"/></svg>
                <span className="font-black text-xs tracking-widest text-black uppercase">Twinings</span>
              </span>
              <span className="text-black/30 mx-2">◆</span>
              <span className="inline-block mx-6 text-black font-bold text-sm tracking-wide">🌍 Globally Sourced</span>
              <span className="text-black/30 mx-2">◆</span>
              {/* Logo: Maldon-style */}
              <span className="inline-flex items-center mx-6 gap-1.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span className="font-black text-xs tracking-widest text-black uppercase">Maldon</span>
              </span>
              <span className="text-black/30 mx-2">◆</span>
              <span className="inline-block mx-6 text-black font-bold text-sm tracking-wide">⭐ Quality Guaranteed</span>
              <span className="text-black/30 mx-2">◆</span>
              {/* Logo: Clipper-style */}
              <span className="inline-flex items-center mx-6 gap-1.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                <span className="font-black text-xs tracking-widest text-black uppercase">Clipper</span>
              </span>
              <span className="text-black/30 mx-2">◆</span>
              <span className="inline-block mx-6 text-black font-bold text-sm tracking-wide">🚀 Next Day Delivery</span>
              <span className="text-black/30 mx-2">◆</span>
              {/* Logo: Quaker-style */}
              <span className="inline-flex items-center mx-6 gap-1.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>
                <span className="font-black text-xs tracking-widest text-black uppercase">Quaker</span>
              </span>
              <span className="text-black/30 mx-2">◆</span>
              <span className="inline-block mx-6 text-black font-bold text-sm tracking-wide">🌱 Sustainably Packaged</span>
              <span className="text-black/30 mx-2">◆</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 3: FEATURED CATEGORIES ────────────────────────────── */}
      <section ref={catRef} className="relative py-24 px-6 overflow-hidden bg-[#0f1923]">
        <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={catInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-[#5a7a00]" />
            <span className="text-[#5a7a00] text-sm font-semibold uppercase tracking-widest">Categories</span>
          </div>
          <h2 className="font-syne text-4xl md:text-5xl font-black text-white mb-4">
            Shop by Category
          </h2>
          <p className="text-white/50 text-lg max-w-lg">
            From aromatic spices to wholesome grains — everything your pantry needs.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          variants={container}
          initial="hidden"
          animate={catInView ? "show" : "hidden"}
        >
          {displayCategories.map((cat) => (
            <motion.div key={cat.id} variants={item}>
              <Link
                href={`/shop?category=${cat.slug}`}
                className="group relative block overflow-hidden rounded-3xl aspect-[4/3] bg-white/[0.04]"
              >
                {cat.image_url && (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Hover shimmer */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#C8F04B]/0 to-[#C8F04B]/0 group-hover:from-[#C8F04B]/10 group-hover:to-transparent transition-all duration-500" />
                {/* Content */}
                <div className="absolute bottom-0 left-0 p-5">
                  <h3 className="font-syne text-xl font-bold text-white">{cat.name}</h3>
                  <p className="text-white/60 text-sm mt-1 group-hover:text-[#C8F04B] transition-colors">
                    Explore →
                  </p>
                </div>
                {/* Corner badge */}
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Shop Now
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        </div>
      </section>

      {/* ─── SECTION 4: FEATURED PRODUCTS ───────────────────────────────── */}
      <section ref={prodRef} className="relative py-24 overflow-hidden bg-[#111c27]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={prodInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-12 bg-[#5a7a00]" />
                <span className="text-[#5a7a00] text-sm font-semibold uppercase tracking-widest">Featured</span>
              </div>
              <h2 className="font-syne text-4xl md:text-5xl font-black text-white">
                Staff Picks
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium"
            >
              View All <span>→</span>
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={container}
            initial="hidden"
            animate={prodInView ? "show" : "hidden"}
          >
            {displayProducts.slice(0, 8).map((product) => (
              <motion.div key={product.id} variants={item}>
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 flex justify-center md:hidden">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-gray-900 border border-gray-900 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-700 transition-all"
            >
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: BENEFITS / WHY US ──────────────────────────────── */}
      <section ref={benefitsRef} className="relative isolate py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src="/d.jpg" alt="" fill className="object-cover object-center" />
          <div className="absolute inset-0 bg-[#060810]/50" />
        </div>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#C8F04B]" />
              <span className="text-[#C8F04B] text-sm font-semibold uppercase tracking-widest">Why Choose Us</span>
              <div className="h-px w-12 bg-[#C8F04B]" />
            </div>
            <h2 className="font-syne text-4xl md:text-5xl font-black text-white mb-4">
              Built Around Quality
            </h2>
            <p className="text-white/50 text-lg max-w-lg mx-auto">
              Every decision we make starts and ends with your experience.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={container}
            initial="hidden"
            animate={benefitsInView ? "show" : "hidden"}
          >
            {BENEFITS.map((benefit) => (
              <motion.div
                key={benefit.title}
                variants={item}
                className={`relative bg-gradient-to-br ${benefit.color} border ${benefit.border} rounded-2xl p-6 backdrop-blur-sm overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
              >
                <div className="text-3xl mb-4">{benefit.icon}</div>
                <h3 className="font-syne text-lg font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{benefit.desc}</p>
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION 6: ANIMATED STATS COUNTER ─────────────────────────── */}
      <section ref={statsRef} className="relative py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#C8F04B]" />
              <span className="text-[#C8F04B] text-sm font-semibold uppercase tracking-widest">The Numbers</span>
              <div className="h-px w-12 bg-[#C8F04B]" />
            </div>
            <h2 className="font-syne text-4xl md:text-5xl font-black text-white">
              Why Legends Choose Us
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className={`flex flex-col items-center text-center py-10 px-6 ${i < STATS.length - 1 ? "border-r border-white/[0.06]" : ""} ${i >= 2 ? "border-t border-white/[0.06] lg:border-t-0" : ""}`}
              >
                {statsInView && <CountUp target={stat.number} suffix={stat.suffix} />}
                <p className="text-white/50 text-sm font-medium mt-3 uppercase tracking-wider">{stat.label}</p>
                <div className="w-8 h-px bg-[#C8F04B]/40 mt-4" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: TESTIMONIALS ────────────────────────────────────── */}
      <section ref={reviewsRef} className="relative isolate py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src="/5 (2).jpg" alt="" fill className="object-cover object-center" />
          <div className="absolute inset-0 bg-[#060810]/50" />
        </div>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={reviewsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#C8F04B]" />
              <span className="text-[#C8F04B] text-sm font-semibold uppercase tracking-widest">Testimonials</span>
              <div className="h-px w-12 bg-[#C8F04B]" />
            </div>
            <h2 className="font-syne text-4xl md:text-5xl font-black text-white mb-4">
              Legends Love It
            </h2>
            <p className="text-white/50 text-lg">
              Don&apos;t just take our word for it.
            </p>
          </motion.div>

          {/* Auto-rotating testimonial */}
          <div className="max-w-3xl mx-auto">
            <div className="relative min-h-[280px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeReview}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 md:p-12 backdrop-blur-xl text-center"
                >
                  {/* Stars */}
                  <div className="flex justify-center gap-1 mb-6">
                    {[...Array(displayReviews[activeReview]?.rating || 5)].map((_, i) => (
                      <span key={i} className="text-[#C8F04B] text-xl">★</span>
                    ))}
                  </div>
                  {/* Quote mark */}
                  <div className="text-[#C8F04B]/20 text-8xl font-serif leading-none mb-2 select-none">&ldquo;</div>
                  <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-8 -mt-6">
                    {displayReviews[activeReview]?.body}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8F04B]/30 to-emerald-500/20 border border-white/10 flex items-center justify-center text-white font-syne font-bold text-sm">
                      {displayReviews[activeReview]?.users?.full_name?.charAt(0) || "?"}
                    </div>
                    <span className="font-syne font-bold text-white">
                      {displayReviews[activeReview]?.users?.full_name || "Verified Customer"}
                    </span>
                    <span className="text-white/30 text-sm">· Verified Purchase</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots indicator */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {displayReviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveReview(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === activeReview
                      ? "w-8 h-2 bg-[#C8F04B]"
                      : "w-2 h-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            {/* All reviews grid below (visible when more than 1) */}
            {displayReviews.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={reviewsInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {displayReviews.map((review, i) => (
                  <button
                    key={review.id}
                    onClick={() => setActiveReview(i)}
                    className={`text-left p-5 rounded-2xl border transition-all duration-300 ${
                      i === activeReview
                        ? "bg-[#C8F04B]/10 border-[#C8F04B]/30"
                        : "bg-white/[0.03] border-white/[0.07] hover:border-white/20"
                    }`}
                  >
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(review.rating)].map((_, j) => (
                        <span key={j} className="text-[#C8F04B] text-xs">★</span>
                      ))}
                    </div>
                    <p className="text-white/70 text-xs leading-relaxed line-clamp-3">{review.body}</p>
                    <p className="text-white/40 text-xs mt-2 font-semibold">{review.users?.full_name}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ─── SECTION 8: PROMO BANNER ────────────────────────────────────── */}
      <section ref={promoRef} className="relative py-20 overflow-hidden">
        {/* Lime accent glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#C8F04B]/8 via-transparent to-emerald-500/5" />
        <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-[#C8F04B]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={promoInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex-1"
          >
            <div className="inline-flex items-center gap-2 bg-[#C8F04B]/10 border border-[#C8F04B]/20 rounded-full px-4 py-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8F04B] animate-pulse" />
              <span className="text-[#C8F04B] text-sm font-bold">Limited Time Offer</span>
            </div>
            <h2 className="font-syne text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Use code{" "}
              <span className="bg-gradient-to-r from-[#C8F04B] to-[#86EFAC] bg-clip-text text-transparent">
                WELCOME10
              </span>
              <br />
              for 10% off your first order
            </h2>
            <p className="text-white/50 text-lg mb-8">
              Discover our full range of premium pantry essentials and taste the difference.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#C8F04B] text-black font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(200,240,75,0.3)]"
            >
              Claim Offer →
            </Link>
          </motion.div>

          {/* Decorative product mosaic */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={promoInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            className="grid grid-cols-3 gap-2 opacity-70 shrink-0"
          >
            {displayProducts.slice(0, 6).map((p, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                {p.images?.[0] && (
                  <Image src={p.images[0]} alt="" fill className="object-cover" sizes="80px" />
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION 9: NEWSLETTER ──────────────────────────────────────── */}
      <section ref={newsletterRef} className="relative isolate py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src="/1.jpg" alt="" fill className="object-cover object-center" />
          <div className="absolute inset-0 bg-[#060810]/50" />
        </div>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={newsletterInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={newsletterInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
              className="w-20 h-20 rounded-2xl bg-[#C8F04B]/10 border border-[#C8F04B]/20 flex items-center justify-center text-3xl mx-auto mb-6"
            >
              ✉️
            </motion.div>

            <h2 className="font-syne text-4xl md:text-5xl font-black text-white mb-4">
              Stay in the Loop
            </h2>
            <p className="text-white/50 text-lg mb-8 leading-relaxed">
              Get weekly recipes, new arrivals, and exclusive offers straight to your inbox.
              No spam, ever.
            </p>

            <NewsletterForm />

            <p className="text-white/25 text-xs mt-4">
              By subscribing you agree to our privacy policy. Unsubscribe anytime.
            </p>
          </motion.div>

          {/* Trust badges below newsletter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={newsletterInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex items-center justify-center gap-6 mt-12 flex-wrap"
          >
            {["🔒 Secure Checkout", "🚀 Fast Delivery", "💚 Freshness Promise"].map((badge) => (
              <span key={badge} className="text-white/30 text-xs font-medium">{badge}</span>
            ))}
          </motion.div>
        </div>
      </section>

    </main>
  )
}
