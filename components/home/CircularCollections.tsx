"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export interface CircularCollectionItem {
  id: string;
  label: string;
  href: string;
  image: string;
  badge?: string;
  alt?: string;
  isViewAll?: boolean;
}

const DEFAULT_COLLECTIONS: CircularCollectionItem[] = [
  {
    id: "col-new",
    label: "New Arrivals",
    href: "/new-in",
    image: "https://www.linoperros.com/cdn/shop/files/Circular_512_X_512_Icon_Webp_1.jpg?v=1786340044&width=300",
    badge: "New",
    alt: "New Arrivals Collection",
  },
  {
    id: "col-bestsellers",
    label: "Best Sellers",
    href: "/bestseller",
    image: "https://www.linoperros.com/cdn/shop/files/bestseller.png?v=1788779073&width=300",
    badge: "Hot",
    alt: "Best Sellers Handbags",
  },
  {
    id: "col-totes",
    label: "Tote Bags",
    href: "/category/tote-bags",
    image: "https://www.linoperros.com/cdn/shop/files/TOTE_1.webp?v=1786339599&width=300",
    alt: "Luxury Tote Bags",
  },
  {
    id: "col-sling",
    label: "Sling Bags",
    href: "/category/crossbody-bags",
    image: "https://www.linoperros.com/cdn/shop/files/sling.png?v=1788779073&width=300",
    alt: "Designer Sling Bags",
  },
  {
    id: "col-satchel",
    label: "Satchel Bags",
    href: "/category/satchel-bags",
    image: "https://www.linoperros.com/cdn/shop/files/satchel_22824a1f-9b5d-4041-a13c-79d1ba2ea671.png?v=1788779073&width=300",
    alt: "Leather Satchel Bags",
  },
  {
    id: "col-shoulder",
    label: "Shoulder Bags",
    href: "/category/shoulder-bags",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80",
    alt: "Elegant Shoulder Bags",
  },
  {
    id: "col-clutches",
    label: "Clutches",
    href: "/category/mini-bags",
    image: "https://www.linoperros.com/cdn/shop/files/clutch_c0e75bbd-9455-4ee5-88e2-c778c0ad809a.png?v=1788779073&width=300",
    alt: "Evening Clutches & Minis",
  },
  {
    id: "col-backpacks",
    label: "Backpacks",
    href: "/category/backpacks",
    image: "https://www.linoperros.com/cdn/shop/files/backpack.png?v=1788779073&width=300",
    alt: "Luxury Backpacks",
  },
  {
    id: "col-wallets",
    label: "Wallets",
    href: "/category/wallets",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=300&q=80",
    alt: "Fine Leather Wallets",
  },
  {
    id: "col-gifting",
    label: "Gifting",
    href: "/shop?collection=gifts",
    image: "https://www.linoperros.com/cdn/shop/files/Perfume_thumbnail_jpg_1.webp?v=1786359653&width=300",
    alt: "Luxury Gifting Collection",
  },
];

interface CircularCollectionsProps {
  items?: CircularCollectionItem[];
  title?: string;
  subtitle?: string;
}

export function CircularCollections({
  items = DEFAULT_COLLECTIONS,
  title = "Our Collections",
}: CircularCollectionsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollerRef.current) return;
    const scrollAmount = scrollerRef.current.clientWidth * 0.7;
    scrollerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section 
      aria-label="Our Collections" 
      className="w-full bg-white border-b border-neutral-100/90 pt-3 pb-4 sm:pt-4 sm:pb-5 md:pt-5 md:pb-6 relative group/section select-none transition-colors"
    >
      <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Aesthetic Stylish Heading with Montserrat Font */}
        <div className="text-center mb-4 sm:mb-5">
          <h2
            style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}
            className="text-lg sm:text-xl md:text-2xl font-semibold tracking-[0.2em] uppercase text-neutral-900"
          >
            {title}
          </h2>
          <div className="w-8 h-[1.5px] bg-neutral-900 mx-auto mt-1.5" />
        </div>

        {/* Relative Slider Container */}
        <div className="relative">

          {/* Horizontal Scroll Track */}
          <div
            ref={scrollerRef}
            onScroll={checkScroll}
            className="flex items-start md:justify-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-proximity py-1 px-2 -mx-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item) => {
              const isViewAll = item.isViewAll || item.id === "col-view-all" || item.label?.toLowerCase() === "view all";

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex flex-col items-center flex-shrink-0 snap-start text-center focus:outline-none"
                >
                  {/* Circular Media Shell */}
                  <div
                    className={`relative w-[86px] h-[86px] sm:w-[98px] sm:h-[98px] md:w-[110px] md:h-[110px] rounded-full p-[3px] sm:p-1 bg-white ring-2 transition-all duration-300 ${
                      isViewAll
                        ? "ring-neutral-900 group-hover:ring-black group-hover:shadow-[0_6px_22px_rgba(0,0,0,0.14)]"
                        : "ring-neutral-300/85 group-hover:ring-neutral-900 group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
                    }`}
                  >
                    {/* Optional Badge */}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 z-10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-black text-white rounded-full shadow-xs leading-none ring-2 ring-white">
                        {item.badge}
                      </span>
                    )}

                    {/* Inner Image Frame */}
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#FAF8F5] border border-neutral-200/60 flex items-center justify-center relative">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.alt || item.label}
                          width={220}
                          height={220}
                          loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 ${
                            isViewAll ? "brightness-90 group-hover:brightness-75" : ""
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs uppercase tracking-widest">
                          DNORA
                        </div>
                      )}

                      {/* View All Overlay Indicator */}
                      {isViewAll && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white transition-opacity duration-300 group-hover:bg-black/55">
                          <ArrowRight className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-x-1" />
                          <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">ALL</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Label */}
                  <span
                    style={isViewAll ? { fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" } : undefined}
                    className={`mt-2.5 text-xs sm:text-sm md:text-[15px] font-medium tracking-wide transition-colors duration-200 whitespace-nowrap ${
                      isViewAll
                        ? "text-black font-semibold group-hover:underline"
                        : "text-neutral-800 group-hover:text-black group-hover:font-semibold"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

export default CircularCollections;
