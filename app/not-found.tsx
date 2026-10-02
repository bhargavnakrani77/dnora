import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#FAF9F6] text-neutral-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-200/60 flex items-center justify-center mb-6">
        <Compass className="w-8 h-8 text-neutral-600 animate-spin-slow" />
      </div>

      <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500 mb-2">
        Error 404 • Silhouette Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-serif text-neutral-950 font-normal mb-3">
        Page Not Found
      </h1>

      <p className="text-xs text-neutral-600 font-light max-w-md mx-auto leading-relaxed mb-8">
        The architectural silhouette or editorial page you are seeking may have been archived or moved to our permanent Florentine collection.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all rounded-xs shadow-xs"
        >
          Return to Atelier
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto px-6 py-3.5 border border-neutral-300 text-neutral-800 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-50 transition-all rounded-xs flex items-center justify-center gap-2"
        >
          <span>Explore All Handbags</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
