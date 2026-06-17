"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Copy, Edit2, Trash2, Tag, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfirmModal } from "@/components/dashboard/ConfirmModal";
import { SlideOver } from "@/components/dashboard/SlideOver";
import { CouponForm } from "@/components/dashboard/CouponForm";

type CouponType = "percentage" | "fixed";

type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

export default function CouponsPage() {
  const supabase = createClient();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load coupons");
    } else {
      setCoupons((data as Coupon[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleActive = async (coupon: Coupon) => {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      );
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", confirmDelete.id);
      if (error) throw error;
      toast.success("Coupon deleted");
      setConfirmDelete(null);
      await fetchCoupons();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expires_at) return false;
    return new Date(coupon.expires_at) < new Date();
  };

  // Summary
  const activeCoupons = coupons.filter((c) => c.is_active && !isExpired(c)).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.used_count ?? 0), 0);
  const inactiveCount = coupons.filter((c) => !c.is_active || isExpired(c)).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-bold text-white">Coupons</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">Create and manage discount codes</p>
        </div>
        <button
          onClick={() => { setEditingCoupon(null); setShowForm(true); }}
          className="bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
          <p className="text-sm text-[#A0A0A0] mb-3">Active Coupons</p>
          <p className="font-syne text-3xl font-bold text-white">{activeCoupons}</p>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
          <p className="text-sm text-[#A0A0A0] mb-3">Total Redemptions</p>
          <p className="font-syne text-3xl font-bold text-white">{totalRedemptions}</p>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
          <p className="text-sm text-[#A0A0A0] mb-3">Inactive / Expired</p>
          <p className="font-syne text-3xl font-bold text-white">{inactiveCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#161616] text-[11px] text-[#666] uppercase tracking-wider">
              <th className="px-6 py-3 text-left">Code</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Value</th>
              <th className="px-6 py-3 text-left">Min Order</th>
              <th className="px-6 py-3 text-left">Usage</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Expires</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-[#1A1A1A] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    title="No coupons yet"
                    description="Create your first discount coupon"
                    icon={Tag}
                    action={{ label: "Create Coupon", onClick: () => setShowForm(true) }}
                  />
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const expired = isExpired(coupon);
                return (
                  <tr key={coupon.id} className="border-b border-[#1A1A1A] hover:bg-[#161616] transition-colors">
                    {/* Code */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white tracking-widest">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => copyCode(coupon.code, coupon.id)}
                          className="p-1 rounded text-[#555] hover:text-white transition-colors"
                        >
                          {copiedId === coupon.id ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        coupon.type === "percentage"
                          ? "bg-purple-950/30 text-purple-400"
                          : "bg-blue-950/30 text-blue-400"
                      }`}>
                        {coupon.type === "percentage" ? "%" : "£"}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="px-6 py-4 text-sm text-white font-semibold">
                      {coupon.type === "percentage"
                        ? `${coupon.value}%`
                        : formatCurrency(coupon.value)}
                    </td>

                    {/* Min Order */}
                    <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                      {coupon.min_order_amount != null
                        ? formatCurrency(coupon.min_order_amount)
                        : "—"}
                    </td>

                    {/* Usage */}
                    <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                      {coupon.used_count}
                      {coupon.usage_limit != null ? ` / ${coupon.usage_limit}` : " / ∞"}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-6 py-4">
                      {expired ? (
                        <span className="text-[11px] font-semibold text-red-400 bg-red-950/30 px-2.5 py-0.5 rounded-full">
                          Expired
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          className="relative rounded-full transition-colors"
                          style={{
                            width: "40px",
                            height: "22px",
                            backgroundColor: coupon.is_active ? "#C8F04B" : "#2A2A2A",
                          }}
                        >
                          <span
                            className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform"
                            style={{ transform: coupon.is_active ? "translateX(18px)" : "translateX(0)" }}
                          />
                        </button>
                      )}
                    </td>

                    {/* Expires */}
                    <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                      {coupon.expires_at ? formatDate(coupon.expires_at) : "Never"}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingCoupon(coupon); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-[#555] hover:text-white hover:bg-[#1A1A1A] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(coupon)}
                          className="p-1.5 rounded-lg text-[#555] hover:text-red-400 hover:bg-red-950/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* SlideOver Form */}
      <SlideOver
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingCoupon ? "Edit Coupon" : "Create Coupon"}
        subtitle={editingCoupon ? `Editing: ${editingCoupon.code}` : "Set up a new discount code"}
      >
        <CouponForm
          key={editingCoupon?.id ?? "new"}
          initialData={editingCoupon ?? undefined}
          onSuccess={fetchCoupons}
          onClose={() => setShowForm(false)}
        />
      </SlideOver>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
        message={`Delete coupon "${confirmDelete?.code}"? This cannot be undone.`}
        danger
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  );
}
