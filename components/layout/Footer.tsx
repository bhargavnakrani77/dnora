"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer aria-label="DNORA Maison Footer" className="w-full bg-[#0E0E0E] text-white border-t border-white/10 print:hidden">
      {/* Compact Main Section for both Desktop & Mobile */}
      <div className="py-6 sm:py-7 md:py-8">
        <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            
            {/* Story, Atelier & Contact (7 cols on Desktop) */}
            <div className="lg:col-span-7 space-y-3">
              <Link href="/" className="inline-block">
                <div className="relative h-7 w-36 sm:h-8 sm:w-44">
                  <Image
                    src="/images/logo.png"
                    alt="DNORA"
                    fill
                    sizes="200px"
                    className="object-contain brightness-0 invert"
                  />
                </div>
              </Link>

              {/* Story */}
              <p className="text-[12px] sm:text-xs text-neutral-400 font-light leading-relaxed max-w-xl">
                Architectural silhouettes engineered with artisanal discipline. Every DNORA silhouette is hand-cut from vegetable-tanned Italian leather in Florence, Italy, sculpted for enduring modern elegance.
              </p>

              {/* Atelier & WhatsApp */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] sm:text-xs text-neutral-400 font-light pt-0.5">
                <span>
                  <strong className="text-white font-medium">Florentine Atelier:</strong> Via de&apos; Tornabuoni 14, Florence, Italy
                </span>
                <span className="flex items-center gap-1">
                  <strong className="text-white font-medium">WhatsApp / Concierge:</strong>{" "}
                  <a
                    href="https://wa.me/919016047308"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-medium underline transition-colors"
                  >
                    +91 90160 47308
                  </a>
                </span>
              </div>

              {/* Social Channels */}
              <div className="flex items-center gap-2.5 pt-1">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/dnora_lifestyle/?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram @dnora_lifestyle"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/share/18Na18aHCQ/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook DNORA"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/919016047308"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp +91 90160 47308"
                  title="WhatsApp: 9016047308"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-600 transition-all"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Policies & Client Care (5 cols on Desktop) */}
            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-8 space-y-2.5">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white">
                Policies & Client Care
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:text-xs text-neutral-400 font-light">
                <Link href="/privacy" className="hover:text-white transition-colors py-0.5">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-white transition-colors py-0.5">
                  Terms & Conditions
                </Link>
                <Link href="/shipping" className="hover:text-white transition-colors py-0.5">
                  Shipping Policy
                </Link>
                <Link href="/returns" className="hover:text-white transition-colors py-0.5">
                  Returns & Exchanges
                </Link>
                <Link href="/authenticity" className="hover:text-white transition-colors py-0.5">
                  Authenticity
                </Link>
                <Link href="/care" className="hover:text-white transition-colors py-0.5">
                  Florentine Leather Care
                </Link>
                <Link href="/orders" className="hover:text-white transition-colors py-0.5">
                  Track Delivery
                </Link>
                <a
                  href="https://wa.me/919016047308"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors py-0.5 font-medium"
                >
                  WhatsApp Care
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Ultra-compact Bottom Copyright Bar */}
      <div className="border-t border-white/10 py-3 bg-black">
        <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-neutral-500 font-light">
          <p>© {new Date().getFullYear()} DNORA Luxury House. Handcrafted in Italy. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400">Accepted:</span>
            <span className="px-1.5 py-0.5 rounded-xs bg-white/10 text-white font-mono text-[9px]">VISA</span>
            <span className="px-1.5 py-0.5 rounded-xs bg-white/10 text-white font-mono text-[9px]">MASTERCARD</span>
            <span className="px-1.5 py-0.5 rounded-xs bg-white/10 text-white font-mono text-[9px]">AMEX</span>
            <span className="px-1.5 py-0.5 rounded-xs bg-white/10 text-white font-mono text-[9px]">UPI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
