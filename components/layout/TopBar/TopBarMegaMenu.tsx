"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NavCategory } from "./types";

interface TopBarMegaMenuProps {
  category: NavCategory | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
}

export function TopBarMegaMenu({
  category,
  onMouseEnter,
  onMouseLeave,
  onClose,
}: TopBarMegaMenuProps) {
  if (!category || !category.subcategories || category.subcategories.length === 0) {
    return null;
  }

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="hidden md:block absolute top-full left-0 w-full bg-white/98 backdrop-blur-xl border-b border-neutral-200 shadow-2xl transition-all duration-300 ease-out z-50 animate-in fade-in slide-in-from-top-1"
    >
      <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-8 xl:px-12 py-10">
        <div className="grid grid-cols-12 gap-10">
          {/* Subcategory columns */}
          <div className="col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-8">
            {category.subcategories.map((col, idx) => (
              <div key={idx} className="space-y-4">
                <h4 className="text-[10px] font-bold tracking-[0.22em] uppercase text-neutral-400 border-b border-neutral-100 pb-2">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="group inline-flex items-center justify-between w-full text-xs font-medium text-neutral-800 hover:text-black tracking-wide transition-colors"
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-neutral-100 text-neutral-900 rounded-xs">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Editorial Highlight Card */}
          {category.featuredCard && (
            <div className="col-span-4 pl-6 border-l border-neutral-100">
              <Link
                href={category.featuredCard.href}
                onClick={onClose}
                className="group block relative h-full overflow-hidden bg-neutral-100 rounded-xs"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden">
                  <Image
                    src={category.featuredCard.image}
                    alt={category.featuredCard.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 1200px) 300px, 400px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-neutral-300">
                      CAMPAIGN FEATURE
                    </p>
                    <h5 className="text-sm font-semibold tracking-wider uppercase mt-1">
                      {category.featuredCard.title}
                    </h5>
                    <p className="text-[11px] text-neutral-200 mt-1 line-clamp-2 leading-relaxed">
                      {category.featuredCard.subtitle}
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white mt-3 group-hover:underline underline-offset-4">
                      <span>{category.featuredCard.cta}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
