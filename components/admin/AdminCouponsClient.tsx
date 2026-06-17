"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, X, Loader2, Check, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Coupon {
  id: string; code: string; type: "percentage" | "fixed"; value: number;
  min_order_amount: number; max_discount_amount: number | null;
  usage_limit: number | null; used_count: number; is_active: boolean;
  expires_at: string | null;
}

export function AdminCouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showAdd, setShowAdd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    code: "", type: "percentage", value: "", min_order: "", limit: "", expires: "",
  });
  const router = useRouter();

  const save = async () => {
    if (!form.code || !form.value) { toast.error("Code and value are required"); return; }
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("coupons").insert({
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      min_order_amount: parseFloat(form.min_order) || 0,
      usage_limit: form.limit ? parseInt(form.limit) : null,
      expires_at: form.expires || null,
      is_active: true,
    });
    if (error) { toast.error(error.message); } else {
      toast.success("Coupon created!");
      setShowAdd(false);
      setForm({ code: "", type: "percentage", value: "", min_order: "", limit: "", expires: "" });
      router.refresh();
    }
    setIsLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    const supabase = createClient();
    await supabase.from("coupons").update({ is_active: !active }).eq("id", id);
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !active } : c));
    toast.success(active ? "Coupon deactivated" : "Coupon activated");
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    const supabase = createClient();
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons(prev => prev.filter(c => c.id !== id));
    toast.success("Coupon deleted");
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setShowAdd(true)}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105">
        <Plus className="h-4 w-4" /> Create Coupon
      </button>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-syne font-bold">New Coupon</h3>
              <button onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Code *</label>
                <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="WELCOME10"
                  className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (£)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Value *</label>
                <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="10"
                  className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Min Order (£)</label>
                <input type="number" value={form.min_order} onChange={e => setForm(p => ({ ...p, min_order: e.target.value }))} placeholder="0"
                  className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Usage Limit</label>
                <input type="number" value={form.limit} onChange={e => setForm(p => ({ ...p, limit: e.target.value }))} placeholder="Unlimited"
                  className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Expires At</label>
                <input type="datetime-local" value={form.expires} onChange={e => setForm(p => ({ ...p, expires: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={save} disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save Coupon</>}
              </button>
              <button onClick={() => setShowAdd(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111] overflow-x-auto">
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Tag className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No coupons yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {["Code", "Type", "Value", "Min Order", "Used", "Limit", "Expires", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-border/20 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{c.type}</td>
                  <td className="px-4 py-3 font-semibold">{c.type === "percentage" ? `${c.value}%` : formatCurrency(c.value)}</td>
                  <td className="px-4 py-3">{c.min_order_amount > 0 ? formatCurrency(c.min_order_amount) : "—"}</td>
                  <td className="px-4 py-3">{c.used_count}</td>
                  <td className="px-4 py-3">{c.usage_limit || "∞"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.expires_at ? formatDate(c.expires_at) : "Never"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c.id, c.is_active)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteCoupon(c.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
