import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/store/ProductCard";
import { CategoryPills } from "@/components/store/CategoryPills";
import { ShopFiltersBar } from "@/components/store/ShopFiltersBar";
import { HeroSection } from "@/components/store/HeroSection";
import { FeaturedCategories } from "@/components/store/FeaturedCategories";
import { Package } from "lucide-react";

export const revalidate = 60;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string; q?: string; view?: string };
}) {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .eq("is_active", true)
    .order("sort_order");

  let categoryId: string | null = null;
  if (searchParams.category && searchParams.category !== "all") {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", searchParams.category)
      .single();
    categoryId = cat?.id ?? null;
  }

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, price, compare_price, images, stock_quantity, is_featured, is_active, category_id, unit, categories(name, slug)"
    )
    .eq("is_active", true);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);

  switch (searchParams.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
  }

  const { data: products } = await query.limit(48);

  const allCategories = categories || [];
  const allProducts = products || [];
  const isFiltered = !!searchParams.category || !!searchParams.q;
  const isCollectionsView = searchParams.view === "collections";
  const activeCategory = allCategories.find(
    (c) => c.slug === searchParams.category
  );

  // ── Collections view — editorial layout, no category section ─────────────────
  if (isCollectionsView) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Hero banner — different image & layout */}
        <div className="relative h-[50vh] min-h-[340px] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1920&auto=format&fit=crop"
            alt="Collections"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0a0a0a]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span className="mb-3 inline-block rounded-full border border-[#C8F04B]/30 bg-[#C8F04B]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#C8F04B]">
              All Collections
            </span>
            <h1 className="font-syne text-4xl font-black text-white md:text-6xl">
              Browse Everything
            </h1>
            <p className="mt-3 max-w-lg text-white/60 text-sm md:text-base">
              Every product we carry — handpicked, quality-tested, delivered to your door.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors underline underline-offset-4"
            >
              ← Browse by category instead
            </Link>
          </div>
        </div>

        {/* Filters bar only (no category pills) */}
        <section className="container mx-auto px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-white/40">{allProducts.length} products</p>
            <ShopFiltersBar activeSort={searchParams.sort} />
          </div>

          {allProducts.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 text-center">
              <Package className="h-12 w-12 text-white/20" />
              <p className="font-syne text-2xl font-bold text-white">No products found</p>
              <Link
                href="/shop?view=collections"
                className="mt-2 inline-flex h-11 items-center rounded-xl bg-[#C8F04B] px-6 text-sm font-bold text-black"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {allProducts.map((product, index) => (
                <ProductCard key={product.id} product={product as any} index={index} />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Standard shop view ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060810] relative">
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1920&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-[#060810]/82" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060810]/30 via-transparent to-[#060810]/60" />
      </div>

      {!isFiltered && (
        <>
          <HeroSection />
          <FeaturedCategories categories={allCategories} />
        </>
      )}

      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-syne text-3xl font-black text-white md:text-4xl">
              {activeCategory?.name ??
                (searchParams.q ? (
                  <>
                    Results for{" "}
                    <span className="text-[#C8F04B]">
                      &ldquo;{searchParams.q}&rdquo;
                    </span>
                  </>
                ) : (
                  <>
                    All <span className="text-[#C8F04B]">Products</span>
                  </>
                ))}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              {allProducts.length} products available
            </p>
          </div>
          {searchParams.q && (
            <Link
              href="/shop"
              prefetch={true}
              className="text-sm text-white/50 hover:text-white transition-colors underline underline-offset-2"
            >
              Clear search
            </Link>
          )}
        </div>

        <CategoryPills
          categories={allCategories}
          activeCategory={searchParams.category}
        />
        <ShopFiltersBar activeSort={searchParams.sort} />

        {allProducts.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <Package className="h-10 w-10 text-white/25" />
            </div>
            <div>
              <p className="font-syne text-2xl font-bold text-white">
                No products found
              </p>
              <p className="mt-2 text-white/50">
                Try adjusting your filters or search query.
              </p>
            </div>
            <Link
              href="/shop"
              prefetch={true}
              className="mt-2 inline-flex h-11 items-center rounded-xl bg-[#C8F04B] px-6 text-sm font-bold text-black hover:scale-105 transition-transform shadow-[0_0_30px_rgba(200,240,75,0.25)]"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {allProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product as any}
                index={index}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
