import Image from "next/image";
import Link from "next/link";
import { Leaf, BadgeCheck, Truck, Heart } from "lucide-react";

export const metadata = { title: "About Us | Vinzlu", description: "Our story, mission and values." };

const VALUES = [
  { icon: Leaf, title: "Sustainably Sourced", body: "Every product is traced to its origin. We work directly with small farms, co-operatives and artisan producers who share our commitment to regenerative agriculture." },
  { icon: BadgeCheck, title: "Authenticity Guaranteed", body: "We taste, test and verify every product before it reaches your door. If it's not extraordinary, it doesn't make the cut. Full stop." },
  { icon: Truck, title: "Next Day Delivery", body: "Order before 2pm and your order ships the same day. We pack fresh to order so your pantry essentials arrive at peak quality." },
  { icon: Heart, title: "Community First", body: "10% of profits go directly to the farming communities we partner with — funding education, infrastructure and sustainable farming practices." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary px-4 py-32 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-5"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative container mx-auto max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-[#C8F04B]/30 bg-[#C8F04B]/10 px-4 py-1.5 text-sm font-medium text-[#C8F04B]">Our Story</span>
          <h1 className="mt-6 font-syne text-5xl font-extrabold text-white md:text-7xl">
            Built for the<br /><span className="text-[#C8F04B]">curious cook.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
            Vinzlu was born from a simple belief: the best meals start with the best ingredients. We curate the world's finest pantry staples so you don't have to.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="container mx-auto max-w-6xl px-4 py-24">
        <div className="grid gap-16 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-syne text-4xl font-bold">From kitchen obsession to global pantry</h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              It started with a saffron thread from Iran, a bottle of Cretan olive oil, and the realisation that the gap between what you can buy at a supermarket and what professional chefs have access to is vast — and completely unnecessary.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              We built Vinzlu to close that gap. Working directly with producers across 40+ countries, we bring you ingredients that were previously only available to restaurants and food professionals.
            </p>
            <Link href="/shop" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground transition-transform hover:scale-105">
              Explore the Shop
            </Link>
          </div>
          <div className="relative h-96 overflow-hidden rounded-3xl">
            <Image src="https://images.unsplash.com/photo-1506617564039-2f3b650b7010?q=80&w=800&auto=format&fit=crop"
              alt="Our story" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 px-4 py-24">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-center font-syne text-4xl font-bold">What we stand for</h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(v => (
              <div key={v.title} className="rounded-2xl bg-background p-6 shadow-sm ring-1 ring-border/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-syne text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-3xl px-4 py-24 text-center">
        <h2 className="font-syne text-4xl font-bold">Ready to upgrade your pantry?</h2>
        <p className="mt-4 text-muted-foreground">Join thousands of home cooks and professional chefs who trust Vinzlu.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/shop" className="h-12 inline-flex items-center gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:scale-105 transition-transform">
            Shop Now
          </Link>
          <Link href="/contact" className="h-12 inline-flex items-center gap-2 rounded-full border border-border px-8 font-semibold hover:bg-muted transition-colors">
            Get in Touch
          </Link>
        </div>
      </section>
    </main>
  );
}
