"use client";

import React, { useRef, useEffect, useState } from "react";

interface DnoraLoadingScreenProps {
  fullScreen?: boolean;
  text?: string;
  subtitle?: string;
  mode?: "light" | "admin" | "dark";
}

const LOGO_WIDTH = 728;
const LOGO_HEIGHT = 170;

// Letter X Bounds for handwriting strokes
const OX_D = 0;
const OW_D = 142;
const OX_N = 142;
const OW_N = 132;
const OX_O = 274;
const OW_O = 161;
const OX_R = 435;
const OW_R = 133;
const OX_A = 568;
const OW_A = 160;

// Bezier interpolation helper
function getBezierPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number
): [number, number] {
  const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0];
  const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1];
  return [x, y];
}

export function DnoraLoadingScreen({
  fullScreen = true,
  text = "D'NORA LUXURY ESSENTIALS",
  subtitle = "CRAFTING BESPOKE SILHOUETTES...",
  mode = "light",
}: DnoraLoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // Preload authentic DNORA logo
  useEffect(() => {
    const img = new Image();
    img.src = "/images/logo/dnora-logo-dark.png";
    img.onload = () => {
      logoImageRef.current = img;
      setIsImageLoaded(true);
    };
  }, []);

  // Continuous loop handwriting animation
  useEffect(() => {
    if (!isImageLoaded || !canvasRef.current || !logoImageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement("canvas");
    }
    const maskCanvas = maskCanvasRef.current;
    maskCanvas.width = LOGO_WIDTH;
    maskCanvas.height = LOGO_HEIGHT;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = LOGO_WIDTH * dpr;
    canvas.height = LOGO_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const strokeDuration = 1250; // 1.25s handwriting stroke
    const pauseDuration = 600;   // 0.6s hold on full logo
    const totalCycle = strokeDuration + pauseDuration;
    let cycleStart: number | null = null;

    const render = (timestamp: number) => {
      if (!cycleStart) cycleStart = timestamp;
      const cycleElapsed = (timestamp - cycleStart) % totalCycle;
      const p = Math.min(cycleElapsed / strokeDuration, 1.0);

      setProgressPercent(Math.floor(p * 100));

      // When stroke completes, show authentic logo directly
      if (p >= 1.0) {
        ctx.clearRect(0, 0, LOGO_WIDTH, LOGO_HEIGHT);
        ctx.drawImage(logoImageRef.current!, 0, 0, LOGO_WIDTH, LOGO_HEIGHT);
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      // Draw strokes onto mask canvas
      maskCtx.clearRect(0, 0, LOGO_WIDTH, LOGO_HEIGHT);
      maskCtx.fillStyle = "#FFFFFF";
      maskCtx.strokeStyle = "#FFFFFF";
      maskCtx.lineCap = "round";
      maskCtx.lineJoin = "round";

      // LETTER 1: D (0.00 -> 0.20)
      if (p >= 0.2) {
        maskCtx.fillRect(OX_D, 0, OW_D, LOGO_HEIGHT);
      } else if (p > 0.0) {
        maskCtx.save();
        maskCtx.beginPath();
        maskCtx.rect(OX_D, 0, OW_D, LOGO_HEIGHT);
        maskCtx.clip();

        const lp1 = Math.min(1.0, p / 0.08);
        maskCtx.beginPath();
        maskCtx.moveTo(OX_D + 32, 5);
        maskCtx.lineTo(OX_D + 32, 5 + (165 - 5) * lp1);
        maskCtx.lineWidth = 65;
        maskCtx.stroke();

        if (p > 0.08) {
          const lp2 = Math.min(1.0, (p - 0.08) / 0.12);
          maskCtx.beginPath();
          maskCtx.moveTo(OX_D + 32, 15);
          const steps = Math.max(2, Math.floor(lp2 * 40));
          for (let i = 1; i <= steps; i++) {
            const t = (i / 40) * lp2;
            let pt: [number, number];
            if (t <= 0.5) {
              const u = t * 2;
              pt = getBezierPoint([OX_D + 32, 15], [OX_D + 130, 20], [OX_D + 138, 85], u);
            } else {
              const u = (t - 0.5) * 2;
              pt = getBezierPoint([OX_D + 138, 85], [OX_D + 130, 150], [OX_D + 32, 155], u);
            }
            maskCtx.lineTo(pt[0], pt[1]);
          }
          maskCtx.lineWidth = 80;
          maskCtx.stroke();
        }
        maskCtx.restore();
      }

      // LETTER 2: N (0.20 -> 0.42)
      if (p >= 0.42) {
        maskCtx.fillRect(OX_N, 0, OW_N, LOGO_HEIGHT);
      } else if (p > 0.2) {
        maskCtx.save();
        maskCtx.beginPath();
        maskCtx.rect(OX_N, 0, OW_N, LOGO_HEIGHT);
        maskCtx.clip();

        const lp1 = Math.min(1.0, (p - 0.2) / 0.07);
        maskCtx.beginPath();
        maskCtx.moveTo(OX_N + 18, 165);
        maskCtx.lineTo(OX_N + 18, 165 - (165 - 5) * lp1);
        maskCtx.lineWidth = 56;
        maskCtx.stroke();

        if (p > 0.27) {
          const lp2 = Math.min(1.0, (p - 0.27) / 0.08);
          maskCtx.beginPath();
          maskCtx.moveTo(OX_N + 15, 10);
          maskCtx.lineTo(OX_N + 15 + (118 - 15) * lp2, 10 + (162 - 10) * lp2);
          maskCtx.lineWidth = 56;
          maskCtx.stroke();
        }

        if (p > 0.35) {
          const lp3 = Math.min(1.0, (p - 0.35) / 0.07);
          maskCtx.beginPath();
          maskCtx.moveTo(OX_N + 115, 165);
          maskCtx.lineTo(OX_N + 115, 165 - (165 - 5) * lp3);
          maskCtx.lineWidth = 56;
          maskCtx.stroke();
        }
        maskCtx.restore();
      }

      // LETTER 3: O (0.42 -> 0.60)
      if (p >= 0.6) {
        maskCtx.fillRect(OX_O, 0, OW_O, LOGO_HEIGHT);
      } else if (p > 0.42) {
        maskCtx.save();
        maskCtx.beginPath();
        maskCtx.rect(OX_O, 0, OW_O, LOGO_HEIGHT);
        maskCtx.clip();

        const lp_o = Math.min(1.0, (p - 0.42) / 0.18);
        const cx = OX_O + 80;
        const cy = 85;
        const rx = 74;
        const ry = 72;
        const maxAngle = lp_o * 2 * Math.PI;
        const steps = Math.max(3, Math.floor(lp_o * 60));

        maskCtx.beginPath();
        maskCtx.moveTo(cx, cy - ry);
        for (let i = 1; i <= steps; i++) {
          const angle = (i / steps) * maxAngle;
          const px = cx + rx * Math.sin(angle);
          const py = cy - ry * Math.cos(angle);
          maskCtx.lineTo(px, py);
        }
        maskCtx.lineWidth = 65;
        maskCtx.stroke();
        maskCtx.restore();
      }

      // LETTER 4: R (0.60 -> 0.83)
      if (p >= 0.83) {
        maskCtx.fillRect(OX_R, 0, OW_R, LOGO_HEIGHT);
      } else if (p > 0.6) {
        maskCtx.save();
        maskCtx.beginPath();
        maskCtx.rect(OX_R, 0, OW_R, LOGO_HEIGHT);
        maskCtx.clip();

        const lp1 = Math.min(1.0, (p - 0.6) / 0.07);
        maskCtx.beginPath();
        maskCtx.moveTo(OX_R + 20, 5);
        maskCtx.lineTo(OX_R + 20, 5 + (165 - 5) * lp1);
        maskCtx.lineWidth = 56;
        maskCtx.stroke();

        if (p > 0.67) {
          const lp2 = Math.min(1.0, (p - 0.67) / 0.09);
          maskCtx.beginPath();
          maskCtx.moveTo(OX_R + 20, 15);
          const steps = Math.max(2, Math.floor(lp2 * 30));
          for (let i = 1; i <= steps; i++) {
            const t = (i / 30) * lp2;
            let pt: [number, number];
            if (t <= 0.5) {
              const u = t * 2;
              pt = getBezierPoint([OX_R + 20, 15], [OX_R + 120, 15], [OX_R + 120, 55], u);
            } else {
              const u = (t - 0.5) * 2;
              pt = getBezierPoint([OX_R + 120, 55], [OX_R + 120, 95], [OX_R + 20, 95], u);
            }
            maskCtx.lineTo(pt[0], pt[1]);
          }
          maskCtx.lineWidth = 65;
          maskCtx.stroke();
        }

        if (p > 0.76) {
          const lp3 = Math.min(1.0, (p - 0.76) / 0.07);
          maskCtx.beginPath();
          maskCtx.moveTo(OX_R + 25, 85);
          const steps = Math.max(2, Math.floor(lp3 * 25));
          for (let i = 1; i <= steps; i++) {
            const t = (i / 25) * lp3;
            const pt = getBezierPoint([OX_R + 25, 85], [OX_R + 70, 110], [OX_R + 132, 162], t);
            maskCtx.lineTo(pt[0], pt[1]);
          }
          maskCtx.lineWidth = 65;
          maskCtx.stroke();
        }
        maskCtx.restore();
      }

      // LETTER 5: A (0.83 -> 1.00)
      if (p >= 1.0) {
        maskCtx.fillRect(OX_A, 0, OW_A, LOGO_HEIGHT);
      } else if (p > 0.83) {
        maskCtx.save();
        maskCtx.beginPath();
        maskCtx.rect(OX_A, 0, OW_A, LOGO_HEIGHT);
        maskCtx.clip();

        const lp1 = Math.min(1.0, (p - 0.83) / 0.06);
        maskCtx.beginPath();
        maskCtx.moveTo(OX_A + 65, 5);
        maskCtx.lineTo(OX_A + 65 - (65 - 10) * lp1, 5 + (165 - 5) * lp1);
        maskCtx.lineWidth = 58;
        maskCtx.stroke();

        if (p > 0.89) {
          const lp2 = Math.min(1.0, (p - 0.89) / 0.06);
          maskCtx.beginPath();
          maskCtx.moveTo(OX_A + 65, 5);
          maskCtx.lineTo(OX_A + 65 + (140 - 65) * lp2, 5 + (165 - 5) * lp2);
          maskCtx.lineWidth = 58;
          maskCtx.stroke();
        }

        if (p > 0.95) {
          const lp3 = Math.min(1.0, (p - 0.95) / 0.05);
          maskCtx.beginPath();
          maskCtx.moveTo(OX_A + 20, 105);
          maskCtx.lineTo(OX_A + 20 + (110 - 20) * lp3, 105);
          maskCtx.lineWidth = 54;
          maskCtx.stroke();
        }
        maskCtx.restore();
      }

      // Draw authentic logo through mask
      ctx.clearRect(0, 0, LOGO_WIDTH, LOGO_HEIGHT);
      ctx.save();
      ctx.drawImage(logoImageRef.current!, 0, 0, LOGO_WIDTH, LOGO_HEIGHT);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(maskCanvas, 0, 0, LOGO_WIDTH, LOGO_HEIGHT);
      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isImageLoaded]);

  const bgStyles =
    mode === "admin"
      ? "bg-[#F8FAFC]"
      : mode === "dark"
      ? "bg-[#111111]"
      : "bg-[#FAF8F5]";

  const containerClasses = fullScreen
    ? `fixed inset-0 z-50 flex flex-col items-center justify-center ${bgStyles} select-none`
    : `w-full py-16 flex flex-col items-center justify-center ${bgStyles} select-none`;

  return (
    <div className={containerClasses} aria-label="Loading DNORA Atelier">
      {/* Subtle luxury ambient glow */}
      <div className="absolute w-72 h-72 rounded-full bg-[#C5A880]/10 blur-3xl pointer-events-none -translate-y-4" />

      <div className="relative flex flex-col items-center text-center space-y-5 px-6 max-w-sm">
        {/* Animated Handwriting Canvas Logo */}
        <div
          className="relative w-48 sm:w-56 h-12 sm:h-14 flex items-center justify-center"
          style={{ aspectRatio: `${LOGO_WIDTH} / ${LOGO_HEIGHT}` }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {/* Delicate Gold Shimmer Progress Bar */}
        <div className="w-36 sm:w-44 h-[1.5px] bg-[#E5DCD0] overflow-hidden rounded-full relative">
          <div
            className="h-full bg-gradient-to-r from-[#C5A880] via-[#9E7D4E] to-[#C5A880] transition-all duration-150 ease-out"
            style={{ width: `${Math.max(15, progressPercent)}%` }}
          />
        </div>

        {/* Luxury Typography */}
        <div className="space-y-1">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-[#111111] font-medium font-sans">
            {text}
          </p>
          <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C7A6B] font-mono font-light">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
