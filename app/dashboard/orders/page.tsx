import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "@/components/dashboard/OrdersTable"
import Link from "next/link"
import { Download } from "lucide-react"

const PAGE_SIZE = 25

interface SearchParams {
  status?: string
  source?: string
  payment?: string
  q?: string
  page?: string
}

// ─── Inline client filter bar ─────────────────────────────────────────────────
function OrdersFilterBar({ currentFilters }: { currentFilters: SearchParams }) {
  return (
    <form className="flex flex-wrap gap-3">
      <input
        type="text"
        name="q"
        defaultValue={currentFilters.q ?? ""}
        placeholder="Search order number…"
        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none placeholder:text-[#555] text-sm w-56"
      />

      <select
        name="status"
        defaultValue={currentFilters.status ?? ""}
        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none text-sm"
      >
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="packing">Packing</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
        <option value="refunded">Refunded</option>
      </select>

      <select
        name="source"
        defaultValue={currentFilters.source ?? ""}
        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none text-sm"
      >
        <option value="">All Sources</option>
        <option value="online">Online</option>
        <option value="pos">POS</option>
      </select>

      <select
        name="payment"
        defaultValue={currentFilters.payment ?? ""}
        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none text-sm"
      >
        <option value="">All Payments</option>
        <option value="paid">Paid</option>
        <option value="unpaid">Unpaid</option>
        <option value="refunded">Refunded</option>
        <option value="failed">Failed</option>
      </select>

      <button
        type="submit"
        className="bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all"
      >
        Filter
      </button>

      {(currentFilters.q || currentFilters.status || currentFilters.source || currentFilters.payment) && (
        <Link
          href="/dashboard/orders"
          className="border border-[#2A2A2A] text-white rounded-full px-5 py-2.5 text-sm hover:border-[#444] transition-all"
        >
          Clear
        </Link>
      )}
    </form>
  )
}

// ─── Inline CSV export button ──────────────────────────────────────────────────
function ExportButton() {
  return (
    <a
      href="/api/orders/export"
      className="flex items-center gap-2 border border-[#2A2A2A] text-white rounded-full px-5 py-2.5 text-sm hover:border-[#444] transition-all"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </a>
  )
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-sm text-[#A0A0A0]">
        Page {page + 1} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 0 && (
          <Link
            href={`?page=${page - 1}`}
            className="border border-[#2A2A2A] text-white rounded-full px-4 py-2 text-sm hover:border-[#444] transition-all"
          >
            Previous
          </Link>
        )}
        {page < totalPages - 1 && (
          <Link
            href={`?page=${page + 1}`}
            className="bg-[#C8F04B] text-black rounded-full px-4 py-2 font-semibold text-sm hover:scale-[1.02] transition-all"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default async function DashboardOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()
  const page = parseInt(searchParams.page ?? "0", 10) || 0
  const offset = page * PAGE_SIZE

  let query = supabase
    .from("orders")
    .select("*, users(full_name, email), order_items(quantity)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (searchParams.status) query = query.eq("status", searchParams.status)
  if (searchParams.source) query = query.eq("source", searchParams.source)
  if (searchParams.payment) query = query.eq("payment_status", searchParams.payment)
  if (searchParams.q) query = query.ilike("order_number", `%${searchParams.q}%`)

  const { data: orders, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-bold text-white">Orders</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">{count ?? 0} total orders</p>
        </div>
        <ExportButton />
      </div>

      <OrdersFilterBar currentFilters={searchParams} />

      <OrdersTable orders={orders ?? []} />

      <Pagination page={page} totalPages={totalPages} />
    </div>
  )
}
