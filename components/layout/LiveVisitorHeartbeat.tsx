"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function LiveVisitorHeartbeat() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Generate or retrieve persistent session ID for this browser tab/device
    let vid: string | null = null;
    try {
      vid = sessionStorage.getItem("dnora_visitor_session_id");
      if (!vid) {
        vid = "v_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
        sessionStorage.setItem("dnora_visitor_session_id", vid);
      }
    } catch {
      vid = "v_" + Math.random().toString(36).substring(2, 9);
    }
    visitorIdRef.current = vid;

    // Do not track admin users as storefront customers
    if (pathname?.startsWith("/admin")) {
      return;
    }

    const lastPingRef = { current: 0 };
    const sendPing = (force = false) => {
      if (!visitorIdRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      
      const now = Date.now();
      // Throttle rapid route changes to max once every 30s
      if (!force && now - lastPingRef.current < 30000) return;
      lastPingRef.current = now;

      try {
        fetch("/api/analytics/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId: visitorIdRef.current,
            path: pathname || "/",
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Silently catch network interruption
      }
    };

    // Send initial ping on page mount
    sendPing();

    // Send ping every 60 seconds (1 minute) while device has website actively open
    const intervalId = setInterval(() => sendPing(true), 60000);

    // Immediate ping when window gains visibility/focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendPing();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Inform server immediately when user closes or unloads tab
    const handleUnload = () => {
      if (visitorIdRef.current && navigator.sendBeacon) {
        navigator.sendBeacon(
          `/api/analytics/heartbeat?action=leave&visitorId=${visitorIdRef.current}`
        );
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [pathname]);

  return null;
}

export default LiveVisitorHeartbeat;
