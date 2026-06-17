"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

const QUICK_LINKS = [
  { label: "All Products", href: "/shop" },
  { label: "Spices & Herbs", href: "/shop/spices-herbs" },
  { label: "Oils & Vinegars", href: "/shop/oils-vinegars" },
  { label: "Grains & Pulses", href: "/shop/grains-pulses" },
  { label: "Beverages", href: "/shop/beverages" },
  { label: "Snacks & Nuts", href: "/shop/snacks-nuts" },
];

const CONTACT_ITEMS = [
  { label: "hello@pantrylegend.com", href: "mailto:hello@pantrylegend.com" },
  { label: "+44 20 7946 0958", href: "tel:+442079460958" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  )
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  { icon: IconInstagram, href: "https://instagram.com", label: "Instagram" },
  { icon: IconX, href: "https://twitter.com", label: "X (Twitter)" },
  { icon: IconFacebook, href: "https://facebook.com", label: "Facebook" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscribed(true);
        setEmail("");
        toast.success("You're subscribed! Welcome to the family.");
      } else {
        toast.error(data.error || "Something went wrong.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="w-full bg-[#040609] border-t border-white/[0.06] relative">
      {/* Subtle lime gradient top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8F04B]/30 to-transparent" />

      <div className="container mx-auto max-w-screen-xl px-4 pt-16 pb-8">
        <div className="grid gap-10 md:grid-cols-3">

          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center">
              <span className="font-syne text-2xl font-black text-[#C8F04B]">PantryLegend.</span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              Premium pantry essentials, globally sourced. Curated from artisan producers across 40+ countries to elevate every meal.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/40 transition-all hover:text-white hover:border-white/[0.18] hover:bg-white/[0.08]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-syne text-xs font-bold uppercase tracking-widest text-white/25 mb-5">Quick Links</h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/40 hover:text-white/80 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-6">
            <div>
              <h3 className="font-syne text-xs font-bold uppercase tracking-widest text-white/25 mb-5">Contact & Info</h3>
              <ul className="space-y-3">
                {CONTACT_ITEMS.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-white/40 hover:text-white/80 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-syne text-xs font-bold uppercase tracking-widest text-white/25 mb-4">Newsletter</h3>
              {subscribed ? (
                <div className="rounded-xl bg-[#C8F04B]/10 border border-[#C8F04B]/20 px-4 py-3 text-sm font-medium text-[#C8F04B]">
                  You're subscribed! Welcome aboard.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="min-w-0 flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#C8F04B] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C8F04B] text-black transition-all hover:scale-105 disabled:opacity-60"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} PantryLegend Ltd. All rights reserved.
          </p>
          <p className="text-xs text-white/25">
            Made with ❤️ for food lovers everywhere
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-white/25 hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-white/25 hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/contact" className="text-xs text-white/25 hover:text-white/60 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
