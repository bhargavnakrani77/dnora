import React from "react";
import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Frequently Asked Questions | DNORA Luxury House",
  description: "Find answers to frequently asked questions regarding DNORA handbags, delivery, and services.",
};

const FAQS = [
  {
    q: "Where are DNORA handbags manufactured?",
    a: "Every single DNORA silhouette is hand-cut, skived, and saddle-stitched in Florence (Firenze), Italy by veteran leather artisans utilizing vegetable-tanned Tuscan calfskin.",
  },
  {
    q: "How long does shipping take within India?",
    a: "Complimentary express courier shipping typically takes 3 to 5 business days. VIP courier dispatch delivers within 1 to 2 business days.",
  },
  {
    q: "What payment methods are supported?",
    a: "We accept all major domestic and international Credit/Debit Cards (Visa, MasterCard, Amex, RuPay), UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking across all top Indian banks, and Cash On Delivery (COD).",
  },
  {
    q: "Can I exchange or return my handbag if the size is not ideal?",
    a: "Yes. We provide a 14-day complimentary exchange and return policy for unused products in their original packaging.",
  },
  {
    q: "How can I contact the DNORA Concierge for bespoke styling advice?",
    a: "You can reach our Maison Concierge anytime directly via WhatsApp at +91 90160 47308 or email us at concierge@dnora.it.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 shadow-xs space-y-8">
        <div className="border-b border-neutral-100 pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">
            Client Assistance
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
            Frequently Asked Questions
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            Answers to our most commonly addressed client inquiries.
          </p>
        </div>

        <div className="divide-y divide-neutral-200 space-y-4">
          {FAQS.map((item, idx) => (
            <div key={idx} className="pt-4 first:pt-0 space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                {item.q}
              </h3>
              <p className="text-xs text-neutral-600 font-light leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Concierge box */}
        <div className="p-4 bg-[#FAF9F6] rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-neutral-900">Have a custom inquiry?</p>
            <p className="text-neutral-500 font-light">Our styling specialists are ready to assist you on WhatsApp.</p>
          </div>
          <a
            href="https://wa.me/919016047308"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shrink-0"
          >
            Chat with Concierge
          </a>
        </div>
      </div>
    </div>
  );
}
