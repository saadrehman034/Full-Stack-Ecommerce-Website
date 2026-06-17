"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, Check, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

type Product = { id: string; name: string; sku: string; stock_quantity: number; low_stock_threshold: number; unit: string; is_active: boolean };
type Log = { id: string; change_amount: number; reason: string; created_at: string; products: { name: string } | null; users: { full_name: string } | null };

const REASONS = ["restock", "correction", "damage", "return", "sale"];

export function AdminInventoryClient({ products, logs }: { products: Product[]; logs: Log[] }) {
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("restock");
  const [tab, setTab] = useState<"stock" | "logs">("stock");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const saveAdjustment = async () => {
    if (!adjustProduct || !amount) return;
    const change = parseInt(amount);
    if (isNaN(change)) { toast.error("Enter a valid number"); return; }
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("products").update({
      stock_quantity: Math.max(0, adjustProduct.stock_quantity + change),
    }).eq("id", adjustProduct.id);

    await supabase.from("inventory_logs").insert({
      product_id: adjustProduct.id,
      change_amount: change,
      reason,
      staff_id: user?.id,
    });

    toast.success(`Stock adjusted for ${adjustProduct.name}`);
    setAdjustProduct(null);
    setAmount("");
    router.refresh();
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setTab("stock")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === "stock" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          Stock Levels
        </button>
        <button onClick={() => setTab("logs")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === "logs" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <History className="h-3.5 w-3.5" /> Log History
        </button>
      </div>

      {tab === "stock" && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {["Product", "SKU", "Stock", "Threshold", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const status = p.stock_quantity <= 0 ? "out" : p.stock_quantity <= p.low_stock_threshold ? "low" : "ok";
                return (
                  <tr key={p.id} className="border-b border-border/20 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-3 font-bold">{p.stock_quantity} {p.unit}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.low_stock_threshold}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status === "out" ? "bg-red-100 text-red-700" : status === "low" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {status === "out" ? "Out of Stock" : status === "low" ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setAdjustProduct(p); setAmount(""); setReason("restock"); }}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "logs" && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {["Date", "Product", "Change", "Reason", "Staff"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border/20 hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(l.created_at)}</td>
                  <td className="px-4 py-3 font-medium">{l.products?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${l.change_amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {l.change_amount > 0 ? "+" : ""}{l.change_amount}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{l.reason}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.users?.full_name || "System"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust modal */}
      <AnimatePresence>
        {adjustProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:bg-[#111]">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-syne text-xl font-bold">Adjust Stock</h2>
                <button onClick={() => setAdjustProduct(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">{adjustProduct.name}</p>
                  <p className="text-sm text-muted-foreground">Current stock: {adjustProduct.stock_quantity} {adjustProduct.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Change Amount (+ to add, - to remove)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="+50 or -10"
                    className="mt-1.5 h-11 w-full rounded-xl border border-border px-4 text-base font-bold outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <select value={reason} onChange={e => setReason(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-border px-4 text-sm outline-none focus:ring-2 focus:ring-ring capitalize">
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button onClick={saveAdjustment} disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save Adjustment</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
