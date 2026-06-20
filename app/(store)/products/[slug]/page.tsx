import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { ProductCard } from "@/components/store/ProductCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("name, description")
      .eq("slug", params.slug)
      .single();
    if (!data) return { title: "Product | Vinzlu" };
    return {
      title: `${data.name} | Vinzlu`,
      description: data.description || `Buy ${data.name} at Vinzlu`,
    };
  } catch {
    return { title: "Product | Vinzlu" };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (error) console.error("Product fetch error:", error.message, error.details);
  if (!product) notFound();

  // Fetch reviews separately so a missing table doesn't break the page
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, body, created_at, users(full_name)")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const productWithReviews = { ...product, reviews: reviews ?? [], product_variants: [] };

  const { data: related } = product.category_id
    ? await supabase
        .from("products")
        .select("id, name, slug, price, compare_price, images, stock_quantity, is_featured, is_active, category_id, unit, categories(name, slug), reviews(rating)")
        .eq("category_id", product.category_id)
        .eq("is_active", true)
        .neq("id", product.id)
        .limit(4)
    : { data: [] };

  return (
    <div className="min-h-screen bg-[#060810] relative">
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=1920&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-[#060810]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060810]/30 via-transparent to-[#060810]/70" />
      </div>

      <ProductDetailClient product={productWithReviews as any} />

      {related && related.length > 0 && (
        <section className="container mx-auto px-4 py-20">
          <h2 className="mb-8 font-syne text-3xl font-black text-white">
            You May <span className="text-[#C8F04B]">Also Like</span>
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p as any} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
