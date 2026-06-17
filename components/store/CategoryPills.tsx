"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function CategoryPills({ categories, activeCategory }: { categories: Category[]; activeCategory?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => handleClick()}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-medium transition-all",
          !activeCategory
            ? "bg-[#C8F04B] text-black font-bold"
            : "bg-white/[0.06] border border-white/[0.1] text-white/60 hover:bg-white/[0.1] hover:text-white"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.slug)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all",
            activeCategory === cat.slug
              ? "bg-[#C8F04B] text-black font-bold"
              : "bg-white/[0.06] border border-white/[0.1] text-white/60 hover:bg-white/[0.1] hover:text-white"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
