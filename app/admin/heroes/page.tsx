"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Video,
  ImageIcon,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Upload,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  Calendar,
  X,
} from "lucide-react";
import { HeroBanner } from "@/types";
import { DestinationLinkSelect } from "@/components/admin/DestinationLinkSelect";

export default function AdminHeroesPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<"desktop" | "tablet" | "mobile" | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formHeading, setFormHeading] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formMediaType, setFormMediaType] = useState<"image" | "video">("image");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formTabletMediaUrl, setFormTabletMediaUrl] = useState("");
  const [formMobileMediaUrl, setFormMobileMediaUrl] = useState("");
  const [formButtonText, setFormButtonText] = useState("");
  const [formButtonLink, setFormButtonLink] = useState("/shop");
  const [formDuration, setFormDuration] = useState(5);
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formStatus, setFormStatus] = useState<"draft" | "published" | "archived">("published");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  // Hidden file input refs
  const desktopFileRef = useRef<HTMLInputElement>(null);
  const tabletFileRef = useRef<HTMLInputElement>(null);
  const mobileFileRef = useRef<HTMLInputElement>(null);

  // Live preview state
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/heroes?includeDrafts=true");
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
      } else {
        showStatus("error", "Failed to fetch hero banners");
      }
    } catch {
      showStatus("error", "Error connecting to hero banner API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormTitle("NEW LUXURY CAMPAIGN");
    setFormHeading("");
    setFormSubtitle("");
    setFormMediaType("image");
    setFormMediaUrl("");
    setFormTabletMediaUrl("");
    setFormMobileMediaUrl("");
    setFormButtonText("");
    setFormButtonLink("/shop");
    setFormDuration(5);
    setFormSortOrder(banners.length + 1);
    setFormIsActive(true);
    setFormStatus("published");
    setFormStartDate("");
    setFormEndDate("");
    setModalOpen(true);
  };

  const openEditModal = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setFormTitle(banner.title);
    setFormHeading(banner.heading || "");
    setFormSubtitle(banner.subtitle || "");
    setFormMediaType(banner.media_type);
    setFormMediaUrl(banner.media_url);
    setFormTabletMediaUrl(banner.tablet_media_url || "");
    setFormMobileMediaUrl(banner.mobile_media_url || "");
    setFormButtonText(banner.button_text || "");
    setFormButtonLink(banner.button_link || "/shop");
    setFormDuration(banner.duration_seconds || 5);
    setFormSortOrder(banner.sort_order || 0);
    setFormIsActive(banner.is_active);
    setFormStatus(banner.status);
    setFormStartDate(banner.start_date ? banner.start_date.split("T")[0] : "");
    setFormEndDate(banner.end_date ? banner.end_date.split("T")[0] : "");
    setModalOpen(true);
  };

  // Upload handler with validation
  const handleFileUpload = async (
    file: File,
    targetField: "desktop" | "tablet" | "mobile"
  ) => {
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
      showStatus("error", "Invalid file format. Please upload JPG, PNG, WEBP, AVIF, or MP4.");
      return;
    }

    const maxSize = file.type.startsWith("video") ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      showStatus("error", `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB.`);
      return;
    }

    setUploadingField(targetField);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "dnora/herobanner");
      formData.append("resource_type", file.type.startsWith("video") ? "video" : "image");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.media?.secure_url;
        if (url) {
          if (targetField === "desktop") {
            setFormMediaUrl(url);
            if (file.type.startsWith("video")) {
              setFormMediaType("video");
            } else {
              setFormMediaType("image");
            }
          } else if (targetField === "tablet") {
            setFormTabletMediaUrl(url);
            if (file.type.startsWith("video")) {
              setFormMediaType("video");
            }
          } else if (targetField === "mobile") {
            setFormMobileMediaUrl(url);
            if (file.type.startsWith("video")) {
              setFormMediaType("video");
            }
          }
          showStatus("success", `${targetField.toUpperCase()} media uploaded successfully!`);
        }
      } else {
        const data = await res.json();
        showStatus("error", data.error || "Upload failed");
      }
    } catch {
      showStatus("error", "Error uploading media file to server");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMediaUrl.trim()) {
      showStatus("error", "Desktop Media URL / Image is required");
      return;
    }

    setSaving(true);
    const isVideo =
      formMediaType === "video" ||
      formMediaUrl.endsWith(".mp4") ||
      formMediaUrl.endsWith(".webm") ||
      formMediaUrl.endsWith(".mov") ||
      formMediaUrl.includes("/video/upload/");

    let validStartDate: string | null = null;
    if (formStartDate) {
      const d = new Date(formStartDate);
      if (!isNaN(d.getTime())) validStartDate = d.toISOString();
    }
    let validEndDate: string | null = null;
    if (formEndDate) {
      const d = new Date(formEndDate);
      if (!isNaN(d.getTime())) validEndDate = d.toISOString();
    }

    const payload = {
      title: formTitle.trim(),
      heading: formHeading.trim() || null,
      subtitle: formSubtitle.trim() || null,
      media_type: (isVideo ? "video" : "image") as "image" | "video",
      media_url: formMediaUrl.trim(),
      tablet_media_url: formTabletMediaUrl.trim() || null,
      mobile_media_url: formMobileMediaUrl.trim() || null,
      button_text: formButtonText.trim() || null,
      button_link: formButtonLink.trim() || "/shop",
      duration_seconds: Number(formDuration),
      sort_order: Number(formSortOrder),
      is_active: formIsActive,
      status: formStatus,
      text_alignment: "left",
      start_date: validStartDate,
      end_date: validEndDate,
    };

    try {
      const url = editingBanner ? `/api/heroes/${editingBanner.id}` : "/api/heroes";
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showStatus("success", editingBanner ? "Banner slide updated" : "New banner slide created");
        setModalOpen(false);
        fetchBanners();
      } else {
        const data = await res.json();
        showStatus("error", data.error || "Failed to save hero banner");
      }
    } catch {
      showStatus("error", "Server communication failure");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/heroes/${id}`, { method: "DELETE" });
      if (res.ok) {
        showStatus("success", "Banner deleted successfully");
        fetchBanners();
      } else {
        showStatus("error", "Failed to delete banner");
      }
    } catch {
      showStatus("error", "Error contacting server");
    }
  };

  const handleToggleActive = async (banner: HeroBanner) => {
    try {
      const res = await fetch(`/api/heroes/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !banner.is_active }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
        );
        showStatus("success", `Banner ${!banner.is_active ? "activated" : "deactivated"}`);
      }
    } catch {
      showStatus("error", "Failed to update banner status");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((b, idx) => ({ ...b, sort_order: idx + 1 }));
    setBanners(reordered);

    try {
      await Promise.all(
        reordered.map((b) =>
          fetch(`/api/heroes/${b.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: b.sort_order }),
          })
        )
      );
      showStatus("success", "Banner sequence reordered");
    } catch {
      showStatus("error", "Failed to save reordered sequence");
      fetchBanners();
    }
  };

  const activeBanners = banners.filter((b) => b.is_active);
  const currentPreview = activeBanners[previewIndex % (activeBanners.length || 1)];

  // Helper to determine the image URL for the active preview device
  const getPreviewImage = (banner: HeroBanner) => {
    if (previewDevice === "mobile") {
      return banner.mobile_media_url || banner.tablet_media_url || banner.media_url;
    }
    if (previewDevice === "tablet") {
      return banner.tablet_media_url || banner.media_url;
    }
    return banner.media_url;
  };

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 uppercase">
            Hero Banner Studio
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Fully responsive multi-image hero system with separate Desktop, Tablet, and Mobile uploads, heading content, and scheduling.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBanners}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black rounded-lg hover:bg-neutral-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Hero Slide
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div
          className={`flex items-center gap-2.5 p-3.5 text-xs rounded-lg font-medium transition animate-in fade-in ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Live Interactive Preview Box (Desktop, Tablet, Mobile) */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-800">
              Live Responsive Simulation
            </h2>
            <span className="text-[10px] bg-neutral-200 text-neutral-700 font-semibold px-2 py-0.5 rounded-full">
              {activeBanners.length} Active {activeBanners.length === 1 ? "Slide" : "Slides"}
            </span>
          </div>

          {/* Device Viewport Toggle (Desktop | Tablet | Mobile) */}
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg p-0.5 bg-neutral-200 text-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase transition cursor-pointer ${
                  previewDevice === "desktop"
                    ? "bg-white text-black shadow-xs"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (16:9 / 1024×346)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("tablet")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase transition cursor-pointer ${
                  previewDevice === "tablet"
                    ? "bg-white text-black shadow-xs"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet (4:3)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase transition cursor-pointer ${
                  previewDevice === "mobile"
                    ? "bg-white text-black shadow-xs"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile (1:1)</span>
              </button>
            </div>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-black px-2 py-1"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Viewport Simulation Frame */}
        <div className="p-6 bg-neutral-900 flex justify-center items-center min-h-[380px]">
          {activeBanners.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs font-mono">
              No active slides published. Click &quot;Add Hero Slide&quot; below.
            </div>
          ) : currentPreview ? (
            <div
              className={`relative overflow-hidden bg-black shadow-2xl transition-all duration-300 ${
                previewDevice === "desktop"
                  ? "w-full max-w-4xl aspect-[1024/346] rounded-md"
                  : previewDevice === "tablet"
                  ? "w-full max-w-lg aspect-[4/3] rounded-xl border-4 border-neutral-800"
                  : "w-72 sm:w-80 aspect-square rounded-2xl border-4 border-neutral-800"
              }`}
            >
              {/* Media rendering */}
              {currentPreview.media_type === "video" ? (
                <video
                  key={currentPreview.id}
                  src={currentPreview.media_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPreviewImage(currentPreview)}
                    alt={currentPreview.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Optional overlay simulation if heading/subtitle exists */}
              {(currentPreview.heading || currentPreview.subtitle || currentPreview.button_text) && (
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-6 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none">
                  {currentPreview.subtitle && (
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-300">
                      {currentPreview.subtitle}
                    </p>
                  )}
                  {currentPreview.heading && (
                    <h3 className="text-base sm:text-xl font-serif uppercase text-white font-light mt-0.5">
                      {currentPreview.heading}
                    </h3>
                  )}
                  {currentPreview.button_text && (
                    <div className="mt-2">
                      <span className="inline-block px-3 py-1 bg-white text-black text-[9px] font-bold uppercase tracking-wider rounded-xs">
                        {currentPreview.button_text}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Prev / Next controls */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewIndex(
                        (prev) => (prev - 1 + activeBanners.length) % activeBanners.length
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((prev) => (prev + 1) % activeBanners.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Indicators */}
              <div className="absolute bottom-2 inset-x-0 z-20 flex justify-center gap-1.5">
                {activeBanners.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all ${
                      i === previewIndex % activeBanners.length
                        ? "w-6 bg-white"
                        : "w-2 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Hero Slides Table & Manager */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
              Carousel Slides ({banners.length})
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Multi-image responsive banners with Desktop, Tablet, and Mobile assets.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slide</span>
          </button>
        </div>

        {banners.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-600 font-medium">No hero banner slides found</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 text-xs font-bold uppercase text-white bg-black rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            >
              Add Slide Now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {banners.map((banner, index) => {
              const isFirst = index === 0;
              const isLast = index === banners.length - 1;

              return (
                <div
                  key={banner.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    banner.is_active ? "bg-white hover:bg-neutral-50/50" : "bg-neutral-50/80 opacity-75"
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Thumbnail */}
                    <div className="relative w-28 h-16 sm:w-36 sm:h-20 bg-neutral-900 rounded-md overflow-hidden shrink-0 border border-neutral-200">
                      {banner.media_type === "video" ? (
                        <div className="w-full h-full flex items-center justify-center text-white/70">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={banner.media_url}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs flex items-center gap-1">
                        {banner.media_type === "video" ? (
                          <>
                            <Video className="w-2.5 h-2.5 text-blue-400" />
                            <span>Video</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Image</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-neutral-900 tracking-wide uppercase">
                          #{index + 1} {banner.title}
                        </span>
                        {banner.heading && (
                          <span className="text-[11px] text-neutral-500 font-serif italic">
                            &ldquo;{banner.heading}&rdquo;
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            banner.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-200 text-neutral-600"
                          }`}
                        >
                          {banner.is_active ? "Active" : "Disabled"}
                        </span>
                        <span className="text-[10px] bg-neutral-100 text-neutral-600 font-mono px-1.5 py-0.5 rounded">
                          {banner.duration_seconds || 5}s rotation
                        </span>
                      </div>

                      {/* Multi-Image Device Badges */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-neutral-100 rounded text-neutral-700 font-medium">
                          <Monitor className="w-3 h-3 text-neutral-500" />
                          <span>Desktop: Set</span>
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium ${
                            banner.tablet_media_url
                              ? "bg-blue-50 text-blue-700"
                              : "bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          <Tablet className="w-3 h-3" />
                          <span>{banner.tablet_media_url ? "Tablet: Custom" : "Tablet: Fallback"}</span>
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium ${
                            banner.mobile_media_url
                              ? "bg-purple-50 text-purple-700"
                              : "bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>{banner.mobile_media_url ? "Mobile: 1:1 Crop" : "Mobile: Fallback"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveOrder(index, "up")}
                      className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveOrder(index, "down")}
                      className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                        banner.is_active
                          ? "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                          : "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600"
                      }`}
                    >
                      {banner.is_active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(banner)}
                      className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                      title="Edit Slide"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(banner.id, banner.title)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Dialog for Create/Edit (Structured: Banner Info, Desktop, Tablet, Mobile, Content, CTA, Visibility) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl my-8 border border-neutral-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 uppercase">
                  {editingBanner ? "Edit Hero Banner" : "Create Responsive Hero Banner"}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure device-specific images (Desktop, Tablet, Mobile) with fallback handling and CTA content.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>



            <form onSubmit={handleSaveBanner} className="space-y-6 mt-6">
              {/* SECTION 1: Banner Information */}
              <div className="p-4 bg-neutral-50/60 rounded-xl border border-neutral-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-2">
                  1. Banner Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Internal Banner Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black bg-white"
                      placeholder="e.g. HANDBAG COLLECTION OFFER"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Duration (Seconds)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Desktop Image / Large Screen */}
              <div className="p-4 bg-neutral-50/60 rounded-xl border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-neutral-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      2. Desktop Media / Video / Image (Required)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded">
                    Recommended: 1920×700 or 1024×346 (16:9 / Panoramic)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                  {/* Preview Thumbnail */}
                  <div className="relative aspect-[1024/346] sm:aspect-video bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200 flex items-center justify-center">
                    {formMediaUrl ? (
                      formMediaType === "video" ? (
                        <video src={formMediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={formMediaUrl} alt="Desktop Preview" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <span className="text-[11px] text-neutral-400">No Image/Video Uploaded</span>
                    )}
                  </div>

                  {/* Upload Actions & URL Input */}
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={desktopFileRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "desktop");
                        }}
                        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => desktopFileRef.current?.click()}
                        disabled={uploadingField === "desktop"}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-lg transition disabled:opacity-50 cursor-pointer"
                      >
                        {uploadingField === "desktop" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Desktop Media</span>
                          </>
                        )}
                      </button>
                      {formMediaUrl && (
                        <button
                          type="button"
                          onClick={() => setFormMediaUrl("")}
                          className="px-2.5 py-2 text-xs text-neutral-500 hover:text-red-600 rounded-lg hover:bg-neutral-100 cursor-pointer"
                          title="Remove media"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      value={formMediaUrl}
                      onChange={(e) => setFormMediaUrl(e.target.value)}
                      placeholder="Or enter desktop media URL: Cloudinary URL or /images/..."
                      className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Tablet Image */}
              <div className="p-4 bg-neutral-50/60 rounded-xl border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Tablet className="w-4 h-4 text-neutral-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      3. Tablet Media / Video / Image (Optional)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded">
                    Recommended: 1024×768 (4:3 aspect ratio)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                  <div className="relative aspect-[4/3] bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200 flex items-center justify-center">
                    {formTabletMediaUrl ? (
                      formTabletMediaUrl.endsWith(".mp4") || formTabletMediaUrl.includes("/video/") ? (
                        <video src={formTabletMediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={formTabletMediaUrl} alt="Tablet Preview" className="w-full h-full object-cover" />
                      )
                    ) : formMediaUrl ? (
                      <div className="text-center p-2">
                        <span className="text-[10px] text-neutral-400 block font-medium">Using Desktop Fallback</span>
                        {formMediaUrl.endsWith(".mp4") || formMediaUrl.includes("/video/") ? (
                          <video src={formMediaUrl} className="w-full h-16 object-cover opacity-50 mt-1 rounded" autoPlay muted loop playsInline />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={formMediaUrl} alt="Fallback" className="w-full h-16 object-cover opacity-50 mt-1 rounded" />
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400">No Image/Video</span>
                    )}
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={tabletFileRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "tablet");
                        }}
                        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => tabletFileRef.current?.click()}
                        disabled={uploadingField === "tablet"}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800 bg-white border border-neutral-300 hover:border-black rounded-lg transition disabled:opacity-50 cursor-pointer"
                      >
                        {uploadingField === "tablet" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Tablet Image / Video</span>
                          </>
                        )}
                      </button>
                      {formTabletMediaUrl && (
                        <button
                          type="button"
                          onClick={() => setFormTabletMediaUrl("")}
                          className="px-2.5 py-2 text-xs text-neutral-500 hover:text-red-600 rounded-lg hover:bg-neutral-100 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formTabletMediaUrl}
                      onChange={(e) => setFormTabletMediaUrl(e.target.value)}
                      placeholder="Or enter tablet image URL (leave empty for desktop fallback)"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg bg-white"
                    />
                    <p className="text-[10px] text-neutral-400">
                      If not provided, the desktop image will automatically be used on tablet devices.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Mobile Image */}
              <div className="p-4 bg-neutral-50/60 rounded-xl border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-neutral-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      4. Mobile Media / Video / Image (Optional)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded">
                    Recommended: 1024×1024 (1:1 Square - 0% cutoff)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                  <div className="relative aspect-square w-24 sm:w-28 bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200 flex items-center justify-center">
                    {formMobileMediaUrl ? (
                      formMobileMediaUrl.endsWith(".mp4") || formMobileMediaUrl.includes("/video/") ? (
                        <video src={formMobileMediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={formMobileMediaUrl} alt="Mobile Preview" className="w-full h-full object-cover" />
                      )
                    ) : formMediaUrl ? (
                      <div className="text-center p-1">
                        <span className="text-[9px] text-neutral-400 block font-medium">Desktop Fallback</span>
                        {formMediaUrl.endsWith(".mp4") || formMediaUrl.includes("/video/") ? (
                          <video src={formMediaUrl} className="w-full h-12 object-cover opacity-50 mt-1 rounded" autoPlay muted loop playsInline />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={formMediaUrl} alt="Fallback" className="w-full h-12 object-cover opacity-50 mt-1 rounded" />
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400">No Image/Video</span>
                    )}
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={mobileFileRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "mobile");
                        }}
                        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => mobileFileRef.current?.click()}
                        disabled={uploadingField === "mobile"}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800 bg-white border border-neutral-300 hover:border-black rounded-lg transition disabled:opacity-50 cursor-pointer"
                      >
                        {uploadingField === "mobile" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Mobile 1:1 Image / Video</span>
                          </>
                        )}
                      </button>
                      {formMobileMediaUrl && (
                        <button
                          type="button"
                          onClick={() => setFormMobileMediaUrl("")}
                          className="px-2.5 py-2 text-xs text-neutral-500 hover:text-red-600 rounded-lg hover:bg-neutral-100 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formMobileMediaUrl}
                      onChange={(e) => setFormMobileMediaUrl(e.target.value)}
                      placeholder="/images/heroes/hero-banner-1-mobile.png or URL"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg bg-white"
                    />
                    <p className="text-[10px] text-neutral-400">
                      Square crop ensures 100% visible luxury product presentation without edge cutting on mobile screens.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Content (Heading & Subheading) */}
              <div className="p-4 bg-neutral-50/60 rounded-xl border border-neutral-200/80 space-y-3">
                <div className="border-b border-neutral-200 pb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    5. Content & Headline (Optional)
                  </h4>
                  {(formHeading || formSubtitle) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormHeading("");
                        setFormSubtitle("");
                      }}
                      className="text-[10px] text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                    >
                      Clear Heading & Subheading
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-neutral-700">
                        Main Heading (Optional)
                      </label>
                      {formHeading && (
                        <button
                          type="button"
                          onClick={() => setFormHeading("")}
                          className="text-[10px] text-neutral-400 hover:text-red-600 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formHeading}
                      onChange={(e) => setFormHeading(e.target.value)}
                      placeholder="e.g. THE FLORENCE SADDLE (or leave empty)"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white font-serif"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-neutral-700">
                        Subheading / Tagline (Optional)
                      </label>
                      {formSubtitle && (
                        <button
                          type="button"
                          onClick={() => setFormSubtitle("")}
                          className="text-[10px] text-neutral-400 hover:text-red-600 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      placeholder="e.g. Handcrafted in Italy (or leave empty)"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Leave empty if your campaign banner already includes typography directly in the graphic image.
                </p>
              </div>

              {/* SECTION 6: CTA (Call To Action) */}
              <div className="p-4 bg-neutral-50/60 rounded-xl border border-neutral-200/80 space-y-3">
                <div className="border-b border-neutral-200 pb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    6. Call To Action (Optional)
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-medium">Optional Button</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      CTA Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={formButtonText}
                      onChange={(e) => setFormButtonText(e.target.value)}
                      placeholder="e.g. SHOP NOW (or leave empty)"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white uppercase font-bold"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      If left empty, clicking anywhere on the hero banner image/video will redirect to the Target URL.
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <DestinationLinkSelect
                      value={formButtonLink}
                      onChange={setFormButtonLink}
                      label="Target Link / URL (Select active page, category, product or type custom URL)"
                      placeholder="/shop or /category/handbags"
                      helperText="Destination page when the slide or CTA button is clicked."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 7: Visibility & Scheduling */}
              <div className="p-4 bg-neutral-50/60 rounded-xl border border-neutral-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-2">
                  7. Visibility, Position & Scheduling
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Display Position Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Lower numbers appear first in the carousel sequence.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-black focus:ring-black"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Active and Published in Storefront
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer / Save Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingField !== null}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : editingBanner ? "Update Hero Banner" : "Save Hero Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
