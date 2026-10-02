"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";

interface BestSellersSectionProps {
  products: Product[];
}

export function BestSellersSection({ products }: BestSellersSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayProducts = products.slice(0, 10);
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

  return (
    <section
      id="bestsellers"
      aria-label="Best Sellers"
      className="w-full bg-white pt-8 pb-10 sm:pt-10 sm:pb-12 md:pt-12 md:pb-14 border-b border-neutral-100 overflow-x-clip"
    >
      <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Heading with Montserrat Font identical to Our Collections (no subtitle) */}
        <SectionHeading title="BEST SELLERS" />

        {/* Swipeable Carousel */}
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
                className="w-[190px] sm:w-[230px] md:w-[270px] lg:w-[285px] shrink-0 snap-start flex flex-col justify-between"
              >
                <ProductCard product={product} priority={idx < 4} />
              </div>
            ))}
          </div>
        </div>

        {/* Small Black Button with White Text */}
        <div className="mt-8 sm:mt-10 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-black text-white hover:bg-neutral-800 text-[11px] font-semibold tracking-[0.2em] uppercase rounded-md shadow-xs transition-all active:scale-95 group"
          >
            <span>VIEW ALL</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default BestSellersSection;
