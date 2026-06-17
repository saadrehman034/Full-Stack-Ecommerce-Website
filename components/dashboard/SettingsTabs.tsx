"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/dashboard/ConfirmModal";

interface Props {
  initialSettings: Record<string, unknown>;
}

type Tab = "store" | "tax" | "shipping" | "notifications" | "announcement" | "danger";

const TABS: { key: Tab; label: string }[] = [
  { key: "store", label: "Store Info" },
  { key: "tax", label: "Tax" },
  { key: "shipping", label: "Shipping" },
  { key: "notifications", label: "Notifications" },
  { key: "announcement", label: "Announcement" },
  { key: "danger", label: "Danger Zone" },
];

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative rounded-full transition-colors shrink-0"
      style={{
        width: "40px",
        height: "22px",
        backgroundColor: value ? "#C8F04B" : "#2A2A2A",
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform"
        style={{ transform: value ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]";
const selectCls = inputCls;

export function SettingsTabs({ initialSettings }: Props) {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>("store");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearInput, setClearInput] = useState("");
  const [clearing, setClearing] = useState(false);

  // ---- Store Info ----
  const storeInit = (initialSettings.store_info as Record<string, string>) ?? {};
  const [storeInfo, setStoreInfo] = useState({
    store_name: storeInit.store_name ?? "PantryLegend",
    tagline: storeInit.tagline ?? "",
    email: storeInit.email ?? "",
    phone: storeInit.phone ?? "",
    address: storeInit.address ?? "",
    currency: storeInit.currency ?? "GBP",
    currency_symbol: storeInit.currency_symbol ?? "£",
  });

  // ---- Tax ----
  const taxInit = (initialSettings.tax_settings as Record<string, unknown>) ?? {};
  const [taxSettings, setTaxSettings] = useState({
    tax_rate: String(taxInit.tax_rate ?? "20"),
    tax_name: String(taxInit.tax_name ?? "VAT"),
    tax_included: Boolean(taxInit.tax_included ?? true),
    apply_to_shipping: Boolean(taxInit.apply_to_shipping ?? false),
  });

  // ---- Shipping ----
  const shipInit = (initialSettings.shipping_settings as Record<string, unknown>) ?? {};
  const [shippingSettings, setShippingSettings] = useState({
    free_threshold: String(shipInit.free_threshold ?? "50"),
    standard_rate: String(shipInit.standard_rate ?? "3.99"),
    express_rate: String(shipInit.express_rate ?? "7.99"),
    standard_days: String(shipInit.standard_days ?? "3-5"),
    express_days: String(shipInit.express_days ?? "1-2"),
  });

  // ---- Notifications ----
  const notifInit = (initialSettings.notification_settings as Record<string, unknown>) ?? {};
  const [notifSettings, setNotifSettings] = useState({
    new_order: Boolean(notifInit.new_order ?? true),
    low_stock: Boolean(notifInit.low_stock ?? true),
    new_customer: Boolean(notifInit.new_customer ?? false),
    new_review: Boolean(notifInit.new_review ?? false),
    daily_summary: Boolean(notifInit.daily_summary ?? false),
    email: String(notifInit.email ?? ""),
  });

  // ---- Announcement ----
  const annInit = (initialSettings.announcement as Record<string, unknown>) ?? {};
  const [announcement, setAnnouncement] = useState({
    active: Boolean(annInit.active ?? false),
    text: String(annInit.text ?? "Free delivery on orders over £50!"),
    bg_color: String(annInit.bg_color ?? "#C8F04B"),
    text_color: String(annInit.text_color ?? "#000000"),
  });

  const saveSetting = async (key: string, value: Record<string, unknown>) => {
    setSavingKey(key);
    try {
      const { error } = await supabase.from("store_settings").upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
      if (error) throw error;
      toast.success("Settings saved!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error("Failed to save: " + message);
    } finally {
      setSavingKey(null);
    }
  };

  const SaveButton = ({ settingKey }: { settingKey: string }) => (
    <button
      onClick={() => {
        const payloads: Record<string, Record<string, unknown>> = {
          store_info: storeInfo,
          tax_settings: taxSettings,
          shipping_settings: shippingSettings,
          notification_settings: notifSettings,
          announcement: announcement,
        };
        saveSetting(settingKey, payloads[settingKey]);
      }}
      disabled={savingKey === settingKey}
      className="bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
    >
      {savingKey === settingKey ? "Saving…" : "Save Changes"}
    </button>
  );

  const handleExportOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total_amount, status, payment_status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const csv = [
        ["ID", "Order Number", "Total", "Status", "Payment Status", "Created At"].join(","),
        ...(data ?? []).map((o) =>
          [o.id, o.order_number, o.total_amount, o.status, o.payment_status, o.created_at].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Orders exported");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast.error(message);
    }
  };

  const handleClearOrders = async () => {
    setClearing(true);
    try {
      const PLACEHOLDER = "00000000-0000-0000-0000-000000000000";
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .neq("id", PLACEHOLDER);
      if (itemsError) throw itemsError;

      const { error: ordersError } = await supabase
        .from("orders")
        .delete()
        .neq("id", PLACEHOLDER);
      if (ordersError) throw ordersError;

      toast.success("All orders cleared");
      setShowClearConfirm(false);
      setClearInput("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to clear orders";
      toast.error(message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[#1E1E1E] mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 px-4 text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-[#C8F04B] text-[#C8F04B] font-semibold"
                : "text-[#555] hover:text-white"
            } ${tab.key === "danger" ? "text-red-400 hover:text-red-300 ml-auto" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Store Info */}
      {activeTab === "store" && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 space-y-5 max-w-xl">
          <Field label="Store Name">
            <input
              className={inputCls}
              value={storeInfo.store_name}
              onChange={(e) => setStoreInfo((p) => ({ ...p, store_name: e.target.value }))}
              placeholder="PantryLegend"
            />
          </Field>
          <Field label="Tagline">
            <input
              className={inputCls}
              value={storeInfo.tagline}
              onChange={(e) => setStoreInfo((p) => ({ ...p, tagline: e.target.value }))}
              placeholder="Your tagline..."
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={inputCls}
              value={storeInfo.email}
              onChange={(e) => setStoreInfo((p) => ({ ...p, email: e.target.value }))}
              placeholder="hello@pantrylegend.com"
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputCls}
              value={storeInfo.phone}
              onChange={(e) => setStoreInfo((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+44 20 0000 0000"
            />
          </Field>
          <Field label="Address">
            <textarea
              className={inputCls + " resize-none"}
              rows={2}
              value={storeInfo.address}
              onChange={(e) => setStoreInfo((p) => ({ ...p, address: e.target.value }))}
              placeholder="123 Pantry Lane, London, UK"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Currency">
              <select
                className={selectCls}
                value={storeInfo.currency}
                onChange={(e) => setStoreInfo((p) => ({ ...p, currency: e.target.value }))}
              >
                <option value="GBP">GBP — British Pound</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </Field>
            <Field label="Currency Symbol">
              <input
                className={inputCls}
                value={storeInfo.currency_symbol}
                onChange={(e) => setStoreInfo((p) => ({ ...p, currency_symbol: e.target.value }))}
                placeholder="£"
              />
            </Field>
          </div>
          <SaveButton settingKey="store_info" />
        </div>
      )}

      {/* Tax */}
      {activeTab === "tax" && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 space-y-5 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tax Rate (%)">
              <input
                type="number"
                className={inputCls}
                value={taxSettings.tax_rate}
                onChange={(e) => setTaxSettings((p) => ({ ...p, tax_rate: e.target.value }))}
                placeholder="20"
              />
            </Field>
            <Field label="Tax Name">
              <input
                className={inputCls}
                value={taxSettings.tax_name}
                onChange={(e) => setTaxSettings((p) => ({ ...p, tax_name: e.target.value }))}
                placeholder="VAT"
              />
            </Field>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-xl">
            <div>
              <p className="text-sm font-semibold text-white">Tax Included in Price</p>
              <p className="text-xs text-[#555] mt-0.5">Prices shown include tax</p>
            </div>
            <Toggle
              value={taxSettings.tax_included}
              onChange={(v) => setTaxSettings((p) => ({ ...p, tax_included: v }))}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-xl">
            <div>
              <p className="text-sm font-semibold text-white">Apply Tax to Shipping</p>
              <p className="text-xs text-[#555] mt-0.5">Add tax to shipping charges</p>
            </div>
            <Toggle
              value={taxSettings.apply_to_shipping}
              onChange={(v) => setTaxSettings((p) => ({ ...p, apply_to_shipping: v }))}
            />
          </div>
          <SaveButton settingKey="tax_settings" />
        </div>
      )}

      {/* Shipping */}
      {activeTab === "shipping" && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 space-y-5 max-w-xl">
          <Field label="Free Shipping Threshold (£)">
            <input
              type="number"
              className={inputCls}
              value={shippingSettings.free_threshold}
              onChange={(e) => setShippingSettings((p) => ({ ...p, free_threshold: e.target.value }))}
              placeholder="50"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Standard Rate (£)">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={shippingSettings.standard_rate}
                onChange={(e) => setShippingSettings((p) => ({ ...p, standard_rate: e.target.value }))}
                placeholder="3.99"
              />
            </Field>
            <Field label="Standard Days">
              <input
                className={inputCls}
                value={shippingSettings.standard_days}
                onChange={(e) => setShippingSettings((p) => ({ ...p, standard_days: e.target.value }))}
                placeholder="3-5"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Express Rate (£)">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={shippingSettings.express_rate}
                onChange={(e) => setShippingSettings((p) => ({ ...p, express_rate: e.target.value }))}
                placeholder="7.99"
              />
            </Field>
            <Field label="Express Days">
              <input
                className={inputCls}
                value={shippingSettings.express_days}
                onChange={(e) => setShippingSettings((p) => ({ ...p, express_days: e.target.value }))}
                placeholder="1-2"
              />
            </Field>
          </div>
          <SaveButton settingKey="shipping_settings" />
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 space-y-4 max-w-xl">
          <Field label="Notification Email">
            <input
              type="email"
              className={inputCls}
              value={notifSettings.email}
              onChange={(e) => setNotifSettings((p) => ({ ...p, email: e.target.value }))}
              placeholder="alerts@yourstore.com"
            />
          </Field>

          {(
            [
              { key: "new_order", label: "New Order", desc: "Notify when a new order is placed" },
              { key: "low_stock", label: "Low Stock Alert", desc: "Notify when product stock is low" },
              { key: "new_customer", label: "New Customer", desc: "Notify when someone registers" },
              { key: "new_review", label: "New Review", desc: "Notify when a product review is submitted" },
              { key: "daily_summary", label: "Daily Summary", desc: "Receive a daily performance digest" },
            ] as { key: keyof typeof notifSettings; label: string; desc: string }[]
          ).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-xl">
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-[#555] mt-0.5">{desc}</p>
              </div>
              <Toggle
                value={notifSettings[key] as boolean}
                onChange={(v) =>
                  setNotifSettings((p) => ({ ...p, [key]: v }))
                }
              />
            </div>
          ))}

          <SaveButton settingKey="notification_settings" />
        </div>
      )}

      {/* Announcement */}
      {activeTab === "announcement" && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 space-y-5 max-w-xl">
          <div className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-xl">
            <div>
              <p className="text-sm font-semibold text-white">Active</p>
              <p className="text-xs text-[#555] mt-0.5">Show announcement banner on store</p>
            </div>
            <Toggle
              value={announcement.active}
              onChange={(v) => setAnnouncement((p) => ({ ...p, active: v }))}
            />
          </div>

          <Field label="Banner Text">
            <input
              className={inputCls}
              value={announcement.text}
              onChange={(e) => setAnnouncement((p) => ({ ...p, text: e.target.value }))}
              placeholder="Free delivery on orders over £50!"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Background Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={announcement.bg_color}
                  onChange={(e) => setAnnouncement((p) => ({ ...p, bg_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  className={inputCls}
                  value={announcement.bg_color}
                  onChange={(e) => setAnnouncement((p) => ({ ...p, bg_color: e.target.value }))}
                />
              </div>
            </Field>
            <Field label="Text Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={announcement.text_color}
                  onChange={(e) => setAnnouncement((p) => ({ ...p, text_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  className={inputCls}
                  value={announcement.text_color}
                  onChange={(e) => setAnnouncement((p) => ({ ...p, text_color: e.target.value }))}
                />
              </div>
            </Field>
          </div>

          {/* Live Preview */}
          <div>
            <p className="text-xs text-[#555] uppercase tracking-wider mb-2">Preview</p>
            <div
              className="rounded-xl p-4 text-center font-semibold text-sm"
              style={{
                backgroundColor: announcement.bg_color,
                color: announcement.text_color,
              }}
            >
              {announcement.text || "Your announcement here"}
            </div>
          </div>

          <SaveButton settingKey="announcement" />
        </div>
      )}

      {/* Danger Zone */}
      {activeTab === "danger" && (
        <div className="bg-[#1A0000] border border-red-900/50 rounded-2xl p-6 space-y-6 max-w-xl">
          <div>
            <h2 className="font-syne font-bold text-red-400 text-lg mb-1">Danger Zone</h2>
            <p className="text-xs text-red-900/80">
              These actions are irreversible. Proceed with caution.
            </p>
          </div>

          {/* Export */}
          <div className="bg-[#110000] border border-red-900/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Export All Orders</p>
              <p className="text-xs text-[#555] mt-0.5">Download all orders as CSV</p>
            </div>
            <button
              onClick={handleExportOrders}
              className="border border-[#2A2A2A] text-white rounded-full px-4 py-2 text-sm hover:border-[#444] transition-all"
            >
              Export CSV
            </button>
          </div>

          {/* Clear Orders */}
          <div className="bg-[#110000] border border-red-900/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Clear All Orders</p>
              <p className="text-xs text-red-400/70 mt-0.5">
                Permanently deletes ALL orders and order items
              </p>
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="bg-red-600 text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-red-500 transition-all"
            >
              Clear Orders
            </button>
          </div>
        </div>
      )}

      {/* Clear Orders Confirm */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111] border border-red-900/50 rounded-3xl p-8 w-full max-w-sm">
            <h2 className="font-syne font-bold text-xl text-white">Delete All Orders</h2>
            <p className="text-sm text-[#A0A0A0] mt-2">
              This will permanently delete ALL orders and cannot be undone. Type{" "}
              <span className="font-mono text-red-400">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={clearInput}
              onChange={(e) => setClearInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full mt-4 bg-[#1A1A1A] border border-red-900/50 rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-red-500 outline-none placeholder:text-[#555] font-mono"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowClearConfirm(false); setClearInput(""); }}
                className="flex-1 border border-[#2A2A2A] text-white rounded-full px-5 py-2.5 text-sm hover:border-[#444] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleClearOrders}
                disabled={clearInput !== "DELETE" || clearing}
                className="flex-1 bg-red-600 text-white rounded-full px-5 py-2.5 font-semibold text-sm hover:bg-red-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {clearing ? "Deleting…" : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
