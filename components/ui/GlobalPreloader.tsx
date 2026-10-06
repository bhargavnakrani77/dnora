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

    // Never show on admin pages or developer portal
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/sys-diagnostics")) {
      return;
    }

    try {
      const alreadySeen = sessionStorage.getItem("dnora_intro_shown");
      if (alreadySeen) {
        return;
      }
      setShowInitial(true);
    } catch {
      // In case sessionStorage is restricted in incognito/strict mode
    }
  }, []);

  // Timer lifecycle is bound to showInitial so timers re-arm correctly across React StrictMode remounts
  useEffect(() => {
    if (!showInitial) return;

    try {
      sessionStorage.setItem("dnora_intro_shown", "true");
    } catch {}

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
  }, [showInitial]);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowInitial(false);
    }, 300);
  };

  // Guaranteed zero hydration mismatch: both SSR and initial client pass return null
  if (!mounted || !showInitial) {
    return null;
  }

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[9999] transition-all duration-700 ease-out cursor-pointer ${
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
