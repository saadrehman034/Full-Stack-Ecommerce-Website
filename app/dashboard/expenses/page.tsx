"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, Pencil, X, Receipt, TrendingDown, PoundSterling } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CATEGORIES = [
  "Packaging",
  "Shipping",
  "Supplies",
  "Marketing",
  "Staff",
  "Rent",
  "Software",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  notes: string | null;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Packaging: "#C8F04B",
  Shipping: "#3B82F6",
  Supplies: "#8B5CF6",
  Marketing: "#F59E0B",
  Staff: "#EF4444",
  Rent: "#06B6D4",
  Software: "#F97316",
  Other: "#6B7280",
};

const BLANK_FORM = {
  title: "",
  category: "Other" as Category,
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

type FormState = typeof BLANK_FORM;

export default function ExpensesPage() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [monthRevenue, setMonthRevenue] = useState<number | null>(null);

  useEffect(() => {
    loadExpenses();
    loadMonthRevenue();
  }, []);

  async function loadExpenses() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      setExpenses((data as unknown as Expense[]) ?? []);
    } catch (err) {
      toast.error("Failed to load expenses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMonthRevenue() {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("payment_status", "paid")
        .gte("created_at", thisMonthStart);
      const rev = (data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
      setMonthRevenue(rev);
    } catch {
      // Silently fail — revenue is optional context
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm({ ...BLANK_FORM, date: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  }

  function openEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date.slice(0, 10),
      notes: expense.notes ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    if (!form.date) { toast.error("Date is required"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase.from("expenses").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Expense updated");
      } else {
        const { error } = await supabase.from("expenses").insert(payload);
        if (error) throw error;
        toast.success("Expense added");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(BLANK_FORM);
      await loadExpenses();
    } catch (err) {
      toast.error("Failed to save expense");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Expense deleted");
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      toast.error("Failed to delete expense");
      console.error(err);
    }
  }

  // Summary calculations
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  const thisMonthTotal = expenses
    .filter((e) => new Date(e.date) >= thisMonthStart)
    .reduce((s, e) => s + e.amount, 0);

  const thisYearTotal = expenses
    .filter((e) => new Date(e.date) >= thisYearStart)
    .reduce((s, e) => s + e.amount, 0);

  const netProfitThisMonth =
    monthRevenue !== null ? monthRevenue - thisMonthTotal : null;

  // Category chart data
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-black text-white tracking-tight">Expenses</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">Track and categorise your business expenses.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#C8F04B] text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#d4f55e] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#C8F04B]/10 flex items-center justify-center mb-3">
            <Receipt className="h-4 w-4 text-[#C8F04B]" />
          </div>
          <p className="font-syne text-2xl font-black text-white tracking-tight">{formatCurrency(thisMonthTotal)}</p>
          <p className="text-[11px] text-[#A0A0A0] uppercase tracking-widest mt-1">This Month</p>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center mb-3">
            <TrendingDown className="h-4 w-4 text-[#3B82F6]" />
          </div>
          <p className="font-syne text-2xl font-black text-white tracking-tight">{formatCurrency(thisYearTotal)}</p>
          <p className="text-[11px] text-[#A0A0A0] uppercase tracking-widest mt-1">This Year</p>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center mb-3">
            <PoundSterling className="h-4 w-4 text-[#8B5CF6]" />
          </div>
          {netProfitThisMonth !== null ? (
            <>
              <p
                className={`font-syne text-2xl font-black tracking-tight ${
                  netProfitThisMonth >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {formatCurrency(netProfitThisMonth)}
              </p>
              <p className="text-[11px] text-[#A0A0A0] uppercase tracking-widest mt-1">Net Profit This Month</p>
            </>
          ) : (
            <>
              <p className="font-syne text-2xl font-black text-[#555] tracking-tight">—</p>
              <p className="text-[11px] text-[#A0A0A0] uppercase tracking-widest mt-1">Net Profit This Month</p>
            </>
          )}
        </div>
      </div>

      {/* Category chart */}
      {categoryChartData.length > 0 && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
          <h2 className="font-syne text-white font-bold text-lg mb-6">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryChartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#A0A0A0", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatCurrency(v)}
                tick={{ fill: "#555", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "12px",
                  padding: "10px 14px",
                }}
                itemStyle={{ color: "#fff", fontSize: 12 }}
                labelStyle={{ color: "#A0A0A0", fontSize: 11 }}
                formatter={(v) => [formatCurrency(Number(v ?? 0)), "Spent"]}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {categoryChartData.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? "#555"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne text-white font-bold text-xl">
                {editingId ? "Edit Expense" : "Add Expense"}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(BLANK_FORM); }}
                className="text-[#555] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors"
                  placeholder="e.g. Amazon packaging order"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                    className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">Amount (£)</label>
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
              </div>

              <div>
                <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#A0A0A0] uppercase tracking-widest block mb-2">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8F04B] transition-colors resize-none"
                  placeholder="Optional notes…"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(BLANK_FORM); }}
                className="flex-1 bg-[#1A1A1A] text-[#A0A0A0] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#C8F04B] text-black text-sm font-bold py-2.5 rounded-xl hover:bg-[#d4f55e] transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : editingId ? "Update" : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
        <h2 className="font-syne text-white font-bold text-lg mb-5">All Expenses</h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#1A1A1A] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-[#555] text-sm">
            No expenses recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A1A1A]">
                  {["Date", "Title", "Category", "Amount", "Notes", "Actions"].map((h) => (
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
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-[#0F0F0F] hover:bg-[#0F0F0F] transition-colors"
                  >
                    <td className="py-3 pr-4 text-[#A0A0A0] text-sm whitespace-nowrap">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-3 pr-4 text-white text-sm">{expense.title}</td>
                    <td className="py-3 pr-4">
                      <span
                        className="text-[11px] font-semibold rounded-full px-2.5 py-0.5"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[expense.category] ?? "#555"}1A`,
                          color: CATEGORY_COLORS[expense.category] ?? "#A0A0A0",
                        }}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-white text-sm font-semibold">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-3 pr-4 text-[#555] text-xs max-w-xs truncate">
                      {expense.notes ?? "—"}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(expense)}
                          className="text-[#555] hover:text-[#C8F04B] transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
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
