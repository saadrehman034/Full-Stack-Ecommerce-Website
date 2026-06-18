"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, CheckCircle, X, Wallet, Clock, TrendingUp, Calendar } from "lucide-react";

interface Payout {
  id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  method: "bank_transfer" | "paypal" | "stripe" | "cash";
  reference: string | null;
  period_start: string | null;
  period_end: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  paypal: "PayPal",
  stripe: "Stripe",
  cash: "Cash",
};

const BLANK_FORM = {
  amount: "",
  method: "bank_transfer" as Payout["method"],
  reference: "",
  period_start: "",
  period_end: "",
  notes: "",
  status: "pending" as Payout["status"],
};

export default function PayoutsPage() {
  const supabase = createClient();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [{ data: payoutData, error: payoutError }, { data: orderData, error: orderError }] =
        await Promise.all([
          supabase.from("payouts").select("*").order("created_at", { ascending: false }),
          supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
        ]);

      if (payoutError) throw payoutError;
      if (orderError) throw orderError;

      const totalPaid = (orderData ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
      const completedPayouts = (payoutData ?? [])
        .filter((p) => p.status === "completed")
        .reduce((s, p) => s + (p.amount ?? 0), 0);

      setPayouts((payoutData as unknown as Payout[]) ?? []);
      setAvailableBalance(Math.max(totalPaid - completedPayouts, 0));
    } catch (err) {
      toast.error("Failed to load payouts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("payouts").insert({
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference || null,
        period_start: form.period_start || null,
        period_end: form.period_end || null,
        notes: form.notes || null,
        status: form.status,
      });
      if (error) throw error;
      toast.success("Payout recorded successfully");
      setForm(BLANK_FORM);
      setShowForm(false);
      await loadData();
    } catch (err) {
      toast.error("Failed to save payout");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkCompleted(id: string) {
    try {
      const { error } = await supabase
        .from("payouts")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Payout marked as completed");
      await loadData();
    } catch (err) {
      toast.error("Failed to update payout");
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this payout record?")) return;
    try {
      const { error } = await supabase.from("payouts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Payout deleted");
      setPayouts((prev) => prev.filter((p) => p.id !== id));
      await loadData();
    } catch (err) {
      toast.error("Failed to delete payout");
      console.error(err);
    }
  }

  const totalPaidOut = payouts.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const pendingPayouts = payouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((s, p) => s + p.amount, 0);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthPayouts = payouts
    .filter((p) => p.status === "completed" && p.completed_at && new Date(p.completed_at) >= thisMonthStart)
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-black text-white tracking-tight">Payouts</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">Manage your payout history and requests.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#C8F04B] text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#d4f55e] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Record Payout
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Available Balance", value: availableBalance, icon: Wallet, color: "#C8F04B" },
          { label: "Total Paid Out", value: totalPaidOut, icon: TrendingUp, color: "#3B82F6" },
          { label: "Pending / Processing", value: pendingPayouts, icon: Clock, color: "#F59E0B" },
          { label: "This Month Payouts", value: thisMonthPayouts, icon: Calendar, color: "#8B5CF6" },
        ].map((card) => (
          <div key={card.label} className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${card.color}1A` }}
            >
              <card.icon className="h-4.5 w-4.5" style={{ color: card.color }} />
            </div>
            <p className="font-syne text-2xl font-black text-white tracking-tight">
              {formatCurrency(card.value)}
            </p>
            <p className="text-[11px] text-[#A0A0A0] uppercase tracking-widest mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Record Payout Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne text-white font-bold text-xl">Record Payout</h2>
              <button
                onClick={() => { setShowForm(false); setForm(BLANK_FORM); }}
                className="text-[#555] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">
                    Method
                  </label>
                  <select
                    value={form.method}
                    onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as Payout["method"] }))}
                    className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">
                  Reference
                </label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors"
                  placeholder="Bank ref / transaction ID"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">
                    Period Start
                  </label>
                  <input
                    type="date"
                    value={form.period_start}
                    onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))}
                    className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">
                    Period End
                  </label>
                  <input
                    type="date"
                    value={form.period_end}
                    onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))}
                    className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Payout["status"] }))}
                  className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors resize-none"
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowForm(false); setForm(BLANK_FORM); }}
                className="flex-1 bg-[#1A1A1A] text-[#A0A0A0] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#C8F04B] text-black text-sm font-bold py-2.5 rounded-xl hover:bg-[#d4f55e] transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Payout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payouts table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
        <h2 className="font-syne text-white font-bold text-lg mb-5">Payout History</h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#1A1A1A] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-[#555] text-sm">
            No payouts recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A1A1A]">
                  {["Date", "Period", "Amount", "Method", "Reference", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] uppercase tracking-widest text-[#555] pb-3 pr-4 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-[#0F0F0F] hover:bg-[#0F0F0F] transition-colors">
                    <td className="py-3 pr-4 text-[#A0A0A0] text-sm whitespace-nowrap">
                      {formatDate(payout.created_at)}
                    </td>
                    <td className="py-3 pr-4 text-[#A0A0A0] text-xs">
                      {payout.period_start && payout.period_end
                        ? `${formatDate(payout.period_start)} – ${formatDate(payout.period_end)}`
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-white text-sm font-semibold">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="py-3 pr-4 text-[#A0A0A0] text-sm">
                      {METHOD_LABELS[payout.method] ?? payout.method}
                    </td>
                    <td className="py-3 pr-4 text-[#555] text-xs font-mono">
                      {payout.reference ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-[11px] font-semibold border rounded-full px-2.5 py-0.5 capitalize ${
                          STATUS_COLORS[payout.status] ?? "bg-[#1A1A1A] text-[#555] border-[#2A2A2A]"
                        }`}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {payout.status !== "completed" && (
                          <button
                            onClick={() => handleMarkCompleted(payout.id)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Mark as completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(payout.id)}
                          className="text-[#555] hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
