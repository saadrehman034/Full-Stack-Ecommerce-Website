"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, Printer } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface ReceiptItem {
  product_id: string
  name: string
  price: number
  quantity: number
}

interface ReceiptOrder {
  order_number: string
  items: ReceiptItem[]
  subtotal: number
  discountAmount: number
  vatAmount: number
  total: number
  paymentMethod: "cash" | "card"
  created_at: string
}

interface POSReceiptModalProps {
  order: ReceiptOrder | null
  onClose: () => void
}

export function POSReceiptModal({ order, onClose }: POSReceiptModalProps) {
  return (
    <AnimatePresence>
      {order && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-[#111] border border-[#1E1E1E] rounded-3xl p-8 w-full max-w-md overflow-y-auto max-h-[90vh]"
          >
            {/* Success animation */}
            <div className="flex flex-col items-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 400, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-3"
              >
                <Check className="w-8 h-8 text-green-400" />
              </motion.div>
              <h2 className="font-syne text-xl font-bold text-white">Sale Complete!</h2>
              <p className="text-[#555] text-sm mt-0.5">Thank you for your purchase</p>
            </div>

            {/* Receipt body */}
            <div className="bg-[#0D0D0D] rounded-2xl p-5 space-y-4 text-sm print:bg-white print:text-black">
              {/* Store header */}
              <div className="text-center border-b border-[#1A1A1A] pb-4 print:border-black/20">
                <img src="/logo.png" alt="Vinzlu" className="h-10 w-auto object-contain mx-auto print:hidden" />
                <p className="hidden print:block font-bold text-xl">Vinzlu</p>
                <p className="text-[#555] text-xs mt-0.5 print:text-gray-600">
                  Your pantry, delivered.
                </p>
              </div>

              {/* Order info */}
              <div className="flex justify-between text-xs">
                <span className="text-[#555]">Order</span>
                <span className="font-mono font-bold text-[#C8F04B] print:text-black">
                  {order.order_number}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#555]">Date</span>
                <span className="text-white print:text-black">
                  {new Date(order.created_at).toLocaleString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#555]">Payment</span>
                <span className="text-white capitalize print:text-black">
                  {order.paymentMethod}
                </span>
              </div>

              {/* Items */}
              <div className="border-t border-[#1A1A1A] pt-3 print:border-black/20">
                <p className="text-[#555] text-[10px] uppercase tracking-wider mb-2">
                  Items
                </p>
                <div className="space-y-1.5">
                  {order.items.map((item) => (
                    <div key={item.product_id} className="flex justify-between gap-2 text-xs">
                      <span className="text-[#A0A0A0] truncate print:text-black">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-white shrink-0 font-medium print:text-black">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals breakdown */}
              <div className="border-t border-[#1A1A1A] pt-3 space-y-1.5 print:border-black/20">
                <div className="flex justify-between text-xs">
                  <span className="text-[#555]">Subtotal</span>
                  <span className="text-white print:text-black">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#555]">Discount</span>
                    <span className="text-green-400">
                      -{formatCurrency(order.discountAmount)}
                    </span>
                  </div>
                )}
                {order.vatAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#555]">VAT (20%)</span>
                    <span className="text-white print:text-black">
                      {formatCurrency(order.vatAmount)}
                    </span>
                  </div>
                )}
                <div className="border-t border-[#1A1A1A] pt-2 flex justify-between font-bold print:border-black/20">
                  <span className="text-white print:text-black">Total</span>
                  <span className="font-syne text-lg text-[#C8F04B] print:text-black">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-[#555] text-[10px] border-t border-[#1A1A1A] pt-3 print:border-black/20">
                Thank you for shopping with Vinzlu!
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 border border-[#2A2A2A] text-white rounded-full px-5 py-2.5 text-sm hover:border-[#444] transition-all"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-bold text-sm hover:scale-[1.02] transition-all"
              >
                New Sale
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
