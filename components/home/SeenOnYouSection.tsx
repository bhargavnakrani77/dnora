"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Volume2, VolumeX, X, ShoppingBag, ArrowRight } from "lucide-react";
import { SeenOnYouVideo } from "@/types";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface SeenOnYouSectionProps {
  videos: SeenOnYouVideo[];
}

export function SeenOnYouSection({ videos }: SeenOnYouSectionProps) {
  const [activeVideo, setActiveVideo] = useState<SeenOnYouVideo | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-play videos when user scrolls into the section
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Trigger play on all videos when section is in view
  useEffect(() => {
    if (!scrollRef.current) return;
    const vids = scrollRef.current.querySelectorAll<HTMLVideoElement>("video");
    vids.forEach((v) => {
      if (isInView) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [isInView]);

  if (!videos || videos.length === 0) return null;

  const isFew = videos.length <= 5;

  return (
    <section
      ref={sectionRef}
      id="seen-on-you"
      aria-label="Seen On You"
      className="w-full bg-white pt-10 pb-12 sm:pt-14 sm:pb-16 md:pt-16 md:pb-20 border-b border-neutral-100 overflow-x-clip"
    >
      <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Heading with Montserrat Font identical to Our Collections */}
        <SectionHeading title="SEEN ON YOU" />

        {/* Carousel / Grid Container (Arrows removed per request) */}
        <div className="relative group/carousel">
          {/* Video Cards Track */}
          <div
            ref={scrollRef}
            className={`flex items-center gap-2.5 sm:gap-3 md:gap-3.5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 px-1 -mx-1 ${
              isFew ? "justify-center" : "justify-start 2xl:justify-center"
            }`}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              justifyContent: isFew ? "center" : "safe center",
            }}
          >
            {videos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setActiveVideo(vid)}
                className="group relative flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] aspect-[9/16] rounded-xl overflow-hidden bg-neutral-900 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer snap-start"
              >
                {/* Background Video Preview / Poster with Auto-Play */}
                {vid.video_url ? (
                  <video
                    src={vid.video_url}
                    poster={vid.thumbnail_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : vid.thumbnail_url ? (
                  <Image
                    src={vid.thumbnail_url}
                    alt={vid.caption || vid.customer_name}
                    fill
                    sizes="240px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white/40">
                    <Play className="w-8 h-8" />
                  </div>
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                {/* Top Badge: Creator Handle */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] sm:text-[11px] font-semibold text-white tracking-wide border border-white/10">
                    {vid.customer_name}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                </div>

                {/* Bottom Overlay: Caption & Product Tag */}
                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-3.5 text-white z-10 pointer-events-none">
                  {vid.caption && (
                    <p className="text-[11px] sm:text-xs text-neutral-200 line-clamp-2 font-light leading-snug mb-2">
                      &ldquo;{vid.caption}&rdquo;
                    </p>
                  )}

                  {vid.product_name && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 text-neutral-900 text-[10px] sm:text-[11px] font-semibold tracking-wide shadow-md">
                      <ShoppingBag className="w-3 h-3 text-neutral-900" />
                      <span className="truncate max-w-[140px] sm:max-w-[160px]">{vid.product_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal Lightbox */}
      {activeVideo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setActiveVideo(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm sm:max-w-md aspect-[9/16] max-h-[85vh] rounded-2xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveVideo(null)}
              aria-label="Close video"
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mute / Unmute Button */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              className="absolute top-4 left-4 z-30 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Video Element */}
            <div className="absolute inset-0">
              <video
                src={activeVideo.video_url}
                poster={activeVideo.thumbnail_url}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />
            </div>

            {/* Modal Bottom Controls / Product Link */}
            <div className="relative z-20 mt-auto p-5 space-y-3 text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide">{activeVideo.customer_name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-widest">
                  Verified Patron
                </span>
              </div>

              <p className="text-xs sm:text-sm text-neutral-200 font-light leading-snug">
                {activeVideo.caption}
              </p>

              {activeVideo.product_slug ? (
                <Link
                  href={`/product/${activeVideo.product_slug}`}
                  onClick={() => setActiveVideo(null)}
                  className="w-full py-3 px-4 bg-white text-black hover:bg-[#D4AF37] hover:text-black font-semibold text-xs uppercase tracking-[0.2em] rounded-md flex items-center justify-center gap-2 shadow-xl transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop This Handbag</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : activeVideo.product_name ? (
                <Link
                  href="/shop"
                  onClick={() => setActiveVideo(null)}
                  className="w-full py-3 px-4 bg-white text-black hover:bg-[#D4AF37] hover:text-black font-semibold text-xs uppercase tracking-[0.2em] rounded-md flex items-center justify-center gap-2 shadow-xl transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SeenOnYouSection;
