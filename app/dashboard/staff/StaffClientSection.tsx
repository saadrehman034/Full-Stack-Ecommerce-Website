"use client";

import { useState } from "react";
import { Plus, Users, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfirmModal } from "@/components/dashboard/ConfirmModal";
import { SlideOver } from "@/components/dashboard/SlideOver";
import { StaffForm } from "@/components/dashboard/StaffForm";
import { useRouter } from "next/navigation";

type StaffStat = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  totalShifts: number;
  totalSales: number;
};

type PosSession = {
  staff_id: string;
  opened_at: string;
  closed_at: string | null;
  closing_cash: number | null;
};

type StaffMember = {
  id: string;
  full_name: string | null;
  email: string;
};

interface Props {
  staffStats: StaffStat[];
  sessions: PosSession[];
  staff: StaffMember[];
  formatDate: (d: string) => string;
  formatCurrency: (n: number) => string;
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

function getDuration(opened: string, closed: string | null) {
  if (!closed) return "Active";
  const ms = new Date(closed).getTime() - new Date(opened).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

export function StaffClientSection({ staffStats, sessions, staff, formatDate, formatCurrency }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [showInvite, setShowInvite] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<StaffStat | null>(null);
  const [removing, setRemoving] = useState(false);
  const [shiftFilter, setShiftFilter] = useState<string>("all");

  const handleRemove = async () => {
    if (!confirmRemove) return;
    setRemoving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: "customer" })
        .eq("id", confirmRemove.id);
      if (error) throw error;
      toast.success(`${confirmRemove.full_name ?? confirmRemove.email} removed from staff`);
      setConfirmRemove(null);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove staff";
      toast.error(message);
    } finally {
      setRemoving(false);
    }
  };

  const handleRoleChange = async (member: StaffStat, newRole: "staff" | "admin") => {
    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", member.id);
    if (error) {
      toast.error("Failed to update role");
    } else {
      toast.success("Role updated");
      router.refresh();
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (shiftFilter === "all") return true;
    return s.staff_id === shiftFilter;
  });

  return (
    <>
      {/* Staff Table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1E1E1E]">
          <h2 className="font-syne font-bold text-white">Team Members</h2>
          <button
            onClick={() => setShowInvite(true)}
            className="bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>

        {staffStats.length === 0 ? (
          <EmptyState
            title="No staff members"
            description="Invite your first team member to get started"
            icon={Users}
            action={{ label: "Add Staff", onClick: () => setShowInvite(true) }}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#161616] text-[11px] text-[#666] uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Member</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Joined</th>
                <th className="px-6 py-3 text-left">Shifts</th>
                <th className="px-6 py-3 text-left">POS Sales</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffStats.map((member) => (
                <tr key={member.id} className="border-b border-[#1A1A1A] hover:bg-[#161616] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          member.role === "admin"
                            ? "bg-[#C8F04B]/20 text-[#C8F04B]"
                            : "bg-[#2A2A2A] text-[#A0A0A0]"
                        }`}
                      >
                        {getInitials(member.full_name, member.email)}
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {member.full_name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#A0A0A0]">{member.email}</td>
                  <td className="px-6 py-4 text-sm text-[#A0A0A0]">{member.phone ?? "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {member.role === "admin" && <Shield className="w-3.5 h-3.5 text-[#C8F04B]" />}
                      <span
                        className={`text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full ${
                          member.role === "admin"
                            ? "bg-[#C8F04B]/10 text-[#C8F04B]"
                            : "bg-[#2A2A2A] text-[#A0A0A0]"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                    {formatDate(member.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{member.totalShifts}</td>
                  <td className="px-6 py-4 text-sm text-white">{formatCurrency(member.totalSales)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member, e.target.value as "staff" | "admin")}
                        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-[#C8F04B] outline-none"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => setConfirmRemove(member)}
                        className="text-xs text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-800/50 rounded-full px-3 py-1.5 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Shift History */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1E1E1E]">
          <h2 className="font-syne font-bold text-white">Shift History</h2>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2 text-white text-sm focus:border-[#C8F04B] outline-none"
          >
            <option value="all">All Staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name ?? s.email}
              </option>
            ))}
          </select>
        </div>

        {filteredSessions.length === 0 ? (
          <EmptyState title="No shifts recorded" icon={Users} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#161616] text-[11px] text-[#666] uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Staff</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Start</th>
                <th className="px-6 py-3 text-left">End</th>
                <th className="px-6 py-3 text-left">Opening Cash</th>
                <th className="px-6 py-3 text-left">Closing Cash</th>
                <th className="px-6 py-3 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((sess, i) => {
                const member = staff.find((s) => s.id === sess.staff_id);
                return (
                  <tr key={i} className="border-b border-[#1A1A1A] hover:bg-[#161616] transition-colors">
                    <td className="px-6 py-4 text-sm text-white">
                      {member?.full_name ?? member?.email ?? "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                      {new Date(sess.opened_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                      {new Date(sess.opened_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                      {sess.closed_at
                        ? new Date(sess.closed_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                        : <span className="text-green-400">Active</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#A0A0A0]">—</td>
                    <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                      {sess.closing_cash != null ? formatCurrency(sess.closing_cash) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {getDuration(sess.opened_at, sess.closed_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite SlideOver */}
      <SlideOver
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Add Staff Member"
        subtitle="Send an invitation to join your team"
      >
        <StaffForm
          onSuccess={() => {
            setShowInvite(false);
            router.refresh();
          }}
          onClose={() => setShowInvite(false)}
        />
      </SlideOver>

      {/* Remove Confirm */}
      <ConfirmModal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemove}
        title="Remove Staff Member"
        message={`Remove ${confirmRemove?.full_name ?? confirmRemove?.email} from staff? They will be changed to a customer role.`}
        danger
        loading={removing}
        confirmLabel="Remove"
      />
    </>
  );
}
