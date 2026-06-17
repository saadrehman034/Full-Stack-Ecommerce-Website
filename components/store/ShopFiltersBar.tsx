"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

const SORT_OPTIONS = [
  { label: "Featured", value: "" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
];

export function ShopFiltersBar({ activeSort }: { activeSort?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <ArrowUpDown className="h-4 w-4 text-white/25 shrink-0" />
        <span className="text-sm text-white/50">Sort by:</span>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSort(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                (activeSort ?? "") === opt.value
                  ? "bg-[#C8F04B] text-black font-bold"
                  : "text-white/50 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
