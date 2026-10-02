import React from "react";

export const metadata = {
  title: "Terms & Conditions | DNORA Luxury House",
  description: "Terms and conditions governing the purchase and ownership of DNORA leather silhouettes.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 shadow-xs space-y-8">
        <div className="border-b border-neutral-100 pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">
            Legal Terms
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
            Terms & Conditions
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            Effective: September 2026 • DNORA Luxury House
          </p>
        </div>

        <div className="space-y-6 text-xs text-neutral-700 font-light leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              1. General Overview
            </h2>
            <p>
              By accessing the DNORA storefront and purchasing our artisanal goods, you agree to comply with the terms set forth herein. Every handbag and accessory is handcrafted according to traditional Florentine methods.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              2. Orders & Allocations
            </h2>
            <p>
              Due to the limited artisanal production of our vegetable-tanned leather batches, orders are accepted subject to atelier material availability. DNORA reserves the right to decline or cancel orders in cases of pricing inaccuracies or unauthorized transactions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              3. Intellectual Property
            </h2>
            <p>
              All trademarks, product designs, architectural handbag patterns, logos, imagery, and narrative copy are the exclusive intellectual property of DNORA Luxury House.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
