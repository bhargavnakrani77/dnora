"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnnouncementConfig, AnnouncementItem } from "@/types";

const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "ann-3",
    text: "Artisan Handcrafted in Florence, Italy • Limited Atelier Batch Production",
    link: "/#editorial",
    badge: "Craftsmanship",
    is_active: true,
  },
  {
    id: "ann-4",
    text: "Extra 5% Courtesy Privilege on All Prepaid Registrations • Code: PRIVÉ5",
    link: "/shop",
    badge: "Exclusive",
    is_active: true,
  },
];

export function AnnouncementBar({ initialConfig }: { initialConfig?: AnnouncementConfig | null }) {
  const pathname = usePathname();

  const [config, setConfig] = useState<AnnouncementConfig>(() => initialConfig || {
    id: "default",
    interval_seconds: 4,
    is_active: true,
    items: DEFAULT_ANNOUNCEMENTS,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch live announcement items from database
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data: AnnouncementConfig = await res.json();
          if (isMounted && data && Array.isArray(data.items) && data.items.length > 0) {
            const activeOnly = data.items.filter((item) => item.is_active);
            if (activeOnly.length > 0) {
              setConfig(data);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load announcement bar config:", err);
      }
    }

    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeItems: AnnouncementItem[] = (config.items || []).filter((i) => i.is_active);
  const items = activeItems.length > 0 ? activeItems : DEFAULT_ANNOUNCEMENTS;

  const goToNext = useCallback(() => {
    if (items.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setIsTransitioning(false);
    }, 220);
  }, [items.length]);

  const goToPrev = useCallback(() => {
    if (items.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      setIsTransitioning(false);
    }, 220);
  }, [items.length]);

  // Auto-swiping ticker with pause-on-hover
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!config.is_active || items.length <= 1 || isHovered) return;

    const intervalMs = Math.max(2, config.interval_seconds || 4) * 1000;
    timerRef.current = setInterval(() => {
      goToNext();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config.interval_seconds, config.is_active, items.length, isHovered, goToNext]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  if (!config.is_active || items.length === 0) {
    return null;
  }

  const current = items[currentIndex % items.length] || items[0];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-[#e5e5e8] text-neutral-950 border-b border-black/10 select-none relative z-50 transition-colors duration-200 print:hidden"
      aria-label="Store Announcements"
    >
      <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 xl:px-12 py-1 sm:py-1.5 flex items-center justify-between min-h-[30px] sm:min-h-[32px]">
        {/* Left Arrow */}
        {items.length > 1 ? (
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous announcement"
            className="text-neutral-500 hover:text-black p-0.5 sm:p-1 transition-all rounded hover:bg-neutral-200/70 active:scale-95 shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        {/* Center Animated Announcement Content */}
        <div className="flex-1 px-2 text-center overflow-hidden">
          <div
            className={`inline-flex items-center justify-center gap-2 sm:gap-2.5 transition-all duration-300 ease-out transform ${
              isTransitioning
                ? "opacity-0 -translate-y-1.5"
                : "opacity-100 translate-y-0"
            }`}
          >
            {/* Announcement Message (Clickable or Text) */}
            {current.link ? (
              <Link
                href={current.link}
                className="group inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] sm:tracking-[0.16em] uppercase text-neutral-900 hover:text-black transition-colors"
              >
                <span className="group-hover:underline underline-offset-4 decoration-neutral-900/40">
                  {current.text}
                </span>
                <span className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all text-xs leading-none">
                  →
                </span>
              </Link>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] sm:tracking-[0.16em] uppercase text-neutral-900">
                {current.text}
              </span>
            )}
          </div>
        </div>

        {/* Right Arrow */}
        {items.length > 1 ? (
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next announcement"
            className="text-neutral-500 hover:text-black p-0.5 sm:p-1 transition-all rounded hover:bg-neutral-200/70 active:scale-95 shrink-0 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}
      </div>
    </aside>
  );
}

export default AnnouncementBar;
