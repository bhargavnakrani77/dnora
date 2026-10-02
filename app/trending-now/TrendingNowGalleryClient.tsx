"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ZoomIn, ArrowRight, ShoppingBag } from "lucide-react";
import { TrendingNowItem } from "@/types";

interface TrendingNowGalleryClientProps {
  items: TrendingNowItem[];
}

export function TrendingNowGalleryClient({ items }: TrendingNowGalleryClientProps) {
  const [activeImage, setActiveImage] = useState<TrendingNowItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="py-20 text-center text-neutral-400">
        <p className="text-sm font-light">No lookbook imagery uploaded yet.</p>
      </div>
    );
  }

  const getProductLink = (item: TrendingNowItem) => {
    if (item.product_slug) return `/product/${item.product_slug}`;
    if (item.target_link && item.target_link.trim()) return item.target_link.trim();
    return null;
  };

  return (
    <>
      {/* Visual Editorial Grid - ONLY IMAGES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {items.map((item, idx) => {
          const productLink = getProductLink(item);

          return (
            <div
              key={item.id}
              onClick={() => setActiveImage(item)}
              className="group relative aspect-3/4 rounded-xl overflow-hidden bg-neutral-100 shadow-xs hover:shadow-2xl transition-all duration-500 cursor-pointer"
            >
              <Image
                src={item.image_url}
                alt={item.alt_text || item.title || `DNORA Look ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-106"
              />

              {/* Hover overlay with Zoom icon */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                  <ZoomIn className="w-5 h-5" />
                </div>
              </div>

              {/* Minimal Caption & Shop Link if present */}
              {(item.title || productLink) && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
                  {item.title && (
                    <p className="text-xs font-medium tracking-wide drop-shadow truncate">
                      {item.title}
                    </p>
                  )}
                  {productLink && (
                    <div className="mt-1">
                      <Link
                        href={productLink}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-black hover:bg-neutral-100 text-[10px] font-bold tracking-widest uppercase rounded-full shadow-md transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Shop Product</span>
                        <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full-Screen Lightbox Modal for High-Resolution View */}
      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setActiveImage(null)}
        >
          <button
            type="button"
            onClick={() => setActiveImage(null)}
            aria-label="Close modal"
            className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center"
          >
            <div className="relative w-full h-[75vh] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={activeImage.image_url}
                alt={activeImage.alt_text || activeImage.title || "Lookbook High-Res"}
                fill
                className="object-contain"
                priority
              />
            </div>
            {activeImage.title && (
              <p className="text-white text-xs sm:text-sm font-medium tracking-wider uppercase mt-3 text-center">
                {activeImage.title}
              </p>
            )}
            {(() => {
              const modalLink = getProductLink(activeImage);
              if (!modalLink) return null;
              return (
                <Link
                  href={modalLink}
                  className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-neutral-100 rounded-full text-xs font-bold tracking-widest uppercase transition-all shadow-xl hover:scale-105"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Shop This Silhouette</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

export default TrendingNowGalleryClient;
