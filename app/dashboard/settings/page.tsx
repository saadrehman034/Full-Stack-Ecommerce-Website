import { createClient } from "@/lib/supabase/server";
import { SettingsTabs } from "@/components/dashboard/SettingsTabs";

export default async function SettingsPage() {
  const supabase = createClient();

  const { data: settings } = await supabase
    .from("store_settings")
    .select("key, value");

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s) => [s.key, s.value])
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-syne text-3xl font-bold text-white">Store Settings</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">Configure your PantryLegend store</p>
      </div>
      <SettingsTabs initialSettings={settingsMap} />
    </div>
  );
}
