import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Users, UserCheck, TrendingUp, DollarSign, ChevronRight } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CustomersSearchFilter } from "./CustomersSearchFilter";

type Customer = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

type OrderStat = {
  user_id: string;
  total_amount: number;
  created_at: string;
};

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export default async function CustomersPage() {
  const supabase = createClient();

  const [{ data: customersData }, { data: orderStatsData }] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, phone, avatar_url, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("user_id, total_amount, created_at")
      .not("user_id", "is", null),
  ]);

  const customers: Customer[] = customersData ?? [];
  const orderStats: OrderStat[] = orderStatsData ?? [];

  // Build per-customer stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const enrichedCustomers = customers.map((c) => {
    const customerOrders = orderStats.filter((o) => o.user_id === c.id);
    const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
    const lastOrder = customerOrders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      ...c,
      orderCount: customerOrders.length,
      totalSpent,
      lastOrderDate: lastOrder?.created_at ?? null,
    };
  });

  // Summary stats
  const totalCustomers = customers.length;
  const newThisMonth = customers.filter((c) => {
    const d = new Date(c.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
  const repeatCustomers = enrichedCustomers.filter((c) => c.orderCount > 1).length;
  const totalRevenue = enrichedCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  const summaryCards = [
    { label: "Total Customers", value: totalCustomers, icon: Users, color: "#C8F04B", display: String(totalCustomers) },
    { label: "New This Month", value: newThisMonth, icon: TrendingUp, color: "#6EE7B7", display: String(newThisMonth) },
    { label: "Repeat Customers", value: repeatCustomers, icon: UserCheck, color: "#93C5FD", display: String(repeatCustomers) },
    { label: "Avg. Customer Value", value: avgValue, icon: DollarSign, color: "#FCD34D", display: formatCurrency(avgValue) },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne text-3xl font-bold text-white">Customers</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">{totalCustomers} registered customers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[#A0A0A0]">{card.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.color + "20" }}>
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            <p className="font-syne text-3xl font-bold text-white">{card.display}</p>
          </div>
        ))}
      </div>

      {/* Customers Table with client-side search */}
      {customers.length === 0 ? (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl">
          <EmptyState
            title="No customers yet"
            description="Customers will appear here when they register or place orders"
            icon={Users}
          />
        </div>
      ) : (
        <CustomersSearchFilter
          customers={enrichedCustomers}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          getInitials={getInitials}
        />
      )}
    </div>
  );
}
