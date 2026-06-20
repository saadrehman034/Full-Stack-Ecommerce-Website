export const metadata = { title: "Terms & Conditions | Vinzlu" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[#14532d] px-4 py-20 text-center">
        <h1 className="font-syne text-5xl font-extrabold text-white">Terms & Conditions</h1>
        <p className="mt-4 text-white/70">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>
      </section>
      <section className="container mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-8">
          {[
            ["1. Acceptance of Terms", "By accessing and using Vinzlu, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website."],
            ["2. Products and Pricing", "All prices are displayed in GBP and include VAT where applicable. We reserve the right to change prices at any time. Product descriptions are provided in good faith but may contain errors; we reserve the right to cancel orders placed for incorrectly priced items."],
            ["3. Orders and Payment", "All orders are subject to availability and confirmation. Payment is taken at the time of order. We accept major credit/debit cards via Stripe. By providing payment details, you confirm you are authorised to use the payment method."],
            ["4. Delivery", "We aim to deliver within the timeframes specified on our delivery information page. Delivery dates are estimates and not guaranteed. Risk in the goods passes to you upon delivery."],
            ["5. Returns and Refunds", "You have the right to cancel your order within 14 days of receipt under the Consumer Contracts Regulations. Perishable goods are exempt from this right. To initiate a return, contact us at orders@vinzlu.com."],
            ["6. Intellectual Property", "All content on this website, including text, graphics, logos and images, is the property of Vinzlu and is protected by UK and international copyright law."],
            ["7. Limitation of Liability", "To the maximum extent permitted by law, Vinzlu shall not be liable for any indirect, incidental, or consequential damages arising from your use of our products or website."],
            ["8. Governing Law", "These terms are governed by English law and subject to the exclusive jurisdiction of the courts of England and Wales."],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 className="font-syne text-xl font-bold mb-2">{title}</h2>
              <p className="text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
