"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  CheckCircle,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InventoryAdjustModal } from "@/components/dashboard/InventoryAdjustModal";

type Product = {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  is_active: boolean;
  categories: { name: string } | null;
};

type InventoryLog = {
  id: string;
  product_id: string;
  change_amount: number;
  reason: string;
  notes?: string;
  created_at: string;
  products: { name: string } | null;
  users: { full_name: string } | null;
};

type StockFilter = "all" | "low" | "out" | "well";

export default function InventoryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stock" | "history">("stock");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [logSearch, setLogSearch] = useState("");
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: p }, { data: l }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, sku, stock_quantity, low_stock_threshold, unit, is_active, categories(name)")
        .order("stock_quantity", { ascending: true }),
      supabase
        .from("inventory_logs")
        .select("*, products(name), users(full_name)")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setProducts((p as unknown as Product[]) ?? []);
    setLogs((l as unknown as InventoryLog[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalProducts = products.length;
  const inStock = products.filter(
    (p) => p.stock_quantity > (p.low_stock_threshold ?? 5)
  ).length;
  const lowStock = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold ?? 5)
  ).length;
  const outOfStock = products.filter((p) => p.stock_quantity === 0).length;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (stockFilter === "low") return p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold ?? 5);
      if (stockFilter === "out") return p.stock_quantity === 0;
      if (stockFilter === "well") return p.stock_quantity > (p.low_stock_threshold ?? 5);
      return true;
    });
  }, [products, stockFilter]);

  const filteredLogs = useMemo(() => {
    if (!logSearch) return logs;
    const q = logSearch.toLowerCase();
    return logs.filter((l) => l.products?.name?.toLowerCase().includes(q));
  }, [logs, logSearch]);

  const getStockStatus = (p: Product): "in_stock" | "low" | "out" => {
    if (p.stock_quantity === 0) return "out";
    if (p.stock_quantity <= (p.low_stock_threshold ?? 5)) return "low";
    return "in_stock";
  };

  const getStockColor = (p: Product) => {
    const s = getStockStatus(p);
    if (s === "out") return "text-red-400";
    if (s === "low") return "text-amber-400";
    return "text-green-400";
  };

  const summaryCards = [
    { label: "Total Products", value: totalProducts, icon: Package, color: "#C8F04B" },
    { label: "In Stock", value: inStock, icon: CheckCircle, color: "#6EE7B7" },
    { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: "#FCD34D" },
    { label: "Out of Stock", value: outOfStock, icon: TrendingDown, color: "#FCA5A5" },
  ];

  const tabs: { key: "stock" | "history"; label: string }[] = [
    { key: "stock", label: "Stock Levels" },
    { key: "history", label: "Adjustment History" },
  ];

  const FILTERS: { key: StockFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "low", label: "Low Stock" },
    { key: "out", label: "Out of Stock" },
    { key: "well", label: "Well Stocked" },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne text-3xl font-bold text-white">Inventory</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">Monitor and adjust product stock levels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[#A0A0A0]">{card.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.color + "20" }}>
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-[#1A1A1A] rounded animate-pulse" />
            ) : (
              <p className="font-syne text-3xl font-bold text-white">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1E1E1E]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2 px-4 text-sm transition-colors ${
              activeTab === t.key
                ? "border-b-2 border-[#C8F04B] text-[#C8F04B] font-semibold"
                : "text-[#555] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stock Levels Tab */}
      {activeTab === "stock" && (
        <div>
          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-4">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStockFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  stockFilter === f.key
                    ? "bg-[#C8F04B] text-black font-semibold"
                    : "border border-[#2A2A2A] text-[#A0A0A0] hover:border-[#444]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#161616] text-[11px] text-[#666] uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">SKU</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Stock</th>
                  <th className="px-6 py-3 text-left">Threshold</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1A1A1A]">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-[#1A1A1A] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title="No products found"
                        description="No products match the current filter"
                        icon={Package}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="border-b border-[#1A1A1A] hover:bg-[#161616] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white text-sm">{p.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[#555] text-xs">{p.sku}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                        {p.categories?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-sm ${getStockColor(p)}`}>
                          {p.stock_quantity} {p.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                        {p.low_stock_threshold ?? 5} {p.unit}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={getStockStatus(p)} type="stock" />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setAdjustProduct(p)}
                          className="bg-[#C8F04B] text-black rounded-full px-4 py-1.5 font-semibold text-xs hover:scale-[1.02] transition-all"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment History Tab */}
      {activeTab === "history" && (
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              placeholder="Search by product name..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full max-w-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] pl-10 pr-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
            />
          </div>

          <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#161616] text-[11px] text-[#666] uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Change</th>
                  <th className="px-6 py-3 text-left">Reason</th>
                  <th className="px-6 py-3 text-left">Staff</th>
                  <th className="px-6 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1A1A1A]">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-[#1A1A1A] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title="No adjustment history"
                        description="Stock adjustments will appear here"
                        icon={Package}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[#1A1A1A] hover:bg-[#161616] transition-colors">
                      <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {log.products?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold text-sm ${
                            log.change_amount > 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {log.change_amount > 0 ? "+" : ""}
                          {log.change_amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#A0A0A0] capitalize">
                        {log.reason}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                        {log.users?.full_name ?? "System"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#555]">
                        {log.notes ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      <InventoryAdjustModal
        product={adjustProduct}
        onClose={() => setAdjustProduct(null)}
        onSuccess={() => {
          setAdjustProduct(null);
          fetchData();
          router.refresh();
        }}
      />
    </div>
  );
}
