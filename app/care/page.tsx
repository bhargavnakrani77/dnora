import React from "react";
import { Sparkles, Sun, Droplets, Wind } from "lucide-react";

export const metadata = {
  title: "Florentine Leather Care Guide | DNORA Luxury House",
  description: "Preserve the beauty, patina, and durability of your vegetable-tanned Italian leather handbag.",
};

export default function LeatherCarePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 shadow-xs space-y-8">
        <div className="border-b border-neutral-100 pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">
            Atelier Preservation
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
            Florentine Leather Care Guide
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            Essential care guidelines to ensure your DNORA handbag ages into an heirloom.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1.5 text-xs text-center">
            <Sun className="w-5 h-5 text-neutral-800 mx-auto" />
            <p className="font-semibold text-neutral-900">Avoid Direct Sun</p>
            <p className="text-neutral-500 font-light">Prolonged ultraviolet rays may accelerate patina prematurely.</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1.5 text-xs text-center">
            <Droplets className="w-5 h-5 text-neutral-800 mx-auto" />
            <p className="font-semibold text-neutral-900">Moisture Control</p>
            <p className="text-neutral-500 font-light">If exposed to rain, dab gently with a clean, dry microfiber cloth.</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1.5 text-xs text-center">
            <Wind className="w-5 h-5 text-neutral-800 mx-auto" />
            <p className="font-semibold text-neutral-900">Breathe & Store</p>
            <p className="text-neutral-500 font-light">Always store inside its organic cotton dustbag, stuffed with tissue.</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-neutral-700 font-light leading-relaxed">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
            The Living Patina of Vegetable-Tanned Leather
          </h2>
          <p>
            Unlike synthetic polyurethane and heavy chemical chrome leathers, authentic Florentine vegetable-tanned leather is an organic, breathing material. Over months and years of use, natural oils and handling create a rich, lustrous patina unique to its bearer.
          </p>
        </div>
      </div>
    </div>
  );
}
