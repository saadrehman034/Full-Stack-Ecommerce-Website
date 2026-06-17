export const metadata = { title: "Privacy Policy | PantryLegend" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-primary px-4 py-20 text-center">
        <h1 className="font-syne text-5xl font-extrabold text-white">Privacy Policy</h1>
        <p className="mt-4 text-white/70">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>
      </section>
      <section className="container mx-auto max-w-3xl px-4 py-16">
        <div className="prose prose-lg max-w-none text-foreground">
          {[
            ["Information We Collect", "We collect information you provide directly to us, such as when you create an account, place an order, or contact us. This may include your name, email address, postal address, phone number, and payment information."],
            ["How We Use Your Information", "We use the information we collect to process your orders, send you transactional emails, personalise your experience, improve our services, and comply with legal obligations. We never sell your personal data to third parties."],
            ["Cookies", "We use essential cookies to maintain your session and shopping cart, and optional analytics cookies (only with your consent) to understand how our website is used. You can manage cookie preferences at any time."],
            ["Data Security", "We implement industry-standard security measures including SSL encryption, secure payment processing via Stripe, and regular security audits. Payment card data is never stored on our servers."],
            ["Your Rights", "Under GDPR and UK data protection law, you have the right to access, rectify, erase, or port your personal data. You may also object to processing or withdraw consent at any time. Contact us at privacy@pantrylegendd.com to exercise these rights."],
            ["Contact", "For any privacy-related questions, contact our Data Protection Officer at privacy@pantrylegendd.com or write to us at 12 Artisan Quarter, London, EC1A 1BB."],
          ].map(([title, body]) => (
            <div key={title} className="mb-8">
              <h2 className="font-syne text-2xl font-bold text-foreground mb-3">{title}</h2>
              <p className="text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
