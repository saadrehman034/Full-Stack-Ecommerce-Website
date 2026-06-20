import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { ProductCard } from "@/components/store/ProductCard";
import type { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const { createStaticClient } = await import("@/lib/supabase/server");
  const supabase = createStaticClient();
  const { data } = await supabase.from("products").select("slug").eq("is_active", true);
  return data?.map(p => ({ slug: p.slug })) ?? [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { createStaticClient } = await import("@/lib/supabase/server");
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", params.slug)
    .single();

  if (!data) return { title: "Product Not Found | Vinzlu" };
  return {
    title: `${data.name} | Vinzlu`,
    description: data.description || `Buy ${data.name} at Vinzlu`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, categories(name, slug), product_variants(*), reviews(rating, body, created_at, reviewer_name, users(full_name))")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (error || !product) notFound();

  const { data: related } = product.category_id
    ? await supabase
        .from("products")
        .select("id, name, slug, price, compare_price, images, stock_quantity, is_featured, is_active, category_id, unit, categories(name, slug)")
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

      <ProductDetailClient product={product as any} />

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
