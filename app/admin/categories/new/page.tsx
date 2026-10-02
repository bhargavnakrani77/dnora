"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Crop,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Tag,
} from "lucide-react";
import { CircularImageCropperModal } from "@/components/admin/CircularImageCropperModal";

export default function NewCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isInNav, setIsInNav] = useState(true);
  const [isInCollections, setIsInCollections] = useState(true);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Circular Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSourceUrl, setCropperSourceUrl] = useState("");

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  };

  const handleRoundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type)) {
      showStatus("error", "Please upload a valid image (JPG, PNG, WEBP, or AVIF).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showStatus("error", "Image file exceeds 15MB limit.");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "dnora/categories");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Upload failed");
      }
      const data = await res.json();
      const newUrl = data.secure_url || data.url || data.media?.secure_url;
      if (!newUrl) throw new Error("No image URL returned from upload server");

      setImageUrl(newUrl);
      showStatus("success", "Category round image uploaded successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Image upload failed";
      showStatus("error", message);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showStatus("error", "Category name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        image_url: imageUrl.trim(),
        is_in_nav: isInNav,
        is_in_collections: isInCollections,
      };

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        showStatus("success", `Category "${json.data.name}" created!`);
        setTimeout(() => {
          router.push("/admin/categories");
        }, 600);
      } else {
        const json = await res.json().catch(() => ({}));
        showStatus("error", json.error || "Failed to create category");
      }
    } catch {
      showStatus("error", "Server communication error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-5">
        <div className="space-y-1">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Categories</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Add New Category
          </h1>
          <p className="text-xs text-neutral-500">
            Define silhouette taxonomy and configure storefront navigation visibility.
          </p>
        </div>
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

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-neutral-900 mb-1.5 uppercase tracking-wider">
            Category Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Architectural Totes, Evening Minis, Crossbody Bags"
            className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-medium"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-bold text-neutral-900 mb-1.5 uppercase tracking-wider">
            URL Identifier (Slug) *
          </label>
          <div className="flex items-center rounded-xl border border-neutral-300 bg-neutral-50 px-3.5 py-2 focus-within:border-black focus-within:bg-white transition">
            <span className="text-xs font-mono text-neutral-400 shrink-0">/category/</span>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="architectural-totes"
              className="w-full bg-transparent text-xs font-mono text-neutral-900 focus:outline-none ml-1"
            />
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Storefront link will be: <code className="font-mono text-neutral-700">/category/{slug || "[slug]"}</code>
          </p>
        </div>

        {/* Navigation Bar Toggle */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-neutral-900 block">
              Show in Storefront Navigation Bar & Sidebar Menu
            </label>
            <p className="text-[11px] text-neutral-500">
              When enabled, this category will appear automatically under &quot;Categories&quot; in the header navigation and mobile drawer.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              type="checkbox"
              checked={isInNav}
              onChange={(e) => setIsInNav(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
          </label>
        </div>

        {/* Our Collections (Circular Highlights) Toggle */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-neutral-900 block">
              Show in Storefront &quot;Our Collections&quot; (Round Highlights)
            </label>
            <p className="text-[11px] text-neutral-500">
              When enabled, this category will appear in the circular collections capsules on the homepage.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              type="checkbox"
              checked={isInCollections}
              onChange={(e) => setIsInCollections(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-neutral-900 mb-1.5 uppercase tracking-wider">
            Editorial Description (Optional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Luxury craftsmanship narrative describing this silhouette collection..."
            className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-light leading-relaxed"
          />
        </div>

        {/* Storefront Round Silhouette Image */}
        <div>
          <label className="block text-xs font-bold text-neutral-900 mb-1.5 uppercase tracking-wider">
            Storefront Round Silhouette Image
          </label>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-neutral-200 shrink-0 flex items-center justify-center">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Category Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Tag className="w-6 h-6 text-neutral-400 opacity-60" />
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... image URL or click Upload below"
                className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-mono"
              />

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-lg cursor-pointer transition shadow-2xs">
                  {uploadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{uploadingImage ? "Uploading..." : "Upload Round Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleRoundImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>

                {imageUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCropperSourceUrl(imageUrl);
                        setCropperOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 rounded-lg cursor-pointer transition"
                    >
                      <Crop className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Crop / Center</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-neutral-100">
          <Link
            href="/admin/categories"
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {saving ? "Creating Category..." : "Create Category"}
          </button>
        </div>
      </form>

      {/* Circular Image Cropper Modal */}
      <CircularImageCropperModal
        isOpen={cropperOpen}
        initialImageUrl={cropperSourceUrl}
        onClose={() => setCropperOpen(false)}
        onCropComplete={(croppedUrl) => {
          setImageUrl(croppedUrl);
          setCropperOpen(false);
          showStatus("success", "Category circular image adjusted & ready!");
        }}
        title={`Adjust "${name || "Category"}" Round Image`}
      />
    </div>
  );
}
