import React from "react";
import { RotateCcw, ShieldCheck, Mail } from "lucide-react";

export const metadata = {
  title: "Returns & Exchanges | DNORA Luxury House",
  description: "Learn about our 14-day complimentary atelier returns and exchange policy.",
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 shadow-xs space-y-8">
        <div className="border-b border-neutral-100 pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">
            Client Assurance
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
            Returns & Exchanges
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            14-Day Complimentary Atelier Returns & Exchanges
          </p>
        </div>

        <div className="space-y-6 text-xs text-neutral-700 font-light leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              1. 14-Day Return Window
            </h2>
            <p>
              We want you to be completely captivated by your DNORA silhouette. If for any reason your purchase does not fulfill your expectations, we gladly accept returns and exchanges initiated within 14 days of delivery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              2. Condition Requirements
            </h2>
            <p>
              Returned items must be in unused, pristine condition, with all protective film on hardware intact, accompanied by original dust bags, authenticity cards, and presentation boxes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              3. Initiating a Return
            </h2>
            <p>
              To initiate a return or exchange, contact our Maison Concierge at{" "}
              <strong className="font-medium text-neutral-950">concierge@dnora.it</strong> or message us on WhatsApp at{" "}
              <a href="https://wa.me/919016047308" className="text-emerald-600 underline font-medium">
                +91 90160 47308
              </a>{" "}
              with your Order Number. We will arrange complimentary courier pickup from your address.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
