"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    storeName: "PantryLegend",
    contactEmail: "hello@pantrylegende.com",
    taxRate: "10",
    freeShippingThreshold: "50",
    flatShippingRate: "4.99",
    announcementText: "Free delivery on orders over £50",
    announcementActive: true,
    announcementColor: "#0D3B2E",
  });

  const save = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success("Settings saved! (Connect to DB to persist)");
    setIsLoading(false);
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="font-syne text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure your store settings.</p>
      </div>

      {/* Store Info */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111] space-y-4">
        <h2 className="font-syne text-lg font-bold">Store Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Store Name</label>
            <input value={settings.storeName} onChange={e => setSettings(p => ({ ...p, storeName: e.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Contact Email</label>
            <input value={settings.contactEmail} onChange={e => setSettings(p => ({ ...p, contactEmail: e.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
      </section>

      {/* Tax & Shipping */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111] space-y-4">
        <h2 className="font-syne text-lg font-bold">Tax & Shipping</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Tax Rate (%)</label>
            <input type="number" value={settings.taxRate} onChange={e => setSettings(p => ({ ...p, taxRate: e.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Free Shipping Over (£)</label>
            <input type="number" value={settings.freeShippingThreshold} onChange={e => setSettings(p => ({ ...p, freeShippingThreshold: e.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Flat Shipping Rate (£)</label>
            <input type="number" value={settings.flatShippingRate} onChange={e => setSettings(p => ({ ...p, flatShippingRate: e.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
      </section>

      {/* Announcement Banner */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111] space-y-4">
        <h2 className="font-syne text-lg font-bold">Announcement Banner</h2>
        <div>
          <label className="text-sm font-medium">Banner Text</label>
          <input value={settings.announcementText} onChange={e => setSettings(p => ({ ...p, announcementText: e.target.value }))}
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex items-center gap-6">
          <div>
            <label className="text-sm font-medium">Color</label>
            <input type="color" value={settings.announcementColor} onChange={e => setSettings(p => ({ ...p, announcementColor: e.target.value }))}
              className="mt-1.5 h-11 w-20 rounded-xl border border-border" />
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={settings.announcementActive} onChange={e => setSettings(p => ({ ...p, announcementActive: e.target.checked }))}
              className="h-4 w-4 rounded" />
            <span className="text-sm font-medium">Banner Active</span>
          </label>
        </div>
        {settings.announcementActive && (
          <div className="rounded-xl py-2 px-4 text-center text-sm font-medium text-white" style={{ backgroundColor: settings.announcementColor }}>
            {settings.announcementText || "Preview text here"}
          </div>
        )}
      </section>

      <button onClick={save} disabled={isLoading}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Settings</>}
      </button>
    </div>
  );
}
