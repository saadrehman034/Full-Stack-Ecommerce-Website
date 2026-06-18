"use client"

import { useState } from "react"
import { X, CreditCard, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatCurrency } from "@/lib/utils"

interface POSPaymentModalProps {
  mode: "cash" | "card" | null
  total: number
  onClose: () => void
  onComplete: (method: "cash" | "card") => void
  isProcessing: boolean
}

export function POSPaymentModal({
  mode,
  total,
  onClose,
  onComplete,
  isProcessing,
}: POSPaymentModalProps) {
  const [cashReceived, setCashReceived] = useState<string>("")

  const received = parseFloat(cashReceived) || 0
  const change = received - total
  const canComplete = mode === "card" || (mode === "cash" && received >= total)

  function handleClose() {
    if (isProcessing) return
    setCashReceived("")
    onClose()
  }

  function handleComplete() {
    if (!mode || !canComplete || isProcessing) return
    onComplete(mode)
  }

  // Quick cash buttons
  const quickAmounts = [
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20,
    50,
  ].filter((v, i, arr) => v >= total && arr.indexOf(v) === i).slice(0, 4)

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111] border border-[#1E1E1E] rounded-3xl p-8 w-full max-w-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne text-xl font-bold text-white">
                {mode === "cash" ? "Cash Payment" : "Card Payment"}
              </h2>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="text-[#555] hover:text-white transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total */}
            <div className="text-center mb-6">
              <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Total Due</p>
              <p className="font-syne text-4xl font-black text-[#C8F04B]">
                {formatCurrency(total)}
              </p>
            </div>

            {mode === "cash" ? (
              <>
                {/* Cash received input */}
                <div className="mb-4">
                  <label className="block text-[#555] text-xs uppercase tracking-wider mb-2">
                    Cash Received ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-lg font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0.00"
                      autoFocus
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-8 pr-4 py-4 text-white text-2xl font-bold focus:border-[#C8F04B] outline-none placeholder:text-[#333]"
                    />
                  </div>
                </div>

                {/* Quick amount buttons */}
                {quickAmounts.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCashReceived(String(amt))}
                        className="flex-1 py-2 border border-[#2A2A2A] text-white text-sm rounded-xl hover:border-[#C8F04B]/50 transition-all"
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Change due */}
                {received > 0 && (
                  <div
                    className={`rounded-xl p-4 mb-6 text-center ${
                      change >= 0 ? "bg-green-900/20 border border-green-900/30" : "bg-red-900/20 border border-red-900/30"
                    }`}
                  >
                    <p className="text-[#555] text-xs uppercase tracking-wider mb-1">
                      Change Due
                    </p>
                    <p
                      className={`font-syne text-3xl font-black ${
                        change >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {change >= 0 ? formatCurrency(change) : `-${formatCurrency(Math.abs(change))}`}
                    </p>
                  </div>
                )}

                {/* Complete button */}
                <button
                  onClick={handleComplete}
                  disabled={!canComplete || isProcessing}
                  className="w-full h-14 bg-[#C8F04B] text-black rounded-xl font-black text-base flex items-center justify-center gap-2 disabled:opacity-40 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Complete Sale"
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Card payment */}
                <div className="flex flex-col items-center gap-4 mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
                    <CreditCard className="w-9 h-9 text-[#C8F04B]" />
                  </div>
                  <p className="text-[#A0A0A0] text-sm text-center">
                    Process the card payment on your terminal for{" "}
                    <span className="text-white font-semibold">
                      {formatCurrency(total)}
                    </span>
                    , then confirm below.
                  </p>
                </div>

                <button
                  onClick={handleComplete}
                  disabled={isProcessing}
                  className="w-full h-14 bg-[#C8F04B] text-black rounded-xl font-black text-base flex items-center justify-center gap-2 disabled:opacity-40 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Card Paid — Complete Sale"
                  )}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
