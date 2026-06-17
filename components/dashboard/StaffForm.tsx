"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

export function StaffForm({ onSuccess, onClose }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          role,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      toast.success(`Invitation sent to ${email}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send invitation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Full Name */}
      <div>
        <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">Full Name *</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Smith"
          required
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          required
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">Phone (optional)</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+44 7700 000000"
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
        />
      </div>

      {/* Role */}
      <div>
        <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "staff" | "admin")}
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none"
        >
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-[#555] mt-1.5">
          {role === "admin"
            ? "Admins have full access to the dashboard"
            : "Staff can use POS and view orders"}
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
        <p className="text-xs text-[#A0A0A0]">
          An invitation email will be sent to the provided address. The user must
          accept it to complete registration.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-[#2A2A2A] text-white rounded-full px-5 py-2.5 text-sm hover:border-[#444] transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send Invite"}
        </button>
      </div>
    </form>
  );
}
