"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  subtitle?: string;
  width?: string;
}

export function SlideOver({
  open,
  onClose,
  title,
  children,
  subtitle,
  width = "480px",
}: SlideOverProps) {
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: width }}
            animate={{ x: 0 }}
            exit={{ x: width }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full bg-[#080820] border-l border-white/[0.08] z-50 flex flex-col backdrop-blur-2xl shadow-2xl shadow-violet-900/20"
            style={{ width }}
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
              <div>
                <h2 className="font-syne font-bold text-lg text-white leading-tight">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-white/40 leading-tight mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto h-[calc(100vh-64px)] p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
