"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Eye,
  ImageIcon,
  Film,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import { CampaignSlide, PromoBannerConfig } from "@/lib/data/store";

export default function AdminCampaignBannerPage() {
  const [slides, setSlides] = useState<CampaignSlide[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Live preview state
  const [previewIndex, setPreviewIndex] = useState(0);

  // Slide Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form Fields for Modal
  const [formHeading, setFormHeading] = useState("");
  const [formTagline, setFormTagline] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formButtonText, setFormButtonText] = useState("");
  const [formButtonLink, setFormButtonLink] = useState("/shop");
  const [formMediaType, setFormMediaType] = useState<"image" | "video">("image");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formDuration, setFormDuration] = useState(6);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/promo-banner");
      if (res.ok) {
        const json = await res.json();
        const data: PromoBannerConfig = json.config;
        setIsActive(data.is_active !== undefined ? Boolean(data.is_active) : true);

        if (Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
        } else {
          // Fallback initial slide from top-level fields
          setSlides([
            {
              id: "slide-1",
              heading: data.heading || "THE ARCHITECTURE OF LUXURY",
              tagline: data.tagline || "THE FLORENTINE ATELIER",
              description:
                data.description ||
                "Cut from full-grain vegetable-tanned Italian calfskin with hand-painted beveled edges.",
              button_text: data.button_text || "EXPLORE THE CAMPAIGN",
              button_link: data.button_link || "/shop",
              media_type: "image",
              media_url:
                data.image_url ||
                "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
              duration_seconds: 6,
            },
          ]);
        }
      } else {
        showStatus("error", "Failed to load campaign banner configuration.");
      }
    } catch {
      showStatus("error", "Network error loading banner settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Open modal for new slide
  const openAddSlideModal = () => {
    setEditingIndex(null);
    setFormHeading("");
    setFormTagline("");
    setFormDescription("");
    setFormButtonText("");
    setFormButtonLink("/shop");
    setFormMediaType("image");
    setFormMediaUrl("");
    setFormDuration(6);
    setModalOpen(true);
  };

  // Open modal to edit existing slide
  const openEditSlideModal = (index: number) => {
    const s = slides[index];
    if (!s) return;
    setEditingIndex(index);
    setFormHeading(s.heading || "");
    setFormTagline(s.tagline || "");
    setFormDescription(s.description || "");
    setFormButtonText(s.button_text || "");
    setFormButtonLink(s.button_link || "/shop");
    setFormMediaType(s.media_type || "image");
    setFormMediaUrl(s.media_url || "");
    setFormDuration(s.duration_seconds || 6);
    setModalOpen(true);
  };

  // Upload image or video to Cloudinary
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMedia(true);
      const isVideo = file.type.startsWith("video");
      if (isVideo) {
        setFormMediaType("video");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "dnora/campaign");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Upload failed");
      }

      const data = await res.json();
      if (data.secure_url || data.url) {
        setFormMediaUrl(data.secure_url || data.url);
        showStatus("success", `${isVideo ? "Video" : "Image"} uploaded successfully!`);
      }
    } catch (err: unknown) {
      console.error(err);
      showStatus("error", err instanceof Error ? err.message : "Media upload failed");
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save current slide from modal into state
  const handleSaveSlideForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMediaUrl.trim()) {
      showStatus("error", "Please provide a valid media URL or upload a file.");
      return;
    }

    const newSlide: CampaignSlide = {
      id: editingIndex !== null && slides[editingIndex]?.id ? slides[editingIndex].id : `slide-${Date.now()}`,
      heading: formHeading.trim(),
      tagline: formTagline.trim(),
      description: formDescription.trim(),
      button_text: formButtonText.trim(),
      button_link: formButtonLink.trim() || "/shop",
      media_type: formMediaType,
      media_url: formMediaUrl.trim(),
      duration_seconds: Number(formDuration) || 6,
    };

    if (editingIndex !== null) {
      setSlides((prev) => prev.map((s, idx) => (idx === editingIndex ? newSlide : s)));
      showStatus("success", "Slide updated in list. Click Save & Publish below to go live.");
    } else {
      setSlides((prev) => [...prev, newSlide]);
      showStatus("success", "New slide added. Click Save & Publish below to go live.");
    }

    setModalOpen(false);
  };

  // Reorder slides
  const moveSlide = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const copy = [...slides];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setSlides(copy);
  };

  // Delete slide
  const deleteSlide = (index: number) => {
    if (slides.length <= 1) {
      showStatus("error", "You must keep at least one campaign slide.");
      return;
    }
    setSlides((prev) => prev.filter((_, idx) => idx !== index));
    if (previewIndex >= slides.length - 1) {
      setPreviewIndex(Math.max(0, slides.length - 2));
    }
    showStatus("success", "Slide removed. Click Save & Publish below to go live.");
  };

  // Persist all slides and active status to database & homepage
  const handleSaveAll = async () => {
    if (slides.length === 0) {
      showStatus("error", "At least one slide is required.");
      return;
    }

    try {
      setSaving(true);
      const firstSlide = slides[0];

      const res = await fetch("/api/promo-banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading: firstSlide.heading,
          tagline: firstSlide.tagline,
          description: firstSlide.description,
          button_text: firstSlide.button_text,
          button_link: firstSlide.button_link,
          image_url: firstSlide.media_url,
          is_active: isActive,
          slides: slides,
        }),
      });

      if (res.ok) {
        showStatus("success", "Campaign Banner slides published live to storefront!");
      } else {
        showStatus("error", "Failed to save campaign banner settings.");
      }
    } catch {
      showStatus("error", "Network error updating banner settings.");
    } finally {
      setSaving(false);
    }
  };

  const activeSlide = slides[previewIndex] || slides[0];

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B89025] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Storefront Editorial Carousel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Campaign Banner (Multiple Slides & Push Transition)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-light mt-1">
            Manage multiple editorial slides with video and photo backgrounds, automatic push transition, and live timer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl shadow-xs transition"
          >
            <span>View Home</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={fetchConfig}
            className="p-2 text-neutral-600 hover:text-black rounded-xl hover:bg-neutral-100 transition cursor-pointer"
            title="Reload settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Status Toast */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-neutral-400 hover:text-neutral-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive Push Carousel Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-900">
            <Eye className="w-4 h-4 text-neutral-500" />
            <span>Storefront Live Push Preview</span>
            <span className="text-[11px] font-normal text-neutral-400 font-mono">
              ({slides.length} {slides.length === 1 ? "Slide" : "Slides"})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700">
              <span>Homepage Visible:</span>
              <div
                onClick={() => setIsActive(!isActive)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  isActive ? "bg-black" : "bg-neutral-300"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    isActive ? "left-4.5" : "left-0.5"
                  }`}
                />
              </div>
            </label>
          </div>
        </div>

        <div className="relative w-full min-h-[360px] sm:min-h-[420px] rounded-2xl overflow-hidden shadow-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center">
          {/* Background Video or Photo */}
          {activeSlide?.media_url && (
            <div className="absolute inset-0 z-0">
              {activeSlide.media_type === "video" ? (
                <video
                  key={activeSlide.media_url}
                  src={activeSlide.media_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={activeSlide.media_url}
                  alt={activeSlide.heading || "Preview"}
                  fill
                  className="object-cover object-center"
                  unoptimized
                />
              )}
            </div>
          )}

          {/* Slide Text Content - only render if at least one text or button is provided */}
          {(activeSlide?.heading || activeSlide?.tagline || activeSlide?.description || activeSlide?.button_text) && (
            <div className="relative z-10 max-w-2xl mx-auto px-6 text-center py-10 space-y-4 text-white">
              {activeSlide?.tagline && (
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[#E5C378] text-[10px] font-bold uppercase tracking-[0.25em]">
                  <Sparkles className="w-3 h-3 text-[#E5C378]" />
                  <span>{activeSlide.tagline}</span>
                </div>
              )}

              {activeSlide?.heading && (
                <h2 className="text-xl sm:text-2xl md:text-3xl font-light tracking-[0.18em] uppercase text-white leading-tight drop-shadow-md">
                  {activeSlide.heading}
                </h2>
              )}

              {(activeSlide?.heading || activeSlide?.description) && (
                <div className="w-10 h-[1.5px] bg-[#D4AF37] mx-auto drop-shadow-sm" />
              )}

              {activeSlide?.description && (
                <p className="text-xs sm:text-sm text-neutral-100 font-light leading-relaxed line-clamp-3 drop-shadow-sm">
                  {activeSlide.description}
                </p>
              )}

              {activeSlide?.button_text && (
                <div>
                  <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold text-[11px] uppercase tracking-[0.2em] rounded-xs shadow-lg">
                    <span>{activeSlide.button_text}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Prev / Next controls in preview */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setPreviewIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewIndex((prev) => (prev + 1) % slides.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === previewIndex ? "w-6 bg-[#D4AF37]" : "w-2 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Slide Cards Manager */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Campaign Banner Slides</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Add multiple photo or video slides. They will automatically slide with smooth push transition on the storefront.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddSlideModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slide</span>
          </button>
        </div>

        {/* List of Slides */}
        <div className="space-y-4">
          {slides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                idx === previewIndex
                  ? "border-[#B89025] bg-amber-50/20 shadow-xs"
                  : "border-neutral-200 bg-neutral-50/50 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Media Thumbnail */}
                <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-black shrink-0 border border-neutral-300 flex items-center justify-center">
                  {slide.media_type === "video" ? (
                    <>
                      <video
                        src={slide.media_url}
                        muted
                        playsInline
                        className="w-full h-full object-cover opacity-80"
                      />
                      <Film className="w-5 h-5 text-white absolute" />
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slide.media_url}
                      alt={slide.heading || "Slide"}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white uppercase">
                    {slide.media_type}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-neutral-400">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase text-[#B89025] tracking-wider">
                      {slide.tagline || "Tagline"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 bg-neutral-200/60 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {slide.duration_seconds || 6}s push
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 tracking-wide uppercase line-clamp-1">
                    {slide.heading || "Untitled Slide"}
                  </h3>
                  <p className="text-xs text-neutral-500 font-light line-clamp-1 max-w-lg">
                    {slide.description || "No narrative provided"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => setPreviewIndex(idx)}
                  className="p-2 text-xs font-semibold text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition"
                  title="Preview in box"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveSlide(idx, "up")}
                  className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === slides.length - 1}
                  onClick={() => moveSlide(idx, "down")}
                  className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditSlideModal(idx)}
                  className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                  title="Edit Slide"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteSlide(idx)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  title="Delete Slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Global Save Button */}
        <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            Changes will be published live to the homepage after clicking &quot;Save &amp; Publish Changes&quot;.
          </p>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer disabled:opacity-60 shrink-0"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Slides...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>Save &amp; Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Slide Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900 uppercase">
                  {editingIndex !== null ? `Edit Slide #${editingIndex + 1}` : "Add Campaign Slide"}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure headline, photo or video background, narrative, and auto push timer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlideForm} className="space-y-4">
              {/* Media Type & Upload */}
              <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Background Media Type &amp; Source
                  </label>
                  <div className="flex items-center bg-white p-0.5 rounded-lg border border-neutral-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setFormMediaType("image")}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
                        formMediaType === "image"
                          ? "bg-black text-white shadow-xs"
                          : "text-neutral-500 hover:text-black"
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMediaType("video")}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
                        formMediaType === "video"
                          ? "bg-black text-white shadow-xs"
                          : "text-neutral-500 hover:text-black"
                      }`}
                    >
                      <Film className="w-3 h-3" />
                      Video
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={formMediaUrl}
                    onChange={(e) => setFormMediaUrl(e.target.value)}
                    placeholder={`https://... (${formMediaType === "video" ? "MP4 video URL" : "Image URL"})`}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept={formMediaType === "video" ? "video/mp4,video/webm" : "image/*"}
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingMedia}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-black text-white rounded-lg transition cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {uploadingMedia ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : formMediaType === "video" ? (
                      <Film className="w-3.5 h-3.5" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingMedia ? "Uploading..." : "Upload File"}</span>
                  </button>
                </div>

                {/* Media Preview inside modal */}
                {formMediaUrl && (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden border border-neutral-300 bg-neutral-100 flex items-center justify-center">
                    {formMediaType === "video" ? (
                      <video
                        src={formMediaUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formMediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-2 left-2 text-[10px] text-white font-mono bg-black/70 px-2 py-0.5 rounded shadow">
                      Previewing {formMediaType} (Natural Colors)
                    </span>
                  </div>
                )}
              </div>

              {/* Informational tip for optional text overlay */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg text-xs text-amber-900 leading-relaxed">
                💡 <span className="font-semibold">Text overlay is completely optional:</span> You can leave Headline, Story, and Button Label empty for a clean, full-screen image/video banner. If Button Label is empty, the entire banner becomes a clickable link to the Button Link.
              </div>

              {/* Heading & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Banner Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={formHeading}
                    onChange={(e) => setFormHeading(e.target.value)}
                    placeholder="e.g. THE ARCHITECTURE OF LUXURY (or leave blank)"
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-black uppercase font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Tagline / Subtitle Badge (Optional)
                  </label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="e.g. THE FLORENTINE ATELIER (or leave blank)"
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Narrative Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Editorial Narrative / Story (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Luxury craftsmanship narrative (or leave blank)..."
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              {/* Button text, Button link, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Button Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={formButtonText}
                    onChange={(e) => setFormButtonText(e.target.value)}
                    placeholder="e.g. EXPLORE (or leave blank for image link)"
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Banner Link Target
                  </label>
                  <input
                    type="text"
                    value={formButtonLink}
                    onChange={(e) => setFormButtonLink(e.target.value)}
                    placeholder="/shop"
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Push Timer (Seconds)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition cursor-pointer"
                >
                  {editingIndex !== null ? "Update Slide" : "Add Slide to Carousel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
