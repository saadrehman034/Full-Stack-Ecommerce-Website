"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const EASE: [number, number, number, number] = [0.25, 0.4, 0.25, 1]

export function HeroSection() {
  return (
    <section
      className="relative isolate overflow-hidden bg-[#060810] px-4 py-32 lg:py-44"
      style={{
        backgroundImage: "url('/hero-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#060810]/72" />
      {/* Lime tint at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#C8F04B]/8 via-transparent to-transparent" />

      {/* Glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-[#C8F04B]/10 blur-[130px]"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 11, repeat: Infinity, delay: 3, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[100px]"
      />

      <div className="container relative z-10 mx-auto max-w-5xl text-center">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C8F04B]/30 bg-[#C8F04B]/10 px-4 py-1.5 backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#C8F04B] animate-pulse" />
          <span className="text-sm font-semibold text-[#C8F04B] tracking-wide">New Arrivals Just Dropped</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.8, ease: EASE }}
          className="font-syne text-5xl font-black leading-[0.92] tracking-tight text-white md:text-7xl lg:text-8xl"
        >
          The World&apos;s Finest
          <br />
          <span className="bg-gradient-to-r from-[#C8F04B] via-[#a8e63b] to-[#C8F04B] bg-clip-text text-transparent">
            Pantry Staples.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32, duration: 0.7 }}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/55"
        >
          Hand-sourced from artisan producers across 40+ countries.
          Delivered fresh to your door.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/shop?sort=newest"
            className="group inline-flex items-center gap-2 rounded-2xl bg-[#C8F04B] px-8 py-4 font-bold text-black shadow-[0_0_50px_rgba(200,240,75,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            Shop Collection
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/[0.12]"
          >
            Browse All
          </Link>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.62, duration: 0.9 }}
          className="mx-auto mt-14 h-px w-48 bg-gradient-to-r from-transparent via-[#C8F04B]/35 to-transparent"
        />

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.78, duration: 0.6 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-8"
        >
          {[
            { icon: "🚀", label: "Next Day Delivery" },
            { icon: "🌍", label: "40+ Countries Sourced" },
            { icon: "✓", label: "Quality Guaranteed" },
          ].map((badge) => (
            <span key={badge.label} className="flex items-center gap-1.5 text-sm text-white/40">
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
