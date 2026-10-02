"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Volume2,
  VolumeX,
} from "lucide-react";
import { HeroBanner as HeroBannerType } from "@/types";

export interface HeroSlide {
  id: string;
  media_type: "image" | "video";
  media_url: string; // Desktop / Large screen
  tablet_media_url?: string; // Tablet screen
  mobile_media_url?: string; // Mobile screen
  heading?: string;
  subtitle?: string;
  button_text?: string;
  link: string;
  duration_seconds?: number;
}

// Luxury hero slides using Cloudinary dnora/herobanner assets
const HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-handbag-offer",
    media_type: "image",
    media_url: "https://res.cloudinary.com/izdmpa4z/image/upload/v1790125400/dnora/herobanner/hero-banner-1-desktop.png",
    tablet_media_url: "https://res.cloudinary.com/izdmpa4z/image/upload/v1790125400/dnora/herobanner/hero-banner-1-desktop.png",
    mobile_media_url: "https://res.cloudinary.com/izdmpa4z/image/upload/v1790125406/dnora/herobanner/hero-banner-1-mobile.png",
    link: "/shop",
    duration_seconds: 5,
  },
  {
    id: "slide-glam-entrance",
    media_type: "image",
    media_url: "https://res.cloudinary.com/izdmpa4z/image/upload/v1790125415/dnora/herobanner/hero-banner-2-desktop.png",
    tablet_media_url: "https://res.cloudinary.com/izdmpa4z/image/upload/v1790125415/dnora/herobanner/hero-banner-2-desktop.png",
    mobile_media_url: "https://res.cloudinary.com/izdmpa4z/image/upload/v1790125422/dnora/herobanner/hero-banner-2-mobile.jpg",
    link: "/shop",
    duration_seconds: 5,
  },
  {
    id: "slide-atelier-video",
    media_type: "video",
    media_url: "https://res.cloudinary.com/izdmpa4z/video/upload/v1790125426/dnora/herobanner/hero-video-1.mp4",
    link: "/shop",
    duration_seconds: 9,
  },
];

export function HeroBanner({
  initialSlides,
  slides,
}: {
  initialSlides?: HeroSlide[];
  slides?: HeroSlide[];
}) {
  const defaultSlides =
    initialSlides && initialSlides.length > 0
      ? initialSlides
      : slides && slides.length > 0
      ? slides
      : HERO_SLIDES;

  const [liveSlides, setLiveSlides] = useState<HeroSlide[]>(defaultSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamically load published hero banners from the database
  useEffect(() => {
    let isMounted = true;
    async function fetchBanners() {
      try {
        const res = await fetch("/api/heroes");
        if (res.ok) {
          const data = await res.json();
          if (data.banners && Array.isArray(data.banners) && data.banners.length > 0) {
            const active = data.banners
              .filter((b: HeroBannerType) => b.is_active && b.status === "published")
              .map((b: HeroBannerType) => ({
                id: b.id,
                media_type: b.media_type,
                media_url: b.media_url,
                tablet_media_url: b.tablet_media_url || undefined,
                mobile_media_url: b.mobile_media_url || undefined,
                heading: b.heading || undefined,
                subtitle: b.subtitle || undefined,
                button_text: b.button_text || undefined,
                link: b.button_link || "/shop",
                duration_seconds: b.duration_seconds || 5,
              }));
            if (isMounted && active.length > 0) {
              setLiveSlides(active);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load hero banners:", err);
      }
    }
    fetchBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentSlide = liveSlides[currentIndex % liveSlides.length] || liveSlides[0];

  const goToNext = useCallback(() => {
    if (liveSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % liveSlides.length);
  }, [liveSlides.length]);

  const goToPrev = useCallback(() => {
    if (liveSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + liveSlides.length) % liveSlides.length);
  }, [liveSlides.length]);

  // Handle slide timing:
  // 1. Video auto-swipes when it finishes (onEnded) with a safety fallback
  // 2. Images auto-swipe after a fixed time (5 seconds)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isPaused || liveSlides.length <= 1) return;

    if (currentSlide.media_type === "image") {
      const durationMs = Math.max(3, currentSlide.duration_seconds || 5) * 1000;
      timerRef.current = setTimeout(() => {
        goToNext();
      }, durationMs);
    } else if (currentSlide.media_type === "video") {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      // Safety timer in case onEnded event does not fire
      const fallbackMs = Math.max(5, (currentSlide.duration_seconds || 9) + 1) * 1000;
      timerRef.current = setTimeout(() => {
        goToNext();
      }, fallbackMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, currentSlide, goToNext, liveSlides.length, isPaused]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 45) {
      goToNext(); // Swipe left -> next
    } else if (diff < -45) {
      goToPrev(); // Swipe right -> prev
    }
    setTouchStartX(null);
  };

  if (!liveSlides || liveSlides.length === 0) return null;

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="group relative w-full aspect-square sm:aspect-16/9 md:aspect-[1024/346] max-h-[640px] bg-neutral-950 overflow-hidden select-none cursor-pointer"
      aria-label="DNORA Hero Banner"
    >
      {/* Sliding Track for Horizontal Push Transition (Previous banner pushes current banner) */}
      <div
        className="flex w-full h-full transition-transform duration-700 ease-in-out will-change-transform"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {liveSlides.map((slide, index) => {
          const isCurrent = index === currentIndex;
          return (
            <div
              key={slide.id}
              className="relative w-full h-full shrink-0 flex-none overflow-hidden"
            >
              <Link
                href={slide.link || "/shop"}
                className="block relative w-full h-full focus:outline-hidden"
                aria-label={`Banner slide ${index + 1}`}
              >
                {slide.media_type === "video" ? (
                  <video
                    ref={isCurrent ? videoRef : undefined}
                    autoPlay
                    muted={isMuted}
                    playsInline
                    onEnded={goToNext}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    key={`${slide.id}-${isCurrent ? "active" : "idle"}`}
                  >
                    {slide.mobile_media_url && (
                      <source src={slide.mobile_media_url} media="(max-width: 639px)" />
                    )}
                    {slide.tablet_media_url && (
                      <source
                        src={slide.tablet_media_url}
                        media="(min-width: 640px) and (max-width: 1023px)"
                      />
                    )}
                    <source src={slide.media_url} media="(min-width: 1024px)" />
                    <source src={slide.media_url} />
                  </video>
                ) : (
                  <picture className="block relative w-full h-full">
                    {/* Desktop / Large Screen: min-width 1024px */}
                    <source
                      media="(min-width: 1024px)"
                      srcSet={slide.media_url}
                    />
                    {/* Tablet Screen: min-width 640px to 1023px */}
                    <source
                      media="(min-width: 640px)"
                      srcSet={slide.tablet_media_url || slide.media_url}
                    />
                    {/* Mobile Screen: max-width 639px */}
                    <source
                      media="(max-width: 639px)"
                      srcSet={slide.mobile_media_url || slide.tablet_media_url || slide.media_url}
                    />
                    {/* Fallback image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.media_url}
                      alt={slide.heading || "DNORA Luxury Collection"}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </picture>
                )}

                {/* Optional Haute Couture Text Overlay if Heading / Subheading / Button is present */}
                {(slide.heading || slide.subtitle || slide.button_text) && (
                  <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-10 md:p-16 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none">
                    <div className="max-w-2xl space-y-2 pointer-events-none">
                      {slide.subtitle && (
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-neutral-300">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.heading && (
                        <h2 className="text-xl sm:text-3xl md:text-5xl font-serif tracking-wider uppercase text-white font-light drop-shadow-md">
                          {slide.heading}
                        </h2>
                      )}
                      {slide.button_text && (
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-2 px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-black bg-white hover:bg-neutral-100 transition shadow-lg pointer-events-auto">
                            {slide.button_text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Video Audio Control Toggle (only shown when current slide is a video) */}
      {currentSlide.media_type === "video" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted((prev) => !prev);
          }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all border border-white/20 cursor-pointer shadow-lg"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          title={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}



      {/* Minimalist Bottom Indicator Bars */}
      {liveSlides.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 inset-x-0 z-20 flex items-center justify-center gap-1.5 sm:gap-2 pointer-events-auto">
          {liveSlides.map((slide, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                aria-label={`Go to slide ${index + 1}`}
                className="h-1 rounded-full transition-all duration-300 overflow-hidden cursor-pointer focus:outline-hidden"
                style={{
                  width: isActive ? "32px" : "10px",
                  backgroundColor: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export default HeroBanner;
