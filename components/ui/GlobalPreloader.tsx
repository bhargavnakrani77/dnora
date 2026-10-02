"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DnoraLoadingScreen } from "./DnoraLoadingScreen";

export function GlobalPreloader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showInitial, setShowInitial] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Never show on admin pages
    if (pathname?.startsWith("/admin")) {
      return;
    }

    try {
      const alreadySeen = sessionStorage.getItem("dnora_intro_shown");
      if (alreadySeen) {
        return;
      }

      // Mark as seen immediately so refreshing the page or navigating won't trigger it again
      sessionStorage.setItem("dnora_intro_shown", "true");
      setShowInitial(true);

      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 1250);

      const unmountTimer = setTimeout(() => {
        setShowInitial(false);
      }, 1750);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    } catch {
      // In case sessionStorage is restricted in incognito/strict mode
    }
  }, [pathname]);

  // Guaranteed zero hydration mismatch: both SSR and initial client pass return null
  if (!mounted || !showInitial) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-all duration-700 ease-out pointer-events-auto ${
        isFadingOut
          ? "opacity-0 pointer-events-none scale-[1.01]"
          : "opacity-100 pointer-events-auto scale-100"
      }`}
    >
      <DnoraLoadingScreen
        fullScreen
        text="D'NORA LUXURY ESSENTIALS"
        subtitle="CRAFTING BESPOKE SILHOUETTES"
      />
    </div>
  );
}
