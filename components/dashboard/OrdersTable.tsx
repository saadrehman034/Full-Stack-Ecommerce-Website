"use client"

import { useState } from "react"
import { Eye, CheckSquare, Square } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { OrderDetailSlideOver } from "@/components/dashboard/OrderDetailSlideOver"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Order {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  payment_status: string
  status: string
  source: string
  users?: { full_name: string; email: string } | null
  order_items?: { quantity: number }[]
}

interface OrdersTableProps {
  orders: Order[]
}

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]

export function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [bulkStatus, setBulkStatus] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const allSelected = orders.length > 0 && selectedRows.length === orders.length
  const someSelected = selectedRows.length > 0

  function toggleAll() {
    setSelectedRows(allSelected ? [] : orders.map((o) => o.id))
  }

  function toggleRow(id: string) {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  async function handleBulkStatusUpdate() {
    if (!bulkStatus || selectedRows.length === 0) return
    setBulkLoading(true)
    const { error } = await supabase
      .from("orders")
      .update({ status: bulkStatus })
      .in("id", selectedRows)

    if (error) {
      toast.error("Failed to update orders")
    } else {
      toast.success(`Updated ${selectedRows.length} orders to "${bulkStatus}"`)
      setSelectedRows([])
      setBulkStatus("")
      router.refresh()
    }
    setBulkLoading(false)
  }

  const itemCount = (order: Order) =>
    order.order_items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0

  return (
    <>
      {/* Bulk actions bar */}
      {someSelected && (
        <div className="flex items-center gap-3 bg-[#1A1A1A] border border-[#C8F04B]/30 rounded-xl px-4 py-3">
          <span className="text-sm text-[#C8F04B] font-semibold">
            {selectedRows.length} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="bg-[#111] border border-[#2A2A2A] rounded-[10px] px-3 py-1.5 text-white focus:border-[#C8F04B] outline-none text-sm"
          >
            <option value="">Update status…</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkStatusUpdate}
            disabled={!bulkStatus || bulkLoading}
            className="bg-[#C8F04B] text-black rounded-full px-4 py-1.5 font-semibold text-sm hover:scale-[1.02] transition-all disabled:opacity-40"
          >
            {bulkLoading ? "Updating…" : "Apply"}
          </button>
          <button
            onClick={() => setSelectedRows([])}
            className="border border-[#2A2A2A] text-white rounded-full px-4 py-1.5 text-sm hover:border-[#444] transition-all ml-auto"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E1E1E]">
                <th className="w-10 px-4 py-3 text-left">
                  <button
                    onClick={toggleAll}
                    className="text-[#555] hover:text-white transition-colors"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#C8F04B]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-[#555] font-medium uppercase tracking-wider text-xs">
                  Order #
                </th>
                <th className="px-4 py-3 text-left text-[#555] font-medium uppercase tracking-wider text-xs">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-[#555] font-medium uppercase tracking-wider text-xs">
                  Customer
                </th>
                <th className="px-4 py-3 text-right text-[#555] font-medium uppercase tracking-wider text-xs">
                  Items
                </th>
                <th className="px-4 py-3 text-right text-[#555] font-medium uppercase tracking-wider text-xs">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-[#555] font-medium uppercase tracking-wider text-xs">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-[#555] font-medium uppercase tracking-wider text-xs">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[#555] font-medium uppercase tracking-wider text-xs">
                  Source
                </th>
                <th className="px-4 py-3 text-right text-[#555] font-medium uppercase tracking-wider text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-[#555]">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isSelected = selectedRows.includes(order.id)
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order.id)}
                      className="hover:bg-[#161616] cursor-pointer transition-colors"
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleRow(order.id)
                        }}
                      >
                        <button className="text-[#555] hover:text-white transition-colors">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#C8F04B]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-[#C8F04B] text-xs">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#A0A0A0] whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {order.users ? (
                          <div>
                            <p className="text-white font-medium">{order.users.full_name}</p>
                            <p className="text-[#555] text-xs">{order.users.email}</p>
                          </div>
                        ) : (
                          <span className="text-[#555]">Guest</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[#A0A0A0]">
                        {itemCount(order)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white whitespace-nowrap">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.payment_status} type="payment" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} type="order" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.source} type="source" />
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedOrder(order.id)}
                          className="p-1.5 rounded-lg text-[#555] hover:text-white hover:bg-[#1A1A1A] transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderDetailSlideOver
        orderId={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  )
}
