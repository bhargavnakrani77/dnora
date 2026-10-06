"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Product, HomepageSection } from "@/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";

interface DynamicHomeSectionProps {
  section: HomepageSection;
  products: Product[];
}

export function DynamicHomeSection({ section, products }: DynamicHomeSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayProducts = products.slice(0, section.limit || 10);
  const isFew = displayProducts.length <= 4;

  if (displayProducts.length === 0) return null;

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // If user explicitly configured "grid" style in admin and has only few products
  const isGrid = section.display_style === "grid";

  return (
    <section
      id={section.id}
      aria-label={section.title}
      className="w-full bg-white pt-8 pb-10 sm:pt-10 sm:pb-12 md:pt-12 md:pb-14 border-b border-neutral-100 overflow-x-clip"
    >
      <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Heading with Montserrat Font */}
        <SectionHeading title={section.title} subtitle={section.subtitle} />

        {isGrid ? (
          /* Grid View fallback if explicitly chosen */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-stretch">
            {displayProducts.map((product, idx) => (
              <div key={product.id} className="h-full flex flex-col justify-between">
                <ProductCard product={product} priority={idx < 4} className="h-full" />
              </div>
            ))}
          </div>
        ) : (
          /* Horizontal Swipeable Carousel (Side-by-side swipe as originally requested) */
          <div className="relative group/carousel">

            {/* Horizontal Swipeable Track */}
            <div
              ref={scrollRef}
              className={`flex items-stretch gap-2.5 sm:gap-3.5 md:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-2 px-1 -mx-1 ${
                isFew ? "justify-start 2xl:justify-center" : "justify-start"
              }`}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {displayProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="w-[190px] sm:w-[230px] md:w-[270px] lg:w-[285px] shrink-0 snap-start h-full flex flex-col justify-between"
                >
                  <ProductCard product={product} priority={idx < 4} className="h-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        {(() => {
          // Resolve View All link to dedicated pages for New In, Best Sellers, and Trending Now
          const resolveViewAllLink = (sec: HomepageSection): string => {
            if (sec.type === "new_in") return "/new-in";
            if (sec.type === "best_sellers") return "/bestseller";
            const typeStr = sec.type as string;
            if (typeStr === "trending" || typeStr === "trending_now") return "/trending-now";
            if (sec.view_all_link?.includes("new_arrival=true") || sec.view_all_link?.includes("new_in=true")) return "/new-in";
            if (sec.view_all_link?.includes("best_seller=true") || sec.view_all_link?.includes("bestseller=true")) return "/bestseller";
            if (sec.view_all_link?.includes("trending=true") || sec.view_all_link?.includes("trending-now")) return "/trending-now";
            return sec.view_all_link || "/shop";
          };

          const targetLink = resolveViewAllLink(section);

          return targetLink ? (
            <div className="mt-8 sm:mt-10 text-center">
              <Link
                href={targetLink}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-black text-white hover:bg-neutral-800 text-[11px] font-semibold tracking-[0.2em] uppercase rounded-md shadow-xs transition-all active:scale-95 group"
              >
                <span>{section.view_all_text || "VIEW ALL"}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          ) : null;
        })()}
      </div>
    </section>
  );
}

export default DynamicHomeSection;
