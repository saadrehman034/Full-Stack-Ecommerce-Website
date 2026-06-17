import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Users, Clock, TrendingUp } from "lucide-react";
import { StaffClientSection } from "./StaffClientSection";

type StaffMember = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
};

type PosSession = {
  staff_id: string;
  opened_at: string;
  closed_at: string | null;
  closing_cash: number | null;
};

type PosOrder = {
  staff_id: string;
  total_amount: number;
};

export default async function StaffPage() {
  const supabase = createClient();

  const [{ data: staffData }, { data: sessionsData }, { data: posOrdersData }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, email, full_name, phone, role, created_at")
        .in("role", ["admin", "staff"])
        .order("created_at"),
      supabase
        .from("pos_sessions")
        .select("staff_id, opened_at, closed_at, closing_cash")
        .not("closed_at", "is", null),
      supabase
        .from("orders")
        .select("staff_id, total_amount")
        .eq("source", "pos")
        .not("staff_id", "is", null),
    ]);

  const staff: StaffMember[] = staffData ?? [];
  const sessions: PosSession[] = sessionsData ?? [];
  const posOrders: PosOrder[] = posOrdersData ?? [];

  // Compute per-staff stats
  const staffStats = staff.map((s) => {
    const memberSessions = sessions.filter((sess) => sess.staff_id === s.id);
    const memberOrders = posOrders.filter((o) => o.staff_id === s.id);
    const totalSales = memberOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
    return {
      ...s,
      totalShifts: memberSessions.length,
      totalSales,
    };
  });

  // Summary card data
  const today = new Date().toDateString();
  const activeShiftsToday = sessions.filter((s) => {
    return new Date(s.opened_at).toDateString() === today && !s.closed_at;
  }).length;

  const thisMonth = new Date();
  const shiftsThisMonth = sessions.filter((s) => {
    const d = new Date(s.opened_at);
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
  }).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne text-3xl font-bold text-white">Staff</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">Manage team members and shift history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-[#A0A0A0]">Total Staff</p>
            <div className="w-8 h-8 rounded-lg bg-[#C8F04B]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#C8F04B]" />
            </div>
          </div>
          <p className="font-syne text-3xl font-bold text-white">{staff.length}</p>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-[#A0A0A0]">Active Shifts Today</p>
            <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <p className="font-syne text-3xl font-bold text-white">{activeShiftsToday}</p>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-[#A0A0A0]">Shifts This Month</p>
            <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="font-syne text-3xl font-bold text-white">{shiftsThisMonth}</p>
        </div>
      </div>

      {/* Staff Table + Actions (client) */}
      <StaffClientSection
        staffStats={staffStats}
        sessions={sessions}
        staff={staff}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
