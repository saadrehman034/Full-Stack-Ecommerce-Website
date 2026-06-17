"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  unit: string;
}

interface Props {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

type AdjustType = "add" | "set" | "remove";
type Reason = "restock" | "correction" | "damage" | "return" | "other";

export function InventoryAdjustModal({ product, onClose, onSuccess }: Props) {
  const [adjustType, setAdjustType] = useState<AdjustType>("add");
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<Reason>("restock");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const currentStock = product?.stock_quantity ?? 0;
  const parsedAmount = parseInt(amount, 10) || 0;

  const computeNewStock = () => {
    if (adjustType === "add") return currentStock + parsedAmount;
    if (adjustType === "set") return parsedAmount;
    if (adjustType === "remove") return Math.max(0, currentStock - parsedAmount);
    return currentStock;
  };

  const newStock = computeNewStock();
  const delta = newStock - currentStock;

  const handleSave = async () => {
    if (!product) return;
    if (parsedAmount <= 0 && adjustType !== "set") {
      toast.error("Please enter a valid amount");
      return;
    }
    if (adjustType === "set" && parsedAmount < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", product.id);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("inventory_logs")
        .insert({
          product_id: product.id,
          change_amount: delta,
          reason,
          notes: notes || null,
          staff_id: user?.id ?? null,
        });

      if (logError) throw logError;

      toast.success(`Stock updated to ${newStock} ${product.unit}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update stock";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111] border border-[#1E1E1E] rounded-3xl p-8 w-full max-w-sm"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-syne font-bold text-xl text-white">Adjust Stock</h2>
                <p className="text-sm text-[#A0A0A0] mt-0.5">{product.name}</p>
              </div>
              <button
                onClick={onClose}
                className="text-[#555] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1A1A1A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Stock Display */}
            <div className="bg-[#1A1A1A] rounded-2xl p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] flex items-center justify-center">
                <Package className="w-5 h-5 text-[#555]" />
              </div>
              <div>
                <p className="text-xs text-[#555] uppercase tracking-wider">Current Stock</p>
                <p className="text-2xl font-bold text-white font-syne">
                  {currentStock} <span className="text-sm text-[#555] font-normal">{product.unit}</span>
                </p>
              </div>
              <p className="ml-auto text-xs text-[#555] font-mono">{product.sku}</p>
            </div>

            {/* Adjustment Type */}
            <div className="mb-4">
              <label className="text-xs text-[#555] uppercase tracking-wider mb-2 block">Adjustment Type</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as AdjustType)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none"
              >
                <option value="add">Add Stock</option>
                <option value="set">Set Exact Amount</option>
                <option value="remove">Remove Stock</option>
              </select>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-xs text-[#555] uppercase tracking-wider mb-2 block">
                {adjustType === "set" ? "New Amount" : "Amount"}
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-3 text-white text-3xl font-bold focus:border-[#C8F04B] outline-none placeholder:text-[#333]"
              />
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="text-xs text-[#555] uppercase tracking-wider mb-2 block">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as Reason)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none"
              >
                <option value="restock">Restock</option>
                <option value="correction">Correction</option>
                <option value="damage">Damage</option>
                <option value="return">Return</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-xs text-[#555] uppercase tracking-wider mb-2 block">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={2}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555] resize-none"
              />
            </div>

            {/* Preview */}
            {amount !== "" && (
              <div className={`rounded-xl p-3 mb-6 flex items-center justify-between text-sm ${
                delta > 0 ? "bg-green-950/40 border border-green-900/30" :
                delta < 0 ? "bg-red-950/40 border border-red-900/30" :
                "bg-[#1A1A1A] border border-[#2A2A2A]"
              }`}>
                <span className="text-[#A0A0A0]">New stock will be</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">{newStock} {product.unit}</span>
                  {delta !== 0 && (
                    <span className={`text-xs font-semibold ${delta > 0 ? "text-green-400" : "text-red-400"}`}>
                      ({delta > 0 ? "+" : ""}{delta})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-[#2A2A2A] text-white rounded-full px-5 py-2.5 text-sm hover:border-[#444] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || amount === ""}
                className="flex-1 bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {saving ? "Saving…" : "Update Stock"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
