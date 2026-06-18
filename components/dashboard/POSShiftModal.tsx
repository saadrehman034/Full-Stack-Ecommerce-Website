"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface POSSession {
  id: string
  staff_id: string
  opening_cash: number
  opened_at: string
}

interface POSShiftModalProps {
  mode: "open" | "close"
  session?: POSSession
  totalSales?: number
  totalOrders?: number
  onOpen: (openingCash: number) => void
  onClose: (closingCash: number) => void
  onCancel?: () => void
}

export function POSShiftModal({
  mode,
  session,
  totalSales = 0,
  totalOrders = 0,
  onOpen,
  onClose,
  onCancel,
}: POSShiftModalProps) {
  const [cashAmount, setCashAmount] = useState<string>("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const amount = parseFloat(cashAmount) || 0
    setLoading(true)
    try {
      if (mode === "open") {
        await onOpen(amount)
      } else {
        await onClose(amount)
      }
    } finally {
      setLoading(false)
    }
  }

  const shiftDuration = session
    ? (() => {
        const ms = Date.now() - new Date(session.opened_at).getTime()
        const hours = Math.floor(ms / 3_600_000)
        const mins = Math.floor((ms % 3_600_000) / 60_000)
        return `${hours}h ${mins}m`
      })()
    : null

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-[#111] border border-[#1E1E1E] rounded-3xl p-8 w-full max-w-sm"
        >
          {/* Icon + heading */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#C8F04B]/10 border border-[#C8F04B]/30 flex items-center justify-center mb-3">
              <Clock className="w-7 h-7 text-[#C8F04B]" />
            </div>
            <h2 className="font-syne text-xl font-bold text-white">
              {mode === "open" ? "Open Shift" : "Close Shift"}
            </h2>
            <p className="text-[#555] text-sm text-center mt-1">
              {mode === "open"
                ? "Enter your opening cash float to begin"
                : "Review your shift summary and enter closing cash"}
            </p>
          </div>

          {/* Close shift summary */}
          {mode === "close" && session && (
            <div className="bg-[#1A1A1A] rounded-2xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#555]">Shift started</span>
                <span className="text-white">
                  {new Date(session.opened_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#555]">Duration</span>
                <span className="text-white">{shiftDuration}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#555]">Opening cash</span>
                <span className="text-white">{formatCurrency(session.opening_cash)}</span>
              </div>
              <div className="border-t border-[#2A2A2A] my-1" />
              <div className="flex justify-between text-xs">
                <span className="text-[#555]">Orders taken</span>
                <span className="text-white">{totalOrders}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#555]">Total sales</span>
                <span className="text-[#C8F04B] font-bold">
                  {formatCurrency(totalSales)}
                </span>
              </div>
              {session.opening_cash > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#555]">Expected in drawer</span>
                  <span className="text-white">
                    {formatCurrency(session.opening_cash + totalSales)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cash input */}
          <div className="mb-5">
            <label className="block text-[#555] text-xs uppercase tracking-wider mb-2">
              {mode === "open" ? "Opening Cash Float ($)" : "Closing Cash Count ($)"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-xl font-bold">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-9 pr-4 py-4 text-white text-2xl font-bold focus:border-[#C8F04B] outline-none placeholder:text-[#333]"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 border border-[#2A2A2A] text-white rounded-full px-5 py-3 text-sm hover:border-[#444] transition-all disabled:opacity-40"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#C8F04B] text-black rounded-full px-5 py-3 font-bold text-sm hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "open" ? "Start Shift" : "Close Shift"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
