"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";

interface CircularImageCropperModalProps {
  isOpen: boolean;
  initialImageUrl?: string;
  onClose: () => void;
  onCropComplete: (url: string) => void;
  title?: string;
}

export function CircularImageCropperModal({
  isOpen,
  initialImageUrl,
  onClose,
  onCropComplete,
  title = "Adjust Circular Image",
}: CircularImageCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string>(initialImageUrl || "");
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [fitMode, setFitMode] = useState<"fit" | "fill">("fit");
  const [baseSize, setBaseSize] = useState<{ width: number; height: number }>({ width: 240, height: 240 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync state when props change during render
  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [prevInitialUrl, setPrevInitialUrl] = useState(initialImageUrl);

  if (isOpen !== prevOpen || initialImageUrl !== prevInitialUrl) {
    setPrevOpen(isOpen);
    setPrevInitialUrl(initialImageUrl);
    if (isOpen && initialImageUrl) {
      setImageSrc(initialImageUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }

  const applyDimensions = (mode: "fit" | "fill") => {
    if (!imgRef.current) return;
    const nw = imgRef.current.naturalWidth || 260;
    const nh = imgRef.current.naturalHeight || 260;
    const aspect = nw / nh;

    if (mode === "fit") {
      // Fit entire handbag comfortably inside the 260px circle with 20px breathing room
      const targetSize = 220;
      if (aspect >= 1) {
        setBaseSize({ width: targetSize, height: targetSize / aspect });
      } else {
        setBaseSize({ width: targetSize * aspect, height: targetSize });
      }
    } else {
      // Fill circle completely (covers edge-to-edge)
      const targetSize = 260;
      if (aspect >= 1) {
        setBaseSize({ width: targetSize * aspect, height: targetSize });
      } else {
        setBaseSize({ width: targetSize, height: targetSize / aspect });
      }
    }
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleImageLoad = () => {
    applyDimensions(fitMode);
  };

  const handleToggleMode = (mode: "fit" | "fill") => {
    setFitMode(mode);
    applyDimensions(mode);
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

  // Mouse & Touch Pan Handling
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch Support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(Math.max(0.5, Number((prev + zoomStep).toFixed(2))), 3.5));
  };

  const handleReset = () => {
    applyDimensions(fitMode);
  };

  // Export cropped circular image to canvas with exact screen-aligned subpixel math
  const handleCropAndApply = async () => {
    if (!imgRef.current || !viewportRef.current || !maskRef.current) return;

    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      // Export high resolution 600x600 for sharp luxury display
      const exportSize = 600;
      canvas.width = exportSize;
      canvas.height = exportSize;

      const img = imgRef.current;
      const mask = maskRef.current;

      const imgRect = img.getBoundingClientRect();
      const maskRect = mask.getBoundingClientRect();

      // Exact scale factor from 260px on-screen preview to 600px export
      const scale = exportSize / maskRect.width;

      // Difference between image center and mask center
      const imgCenterX = imgRect.left + imgRect.width / 2;
      const imgCenterY = imgRect.top + imgRect.height / 2;
      const maskCenterX = maskRect.left + maskRect.width / 2;
      const maskCenterY = maskRect.top + maskRect.height / 2;

      const diffX = imgCenterX - maskCenterX;
      const diffY = imgCenterY - maskCenterY;

      const exportW = imgRect.width * scale;
      const exportH = imgRect.height * scale;
      const exportX = (exportSize / 2) + (diffX * scale) - (exportW / 2);
      const exportY = (exportSize / 2) + (diffY * scale) - (exportH / 2);

      // Fill background with pure white #FFFFFF (seamlessly blends with storefront circular cards)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, exportSize, exportSize);

      // Draw image onto canvas
      ctx.drawImage(img, exportX, exportY, exportW, exportH);

      let blob: Blob | null = null;
      try {
        blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png")
        );
      } catch (taintErr) {
        console.warn("Canvas export tainted, using fallback:", taintErr);
      }

      if (!blob) {
        if (imageSrc && (imageSrc.startsWith("http://") || imageSrc.startsWith("https://"))) {
          onCropComplete(imageSrc);
          onClose();
          return;
        }
        throw new Error("Failed to export image preview. Please try uploading the image directly.");
      }

      // Upload blob to media upload API
      const formData = new FormData();
      formData.append("file", blob, `category-crop-${Date.now()}.png`);
      formData.append("folder", "dnora/categories");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      const secureUrl =
        uploadData.secure_url ||
        uploadData.url ||
        uploadData.media?.secure_url ||
        uploadData.media?.url;

      if (!secureUrl) {
        throw new Error(uploadData.error || "No image URL returned from upload server");
      }

      onCropComplete(secureUrl);
      onClose();
    } catch (err: unknown) {
      console.error("Crop & upload error:", err);
      const msg = err instanceof Error ? err.message : "Failed to apply image";
      alert(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#0F141C] text-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-white/10 flex flex-col items-center gap-5">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                {title}
              </h3>
            </div>
            <p className="text-[11px] text-white/50 mt-0.5">
              Drag to position & choose Fit or Fill so the bag never cuts off.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fit Mode Controls */}
        <div className="w-full flex items-center justify-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => handleToggleMode("fit")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
              fitMode === "fit"
                ? "bg-white text-black shadow-xs"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Fit Entire Bag (સંપૂર્ણ બેગ દેખાય)</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode("fill")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
              fitMode === "fill"
                ? "bg-white text-black shadow-xs"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fill Circle (સંપૂર્ણ ભરો)</span>
          </button>
        </div>

        {/* Circular Viewport */}
        <div className="w-full flex flex-col items-center justify-center">
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className="relative w-[300px] h-[300px] bg-white rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 flex items-center justify-center shadow-inner"
          >
            {/* The Image being transformed */}
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                crossOrigin={imageSrc.startsWith("data:") ? undefined : "anonymous"}
                onLoad={handleImageLoad}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  width: `${baseSize.width}px`,
                  height: `${baseSize.height}px`,
                  maxWidth: "none",
                  maxHeight: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                className="transition-transform duration-75 will-change-transform"
              />
            ) : (
              <div className="text-xs text-neutral-400 text-center p-4">
                No image loaded. Please upload a photo below.
              </div>
            )}

            {/* Circular Mask Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                ref={maskRef}
                className="w-[260px] h-[260px] rounded-full shadow-[0_0_0_9999px_rgba(15,20,28,0.78)] ring-2 ring-white/90 relative"
              >
                {/* Subtle alignment crosshair indicator */}
                <div className="absolute inset-0 rounded-full border border-dashed border-white/20 pointer-events-none" />
              </div>
            </div>

            {/* Drag hint badge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[9.5px] uppercase font-bold tracking-widest text-white/90 flex items-center gap-1.5">
              <Move className="w-2.5 h-2.5" />
              <span>Drag to position</span>
            </div>
          </div>
        </div>

        {/* Zoom Slider & Quick Adjust Controls */}
        <div className="w-full space-y-3 px-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
              className="p-1.5 text-white/70 hover:text-white rounded-md hover:bg-white/10 transition cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3.0, Number((prev + 0.1).toFixed(2))))}
              className="p-1.5 text-white/70 hover:text-white rounded-md hover:bg-white/10 transition cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold text-white/80 w-10 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            {/* Choose file replacement */}
            <label className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white cursor-pointer px-2.5 py-1 rounded-md hover:bg-white/5 transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Reset pan & zoom */}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white px-2.5 py-1 rounded-md hover:bg-white/5 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Center / Reset</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="w-full flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 text-xs font-semibold text-white/70 hover:text-white rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropAndApply}
            disabled={processing || !imageSrc}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-neutral-200 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {processing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Applying & Uploading...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Apply Circular Crop</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
