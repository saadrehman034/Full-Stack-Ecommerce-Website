"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

const INFO = [
  { icon: Mail, label: "Email", value: "hello@pantrylegendd.com" },
  { icon: Phone, label: "Phone", value: "+44 (0) 20 1234 5678" },
  { icon: MapPin, label: "Address", value: "12 Artisan Quarter, London, EC1A 1BB" },
  { icon: Clock, label: "Hours", value: "Mon–Fri: 9am–6pm GMT" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error("Please fill in all required fields.");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000)); // Simulated send
    setSent(true);
    setLoading(false);
    toast.success("Message sent! We'll get back to you within 24 hours.");
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-primary px-4 py-20 text-center">
        <h1 className="font-syne text-5xl font-extrabold text-white">Get in touch</h1>
        <p className="mt-4 text-lg text-white/70">Questions, feedback, or bulk orders — we'd love to hear from you.</p>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact info */}
          <div>
            <h2 className="font-syne text-3xl font-bold">Contact information</h2>
            <p className="mt-4 text-muted-foreground">Our team typically responds within one business day.</p>
            <div className="mt-8 space-y-5">
              {INFO.map(i => (
                <div key={i.label} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <i.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{i.label}</p>
                    <p className="mt-0.5 font-medium">{i.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
            className="rounded-3xl bg-card p-8 shadow-sm ring-1 ring-border/30">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 text-5xl">✉️</div>
                <h3 className="font-syne text-2xl font-bold">Message received!</h3>
                <p className="mt-2 text-muted-foreground">We'll be in touch within 24 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="font-syne text-xl font-bold">Send us a message</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Name *</label>
                    <input required value={form.name} onChange={e => set("name", e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Email *</label>
                    <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Subject</label>
                  <input value={form.subject} onChange={e => set("subject", e.target.value)}
                    placeholder="How can we help?"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e => set("message", e.target.value)}
                    placeholder="Tell us more…"
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <button type="submit" disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60 hover:scale-[1.02] transition-transform">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send message</>}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
