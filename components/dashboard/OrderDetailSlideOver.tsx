"use client"

import { useEffect, useState } from "react"
import { Printer, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, formatDate } from "@/lib/utils"
import { SlideOver } from "@/components/dashboard/SlideOver"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface OrderDetailSlideOverProps {
  orderId: string | null
  onClose: () => void
}

const STATUS_TIMELINE = ["pending", "confirmed", "packing", "shipped", "delivered"]

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packing: "Packing",
  shipped: "Shipped",
  delivered: "Delivered",
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`bg-[#1A1A1A] rounded-lg animate-pulse ${className ?? ""}`} />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#555]">
        {title}
      </h3>
      {children}
    </div>
  )
}

export function OrderDetailSlideOver({ orderId, onClose }: OrderDetailSlideOverProps) {
  const [order, setOrder] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusLoading, setStatusLoading] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [noteLoading, setNoteLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from("orders")
      .select("*, users(full_name, email, phone), order_items(*, products(name, images))")
      .eq("id", orderId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          toast.error("Failed to load order")
        } else {
          setOrder(data)
          setNewStatus((data as Record<string, unknown>)?.status as string ?? "")
          setNoteText((data as Record<string, unknown>)?.notes as string ?? "")
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusUpdate() {
    if (!orderId || !newStatus) return
    setStatusLoading(true)
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
    if (error) {
      toast.error("Failed to update status")
    } else {
      toast.success("Order status updated")
      setOrder((prev) => prev ? { ...prev, status: newStatus } : prev)
      router.refresh()
    }
    setStatusLoading(false)
  }

  async function handleSaveNote() {
    if (!orderId) return
    setNoteLoading(true)
    const { error } = await supabase
      .from("orders")
      .update({ notes: noteText })
      .eq("id", orderId)
    if (error) {
      toast.error("Failed to save note")
    } else {
      toast.success("Note saved")
      setOrder((prev) => prev ? { ...prev, notes: noteText } : prev)
    }
    setNoteLoading(false)
  }

  const o = order as Record<string, unknown> | null
  const users = o?.users as Record<string, unknown> | null
  const orderItems = (o?.order_items as Record<string, unknown>[]) ?? []
  const shippingAddress = o?.shipping_address as Record<string, unknown> | null

  const currentStatusIndex = STATUS_TIMELINE.indexOf((o?.status as string) ?? "")
  const isCancelledOrRefunded =
    o?.status === "cancelled" || o?.status === "refunded"

  return (
    <SlideOver
      open={!!orderId}
      onClose={onClose}
      title={loading ? "Loading…" : `Order ${o?.order_number ?? ""}`}
      subtitle={o ? formatDate(o.created_at as string) : undefined}
      width="520px"
    >
      {loading ? (
        <div className="space-y-6">
          <SkeletonBlock className="h-6 w-2/3" />
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-32 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      ) : o ? (
        <div className="space-y-7 pb-24">
          {/* Header badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={o.status as string} type="order" />
            <StatusBadge status={o.payment_status as string} type="payment" />
            <StatusBadge status={o.source as string} type="source" />
          </div>

          {/* Customer */}
          <Section title="Customer">
            <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-1">
              <p className="font-semibold text-white">
                {users?.full_name as string ||
                  (shippingAddress?.full_name as string) ||
                  "Guest"}
              </p>
              {(users?.email || shippingAddress?.email) && (
                <p className="text-sm text-[#A0A0A0]">
                  {(users?.email ?? shippingAddress?.email) as string}
                </p>
              )}
              {(users?.phone || shippingAddress?.phone) && (
                <p className="text-sm text-[#A0A0A0]">
                  {(users?.phone ?? shippingAddress?.phone) as string}
                </p>
              )}
            </div>
          </Section>

          {/* Items */}
          <Section title={`Items (${orderItems.length})`}>
            <div className="space-y-2">
              {orderItems.map((item) => {
                const products = item.products as Record<string, unknown> | null
                const snapshot = item.product_snapshot as Record<string, unknown> | null
                const name =
                  (products?.name as string) ??
                  (snapshot?.name as string) ??
                  "Product"
                const image =
                  (products?.images as string[])?.[0] ??
                  (snapshot?.image as string) ??
                  ""
                const qty = item.quantity as number
                const unitPrice = item.unit_price as number
                const lineTotal = item.total_price as number

                return (
                  <div
                    key={item.id as string}
                    className="flex items-center gap-3 bg-[#1A1A1A] rounded-xl p-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#222] overflow-hidden shrink-0 relative">
                      {image ? (
                        <Image
                          src={image}
                          alt={name}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#2A2A2A]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{name}</p>
                      <p className="text-[#555] text-xs">
                        {qty} × {formatCurrency(unitPrice)}
                      </p>
                    </div>
                    <p className="text-white font-semibold text-sm shrink-0">
                      {formatCurrency(lineTotal)}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Breakdown */}
            <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-2 mt-3">
              {[
                { label: "Subtotal", value: o.subtotal as number },
                {
                  label: "Discount",
                  value: -(o.discount_amount as number),
                  hide: !(o.discount_amount as number),
                  green: true,
                },
                { label: "Shipping", value: o.shipping_amount as number },
                { label: "Tax", value: o.tax_amount as number },
              ]
                .filter((r) => !r.hide)
                .map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-[#A0A0A0]">{row.label}</span>
                    <span className={row.green ? "text-green-400" : "text-white"}>
                      {row.green && row.value < 0
                        ? `-${formatCurrency(Math.abs(row.value))}`
                        : formatCurrency(row.value ?? 0)}
                    </span>
                  </div>
                ))}
              <div className="border-t border-[#2A2A2A] pt-2 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="font-syne text-white text-lg">
                  {formatCurrency(o.total_amount as number)}
                </span>
              </div>
            </div>
          </Section>

          {/* Status timeline */}
          {!isCancelledOrRefunded && (
            <Section title="Order Timeline">
              <div className="flex items-center gap-1">
                {STATUS_TIMELINE.map((step, idx) => {
                  const reached = idx <= currentStatusIndex
                  const completed = idx < currentStatusIndex
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            reached
                              ? "bg-[#C8F04B]"
                              : "bg-[#1A1A1A] border border-[#2A2A2A]"
                          }`}
                        >
                          {completed ? (
                            <Check className="w-3.5 h-3.5 text-black" />
                          ) : reached ? (
                            <div className="w-2 h-2 rounded-full bg-black" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-[#333]" />
                          )}
                        </div>
                        <p
                          className={`text-[9px] font-medium text-center leading-tight ${
                            reached ? "text-[#C8F04B]" : "text-[#555]"
                          }`}
                        >
                          {STATUS_LABELS[step]}
                        </p>
                      </div>
                      {idx < STATUS_TIMELINE.length - 1 && (
                        <div
                          className={`h-px flex-1 mb-4 ${
                            idx < currentStatusIndex ? "bg-[#C8F04B]/40" : "bg-[#2A2A2A]"
                          }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Update status */}
          <Section title="Update Status">
            <div className="flex gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none text-sm"
              >
                {[
                  "pending",
                  "confirmed",
                  "packing",
                  "shipped",
                  "delivered",
                  "cancelled",
                  "refunded",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={statusLoading || newStatus === o.status}
                className="bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all disabled:opacity-40"
              >
                {statusLoading ? "Saving…" : "Update"}
              </button>
            </div>
          </Section>

          {/* Shipping address */}
          {shippingAddress && (
            <Section title="Shipping Address">
              <div className="bg-[#1A1A1A] rounded-xl p-4 text-sm text-[#A0A0A0] space-y-0.5">
                {shippingAddress.full_name && (
                  <p className="text-white font-medium">
                    {shippingAddress.full_name as string}
                  </p>
                )}
                {shippingAddress.line1 && <p>{shippingAddress.line1 as string}</p>}
                {shippingAddress.line2 && <p>{shippingAddress.line2 as string}</p>}
                {(shippingAddress.city || shippingAddress.postcode) && (
                  <p>
                    {[shippingAddress.city, shippingAddress.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {shippingAddress.country && <p>{shippingAddress.country as string}</p>}
              </div>
            </Section>
          )}

          {/* Notes */}
          <Section title="Staff Notes">
            <div className="space-y-2">
              {o.notes && (
                <p className="text-sm text-[#A0A0A0] bg-[#1A1A1A] rounded-xl p-3">
                  {o.notes as string}
                </p>
              )}
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a staff note…"
                rows={3}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white focus:border-[#C8F04B] outline-none placeholder:text-[#555] text-sm resize-none"
              />
              <button
                onClick={handleSaveNote}
                disabled={noteLoading}
                className="bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all disabled:opacity-40"
              >
                {noteLoading ? "Saving…" : "Save Note"}
              </button>
            </div>
          </Section>
        </div>
      ) : null}

      {/* Footer */}
      {o && !loading && (
        <div className="fixed bottom-0 right-0 bg-[#111111] border-t border-[#1E1E1E] p-4 flex gap-3"
          style={{ width: "520px" }}>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 border border-[#2A2A2A] text-white rounded-full px-4 py-2.5 text-sm hover:border-[#444] transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all"
          >
            Close
          </button>
        </div>
      )}
    </SlideOver>
  )
}
