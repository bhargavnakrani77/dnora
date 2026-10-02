import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "The Florentine Atelier & Story | DNORA Luxury House",
  description: "Discover the heritage, master artisans, and architectural design discipline behind DNORA.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 shadow-xs space-y-8">
        <div className="border-b border-neutral-100 pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">
            Heritage & Craft
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
            The Florentine Atelier
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            Via de&apos; Tornabuoni 14, Florence, Italy • Founded on architectural discipline.
          </p>
        </div>

        <div className="space-y-6 text-xs text-neutral-700 font-light leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              Architectural Silhouettes
            </h2>
            <p>
              DNORA was founded with an unyielding reverence for geometry, timeless architectural form, and Florentine leather discipline. Rejecting ephemeral fast-fashion trends, our maison designs structured silhouettes that command poise and elegance in any setting.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              Ethical Vegetable-Tanned Italian Leather
            </h2>
            <p>
              We source exclusively from historic Tuscan tanneries that preserve heritage pit-tanning techniques utilizing natural vegetable extracts. The result is leather that is completely biodegradable, hypoallergenic, and enriched with natural resilience.
            </p>
          </section>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-6 py-3 bg-neutral-950 text-white font-medium text-xs uppercase tracking-wider rounded-xs hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="https://wa.me/919016047308"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 border border-neutral-300 text-neutral-800 font-medium text-xs uppercase tracking-wider rounded-xs hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
            >
              <span>Contact Concierge</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
