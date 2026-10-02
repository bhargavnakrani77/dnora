"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Play,
  Upload,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Video,
  ShoppingBag,
  Sparkles,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SeenOnYouVideo, Product } from "@/types";

export default function AdminSeenOnYouPage() {
  const [videos, setVideos] = useState<SeenOnYouVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<SeenOnYouVideo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SeenOnYouVideo | null>(null);
  const [previewVideo, setPreviewVideo] = useState<SeenOnYouVideo | null>(null);
  const [previewMuted, setPreviewMuted] = useState(false);

  // Available Products for Auto-Selection
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [productName, setProductName] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [status, setStatus] = useState<"active" | "hidden">("active");
  const [sortOrder, setSortOrder] = useState(0);

  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/seen-on-you");
      if (res.ok) {
        const json = await res.json();
        setVideos(json.videos || []);
      } else {
        showStatus("error", "Failed to fetch videos from server");
      }
    } catch {
      showStatus("error", "Network error fetching videos");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const json = await res.json();
        const activeProds = (json.products || []).filter(
          (p: Product) => p.status === "active" || !p.status
        );
        setAvailableProducts(activeProds);
      }
    } catch (err) {
      console.error("Failed to load products for tagging:", err);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingVideo(null);
    setCustomerName("");
    setVideoUrl("");
    setThumbnailUrl("");
    setCaption("");
    setProductName("");
    setProductSlug("");
    setStatus("active");
    setSortOrder(videos.length + 1);
    setModalOpen(true);
  };

  const openEditModal = (v: SeenOnYouVideo) => {
    setEditingVideo(v);
    setCustomerName(v.customer_name);
    setVideoUrl(v.video_url);
    setThumbnailUrl(v.thumbnail_url || "");
    setCaption(v.caption || "");
    setProductName(v.product_name || "");
    setProductSlug(v.product_slug || "");
    setStatus(v.status || "active");
    setSortOrder(v.sort_order || 0);
    setModalOpen(true);
  };

  // Upload handlers
  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingVideo(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "dnora/seenonyou");
      fd.append("resource_type", "video");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setVideoUrl(data.secure_url || data.url);
        showStatus("success", "Video file uploaded successfully!");
      } else {
        const errData = await res.json();
        showStatus("error", errData.error || "Video upload failed");
      }
    } catch {
      showStatus("error", "Error uploading video file");
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

  const handleUploadThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumb(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "dnora/seenonyou/thumbs");
      fd.append("resource_type", "image");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setThumbnailUrl(data.secure_url || data.url);
        showStatus("success", "Thumbnail image uploaded!");
      } else {
        const errData = await res.json();
        showStatus("error", errData.error || "Thumbnail upload failed");
      }
    } catch {
      showStatus("error", "Error uploading thumbnail");
    } finally {
      setUploadingThumb(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      showStatus("error", "Video URL is required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        customer_name: customerName.trim() || "DNORA Patron",
        video_url: videoUrl.trim(),
        thumbnail_url: thumbnailUrl.trim(),
        caption: caption.trim(),
        product_name: productName.trim(),
        product_slug: productSlug.trim(),
        status,
        sort_order: Number(sortOrder) || 0,
      };

      if (editingVideo) {
        const res = await fetch(`/api/admin/seen-on-you/${editingVideo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showStatus("success", "Video updated successfully!");
          setModalOpen(false);
          fetchVideos();
        } else {
          const d = await res.json();
          showStatus("error", d.error || "Failed to update video");
        }
      } else {
        const res = await fetch("/api/admin/seen-on-you", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showStatus("success", "New video published successfully!");
          setModalOpen(false);
          fetchVideos();
        } else {
          const d = await res.json();
          showStatus("error", d.error || "Failed to create video");
        }
      }
    } catch {
      showStatus("error", "Error saving video");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/seen-on-you/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showStatus("success", "Video deleted successfully");
        setDeleteConfirm(null);
        fetchVideos();
      } else {
        showStatus("error", "Failed to delete video");
      }
    } catch {
      showStatus("error", "Error deleting video");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (v: SeenOnYouVideo) => {
    const newStatus = v.status === "active" ? "hidden" : "active";
    try {
      const res = await fetch(`/api/admin/seen-on-you/${v.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showStatus("success", `Video marked as ${newStatus}`);
        fetchVideos();
      }
    } catch {
      showStatus("error", "Failed to update video status");
    }
  };

  const activeCount = videos.filter((v) => v.status === "active").length;

  return (
    <div className="space-y-8 w-full pb-16 animate-in fade-in duration-200">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-rose-500/10 text-rose-700 border border-rose-200">
              Community & UGC Reels
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Seen On You (Videos)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Curate vertical reels, creator style moments, and UGC videos featured on the storefront.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchVideos}
            disabled={loading}
            className="p-2.5 text-neutral-600 hover:text-black bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 shadow-xs transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/#seen-on-you"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl shadow-xs transition"
          >
            <Eye className="w-4 h-4 text-neutral-400" />
            <span className="hidden sm:inline">Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </Link>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-xl shadow-md transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Video</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Toast */}
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

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Reels</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{videos.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Active On Storefront</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Hidden / Draft</div>
          <div className="text-2xl font-bold text-neutral-500 mt-1">{videos.length - activeCount}</div>
        </div>
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
          <p className="text-xs uppercase tracking-widest text-neutral-400">Loading Videos...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center mx-auto text-neutral-500">
            <Video className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">No Videos Added Yet</h3>
            <p className="text-xs text-neutral-500">
              Add short vertical videos or reels of patrons and creators to showcase DNORA silhouettes.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Video</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs hover:border-black/30 transition-all flex flex-col justify-between group"
            >
              {/* Media Reel Frame */}
              <div className="relative aspect-[9/14] bg-neutral-900 overflow-hidden">
                {vid.video_url ? (
                  <video
                    src={vid.video_url}
                    poster={vid.thumbnail_url}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : vid.thumbnail_url ? (
                  <Image
                    src={vid.thumbnail_url}
                    alt={vid.caption || vid.customer_name}
                    fill
                    sizes="300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30">
                    <Video className="w-10 h-10" />
                  </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Preview Button */}
                <button
                  type="button"
                  onClick={() => setPreviewVideo(vid)}
                  className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>
                </button>

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white tracking-wider border border-white/10">
                    {vid.customer_name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      vid.status === "active"
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-white/80 text-neutral-700"
                    }`}
                  >
                    {vid.status}
                  </span>
                </div>

                {/* Order Badge */}
                <div className="absolute bottom-2.5 left-2.5 z-10">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-mono text-white/70">
                    Order: {vid.sort_order}
                  </span>
                </div>
              </div>

              {/* Video Info & Controls */}
              <div className="p-4 space-y-3">
                {vid.caption && (
                  <p className="text-xs text-neutral-600 line-clamp-2 font-light italic">
                    &ldquo;{vid.caption}&rdquo;
                  </p>
                )}

                {vid.product_name && (
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-900 font-medium truncate">
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                    <span className="truncate">{vid.product_name}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(vid)}
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
                  >
                    {vid.status === "active" ? "Hide" : "Publish"}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(vid)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(vid)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal - Viewport Bounded to Prevent Overflow */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 min-h-screen animate-in fade-in"
        >
          <div className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-neutral-900">
                  {editingVideo ? "Edit Video / Reel" : "Add New Video / Reel"}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Provide a 9:16 vertical video and details to feature in the Seen On You section.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {/* 1. Auto-select from active products dropdown */}
                <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-800">
                    Auto-Select From Active Products
                  </label>
                  <select
                    value={
                      availableProducts.find(
                        (p) => p.name === productName || p.slug === productSlug
                      )?.id || ""
                    }
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const prod = availableProducts.find((p) => p.id === selectedId);
                      if (prod) {
                        setProductName(prod.name);
                        setProductSlug(prod.slug);
                      } else {
                        setProductName("");
                        setProductSlug("");
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 font-medium focus:outline-none focus:border-black transition cursor-pointer"
                  >
                    <option value="">-- Choose an Active Product (Auto-fills name & link) --</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (/{p.slug})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-500">
                    Selecting a product automatically populates Tagged Product Name and Product Slug.
                  </p>
                </div>

                {/* 2. Tagged Product Name & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Tagged Product Name
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. The Marais Handbag"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Product Slug (Link)
                    </label>
                    <input
                      type="text"
                      value={productSlug}
                      onChange={(e) => setProductSlug(e.target.value)}
                      placeholder="e.g. the-marais-handbag"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* 3. Creator Handle */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Creator / Customer Handle
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. @sophia.style or Camille V."
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white transition"
                  />
                </div>

                {/* 4. Video URL & Upload */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Video File / URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://.../video.mp4"
                      className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white transition"
                    />
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={handleUploadVideo}
                    />
                    <button
                      type="button"
                      disabled={uploadingVideo}
                      onClick={() => videoFileInputRef.current?.click()}
                      className="px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                    >
                      {uploadingVideo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Upload</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    MP4 or WebM vertical (9:16) video. Max 50MB.
                  </p>
                </div>

                {/* 5. Thumbnail Image */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Thumbnail / Poster Image (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://.../poster.jpg"
                      className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white transition"
                    />
                    <input
                      ref={thumbFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleUploadThumb}
                    />
                    <button
                      type="button"
                      disabled={uploadingThumb}
                      onClick={() => thumbFileInputRef.current?.click()}
                      className="px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                    >
                      {uploadingThumb ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Image</span>
                    </button>
                  </div>
                </div>

                {/* 6. Caption / Quote (Optional) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Caption / Quote (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write an optional caption or quote..."
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white transition"
                  />
                </div>

                {/* 7. Sort Order & Status */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as "active" | "hidden")}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white transition"
                    >
                      <option value="active">Active (Visible)</option>
                      <option value="hidden">Hidden (Draft)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fixed Footer Buttons */}
              <div className="p-4 sm:p-5 border-t border-neutral-100 flex items-center justify-end gap-3 bg-neutral-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-black text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingVideo ? "Update Video" : "Save & Publish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="relative w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-6 text-neutral-900 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold uppercase tracking-wider text-neutral-900">Delete Video Reel?</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-6">
              Are you sure you want to delete the video for <span className="font-bold text-neutral-900">{deleteConfirm.customer_name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:text-black text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Lightbox Preview in Admin */}
      {previewVideo && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewVideo(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/20 shadow-2xl flex flex-col justify-between"
          >
            <button
              type="button"
              onClick={() => setPreviewVideo(null)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setPreviewMuted(!previewMuted)}
              className="absolute top-4 left-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
            >
              {previewMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <div className="absolute inset-0">
              <video
                src={previewVideo.video_url}
                autoPlay
                loop
                muted={previewMuted}
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            </div>

            <div className="relative z-20 mt-auto p-4 space-y-2 text-white">
              <span className="font-bold text-sm">{previewVideo.customer_name}</span>
              <p className="text-xs text-neutral-300 font-light">{previewVideo.caption}</p>
              {previewVideo.product_name && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-black text-xs font-semibold">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{previewVideo.product_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
