"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type CouponType = "percentage" | "fixed";

interface Coupon {
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
}

interface Props {
  initialData?: Coupon;
  onSuccess: () => void;
  onClose: () => void;
}

function generateCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function CouponForm({ initialData, onSuccess, onClose }: Props) {
  const supabase = createClient();

  const [code, setCode] = useState(initialData?.code ?? "");
  const [type, setType] = useState<CouponType>(initialData?.type ?? "percentage");
  const [value, setValue] = useState<string>(String(initialData?.value ?? ""));
  const [minOrderAmount, setMinOrderAmount] = useState<string>(
    initialData?.min_order_amount != null ? String(initialData.min_order_amount) : ""
  );
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>(
    initialData?.max_discount_amount != null ? String(initialData.max_discount_amount) : ""
  );
  const [usageLimit, setUsageLimit] = useState<string>(
    initialData?.usage_limit != null ? String(initialData.usage_limit) : ""
  );
  const [expiresAt, setExpiresAt] = useState<string>(
    initialData?.expires_at ? initialData.expires_at.split("T")[0] : ""
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    if (!value || parseFloat(value) <= 0) {
      toast.error("Value must be greater than 0");
      return;
    }
    if (type === "percentage" && parseFloat(value) > 100) {
      toast.error("Percentage cannot exceed 100");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: code.toUpperCase().trim(),
        type,
        value: parseFloat(value),
        min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        max_discount_amount: type === "percentage" && maxDiscountAmount
          ? parseFloat(maxDiscountAmount)
          : null,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: isActive,
      };

      if (initialData) {
        const { error } = await supabase
          .from("coupons")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        toast.success("Coupon updated");
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
        toast.success("Coupon created");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save coupon";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Code */}
      <div>
        <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">Code *</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SUMMER20"
            className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555] font-mono tracking-widest uppercase"
          />
          <button
            onClick={() => setCode(generateCode())}
            className="p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] text-[#555] hover:text-white hover:border-[#444] transition-colors"
            title="Generate random code"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="text-xs text-[#555] uppercase tracking-wider mb-2 block">Type</label>
        <div className="flex gap-2">
          {(["percentage", "fixed"] as CouponType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${
                type === t
                  ? "bg-[#C8F04B] text-black"
                  : "bg-[#1A1A1A] border border-[#2A2A2A] text-[#A0A0A0] hover:border-[#444]"
              }`}
            >
              {t === "percentage" ? "Percentage (%)" : "Fixed Amount ($)"}
            </button>
          ))}
        </div>
      </div>

      {/* Value */}
      <div>
        <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">
          Value ({type === "percentage" ? "%" : "$"}) *
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555] text-sm">
            {type === "percentage" ? "%" : "$"}
          </span>
          <input
            type="number"
            min="0"
            max={type === "percentage" ? 100 : undefined}
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] pl-8 pr-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
          />
        </div>
      </div>

      {/* Min Order */}
      <div>
        <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">
          Minimum Order Amount ($) — optional
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={minOrderAmount}
          onChange={(e) => setMinOrderAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
        />
      </div>

      {/* Max Discount (percentage only) */}
      {type === "percentage" && (
        <div>
          <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">
            Maximum Discount Amount ($) — optional
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={maxDiscountAmount}
            onChange={(e) => setMaxDiscountAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
          />
        </div>
      )}

      {/* Usage Limit */}
      <div>
        <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">
          Usage Limit — leave blank for unlimited
        </label>
        <input
          type="number"
          min="1"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          placeholder="Unlimited"
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
        />
      </div>

      {/* Expiry Date */}
      <div>
        <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">
          Expiry Date — optional
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none [color-scheme:dark]"
        />
      </div>

      {/* Active */}
      <div className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-xl">
        <div>
          <p className="text-sm text-white font-semibold">Active</p>
          <p className="text-xs text-[#555] mt-0.5">Coupon can be applied at checkout</p>
        </div>
        <button
          onClick={() => setIsActive((p) => !p)}
          className="relative rounded-full transition-colors"
          style={{
            width: "40px",
            height: "22px",
            backgroundColor: isActive ? "#C8F04B" : "#2A2A2A",
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform"
            style={{ transform: isActive ? "translateX(18px)" : "translateX(0)" }}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 border border-[#2A2A2A] text-white rounded-full px-5 py-2.5 text-sm hover:border-[#444] transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          {saving ? "Saving…" : initialData ? "Update Coupon" : "Create Coupon"}
        </button>
      </div>
    </div>
  );
}
