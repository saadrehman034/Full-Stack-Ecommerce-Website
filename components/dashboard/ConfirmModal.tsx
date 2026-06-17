"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center"
            onClick={() => !loading && onClose()}
          >
            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0d0d25] border border-white/[0.1] rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl shadow-black/50"
            >
              {/* Warning icon for danger */}
              {danger && (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500/30 to-pink-600/20 border border-rose-500/30 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
              )}

              <h2 className="font-syne font-bold text-xl text-white">{title}</h2>
              <p className="text-sm text-white/50 mt-2">{message}</p>

              <div className="flex items-center gap-3 mt-8">
                {/* Cancel */}
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 bg-white/[0.08] border border-white/[0.15] text-white rounded-xl px-5 py-2.5 hover:bg-white/[0.12] transition-all text-sm font-semibold disabled:opacity-40"
                >
                  Cancel
                </button>

                {/* Confirm */}
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={[
                    "flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 text-white shadow-lg",
                    danger
                      ? "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-500/25"
                      : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-violet-500/25",
                  ].join(" ")}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
