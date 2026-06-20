import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/ProductCard";
import { CategoryPills } from "@/components/store/CategoryPills";
import { ShopFiltersBar } from "@/components/store/ShopFiltersBar";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { category: string };
  searchParams: { sort?: string; q?: string };
}

const FALLBACK_IMAGES: Record<string, string> = {
  "candy-treats": "https://images.pexels.com/photos/16365469/pexels-photo-16365469.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "snacks-nuts": "https://images.pexels.com/photos/18153178/pexels-photo-18153178.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "beverages": "https://images.pexels.com/photos/32354655/pexels-photo-32354655.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "spreads-condiments": "https://images.pexels.com/photos/6659901/pexels-photo-6659901.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "baking-essentials": "https://images.pexels.com/photos/5441079/pexels-photo-5441079.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "household": "https://images.pexels.com/photos/5217897/pexels-photo-5217897.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "pet-supplies": "https://images.pexels.com/photos/8121154/pexels-photo-8121154.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "electronics": "https://images.pexels.com/photos/5208781/pexels-photo-5208781.jpeg?auto=compress&cs=tinysrgb&w=1600",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: cat } = await supabase.from("categories").select("name, description").eq("slug", params.category).single();
  return {
    title: cat ? `${cat.name} | Vinzlu` : "Shop | Vinzlu",
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
