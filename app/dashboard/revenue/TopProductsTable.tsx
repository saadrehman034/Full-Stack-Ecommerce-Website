"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  revenue: number;
  units: number;
}

type SortKey = "revenue" | "units";

export function TopProductsTable({
  products,
  totalRevenue,
}: {
  products: Product[];
  totalRevenue: number;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...products].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === "desc" ? -diff : diff;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown className="h-3.5 w-3.5 text-[#555]" />;
    return sortDir === "desc" ? (
      <ChevronDown className="h-3.5 w-3.5 text-[#C8F04B]" />
    ) : (
      <ChevronUp className="h-3.5 w-3.5 text-[#C8F04B]" />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1A1A1A]">
            <th className="text-left text-[10px] uppercase tracking-widest text-[#555] pb-3 pr-4 font-medium w-8">
              #
            </th>
            <th className="text-left text-[10px] uppercase tracking-widest text-[#555] pb-3 pr-4 font-medium">
              Product
            </th>
            <th className="text-left text-[10px] uppercase tracking-widest text-[#555] pb-3 pr-4 font-medium">
              SKU
            </th>
            <th
              className="text-right text-[10px] uppercase tracking-widest text-[#555] pb-3 pr-4 font-medium cursor-pointer select-none hover:text-[#A0A0A0] transition-colors"
              onClick={() => handleSort("units")}
            >
              <span className="flex items-center justify-end gap-1">
                Units Sold
                <SortIcon col="units" />
              </span>
            </th>
            <th
              className="text-right text-[10px] uppercase tracking-widest text-[#555] pb-3 pr-4 font-medium cursor-pointer select-none hover:text-[#A0A0A0] transition-colors"
              onClick={() => handleSort("revenue")}
            >
              <span className="flex items-center justify-end gap-1">
                Revenue
                <SortIcon col="revenue" />
              </span>
            </th>
            <th className="text-right text-[10px] uppercase tracking-widest text-[#555] pb-3 font-medium">
              % of Total
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const pct = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
            return (
              <tr
                key={p.id}
                className="border-b border-[#0F0F0F] hover:bg-[#0F0F0F] transition-colors group"
              >
                <td className="py-3 pr-4">
                  <span className="text-[#555] text-sm">{i + 1}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-white text-sm group-hover:text-[#C8F04B] transition-colors">
                    {p.name}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[#555] text-xs font-mono">{p.sku}</span>
                </td>
                <td className="py-3 pr-4 text-right">
                  <span className="text-[#A0A0A0] text-sm">{p.units.toLocaleString()}</span>
                </td>
                <td className="py-3 pr-4 text-right">
                  <span className="text-white text-sm font-semibold">{formatCurrency(p.revenue)}</span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C8F04B] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[#A0A0A0] text-xs w-10 text-right">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
