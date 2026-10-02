"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Search,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  ShoppingBag,
  Package,
} from "lucide-react";
import { TrendingNowItem } from "@/types";
import { formatPrice } from "@/lib/utils";

interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  image_url: string;
  category_name?: string;
  stock: number;
}

export default function AdminTrendingNowPage() {
  const [trendingItems, setTrendingItems] = useState<TrendingNowItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [trendRes, prodRes] = await Promise.all([
        fetch("/api/admin/trending-now").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
      ]);

      if (trendRes.success) {
        setTrendingItems(trendRes.data || []);
      }

      const rawProds = Array.isArray(prodRes) ? prodRes : prodRes.products || [];
      const formatted: CatalogProduct[] = rawProds.map((p: any) => {
        const rawImg = p.images?.[0];
        const imgUrl =
          typeof rawImg === "string"
            ? rawImg
            : rawImg?.secure_url || p.thumbnail || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80";

        return {
          id: p.id,
          name: p.name || "Untitled Handbag",
          slug: p.slug || "",
          sku: p.sku || "DN-000",
          price: Number(p.price || 0),
          compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
          image_url: imgUrl,
          category_name: p.categories?.[0]?.name,
          stock: Number(p.stock || 0),
        };
      });

      setCatalogProducts(formatted);
    } catch {
      showFeedback("error", "Failed to load products and trending list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check if a catalog product is in Trending Now
  const isProductTrending = (productId: string, productSlug: string) => {
    return trendingItems.some(
      (item) =>
        item.product_id === productId ||
        (item.product_slug && item.product_slug === productSlug) ||
        (item.target_link && item.target_link.includes(productSlug))
    );
  };

  // Get matching Trending Now item
  const getTrendingItem = (productId: string, productSlug: string) => {
    return trendingItems.find(
      (item) =>
        item.product_id === productId ||
        (item.product_slug && item.product_slug === productSlug) ||
        (item.target_link && item.target_link.includes(productSlug))
    );
  };

  // Toggle Product into Trending Now
  const handleToggleProduct = async (product: CatalogProduct) => {
    const existing = getTrendingItem(product.id, product.slug);

    try {
      setActionLoadingId(product.id);

      if (existing) {
        // Remove from Trending Now
        const res = await fetch(`/api/admin/trending-now?id=${existing.id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setTrendingItems((prev) => prev.filter((it) => it.id !== existing.id));
          showFeedback("success", `Removed "${product.name}" from Trending Now.`);
        } else {
          showFeedback("error", "Failed to remove item.");
        }
      } else {
        // Add to Trending Now
        const nextOrder = trendingItems.length + 1;
        const res = await fetch("/api/admin/trending-now", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: product.name,
            product_id: product.id,
            product_slug: product.slug,
            image_url: product.image_url,
            alt_text: product.name,
            sort_order: nextOrder,
            is_active: true,
            target_link: `/product/${product.slug}`,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setTrendingItems((prev) => [...prev, json.data]);
          } else {
            loadData();
          }
          showFeedback("success", `Added "${product.name}" to Trending Now!`);
        } else {
          showFeedback("error", "Failed to add product to Trending Now.");
        }
      }
    } catch {
      showFeedback("error", "An error occurred while updating Trending Now.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle active status for existing item
  const handleToggleActive = async (item: TrendingNowItem) => {
    try {
      setActionLoadingId(item.id);
      const res = await fetch("/api/admin/trending-now", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          is_active: !item.is_active,
        }),
      });

      if (res.ok) {
        setTrendingItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, is_active: !it.is_active } : it))
        );
      }
    } catch {
      showFeedback("error", "Failed to update item status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete directly from active list
  const handleDeleteItem = async (itemId: string, itemTitle?: string) => {
    try {
      setActionLoadingId(itemId);
      const res = await fetch(`/api/admin/trending-now?id=${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTrendingItems((prev) => prev.filter((it) => it.id !== itemId));
        showFeedback("success", `Removed "${itemTitle || "Item"}" from Trending Now.`);
      }
    } catch {
      showFeedback("error", "Failed to remove item.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Categories list
  const categoriesList = Array.from(
    new Set(catalogProducts.map((p) => p.category_name).filter(Boolean))
  );

  // Filtered catalog products
  const filteredProducts = catalogProducts.filter((p) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      categoryFilter === "all" || p.category_name === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200/70">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Trending Now Section Manager</span>
          </h1>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Select products from your catalog to feature directly in the storefront &ldquo;Trending Now&rdquo; marquee and lookbook.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/trending-now"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold tracking-wide transition-all shadow-xs"
          >
            <span>View Live Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Sparkles className="w-4 h-4 text-rose-600" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Currently Selected in Trending Now Strip */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
              Featured in Trending Now
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
              {trendingItems.length} Products Selected
            </span>
          </div>
          <p className="text-[11px] text-neutral-400">
            These products appear on the storefront homepage and /trending-now page.
          </p>
        </div>

        {trendingItems.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-neutral-200 rounded-xl space-y-1">
            <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-xs font-semibold text-neutral-700">No products selected yet</p>
            <p className="text-[11px] text-neutral-400">
              Browse the catalog below and click &ldquo;Add to Trending&rdquo; to feature silhouettes here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
            {trendingItems.map((item, idx) => {
              const isLoading = actionLoadingId === item.id;

              return (
                <div
                  key={item.id}
                  className="relative group bg-[#FAF9F6] border border-neutral-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-white border border-neutral-100 mb-2">
                    <Image
                      src={item.image_url}
                      alt={item.title || "Trending item"}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                      #{idx + 1}
                    </div>

                    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        disabled={isLoading}
                        className="p-1 rounded-md bg-white/90 text-neutral-700 hover:text-black shadow-xs cursor-pointer"
                        title={item.is_active ? "Hide" : "Show"}
                      >
                        {item.is_active ? (
                          <Eye className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-neutral-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        disabled={isLoading}
                        className="p-1 rounded-md bg-white/90 text-rose-600 hover:bg-rose-50 shadow-xs cursor-pointer"
                        title="Remove from Trending"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="font-semibold text-neutral-900 text-[11px] truncate" title={item.title}>
                    {item.title || "DNORA Silhouette"}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                        item.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {item.is_active ? "Live" : "Hidden"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      disabled={isLoading}
                      className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Catalog Product Selector */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-4">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
              Boutique Catalog Silhouettes
            </h2>
            <p className="text-[11px] text-neutral-500 font-light">
              Toggle any product to instantly feature its real photo, title, and price in Trending Now.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-hidden font-medium text-neutral-700 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-neutral-800 animate-spin mx-auto mb-2" />
            <p className="text-xs text-neutral-500 font-light">Loading catalog products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Package className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-xs font-semibold text-neutral-800">No matching products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => {
              const isTrending = isProductTrending(product.id, product.slug);
              const isActionLoading = actionLoadingId === product.id;

              return (
                <div
                  key={product.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isTrending
                      ? "bg-amber-50/40 border-amber-300 shadow-xs"
                      : "bg-[#FAF9F6] border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 h-15 rounded-lg overflow-hidden bg-white border border-neutral-200 shrink-0">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-neutral-900 text-xs truncate" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {product.sku} {product.category_name ? `• ${product.category_name}` : ""}
                      </p>
                      <p className="text-xs font-bold font-mono text-neutral-900 mt-0.5">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleProduct(product)}
                    disabled={isActionLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                      isTrending
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-2xs"
                        : "bg-neutral-900 hover:bg-black text-white"
                    }`}
                  >
                    {isActionLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isTrending ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Trending</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
