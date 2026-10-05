"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Film,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  ExternalLink,
  Eye,
  Sliders,
  Sparkles,
  Maximize2,
  Scan,
  Grid,
  ShieldCheck,
  Info,
} from "lucide-react";
import { ProductCategory } from "@/types";
import { uploadDirectToCloudinary } from "@/lib/cloudinary/client-upload";

export default function CategoryBannerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerMobileImageUrl, setBannerMobileImageUrl] = useState("");
  const [bannerHeading, setBannerHeading] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerMediaType, setBannerMediaType] = useState<"image" | "video">("image");
  const [bannerFit, setBannerFit] = useState<"cover" | "contain">("cover");
  const [bannerPosition, setBannerPosition] = useState<string>("center");
  const [bannerAspectRatio, setBannerAspectRatio] = useState<"storefront" | "video" | "natural">("storefront");

  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [showSafeZone, setShowSafeZone] = useState(false);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  useEffect(() => {
    async function loadCategory() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch("/api/categories?include_uncategorized=true");
        if (res.ok) {
          const json = await res.json();
          const cat = (json.data || []).find((c: ProductCategory) => c.id === id);
          if (cat) {
            setCategory(cat);
            setBannerImageUrl(cat.banner_image_url || "");
            setBannerMobileImageUrl(cat.banner_mobile_image_url || "");
            setBannerHeading(cat.banner_heading || "");
            setBannerSubtitle(cat.banner_subtitle || "");
            setBannerMediaType(cat.banner_media_type || "image");
            setBannerFit(cat.banner_fit || "cover");
            setBannerPosition(cat.banner_position || "center");
            setBannerAspectRatio(cat.banner_aspect_ratio || "storefront");
          } else {
            showStatus("error", "Category not found");
          }
        }
      } catch {
        showStatus("error", "Failed to load category details");
      } finally {
        setLoading(false);
      }
    }
    loadCategory();
  }, [id]);

  const handleBannerUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "desktop" | "mobile"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowed.includes(file.type)) {
      showStatus("error", "Invalid format. Upload JPG, PNG, WEBP, AVIF, or MP4/WebM video.");
      return;
    }

    const isVideo = file.type.startsWith("video");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      showStatus("error", `File size exceeds ${maxSize / (1024 * 1024)}MB.`);
      return;
    }

    if (target === "desktop") setUploadingDesktop(true);
    else setUploadingMobile(true);

    try {
      const res = await uploadDirectToCloudinary(file, {
        folder: "dnora/categories/banners",
        resourceType: isVideo ? "video" : "image",
      });

      const url = res.secure_url;
      if (!url) throw new Error("No URL returned from upload server");

      if (isVideo) setBannerMediaType("video");

      if (target === "desktop") {
        setBannerImageUrl(url);
        showStatus("success", "Desktop banner uploaded successfully!");
      } else {
        setBannerMobileImageUrl(url);
        showStatus("success", "Mobile banner uploaded successfully!");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Banner upload failed";
      showStatus("error", message);
    } finally {
      if (target === "desktop") setUploadingDesktop(false);
      else setUploadingMobile(false);
      e.target.value = "";
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    setSaving(true);
    try {
      const payload = {
        banner_image_url: bannerImageUrl.trim(),
        banner_mobile_image_url: bannerMobileImageUrl.trim(),
        banner_heading: bannerHeading.trim(),
        banner_subtitle: bannerSubtitle.trim(),
        banner_media_type: bannerMediaType,
        banner_fit: bannerFit,
        banner_position: bannerPosition.trim(),
        banner_aspect_ratio: bannerAspectRatio,
      };

      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showStatus("success", "Category hero banner saved successfully!");
        setTimeout(() => {
          router.push("/admin/categories");
        }, 600);
      } else {
        const json = await res.json().catch(() => ({}));
        showStatus("error", json.error || "Failed to save banner");
      }
    } catch {
      showStatus("error", "Server communication error");
    } finally {
      setSaving(false);
    }
  };

  const getFocalPercent = (pos: string): number => {
    if (!pos || pos === "center") return 50;
    if (pos === "top") return 0;
    if (pos === "bottom") return 100;
    const parsed = parseInt(pos, 10);
    return isNaN(parsed) ? 50 : Math.max(0, Math.min(100, parsed));
  };

  const getObjectPositionStyle = (pos: string): string => {
    const pct = getFocalPercent(pos);
    return `50% ${pct}%`;
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
        <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
          Loading banner studio...
        </p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm font-bold text-neutral-800">Category not found.</p>
        <Link href="/admin/categories" className="text-xs text-black underline font-bold">
          ← Back to Categories
        </Link>
      </div>
    );
  }

  const hasOverlayText = Boolean(bannerHeading.trim() || bannerSubtitle.trim());
  const displayMobileUrl = bannerMobileImageUrl || bannerImageUrl;
  const currentFocalPercent = getFocalPercent(bannerPosition);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div className="space-y-1">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Categories</span>
          </Link>
          <div className="flex items-center gap-2 pt-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Hero Banner Studio — {category.name}
            </h1>
          </div>
          <p className="text-xs text-neutral-500">
            Configure header banner sizing, crop protection, and live presentation for{" "}
            <span className="font-mono text-neutral-700">/category/{category.slug}</span>
          </p>
        </div>

        <Link
          href={`/category/${category.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl transition border border-neutral-300 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Live Storefront Page</span>
          <ExternalLink className="w-3 h-3 text-neutral-400" />
        </Link>
      </div>

      {/* Toast Notification */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-150 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Column Split View: Settings on Left, Sticky Live Preview on Right */}
      <form onSubmit={handleSaveBanner}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Controls, Sizing, Overlays, and Uploads */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Format & Crop-Protection / Fit Settings */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-neutral-700" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                      1. Banner Media Format & Sizing Adjustment
                    </h2>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Set sizing to match main storefront banner and protect graphics/videos from auto-cropping.
                  </p>
                </div>

                {/* Media Type Toggle */}
                <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setBannerMediaType("image")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      bannerMediaType === "image"
                        ? "bg-white text-black shadow-2xs font-bold"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Image Banner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerMediaType("video")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      bannerMediaType === "video"
                        ? "bg-white text-black shadow-2xs font-bold"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Video Header</span>
                  </button>
                </div>
              </div>

              {/* Sizing & Crop Mode Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fit Mode / Auto-Crop Protection */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5 uppercase tracking-wider">
                    Display Fit (Crop Control)
                  </label>
                  <div className="flex rounded-xl border border-neutral-300 p-1 bg-neutral-50">
                    <button
                      type="button"
                      onClick={() => setBannerFit("cover")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        bannerFit === "cover"
                          ? "bg-white text-black shadow-2xs font-bold"
                          : "text-neutral-600 hover:text-black"
                      }`}
                      title="Fills canvas completely (cinematic edge-to-edge)"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Auto-Crop & Fill</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerFit("contain")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        bannerFit === "contain"
                          ? "bg-white text-black shadow-2xs font-bold"
                          : "text-neutral-600 hover:text-black"
                      }`}
                      title="Shows 100% of the banner with ambient glow backdrop"
                    >
                      <Scan className="w-3.5 h-3.5 text-emerald-600" />
                      <span>No Crop (Fit)</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1.5">
                    {bannerFit === "cover"
                      ? "Fills canvas edge-to-edge. Use the slider below to prevent your subject/text from being cut."
                      : "✓ 100% of graphic is visible without cutting edges + ambient background glow."}
                  </p>
                </div>

                {/* Canvas Aspect Ratio */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5 uppercase tracking-wider">
                    Canvas Size Ratio
                  </label>
                  <select
                    value={bannerAspectRatio}
                    onChange={(e) => setBannerAspectRatio(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-medium"
                  >
                    <option value="storefront">Storefront Ratio (1024:346 / ~2.96:1)</option>
                    <option value="video">Standard 16:9 (Cinematic Widescreen)</option>
                    <option value="natural">Natural / Adaptive Height</option>
                  </select>
                  <p className="text-[10px] text-neutral-400 mt-1.5">
                    {bannerAspectRatio === "storefront"
                      ? "Matches the main homepage hero banner dimensions."
                      : "Adjusts container height based on chosen standard."}
                  </p>
                </div>
              </div>

              {/* FOCAL POINT / CROP POSITION ADJUSTMENT ("Jate srkhu kri saku") */}
              <div className="pt-3 border-t border-neutral-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Vertical Focal Position (Crop Alignment):</span>
                      <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-mono text-[11px] border border-purple-200">
                        {currentFocalPercent}% — {
                          currentFocalPercent <= 15
                            ? "Top Edge / Head Focus"
                            : currentFocalPercent <= 40
                            ? "Upper Focus"
                            : currentFocalPercent <= 60
                            ? "Center Balanced"
                            : currentFocalPercent <= 85
                            ? "Lower Focus"
                            : "Bottom Edge / Base Focus"
                        }
                      </span>
                    </label>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      If your photo is tall or wide, slide to shift the picture up or down so heads, faces, or text are never cut off.
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1">Presets:</span>
                  {[
                    { label: "Top (0%)", val: "0%" },
                    { label: "Upper (25%)", val: "25%" },
                    { label: "Center (50%)", val: "50%" },
                    { label: "Lower (75%)", val: "75%" },
                    { label: "Bottom (100%)", val: "100%" },
                  ].map((preset) => {
                    const isActive = getFocalPercent(bannerPosition) === getFocalPercent(preset.val);
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setBannerPosition(preset.val)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
                          isActive
                            ? "bg-black text-white border-black shadow-2xs"
                            : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Range Slider */}
                <div className="space-y-1 pt-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={currentFocalPercent}
                    onChange={(e) => setBannerPosition(`${e.target.value}%`)}
                    className="w-full h-2.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>0% (Top / Heads)</span>
                    <span>50% (Center)</span>
                    <span>100% (Bottom / Ground)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Optional Headline & Subtitle */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>2. Text Overlay (Optional)</span>
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  If your background banner image or video already has text or logo in it, leave these completely empty.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5 uppercase tracking-wider">
                    Headline (Overlay Title) — Optional
                  </label>
                  <input
                    type="text"
                    value={bannerHeading}
                    onChange={(e) => setBannerHeading(e.target.value)}
                    placeholder="e.g. THE TOTE SILHOUETTES"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black uppercase tracking-wider font-semibold"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Leave empty if background banner already contains title.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5 uppercase tracking-wider">
                    Subtitle / Narrative Tagline — Optional
                  </label>
                  <input
                    type="text"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="e.g. Architectural Leather Artistry"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-medium"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Optional narrative tagline displayed above or below headline.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Upload Media Files with Clear Size Badges (Desktop & Mobile) */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs space-y-6">
              <div className="border-b border-neutral-100 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-neutral-700" />
                  <span>3. Upload Banner Media & Dimension Guidelines</span>
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Follow recommended dimensions below for optimal clarity and zero content clipping.
                </p>
              </div>

              {/* Desktop Banner Media Card */}
              <div className="p-4 rounded-xl bg-neutral-50/70 border border-neutral-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-purple-700" />
                    <span>Desktop / Laptop Banner ({bannerMediaType === "video" ? "Video" : "Image"})</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200 self-start sm:self-auto">
                    Primary Display
                  </span>
                </div>

                {/* Size Guidance Box for Desktop */}
                <div className="p-3 bg-white rounded-lg border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-900">📐 Recommended Size:</span>
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        1920 × 648 px
                      </span>
                      <span className="text-neutral-400 text-[11px]">
                        (Ratio 1024:346) or 1920 × 1080 px (16:9)
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      💡 Any image size automatically adapts. Use the Focal Position slider to center your product or model.
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0">
                    Formats: WEBP, JPG, PNG (Max 15MB) / MP4 (Max 50MB)
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    placeholder={`https://... (${bannerMediaType === "video" ? "MP4 video URL" : "Desktop Banner Image URL"})`}
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-mono"
                  />
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-white rounded-xl cursor-pointer transition shadow-2xs shrink-0 active:scale-95">
                    {uploadingDesktop ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingDesktop ? "Uploading..." : "Upload File"}</span>
                    <input
                      type="file"
                      accept={bannerMediaType === "video" ? "video/mp4,video/webm" : "image/*"}
                      onChange={(e) => handleBannerUpload(e, "desktop")}
                      disabled={uploadingDesktop}
                      className="hidden"
                    />
                  </label>
                  {bannerImageUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerImageUrl("")}
                      className="p-2 text-neutral-400 hover:text-red-600 rounded-xl border border-neutral-200 transition cursor-pointer"
                      title="Clear Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Banner Media Card */}
              <div className="p-4 rounded-xl bg-neutral-50/70 border border-neutral-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-neutral-600" />
                    <span>Mobile Screen Banner (Optional)</span>
                  </label>
                  <span className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200 self-start sm:self-auto">
                    Smartphones Only
                  </span>
                </div>

                {/* Size Guidance Box for Mobile */}
                <div className="p-3 bg-white rounded-lg border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-900">📐 Recommended Size:</span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        750 × 900 px
                      </span>
                      <span className="text-neutral-400 text-[11px]">
                        (Ratio 3:4 / 4:5) or 1080 × 1350 px
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      💡 If left empty, your desktop banner automatically adapts and displays on mobile devices.
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0">
                    Formats: WEBP, JPG, PNG / Vertical MP4
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={bannerMobileImageUrl}
                    onChange={(e) => setBannerMobileImageUrl(e.target.value)}
                    placeholder={`https://... (${bannerMediaType === "video" ? "MP4 video URL" : "Mobile Banner Image URL"})`}
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-mono"
                  />
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl cursor-pointer transition shadow-2xs shrink-0 active:scale-95">
                    {uploadingMobile ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingMobile ? "Uploading..." : "Upload Mobile"}</span>
                    <input
                      type="file"
                      accept={bannerMediaType === "video" ? "video/mp4,video/webm" : "image/*"}
                      onChange={(e) => handleBannerUpload(e, "mobile")}
                      disabled={uploadingMobile}
                      className="hidden"
                    />
                  </label>
                  {bannerMobileImageUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerMobileImageUrl("")}
                      className="p-2 text-neutral-400 hover:text-red-600 rounded-xl border border-neutral-200 transition cursor-pointer"
                      title="Clear Mobile Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/admin/categories"
                className="px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:text-black rounded-xl transition border border-neutral-200 bg-white hover:bg-neutral-50 shadow-2xs"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || uploadingDesktop || uploadingMobile}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {saving ? "Saving Hero Banner..." : "Save Category Hero Banner"}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Real-Time Live Preview (No Scrolling Needed!) */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
              {/* Preview Header & Controls */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Live Visual Preview
                  </h3>
                </div>

                {/* Device Switcher */}
                <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      previewDevice === "desktop"
                        ? "bg-white text-black shadow-2xs font-bold"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      previewDevice === "mobile"
                        ? "bg-white text-black shadow-2xs font-bold"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              {/* Status Chips & Safe Zone Overlay Toggle */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-[10px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {bannerFit === "contain" ? "No Crop (Fit)" : "Auto-Crop (Cover)"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 font-mono">
                    Pos: {currentFocalPercent}%
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {bannerAspectRatio === "storefront" ? "1024:346" : bannerAspectRatio === "video" ? "16:9" : "Natural"}
                  </span>
                </div>

                {/* Safe Zone Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowSafeZone(!showSafeZone)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer ${
                    showSafeZone
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:text-black"
                  }`}
                  title="Toggle safe zone boundary overlay to verify content won't cut"
                >
                  <Grid className="w-3 h-3 text-emerald-600" />
                  <span>{showSafeZone ? "Safe Zone: ON" : "Safe Zone: OFF"}</span>
                </button>
              </div>

              {/* DESKTOP PREVIEW */}
              {previewDevice === "desktop" && (
                <div className="space-y-2">
                  <div
                    className="relative w-full rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center shadow-inner transition-all duration-200"
                    style={{
                      aspectRatio:
                        bannerAspectRatio === "video"
                          ? "16 / 9"
                          : bannerAspectRatio === "natural"
                          ? "16 / 7"
                          : "1024 / 346",
                      minHeight: "180px",
                      maxHeight: "360px",
                    }}
                  >
                    {/* Ambient Glow Backdrop if in Contain Mode */}
                    {bannerFit === "contain" && bannerImageUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110 pointer-events-none"
                        style={{ backgroundImage: `url(${bannerImageUrl})` }}
                      />
                    )}

                    {bannerImageUrl ? (
                      bannerMediaType === "video" ? (
                        <video
                          key={bannerImageUrl}
                          src={bannerImageUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            objectPosition: getObjectPositionStyle(bannerPosition),
                            transition: "object-position 0.12s ease-out",
                          }}
                          className={`absolute inset-0 w-full h-full ${
                            bannerFit === "contain" ? "object-contain z-1" : "object-cover"
                          }`}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={bannerImageUrl}
                          src={bannerImageUrl}
                          alt="Desktop Banner Preview"
                          style={{
                            objectPosition: getObjectPositionStyle(bannerPosition),
                            transition: "object-position 0.12s ease-out",
                          }}
                          className={`absolute inset-0 w-full h-full ${
                            bannerFit === "contain" ? "object-contain z-1" : "object-cover"
                          }`}
                        />
                      )
                    ) : (
                      <div className="p-8 text-center text-neutral-500 space-y-2 relative z-10">
                        <Monitor className="w-8 h-8 mx-auto text-neutral-600 opacity-60" />
                        <p className="text-xs font-semibold text-neutral-400">Desktop Banner Preview</p>
                        <p className="text-[11px] text-neutral-600 max-w-xs">
                          Upload or paste an image/video URL on the left to see live preview.
                        </p>
                      </div>
                    )}

                    {/* Safe Zone Boundary Box Overlay & Focal Center Guide */}
                    {showSafeZone && (
                      <>
                        <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-emerald-400/80 bg-emerald-500/10 pointer-events-none z-20 flex items-start justify-end p-2 rounded-lg">
                          <span className="px-1.5 py-0.5 bg-black/80 backdrop-blur-xs text-emerald-300 font-mono text-[8px] font-bold rounded uppercase tracking-wider">
                            Protected Safe Zone (80%)
                          </span>
                        </div>
                        {/* Interactive Focal Line Guide */}
                        <div
                          className="absolute left-0 right-0 border-t border-dashed border-yellow-300/80 pointer-events-none z-20 flex justify-start pl-3"
                          style={{ top: `${currentFocalPercent}%` }}
                        >
                          <span className="bg-black/80 text-yellow-300 font-mono text-[8px] px-1 py-0.5 rounded -translate-y-1/2">
                            Focal Center ({currentFocalPercent}%)
                          </span>
                        </div>
                      </>
                    )}

                    {/* Desktop Overlay Simulation */}
                    {hasOverlayText && bannerImageUrl && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-3 text-center z-10">
                        {bannerHeading && (
                          <h3 className="text-white font-serif text-sm sm:text-lg font-bold tracking-widest uppercase">
                            {bannerHeading}
                          </h3>
                        )}
                        {bannerSubtitle && (
                          <p className="text-white/80 text-[10px] sm:text-xs mt-1 max-w-xs font-light">
                            {bannerSubtitle}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur-xs rounded text-[9px] uppercase font-bold text-white tracking-wider flex items-center gap-1 z-10">
                      <Monitor className="w-2.5 h-2.5" /> Desktop Storefront
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 text-center">
                    Simulating laptop & desktop monitors. Focal position: <span className="font-mono text-neutral-600">{currentFocalPercent}%</span>
                  </p>
                </div>
              )}

              {/* MOBILE PREVIEW */}
              {previewDevice === "mobile" && (
                <div className="space-y-2">
                  <div className="flex justify-center py-2">
                    <div className="relative w-[230px] rounded-[30px] border-4 border-neutral-800 bg-neutral-950 p-2 shadow-xl">
                      {/* Notch / Dynamic Island */}
                      <div className="w-14 h-3 bg-neutral-800 rounded-full mx-auto mb-2" />
                      <div className="relative w-full aspect-[9/16] rounded-[20px] overflow-hidden bg-white flex flex-col">
                        {/* Mini Phone Header Bar */}
                        <div className="h-6 bg-black flex items-center justify-between px-3 text-[9px] text-neutral-400 shrink-0">
                          <span className="font-bold text-white tracking-widest text-[8px]">D&apos;NORA</span>
                          <span className="text-[8px] font-mono">9:41</span>
                        </div>

                        {/* Mini Banner Header */}
                        <div className="relative w-full h-36 bg-neutral-900 flex items-center justify-center overflow-hidden shrink-0 border-b border-neutral-200">
                          {/* Ambient Glow Backdrop on Mobile if Contain Mode */}
                          {bannerFit === "contain" && displayMobileUrl && (
                            <div
                              className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110 pointer-events-none"
                              style={{ backgroundImage: `url(${displayMobileUrl})` }}
                            />
                          )}

                          {displayMobileUrl ? (
                            bannerMediaType === "video" ? (
                              <video
                                key={displayMobileUrl}
                                src={displayMobileUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{
                                  objectPosition: getObjectPositionStyle(bannerPosition),
                                  transition: "object-position 0.12s ease-out",
                                }}
                                className={`absolute inset-0 w-full h-full ${
                                  bannerFit === "contain" ? "object-contain z-1" : "object-cover"
                                }`}
                              />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={displayMobileUrl}
                                src={displayMobileUrl}
                                alt="Mobile Banner Preview"
                                style={{
                                  objectPosition: getObjectPositionStyle(bannerPosition),
                                  transition: "object-position 0.12s ease-out",
                                }}
                                className={`absolute inset-0 w-full h-full ${
                                  bannerFit === "contain" ? "object-contain z-1" : "object-cover"
                                }`}
                              />
                            )
                          ) : (
                            <div className="p-3 text-center text-neutral-500 relative z-10">
                              <Smartphone className="w-5 h-5 mx-auto mb-1 text-neutral-600 opacity-60" />
                              <p className="text-[9px] text-neutral-400">No Mobile Banner</p>
                            </div>
                          )}

                          {/* Safe Zone Overlay on Mobile */}
                          {showSafeZone && (
                            <>
                              <div className="absolute inset-2 border border-dashed border-emerald-400/80 bg-emerald-500/10 pointer-events-none z-20" />
                              <div
                                className="absolute left-0 right-0 border-t border-dashed border-yellow-300/80 pointer-events-none z-20"
                                style={{ top: `${currentFocalPercent}%` }}
                              />
                            </>
                          )}

                          {hasOverlayText && displayMobileUrl && (
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2 text-center z-10">
                              {bannerHeading && (
                                <h4 className="text-white font-serif text-[10px] font-bold tracking-wider uppercase leading-tight">
                                  {bannerHeading}
                                </h4>
                              )}
                              {bannerSubtitle && (
                                <p className="text-white/80 text-[8px] mt-0.5 max-w-[140px] line-clamp-2 font-light">
                                  {bannerSubtitle}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Simulated Storefront Content Below Banner */}
                        <div className="p-2.5 space-y-2 flex-1 bg-neutral-50">
                          <div className="h-2 bg-neutral-200 rounded w-1/3" />
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <div className="h-16 rounded-lg bg-neutral-200/80" />
                            <div className="h-16 rounded-lg bg-neutral-200/80" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 text-center">
                    {bannerMobileImageUrl
                      ? "Showing dedicated mobile banner asset."
                      : "Adapting desktop banner for mobile screen."}
                  </p>
                </div>
              )}

              {/* View Live Storefront Button in Preview Card */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400 font-mono">
                  /category/{category.slug}
                </span>
                <Link
                  href={`/category/${category.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 hover:text-black underline"
                >
                  <span>Open Live</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
