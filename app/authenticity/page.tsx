import React from "react";
import { ShieldCheck, Award, Sparkles } from "lucide-react";

export const metadata = {
  title: "Certificate of Authenticity | DNORA Luxury House",
  description: "Every DNORA handbag is certified for Florentine origin and 100% vegetable-tanned Italian leather.",
};

export default function AuthenticityPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 shadow-xs space-y-8">
        <div className="border-b border-neutral-100 pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">
            Artisanal Origin
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
            Certificate of Authenticity
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            Genuine Florentine craftsmanship, certified materials, and numbered serial identification.
          </p>
        </div>

        <div className="space-y-6 text-xs text-neutral-700 font-light leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              1. The Florentine Benchmark
            </h2>
            <p>
              Each DNORA handbag is crafted in our Tuscan atelier in Florence, Italy. We partner with historic Italian tanneries certified by the Consorzio Vera Pelle Italiana Conciata al Vegetale, utilizing natural chestnut and mimosa tannins.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              2. Individual Serial Identification
            </h2>
            <p>
              Every silhouette possesses a debossed interior leather serial patch corresponding to its artisan batch. The physical NFC or QR Certificate of Authenticity card included in your packaging guarantees the origin of your handbag.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
