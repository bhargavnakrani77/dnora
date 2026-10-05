"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { CampaignSlide } from "@/lib/data/store";

interface PromoBannerProps {
  slides?: CampaignSlide[];
  heading?: string;
  tagline?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export function PromoBanner({
  slides,
  heading = "",
  tagline = "",
  description = "",
  buttonText = "",
  buttonLink = "/shop",
  imageUrl = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
  isActive = true,
}: PromoBannerProps) {
  // Prepare slides list with fallback to top-level props
  const resolvedSlides: CampaignSlide[] = useMemo(() => {
    return slides && slides.length > 0
      ? slides
      : [
          {
            id: "fallback-slide",
            heading,
            tagline,
            description,
            button_text: buttonText,
            button_link: buttonLink,
            media_type: "image",
            media_url: imageUrl,
            duration_seconds: 6,
          },
        ];
  }, [slides, heading, tagline, description, buttonText, buttonLink, imageUrl]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const totalSlides = resolvedSlides.length;

  // Next Slide handler
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // Previous Slide handler
  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-advance timer (push transition)
  useEffect(() => {
    if (!isActive || totalSlides <= 1 || isHovered) return;

    const currentSlide = resolvedSlides[currentIndex];
    const duration = (currentSlide?.duration_seconds || 6) * 1000;

    const timer = setTimeout(() => {
      nextSlide();
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, currentIndex, isHovered, totalSlides, resolvedSlides, nextSlide]);

  // If explicitly inactive, do not render
  if (isActive === false) {
    return null;
  }

  // Handle Touch Swipe on Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
  };

  return (
    <section
      aria-label="Campaign Banner Carousel"
      className="relative w-full max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 my-4 sm:my-6 md:my-8 group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-neutral-100/80 border border-neutral-200/60 shadow-xs">
        {/* Horizontal Push Track: Slides push sideways smoothly */}
        <div
          className="flex w-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {resolvedSlides.map((slide, idx) => {
            const hasHeading = Boolean(slide.heading && slide.heading.trim());
            const hasTagline = Boolean(slide.tagline && slide.tagline.trim());
            const hasDesc = Boolean(slide.description && slide.description.trim());
            const hasBtn = Boolean(slide.button_text && slide.button_text.trim());
            const hasAnyText = hasHeading || hasTagline || hasDesc || hasBtn;
            const destinationLink = slide.button_link || "/shop";

            const slideContent = (
              <div
                key={slide.id || idx}
                className="min-w-full w-full relative min-h-[420px] sm:min-h-[480px] md:h-[540px] lg:h-[620px] xl:h-[680px] flex items-center justify-center shrink-0 overflow-hidden"
              >
                {/* Background Media: Responsive art-direction for desktop/laptop and mobile */}
                <div className="absolute inset-0 z-0">
                  {slide.media_type === "video" ? (
                    <video
                      src={slide.media_url || slide.mobile_media_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      {slide.mobile_media_url && (
                        <source src={slide.mobile_media_url} media="(max-width: 767px)" />
                      )}
                      <source src={slide.media_url || slide.mobile_media_url} media="(min-width: 768px)" />
                      <source src={slide.media_url || slide.mobile_media_url} />
                    </video>
                  ) : (
                    <picture className="block relative w-full h-full">
                      {slide.mobile_media_url && (
                        <source media="(max-width: 767px)" srcSet={slide.mobile_media_url} />
                      )}
                      <source media="(min-width: 768px)" srcSet={slide.media_url || slide.mobile_media_url} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.media_url || slide.mobile_media_url}
                        alt={slide.heading || "DNORA Campaign Banner"}
                        loading={idx === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-full object-cover object-center select-none"
                      />
                    </picture>
                  )}

                  {/* Only add a very subtle soft contrast veil if text overlay is present */}
                  {hasAnyText && (
                    <div className="absolute inset-0 bg-black/25 pointer-events-none" />
                  )}
                </div>

              {/* Content Shell with Luxury Typography - Rendered ONLY if text was provided */}
              {hasAnyText && (
                <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center py-12 sm:py-16 animate-in fade-in zoom-in-95 duration-500">
                  {/* Tagline Badge */}
                  {hasTagline && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 text-[#F5D77F] backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-4 sm:mb-5 shadow-sm">
                      <Sparkles className="w-3 h-3 text-[#F5D77F]" />
                      <span>{slide.tagline}</span>
                    </div>
                  )}

                  {/* Main Heading */}
                  {hasHeading && (
                    <h2
                      style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.18em] uppercase text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] leading-tight mb-3"
                    >
                      {slide.heading}
                    </h2>
                  )}

                  {/* Gold Divider Line */}
                  {(hasHeading || hasDesc) && (
                    <div className="w-12 h-[1.5px] bg-[#D4AF37] mx-auto mb-4 sm:mb-5 shadow-xs" />
                  )}

                  {/* Narrative Story */}
                  {hasDesc && (
                    <p className="text-xs sm:text-sm md:text-base text-white font-light leading-relaxed max-w-xl mx-auto mb-6 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] bg-black/30 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10">
                      {slide.description}
                    </p>
                  )}

                  {/* CTA Action Button */}
                  {hasBtn && (
                    <div>
                      <Link
                        href={destinationLink}
                        className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-black hover:bg-[#D4AF37] hover:text-black font-semibold text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-xl group rounded-xs cursor-pointer"
                      >
                        <span>{slide.button_text}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );

          // If no CTA button is defined, make the entire slide image clickable directly to the destination link
          if (!hasBtn && destinationLink) {
            return (
              <Link
                key={slide.id || idx}
                href={destinationLink}
                className="min-w-full w-full block cursor-pointer"
              >
                {slideContent}
              </Link>
            );
          }

          return slideContent;
        })}
      </div>

      {/* Navigation Arrows (Shown on multi-slide) */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-neutral-800 hover:text-black backdrop-blur-md border border-neutral-200/80 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-5 h-5 -ml-0.5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-neutral-800 hover:text-black backdrop-blur-md border border-neutral-200/80 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-md"
          >
            <ChevronRight className="w-5 h-5 -mr-0.5" />
          </button>
        </>
      )}

      {/* Slide Progress Indicator Dots / Dashes */}
      {totalSlides > 1 && (
        <div className="absolute bottom-5 sm:bottom-6 inset-x-0 z-20 flex items-center justify-center gap-2">
          {resolvedSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                idx === currentIndex
                  ? "w-8 bg-[#D4AF37] shadow-sm"
                  : "w-2.5 bg-neutral-400/60 hover:bg-neutral-600"
              }`}
            />
          ))}
        </div>
      )}
      </div>
    </section>
  );
}

export default PromoBanner;
