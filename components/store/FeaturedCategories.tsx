"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const CATEGORY_IMAGES: Record<string, string> = {
  "spices-herbs": "https://images.unsplash.com/photo-1506617564039-2f3b650b7010?q=80&w=600&auto=format&fit=crop",
  "grains-pulses": "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600&auto=format&fit=crop",
  "oils-vinegars": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600&auto=format&fit=crop",
  "snacks-nuts": "https://images.unsplash.com/photo-1545987796-200677ee1011?q=80&w=600&auto=format&fit=crop",
  "beverages": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop",
  "baking-essentials": "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?q=80&w=600&auto=format&fit=crop",
};

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
}

export function FeaturedCategories({ categories }: { categories: Category[] }) {
  return (
    <section className="bg-background py-20 px-4">
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <h2 className="font-syne text-4xl font-bold md:text-5xl">
            Shop by Category
          </h2>
          <p className="mt-3 text-muted-foreground">
            Explore our curated selection of premium pantry staples.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              whileHover={{ y: -6 }}
            >
              <Link
                href={`/shop?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl bg-muted/40 p-4 text-center transition-colors hover:bg-primary/5"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-border transition-all group-hover:ring-primary">
                  <Image
                    src={cat.image_url || CATEGORY_IMAGES[cat.slug] || CATEGORY_IMAGES["spices-herbs"]}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <span className="font-syne text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
