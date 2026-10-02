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
  const viewportRef = useRef<HTMLDivElement>(null);
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

  const handleImageLoad = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
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
    const zoomStep = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(Math.max(1, Number((prev + zoomStep).toFixed(2))), 3.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Export cropped circular image to canvas and upload
  const handleCropAndApply = async () => {
    if (!imgRef.current || !viewportRef.current) return;

    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      // We export high resolution 600x600 for sharp luxury display
      const exportSize = 600;
      canvas.width = exportSize;
      canvas.height = exportSize;

      // Circle mask dimension in viewport
      const circleViewportDiameter = 260; // size of the circular cut-out in px
      const scaleFactor = exportSize / circleViewportDiameter;

      const img = imgRef.current;

      // Render image onto offscreen canvas with circular clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(exportSize / 2, exportSize / 2, exportSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Clear background
      ctx.fillStyle = "#FAF8F5";
      ctx.fillRect(0, 0, exportSize, exportSize);

      // Compute drawn image coordinates
      const renderedImgWidth = img.width * zoom * scaleFactor;
      const renderedImgHeight = img.height * zoom * scaleFactor;

      const drawX = (exportSize / 2) + (pan.x * scaleFactor) - (renderedImgWidth / 2);
      const drawY = (exportSize / 2) + (pan.y * scaleFactor) - (renderedImgHeight / 2);

      ctx.drawImage(img, drawX, drawY, renderedImgWidth, renderedImgHeight);
      ctx.restore();

      let blob: Blob | null = null;
      try {
        blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
        );
      } catch (taintErr) {
        console.warn("Canvas export tainted, using fallback:", taintErr);
      }

      if (!blob) {
        // If imageSrc is already an online URL, pass it back directly so user is never blocked
        if (imageSrc && (imageSrc.startsWith("http://") || imageSrc.startsWith("https://"))) {
          onCropComplete(imageSrc);
          onClose();
          return;
        }
        throw new Error("Failed to export image preview. Please try uploading the image directly.");
      }

      // Upload blob to media upload API
      const formData = new FormData();
      formData.append("file", blob, `category-crop-${Date.now()}.jpg`);
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none">
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
              Drag to pan & use slider/wheel to zoom into the circular mask.
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

        {/* Circular Viewport (Instagram PFP style) */}
        <div className="w-full flex flex-col items-center justify-center">
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className="relative w-[300px] h-[300px] bg-neutral-900 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 flex items-center justify-center shadow-inner"
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
                  maxWidth: "280px",
                  maxHeight: "280px",
                  objectFit: "contain",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                className="transition-transform duration-75 will-change-transform"
              />
            ) : (
              <div className="text-xs text-white/40 text-center p-4">
                No image loaded. Please upload a photo below.
              </div>
            )}

            {/* Circular Mask Overlay (Instagram PFP Cut-out) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[260px] h-[260px] rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.68)] ring-2 ring-white/90 relative">
                {/* Subtle alignment crosshair indicator */}
                <div className="absolute inset-0 rounded-full border border-dashed border-white/20 pointer-events-none" />
              </div>
            </div>

            {/* Drag hint badge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[9.5px] uppercase font-bold tracking-widest text-white/80 flex items-center gap-1.5">
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
              onClick={() => setZoom((prev) => Math.max(1, Number((prev - 0.1).toFixed(2))))}
              className="p-1.5 text-white/70 hover:text-white rounded-md hover:bg-white/10 transition cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="1"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3.5, Number((prev + 0.1).toFixed(2))))}
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
