"use client";

import { useState, useMemo } from "react";
import { Search, ChevronRight } from "lucide-react";
import Link from "next/link";

type EnrichedCustomer = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
};

interface Props {
  customers: EnrichedCustomer[];
  formatDate: (d: string) => string;
  formatCurrency: (n: number) => string;
  getInitials: (name: string | null, email: string) => string;
}

export function CustomersSearchFilter({ customers, formatDate, formatCurrency, getInitials }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        (c.full_name ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[#1E1E1E]">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] pl-10 pr-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
          />
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="bg-[#161616] text-[11px] text-[#666] uppercase tracking-wider">
            <th className="px-6 py-3 text-left">Customer</th>
            <th className="px-6 py-3 text-left">Email</th>
            <th className="px-6 py-3 text-left">Phone</th>
            <th className="px-6 py-3 text-left">Orders</th>
            <th className="px-6 py-3 text-left">Total Spent</th>
            <th className="px-6 py-3 text-left">Last Order</th>
            <th className="px-6 py-3 text-left">Joined</th>
            <th className="px-6 py-3 text-left"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-16 text-[#555] text-sm">
                No customers match your search
              </td>
            </tr>
          ) : (
            filtered.map((c) => (
              <tr
                key={c.id}
                className="border-b border-[#1A1A1A] hover:bg-[#161616] transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <Link href={`/dashboard/customers/${c.id}`} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#C8F04B]/20 text-[#C8F04B] flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(c.full_name, c.email)}
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {c.full_name ?? "—"}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-[#A0A0A0]">{c.email}</td>
                <td className="px-6 py-4 text-sm text-[#A0A0A0]">{c.phone ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-white">{c.orderCount}</td>
                <td className="px-6 py-4 text-sm text-white">{formatCurrency(c.totalSpent)}</td>
                <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                  {c.lastOrderDate ? formatDate(c.lastOrderDate) : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-[#A0A0A0]">{formatDate(c.created_at)}</td>
                <td className="px-6 py-4">
                  <Link href={`/dashboard/customers/${c.id}`}>
                    <ChevronRight className="w-4 h-4 text-[#555]" />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
