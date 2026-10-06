"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Upload,
  Check,
  X,
  Loader2,
  Move,
  Sparkles,
  Maximize2,
  Minimize2,
  Sliders,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ShoppingBag,
} from "lucide-react";
import { uploadDirectToCloudinary } from "@/lib/cloudinary/client-upload";

interface ProductImageAdjustModalProps {
  isOpen: boolean;
  initialImageUrl?: string;
  productName?: string;
  productPrice?: number | string;
  onClose: () => void;
  onSave: (url: string, publicId?: string) => void;
  title?: string;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1067; // 3:4 portrait ratio (800x1067)

export function ProductImageAdjustModal({
  isOpen,
  initialImageUrl,
  productName = "DNORA Luxury Silhouette",
  productPrice = "1,299",
  onClose,
  onSave,
  title = "Adjust & Fit Image to Product Card (3:4)",
}: ProductImageAdjustModalProps) {
  const [imageSrc, setImageSrc] = useState<string>(initialImageUrl || "");
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FAF8F5"); // DNORA Atelier warm white
  const [naturalAspect, setNaturalAspect] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opened with a new image URL
  useEffect(() => {
    if (isOpen && initialImageUrl) {
      setImageSrc(initialImageUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialImageUrl]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const nw = e.currentTarget.naturalWidth || 800;
    const nh = e.currentTarget.naturalHeight || 800;
    const asp = nw / nh;
    setNaturalAspect(asp);
  };

  // Quick Preset Handlers
  const handleFitEntire = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  const handleFillCard = () => {
    setZoom(1.25);
    setPan({ x: 0, y: 0 });
  };

  const handleCenter = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleBaselineBottom = () => {
    // Aligns bottom of image to baseline (~8% off bottom border)
    setZoom(1);
    setPan({ x: 0, y: 35 });
  };

  // Mouse / Touch Drag handlers for panning & mobile pinch zoom
  const lastTouchDist = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDist.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / lastTouchDist.current;
      setZoom((z) => Math.min(Math.max(0.4, Number((z * factor).toFixed(2))), 3.0));
      lastTouchDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDist.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(0.4, prev + delta), 3.0));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setImageSrc(event.target.result);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(file);
  };

  // Final Canvas Render & Direct Cloudinary Upload
  const handleSaveAndUpload = async () => {
    if (!imageSrc) return;
    setProcessing(true);

    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;

      await new Promise<void>((resolve, reject) => {
        if (img.complete) resolve();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load source image for canvas render"));
      });

      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not obtain 2D canvas context");

      // 1. Fill luxury background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Calculate scaling and draw image with pan & zoom
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const aspect = nw / nh;

      // Base dimension matching inside 3:4 canvas
      let drawW: number;
      let drawH: number;

      if (aspect > 3 / 4) {
        // Wider than 3:4 -> fit width
        drawW = CANVAS_WIDTH;
        drawH = CANVAS_WIDTH / aspect;
      } else {
        // Taller than 3:4 -> fit height
        drawH = CANVAS_HEIGHT;
        drawW = CANVAS_HEIGHT * aspect;
      }

      // Apply zoom
      drawW *= zoom;
      drawH *= zoom;

      // Scale pan offset from preview container (assume preview is ~270px wide)
      const previewW = containerRef.current?.clientWidth || 270;
      const scaleFactor = CANVAS_WIDTH / previewW;
      const scaledPanX = pan.x * scaleFactor;
      const scaledPanY = pan.y * scaleFactor;

      const posX = (CANVAS_WIDTH - drawW) / 2 + scaledPanX;
      const posY = (CANVAS_HEIGHT - drawH) / 2 + scaledPanY;

      ctx.drawImage(img, posX, posY, drawW, drawH);

      // 3. Export to High-Quality Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/webp", 0.95);
      });

      if (!blob) throw new Error("Canvas blob generation failed");

      // 4. Upload directly to Cloudinary
      const res = await uploadDirectToCloudinary(blob, {
        folder: "dnora/catalog",
        resourceType: "image",
      });

      onSave(res.secure_url, res.public_id);
      onClose();
    } catch (err: unknown) {
      console.error("Image adjustment upload failed:", err);
      alert("Failed to process image: " + (err instanceof Error ? err.message : "Network error"));
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-950 font-serif tracking-wide">
                {title}
              </h3>
              <p className="text-[11px] text-neutral-400 font-light">
                Position, zoom, or align your bag to fit the 3:4 storefront card frame perfectly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two Columns (Left: Workspace, Right: Live Card Preview) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-y-auto bg-neutral-50/50 flex-1">
          {/* Left: Interactive 3:4 Canvas Workspace (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-center space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 self-start flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5" /> Drag &amp; Position Handbag
            </span>

            {/* 3:4 Interactive Frame */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onWheel={handleWheel}
              className="relative w-64 sm:w-72 aspect-3/4 rounded-xl overflow-hidden border-2 border-neutral-300 shadow-md cursor-grab active:cursor-grabbing select-none touch-none"
              style={{ backgroundColor }}
            >
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Workspace"
                  onLoad={handleImageLoad}
                  className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 p-4 text-center">
                  <Upload className="w-8 h-8 mb-2" />
                  <p className="text-xs font-semibold text-neutral-700">No Image Selected</p>
                  <p className="text-[10px]">Select a file below to start</p>
                </div>
              )}

              {/* 3:4 Subtle Frame Guidelines */}
              <div className="absolute inset-0 border border-black/10 rounded-xl pointer-events-none" />
              <div className="absolute bottom-2 inset-x-2 text-center pointer-events-none">
                <span className="text-[9px] bg-black/60 text-white/90 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider backdrop-blur-xs">
                  Exact 3:4 Card Frame
                </span>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="w-full max-w-xs space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600">
                <span>Scale / Zoom</span>
                <span className="font-mono text-neutral-900">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                  className="p-1 text-neutral-500 hover:text-black rounded bg-white border border-neutral-200 cursor-pointer shadow-2xs"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.02"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(2))))}
                  className="p-1 text-neutral-500 hover:text-black rounded bg-white border border-neutral-200 cursor-pointer shadow-2xs"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Alignment Presets */}
            <div className="w-full max-w-sm space-y-2 pt-2 border-t border-neutral-200">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 block">
                Quick Align Presets
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={handleBaselineBottom}
                  className="px-2 py-1.5 bg-white border border-neutral-200 hover:border-black rounded-lg text-[10.5px] font-semibold text-neutral-800 flex flex-col items-center gap-1 shadow-2xs cursor-pointer transition active:scale-95"
                  title="Align to bottom floor so all bags sit evenly"
                >
                  <AlignVerticalJustifyEnd className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Sit on Floor</span>
                </button>
                <button
                  type="button"
                  onClick={handleCenter}
                  className="px-2 py-1.5 bg-white border border-neutral-200 hover:border-black rounded-lg text-[10.5px] font-semibold text-neutral-800 flex flex-col items-center gap-1 shadow-2xs cursor-pointer transition active:scale-95"
                  title="Center bag vertically and horizontally"
                >
                  <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Center</span>
                </button>
                <button
                  type="button"
                  onClick={handleFitEntire}
                  className="px-2 py-1.5 bg-white border border-neutral-200 hover:border-black rounded-lg text-[10.5px] font-semibold text-neutral-800 flex flex-col items-center gap-1 shadow-2xs cursor-pointer transition active:scale-95"
                  title="Fit whole bag with breathing room"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Fit All</span>
                </button>
                <button
                  type="button"
                  onClick={handleFillCard}
                  className="px-2 py-1.5 bg-white border border-neutral-200 hover:border-black rounded-lg text-[10.5px] font-semibold text-neutral-800 flex flex-col items-center gap-1 shadow-2xs cursor-pointer transition active:scale-95"
                  title="Fill card edge-to-edge"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Fill Card</span>
                </button>
              </div>
            </div>

            {/* Background Color Picker */}
            <div className="w-full max-w-sm flex items-center justify-between pt-1">
              <span className="text-[11px] font-medium text-neutral-600">Background Color:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { name: "Atelier Warm White", hex: "#FAF8F5" },
                  { name: "Pure White", hex: "#FFFFFF" },
                  { name: "Soft Linen", hex: "#F5F3EF" },
                  { name: "Noir Black", hex: "#111111" },
                ].map((bg) => (
                  <button
                    key={bg.hex}
                    type="button"
                    onClick={() => setBackgroundColor(bg.hex)}
                    title={bg.name}
                    className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                      backgroundColor === bg.hex ? "ring-2 ring-black scale-110" : "border-neutral-300"
                    }`}
                    style={{ backgroundColor: bg.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Storefront Card Preview (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025] block">
                Live Storefront Preview
              </span>
              <p className="text-xs font-bold text-neutral-900 mt-0.5">
                Exact look on Customer Catalog
              </p>
            </div>

            {/* Exact Miniature Replica of DNORA ProductCard */}
            <div className="w-48 sm:w-52 bg-white rounded-xl border border-neutral-200 shadow-sm p-2 space-y-2 select-none pointer-events-none">
              {/* Product Image Frame */}
              <div
                className="relative aspect-3/4 rounded-lg overflow-hidden border border-neutral-200/70"
                style={{ backgroundColor }}
              >
                {imageSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    style={{
                      transform: `translate(${pan.x * 0.7}px, ${pan.y * 0.7}px) scale(${zoom})`,
                    }}
                  />
                )}
              </div>

              {/* Details & Button */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-neutral-900 truncate uppercase tracking-wider">
                  {productName}
                </p>
                <p className="text-[10px] text-neutral-400 font-light truncate">
                  Handcrafted Italian calfskin
                </p>
                <p className="text-xs font-bold text-neutral-950 font-mono">
                  ₹{productPrice}
                </p>
                <div className="w-full py-1.5 bg-neutral-900 text-white text-[9.5px] font-bold uppercase tracking-wider rounded-md text-center flex items-center justify-center gap-1 mt-1.5 shadow-2xs">
                  <ShoppingBag className="w-3 h-3 text-white" />
                  <span>ADD TO BAG</span>
                </div>
              </div>
            </div>

            <p className="text-[10.5px] text-neutral-400 text-center max-w-xs font-light">
              Tip: Click <strong className="text-neutral-800">"Sit on Floor"</strong> so clutches and handbags sit on the same bottom line!
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-white">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black font-semibold cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Different Image</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 border border-neutral-300 hover:border-black rounded-xl text-xs font-bold text-neutral-800 cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndUpload}
              disabled={processing || !imageSrc}
              className="inline-flex items-center gap-2 px-5 py-2 bg-neutral-950 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md transition disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Optimizing &amp; Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply &amp; Fit to Card</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
