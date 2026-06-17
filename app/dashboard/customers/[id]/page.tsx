import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, Calendar } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type Address = {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
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

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: customer }, { data: ordersData }, { data: addressesData }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", params.id).single(),
      supabase
        .from("orders")
        .select("id, order_number, total_amount, status, payment_status, created_at, order_items(quantity)")
        .eq("user_id", params.id)
        .order("created_at", { ascending: false }),
      supabase.from("addresses").select("*").eq("user_id", params.id),
    ]);

  if (!customer) notFound();

  const orders = ordersData ?? [];
  const addresses: Address[] = addressesData ?? [];

  const lifetimeValue = orders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
  const totalItems = orders.reduce((sum, o) => {
    const items = o.order_items ?? [];
    return sum + items.reduce((s: number, item: { quantity: number }) => s + (item.quantity ?? 0), 0);
  }, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/customers"
        className="flex items-center gap-2 text-sm text-[#A0A0A0] hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      <div className="grid grid-cols-3 gap-6">
        {/* Profile Card (1/3) */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-full bg-[#C8F04B]/20 text-[#C8F04B] flex items-center justify-center text-2xl font-bold font-syne">
              {getInitials(customer.full_name, customer.email)}
            </div>
            <div>
              <h2 className="font-syne text-2xl font-bold text-white">
                {customer.full_name ?? "—"}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2A2A2A] text-[#A0A0A0] capitalize mt-1 inline-block">
                {customer.role}
              </span>
            </div>
          </div>

          <div className="border-t border-[#1E1E1E] pt-5 space-y-3">
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="w-4 h-4 text-[#555] shrink-0" />
              <span className="text-[#A0A0A0] break-all">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-[#555] shrink-0" />
                <span className="text-[#A0A0A0]">{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm">
              <Calendar className="w-4 h-4 text-[#555] shrink-0" />
              <span className="text-[#A0A0A0]">Joined {formatDate(customer.created_at)}</span>
            </div>
          </div>

          <div className="border-t border-[#1E1E1E] pt-5 grid grid-cols-2 gap-3">
            <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
              <p className="text-xs text-[#555] mb-1">Lifetime Value</p>
              <p className="font-syne font-bold text-white text-lg">{formatCurrency(lifetimeValue)}</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
              <p className="text-xs text-[#555] mb-1">Total Orders</p>
              <p className="font-syne font-bold text-white text-lg">{orders.length}</p>
            </div>
          </div>
        </div>

        {/* Right column (2/3) */}
        <div className="col-span-2 space-y-6">
          {/* Orders */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#1E1E1E] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C8F04B]" />
              <h3 className="font-syne font-bold text-white">Order History</h3>
              <span className="ml-auto text-xs text-[#555]">{orders.length} orders</span>
            </div>

            {orders.length === 0 ? (
              <div className="p-10 text-center text-[#555] text-sm">No orders yet</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#161616] text-[11px] text-[#666] uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">Order</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Items</th>
                    <th className="px-6 py-3 text-left">Total</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const itemCount = (order.order_items ?? []).reduce(
                      (s: number, item: { quantity: number }) => s + (item.quantity ?? 0),
                      0
                    );
                    return (
                      <tr key={order.id} className="border-b border-[#1A1A1A] hover:bg-[#161616] transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-sm font-mono text-[#C8F04B] hover:underline"
                          >
                            #{order.order_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#A0A0A0]">{itemCount}</td>
                        <td className="px-6 py-4 text-sm text-white font-semibold">
                          {formatCurrency(order.total_amount ?? 0)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} type="order" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Addresses */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#C8F04B]" />
              <h3 className="font-syne font-bold text-white">Saved Addresses</h3>
            </div>

            {addresses.length === 0 ? (
              <p className="text-sm text-[#555]">No addresses on record</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {addresses.map((addr, i) => (
                  <div
                    key={i}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4"
                  >
                    <p className="text-sm text-white">{addr.line1}</p>
                    {addr.line2 && <p className="text-sm text-[#A0A0A0]">{addr.line2}</p>}
                    <p className="text-sm text-[#A0A0A0]">{addr.city}, {addr.postal_code ?? (addr as any).postcode}</p>
                    <p className="text-sm text-[#555]">{addr.country}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
