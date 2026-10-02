"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  Upload,
  Search,
  Check,
  Flame,
  Clock,
  Eye,
  Tag,
  SlidersHorizontal,
} from "lucide-react";
import { Product, StorefrontPageConfig } from "@/types";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ pageKey: string }>;
}

const PAGES_META: Record<
  string,
  { label: string; storefrontUrl: string; icon: React.ElementType; defaultBadge: string; description: string }
> = {
  bestseller: {
    label: "Best Sellers",
    storefrontUrl: "/bestseller",
    icon: Flame,
    defaultBadge: "Curated Icons",
    description: "Manage the hero headline, editorial story, and curated products showcased on your Best Sellers page.",
  },
  "new-in": {
    label: "New In",
    storefrontUrl: "/new-in",
    icon: Clock,
    defaultBadge: "Seasonal Arrivals",
    description: "Manage the seasonal drops, craftsmanship narrative, and new arrival products on your New In page.",
  },
  "trending-now": {
    label: "Trending Now",
    storefrontUrl: "/trending-now",
    icon: Sparkles,
    defaultBadge: "Trending Collection",
    description: "Manage the trending lookbook title, description narrative, and featured trending silhouettes.",
  },
};

export default function AdminStorefrontPageEditor({ params }: PageProps) {
  const router = useRouter();
  const { pageKey } = use(params);

  const activeKey = PAGES_META[pageKey] ? pageKey : "bestseller";
  const currentMeta = PAGES_META[activeKey];
  const PageIcon = currentMeta.icon;

  // Data states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerHeadline, setBannerHeadline] = useState("");
  const [bannerSubheadline, setBannerSubheadline] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Products Curation
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Load data for active page key
  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`/api/admin/storefront-pages?page=${activeKey}`);
        const json = await res.json();

        if (res.ok && json.success) {
          const p: StorefrontPageConfig | null = json.page;
          const prods: Product[] = json.products || [];
          setAllProducts(prods);

          if (p) {
            setTitle(p.title || currentMeta.label.toUpperCase());
            setBadgeLabel(p.badge_label || currentMeta.defaultBadge);
            setSubtitle(p.subtitle || "");
            setDescription(p.description || "");
            setBannerImageUrl(p.banner_image_url || "");
            setBannerHeadline(p.banner_headline || "");
            setBannerSubheadline(p.banner_subheadline || "");
            setMetaTitle(p.meta_title || "");
            setMetaDescription(p.meta_description || "");
            setIsActive(p.is_active !== undefined ? p.is_active : true);

            // If featured_product_ids is empty, pre-populate sensible defaults
            if (p.featured_product_ids && p.featured_product_ids.length > 0) {
              setFeaturedProductIds(p.featured_product_ids);
            } else {
              // Auto-seed with matching flags if brand new
              if (activeKey === "bestseller") {
                const defaultIds = prods.filter((x) => x.is_best_seller).map((x) => x.id);
                setFeaturedProductIds(defaultIds.length > 0 ? defaultIds : prods.slice(0, 8).map((x) => x.id));
              } else if (activeKey === "new-in") {
                const defaultIds = prods.filter((x) => x.is_new_arrival).map((x) => x.id);
                setFeaturedProductIds(defaultIds.length > 0 ? defaultIds : prods.slice(0, 8).map((x) => x.id));
              } else {
                setFeaturedProductIds(prods.slice(0, 8).map((x) => x.id));
              }
            }
          } else {
            setTitle(currentMeta.label.toUpperCase());
            setBadgeLabel(currentMeta.defaultBadge);
            setFeaturedProductIds(prods.slice(0, 6).map((x) => x.id));
          }
        } else {
          setErrorMsg("Could not load storefront page configuration.");
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [activeKey, currentMeta.label, currentMeta.defaultBadge]);

  // Handle Banner Upload
  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "dnora/storefront-pages");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.secure_url) {
        throw new Error(json.error || "Failed to upload image");
      }

      setBannerImageUrl(json.secure_url);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
    }
  };

  // Toggle a product featured on this page
  const toggleProduct = (productId: string) => {
    setFeaturedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Select All / Deselect All
  const handleSelectAll = () => {
    setFeaturedProductIds(allProducts.map((p) => p.id));
  };

  const handleDeselectAll = () => {
    setFeaturedProductIds([]);
  };

  // Save Page Settings
  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: StorefrontPageConfig = {
        page_key: activeKey,
        title: title.trim() || currentMeta.label.toUpperCase(),
        badge_label: badgeLabel.trim() || null,
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        banner_image_url: bannerImageUrl.trim() || null,
        banner_headline: bannerHeadline.trim() || null,
        banner_subheadline: bannerSubheadline.trim() || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        is_active: isActive,
        featured_product_ids: featuredProductIds,
      };

      const res = await fetch("/api/admin/storefront-pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save storefront page");
      }

      setSuccessMsg(`"${currentMeta.label}" page updated successfully! Changes are live on your storefront.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving page");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category_name && p.category_name.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
          <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">
            Loading Storefront Page Editor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 pb-28">
      {/* Hidden file input for banner upload */}
      <input
        ref={bannerFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBannerFileSelect}
      />

      {/* STICKY TOP HEADER */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 text-neutral-500 hover:text-black rounded-lg hover:bg-neutral-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#B89025] flex items-center gap-1">
                <PageIcon className="w-3 h-3 text-[#B89025]" />
                Storefront Page Editor
              </span>
              <span className="text-[10px] font-mono text-neutral-400">/{activeKey}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 font-serif">
              {currentMeta.label} Page
            </h1>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href={currentMeta.storefrontUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <span>View Live</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Page</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* TOP TAB SWITCHER: BESTSELLERS | NEW IN | TRENDING NOW */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-1.5 sm:p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
          {Object.entries(PAGES_META).map(([key, meta]) => {
            const Icon = meta.icon;
            const isSelected = activeKey === key;
            return (
              <Link
                key={key}
                href={`/admin/storefront-pages/${key}`}
                className={`flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-neutral-400"}`} />
                <span>{meta.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-600 hover:text-red-900 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SECTION 1: EDITORIAL HEADER & NARRATIVE */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
                Section 1
              </span>
              <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
                Editorial Header & Narrative Story
              </h2>
              <p className="text-xs text-neutral-500 font-light">
                Configure the primary title, pill badge, subtitle, and atelier narrative displayed at the top of the {currentMeta.label} page.
              </p>
            </div>

            {/* Status Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
              />
              <span className="text-xs font-bold text-neutral-800">
                {isActive ? "Page Published" : "Draft (Hidden)"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Page Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Page Headline / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={currentMeta.label.toUpperCase()}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-bold font-serif"
              />
            </div>

            {/* Badge Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Pill Badge Tag
              </label>
              <input
                type="text"
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder={currentMeta.defaultBadge}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-medium"
              />
            </div>
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Editorial Subtitle / Tagline
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Curated visual edits and architectural silhouettes."
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-medium"
            />
          </div>

          {/* Full Narrative Story */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Atelier Narrative Story / Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Handcrafted in Florence, Italy using sustainably-sourced Italian calfskin..."
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-normal leading-relaxed"
            />
          </div>
        </div>

        {/* SECTION 2: HERO BANNER & VISUALS (OPTIONAL) */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-neutral-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
              Section 2
            </span>
            <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
              Top Visual Banner (Optional)
            </h2>
            <p className="text-xs text-neutral-500 font-light">
              Add a cinematic luxury editorial banner at the very top of the page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Banner Image Preview / Upload */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 block">
                Banner Artwork / Photography
              </span>

              <div
                onClick={() => bannerFileInputRef.current?.click()}
                className={`relative aspect-[21/9] sm:aspect-[16/7] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer overflow-hidden group ${
                  bannerImageUrl
                    ? "border-neutral-300 bg-black"
                    : "border-neutral-300 hover:border-black bg-neutral-50"
                }`}
              >
                {bannerImageUrl ? (
                  <>
                    <Image
                      src={bannerImageUrl}
                      alt="Banner Preview"
                      fill
                      className="object-cover opacity-85 group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <span className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg shadow-sm">
                        Change Artwork
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    {uploadingBanner ? (
                      <Loader2 className="w-8 h-8 animate-spin text-neutral-600 mx-auto" />
                    ) : (
                      <Upload className="w-8 h-8 text-neutral-400 group-hover:text-black mx-auto transition-colors" />
                    )}
                    <p className="text-xs font-bold text-neutral-700">Click to Upload Banner Image</p>
                    <p className="text-[10px] text-neutral-400">Recommended 1920x600 high-resolution</p>
                  </div>
                )}
              </div>

              {bannerImageUrl && (
                <button
                  type="button"
                  onClick={() => setBannerImageUrl("")}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Remove Banner Image
                </button>
              )}
            </div>

            {/* Banner Text Overlays */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Banner Overlay Headline
                </label>
                <input
                  type="text"
                  value={bannerHeadline}
                  onChange={(e) => setBannerHeadline(e.target.value)}
                  placeholder="Florentine Heritage & Discipline"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Banner Subheadline
                </label>
                <input
                  type="text"
                  value={bannerSubheadline}
                  onChange={(e) => setBannerSubheadline(e.target.value)}
                  placeholder="Limited Edition Architectural Pieces"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Or Direct Image URL
                </label>
                <input
                  type="url"
                  value={bannerImageUrl}
                  onChange={(e) => setBannerImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PRODUCT CURATION / FEATURED SILHOUETTES */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
                  Section 3
                </span>
                <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-white font-mono text-[10px] font-bold">
                  {featuredProductIds.length} Selected
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
                Curated Products for {currentMeta.label}
              </h2>
              <p className="text-xs text-neutral-500 font-light">
                Select exactly which silhouettes are featured on this page. Click any item card to toggle inclusion.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
              >
                Select All ({allProducts.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products by title, SKU, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-medium"
            />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isSelected = featuredProductIds.includes(p.id);
              const imgUrl = p.images?.[0]?.secure_url;
              return (
                <div
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`group relative rounded-xl border p-2.5 transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? "border-neutral-950 bg-neutral-900 text-white shadow-sm ring-2 ring-neutral-900/10"
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-900"
                  }`}
                >
                  {/* Selection Checkmark Indicator */}
                  <div
                    className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-white text-black shadow-xs"
                        : "bg-black/20 text-transparent border border-white/50"
                    }`}
                  >
                    <Check className={`w-3 h-3 ${isSelected ? "text-black" : "text-transparent"}`} />
                  </div>

                  <div>
                    {/* Thumbnail Image */}
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-neutral-100 mb-2">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={p.name}
                          fill
                          sizes="150px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                          No Photo
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <p className={`text-xs font-semibold line-clamp-1 leading-tight ${isSelected ? "text-white" : "text-neutral-900"}`}>
                      {p.name}
                    </p>

                    {/* Category & SKU */}
                    <p className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
                      {p.category_name || "Boutique"} • {p.sku || "DNR"}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono ${isSelected ? "text-white" : "text-neutral-950"}`}>
                      {formatPrice(p.price)}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: SEO METADATA */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
              Section 4
            </span>
            <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
              Search Engine Optimization (SEO)
            </h2>
            <p className="text-xs text-neutral-500 font-light">
              Customize title tags and meta descriptions for search engine indexing and social sharing previews.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={`${currentMeta.label} | Handcrafted Luxury Handbags | DNORA`}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                SEO Meta Description
              </label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={`Discover the ${currentMeta.label} collection from DNORA luxury house. Handcrafted in Florence, Italy.`}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-normal leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-neutral-700">
              Editing <strong className="text-neutral-950 font-bold">{currentMeta.label}</strong> Page
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={currentMeta.storefrontUrl}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              <span>Preview Live Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-2.5 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Page Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
