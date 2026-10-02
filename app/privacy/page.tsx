import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | DNORA Luxury House",
  description: "Learn how DNORA protects and safeguards your personal data under international privacy standards.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 shadow-xs space-y-8">
        <div className="border-b border-neutral-100 pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">
            Maison Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
            Privacy Policy
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            Last Updated: September 2026 • Florence Atelier & Worldwide Operations
          </p>
        </div>

        <div className="space-y-6 text-xs text-neutral-700 font-light leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              1. Commitment to Client Confidentiality
            </h2>
            <p>
              DNORA Luxury House (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) holds our patrons&apos; privacy with the utmost reverence. This Privacy Policy details how we collect, store, and utilize information provided across our digital maison and global client concierge.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              2. Information We Collect
            </h2>
            <p>
              When you purchase a handcrafted silhouette, create an account, or contact our Concierge via WhatsApp, we collect:
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 pl-2">
              <li>Contact details: Name, email address, phone number, and delivery address.</li>
              <li>Order specifics: Purchased silhouettes, artisan color variants, and transaction receipts.</li>
              <li>Device diagnostics: Browsing preferences and authenticated session credentials.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              3. Protection & Encryption
            </h2>
            <p>
              All customer sessions and payment exchanges are protected via 256-bit cryptographic encryption. Payment details (credit card tokens and UPI identifiers) are never stored in plain text on our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              4. Client Rights & Inquiries
            </h2>
            <p>
              You maintain the absolute right to request an export or complete deletion of your profile data. To exercise this right, contact our Data Protection Officer at{" "}
              <strong className="font-medium text-neutral-950">concierge@dnora.it</strong> or via WhatsApp at{" "}
              <a href="https://wa.me/919016047308" className="text-emerald-600 underline font-medium">
                +91 90160 47308
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
