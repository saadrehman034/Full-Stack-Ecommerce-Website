import { createClient, createStaticClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/ProductCard";
import { CategoryPills } from "@/components/store/CategoryPills";
import { ShopFiltersBar } from "@/components/store/ShopFiltersBar";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase.from("categories").select("slug").eq("is_active", true);
  return data?.map(c => ({ category: c.slug })) ?? [];
}

export const revalidate = 60;

interface PageProps {
  params: { category: string };
  searchParams: { sort?: string; q?: string };
}

const FALLBACK_IMAGES: Record<string, string> = {
  "candy-treats": "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?q=80&w=1600&auto=format&fit=crop",
  "snacks-nuts": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1600&auto=format&fit=crop",
  "beverages": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1600&auto=format&fit=crop",
  "spreads-condiments": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?q=80&w=1600&auto=format&fit=crop",
  "baking-essentials": "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?q=80&w=1600&auto=format&fit=crop",
  "household": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1600&auto=format&fit=crop",
  "pet-supplies": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=1600&auto=format&fit=crop",
  "electronics": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=1600&auto=format&fit=crop",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: cat } = await supabase.from("categories").select("name, description").eq("slug", params.category).single();
  return {
    title: cat ? `${cat.name} | PantryLegend` : "Shop | PantryLegend",
    description: cat?.description || "Premium pantry products.",
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.category)
    .eq("is_active", true)
    .single();

  if (!category) notFound();

  let query = supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("category_id", category.id)
    .eq("is_active", true);

  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);

  switch (searchParams.sort) {
    case "price_asc": query = query.order("price", { ascending: true }); break;
    case "price_desc": query = query.order("price", { ascending: false }); break;
    default: query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data: products } = await query.limit(48);
  const { data: allCategories } = await supabase.from("categories").select("id, name, slug, image_url").eq("is_active", true).order("sort_order");

  const heroImg = category.image_url || FALLBACK_IMAGES[params.category] || FALLBACK_IMAGES["spices-herbs"];

  return (
    <div className="min-h-screen bg-background">
      {/* Category hero */}
      <div className="relative h-[40vh] min-h-[280px] overflow-hidden">
        <Image src={heroImg} alt={category.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Category</p>
            <h1 className="mt-1 font-syne text-4xl font-extrabold text-white md:text-6xl">{category.name}</h1>
            {category.description && (
              <p className="mt-2 max-w-lg text-base text-white/70">{category.description}</p>
            )}
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{products?.length || 0} products</span>
        </div>

        <CategoryPills categories={allCategories || []} activeCategory={params.category} />
        <ShopFiltersBar activeSort={searchParams.sort} />

        {!products?.length ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-2xl font-semibold">No products in this category yet.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product as any} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
