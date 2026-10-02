"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  ExternalLink,
  Tag,
  Loader2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Monitor,
  Check,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Compass,
  Package,
  Sparkles,
  EyeOff,
} from "lucide-react";
import { ProductCategory } from "@/types";

interface CatalogProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
  status: string;
  image_url?: string;
  categories?: { id: string; name: string }[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [togglingNavId, setTogglingNavId] = useState<string | null>(null);
  const [togglingCollectionsId, setTogglingCollectionsId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Filter for Table
  const [searchQuery, setSearchQuery] = useState("");
  const [navFilter, setNavFilter] = useState<"all" | "in_nav" | "not_in_nav">("all");

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<ProductCategory | null>(null);

  // Product Assignment Modal state
  const [productModalCat, setProductModalCat] = useState<ProductCategory | null>(null);
  const [assignedProducts, setAssignedProducts] = useState<CatalogProductItem[]>([]);
  const [allCatalogProducts, setAllCatalogProducts] = useState<CatalogProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productModalSearch, setProductModalSearch] = useState("");
  const [productModalTab, setProductModalTab] = useState<"assigned" | "add_new">("assigned");
  const [selectedProductIdsToAdd, setSelectedProductIdsToAdd] = useState<string[]>([]);
  const [addingProducts, setAddingProducts] = useState(false);
  const [removingProductId, setRemovingProductId] = useState<string | null>(null);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories?include_uncategorized=true");
      if (res.ok) {
        const json = await res.json();
        setCategories(json.data || []);
      } else {
        showStatus("error", "Failed to fetch categories");
      }
    } catch {
      showStatus("error", "Error connecting to categories API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Toggle category storefront navigation visibility
  const handleToggleNav = async (cat: ProductCategory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setTogglingNavId(cat.id);
      const nextNav = !(cat.is_in_nav ?? true);
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_in_nav: nextNav }),
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, is_in_nav: nextNav } : c))
        );
        showStatus(
          "success",
          nextNav
            ? `"${cat.name}" added to storefront navigation bar & sidebar!`
            : `"${cat.name}" removed from storefront navigation bar & sidebar.`
        );
      } else {
        const json = await res.json().catch(() => ({}));
        showStatus("error", json.error || "Failed to update navigation status");
      }
    } catch {
      showStatus("error", "Error connecting to server");
    } finally {
      setTogglingNavId(null);
    }
  };

  // Toggle category storefront "Our Collections" (homepage round highlights) visibility
  const handleToggleCollections = async (cat: ProductCategory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setTogglingCollectionsId(cat.id);
      const nextCollections = !(cat.is_in_collections ?? true);
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_in_collections: nextCollections }),
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, is_in_collections: nextCollections } : c))
        );
        showStatus(
          "success",
          nextCollections
            ? `"${cat.name}" added to homepage "Our Collections" circles!`
            : `"${cat.name}" hidden from homepage "Our Collections" circles.`
        );
      } else {
        const json = await res.json().catch(() => ({}));
        showStatus("error", json.error || "Failed to update collections status");
      }
    } catch {
      showStatus("error", "Error connecting to server");
    } finally {
      setTogglingCollectionsId(null);
    }
  };

  // Open Product Management Modal
  const openManageProducts = async (cat: ProductCategory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProductModalCat(cat);
    setProductModalSearch("");
    setSelectedProductIdsToAdd([]);
    setProductModalTab("assigned");
    setLoadingProducts(true);

    try {
      const res = await fetch(`/api/categories/${cat.id}/products`);
      if (res.ok) {
        const json = await res.json();
        setAssignedProducts(json.products || []);
        setAllCatalogProducts(json.allProducts || []);
      } else {
        showStatus("error", "Failed to load products for category");
      }
    } catch {
      showStatus("error", "Error connecting to products API");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Add selected products to current category
  const handleAddProductsToCategory = async () => {
    if (!productModalCat || selectedProductIdsToAdd.length === 0) return;
    setAddingProducts(true);
    try {
      const res = await fetch(`/api/categories/${productModalCat.id}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: selectedProductIdsToAdd }),
      });

      if (res.ok) {
        const json = await res.json();
        setAssignedProducts(json.products || []);
        setSelectedProductIdsToAdd([]);
        setProductModalTab("assigned");
        showStatus("success", `Added products to "${productModalCat.name}"!`);

        // Update counts in main categories state
        setCategories((prev) =>
          prev.map((c) =>
            c.id === productModalCat.id
              ? {
                  ...c,
                  live_products_count: (json.products || []).filter(
                    (p: CatalogProductItem) => p.status === "active"
                  ).length,
                  total_products_count: (json.products || []).length,
                }
              : c
          )
        );
      } else {
        const json = await res.json().catch(() => ({}));
        showStatus("error", json.error || "Failed to add products");
      }
    } catch {
      showStatus("error", "Server communication error");
    } finally {
      setAddingProducts(false);
    }
  };

  // Remove a product from current category
  const handleRemoveProduct = async (productId: string) => {
    if (!productModalCat) return;
    setRemovingProductId(productId);
    try {
      const res = await fetch(
        `/api/categories/${productModalCat.id}/products?product_id=${productId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        const json = await res.json();
        setAssignedProducts(json.products || []);
        showStatus("success", "Product removed from category (safely moved to Uncategorized if orphaned).");

        // Update counts in main categories state
        setCategories((prev) =>
          prev.map((c) =>
            c.id === productModalCat.id
              ? {
                  ...c,
                  live_products_count: (json.products || []).filter(
                    (p: CatalogProductItem) => p.status === "active"
                  ).length,
                  total_products_count: (json.products || []).length,
                }
              : c
          )
        );
      } else {
        const json = await res.json().catch(() => ({}));
        showStatus("error", json.error || "Failed to remove product");
      }
    } catch {
      showStatus("error", "Server communication error");
    } finally {
      setRemovingProductId(null);
    }
  };

  const handleDelete = async (cat: ProductCategory) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        const movedNotice = json.movedToUncategorizedCount
          ? ` (${json.movedToUncategorizedCount} orphaned products moved to 'Uncategorized')`
          : "";
        showStatus("success", `Deleted category "${cat.name}"${movedNotice}`);
        setDeleteConfirm(null);
        fetchCategories();
      } else {
        const json = await res.json().catch(() => ({}));
        showStatus("error", json.error || "Failed to delete category");
      }
    } catch {
      showStatus("error", "Error communicating with server");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered categories for the table view
  // Rule: Only show 'uncategorized' if total_products_count > 0!
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // 1. Hide 'uncategorized' if it has 0 products
      if (cat.slug === "uncategorized" && (cat.total_products_count || 0) === 0) {
        return false;
      }

      // 2. Search query filter
      const matchesSearch =
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // 3. Navigation filter
      const matchesNav =
        navFilter === "all"
          ? true
          : navFilter === "in_nav"
          ? (cat.is_in_nav ?? true)
          : !(cat.is_in_nav ?? true);

      return matchesSearch && matchesNav;
    });
  }, [categories, searchQuery, navFilter]);

  // Catalog products available to add to category (not already in category)
  const availableToAddProducts = useMemo(() => {
    const assignedIds = new Set(assignedProducts.map((p) => p.id));
    return allCatalogProducts.filter((p) => {
      const notAssigned = !assignedIds.has(p.id);
      const matchesSearch =
        p.name.toLowerCase().includes(productModalSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productModalSearch.toLowerCase());
      return notAssigned && matchesSearch;
    });
  }, [allCatalogProducts, assignedProducts, productModalSearch]);

  const assignedFilteredProducts = useMemo(() => {
    if (!productModalSearch.trim()) return assignedProducts;
    return assignedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(productModalSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productModalSearch.toLowerCase())
    );
  }, [assignedProducts, productModalSearch]);

  // Metric computations (excluding empty uncategorized)
  const visibleForMetrics = useMemo(() => {
    return categories.filter(
      (c) => c.slug !== "uncategorized" || (c.total_products_count || 0) > 0
    );
  }, [categories]);

  const totalLiveProductsAll = useMemo(() => {
    return visibleForMetrics.reduce((acc, c) => acc + (c.live_products_count || 0), 0);
  }, [visibleForMetrics]);

  const inNavCount = useMemo(() => {
    return visibleForMetrics.filter((c) => c.is_in_nav ?? true).length;
  }, [visibleForMetrics]);

  return (
    <div className="space-y-6 w-full pb-20 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-700 border border-purple-200">
              Silhouette Taxonomy & Storefront Navigation
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Category & Navigation Manager
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage product collections, toggle storefront navigation bar & sidebar visibility, configure hero banners, and assign products.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/admin/navigation"
            className="p-2.5 text-neutral-600 hover:text-black bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 shadow-2xs transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Configure Full Navigation Tree"
          >
            <Compass className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Nav Menu Setup</span>
          </Link>

          <button
            type="button"
            onClick={fetchCategories}
            disabled={loading}
            className="p-2.5 text-neutral-600 hover:text-black bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 shadow-2xs transition cursor-pointer"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Opens dedicated /admin/categories/new page (No popup card!) */}
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-xl shadow-md transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Category</span>
          </Link>
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

      {/* METRIC PILLS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Total Categories
            </p>
            <p className="text-xl font-bold text-neutral-900 mt-0.5">
              {visibleForMetrics.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Live Products Allocated
            </p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">
              {totalLiveProductsAll}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              In Storefront Navbar
            </p>
            <p className="text-xl font-bold text-neutral-900 mt-0.5">
              {inNavCount} <span className="text-xs font-normal text-neutral-400">/ {visibleForMetrics.length}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CATEGORY DIRECTORY TABLE */}
      <div className="space-y-3">
        {/* Table Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Category Directory & Allocation
            </h2>
            <span className="text-xs font-medium text-neutral-400">
              ({filteredCategories.length} items)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category or slug..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black focus:bg-white transition"
              />
            </div>

            {/* Nav Filter */}
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
              <button
                type="button"
                onClick={() => setNavFilter("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  navFilter === "all" ? "bg-white text-black shadow-xs font-bold" : "text-neutral-500 hover:text-black"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setNavFilter("in_nav")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  navFilter === "in_nav" ? "bg-white text-emerald-800 shadow-xs font-bold" : "text-neutral-500 hover:text-black"
                }`}
              >
                In Nav Bar
              </button>
              <button
                type="button"
                onClick={() => setNavFilter("not_in_nav")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  navFilter === "not_in_nav" ? "bg-white text-neutral-800 shadow-xs font-bold" : "text-neutral-500 hover:text-black"
                }`}
              >
                Hidden
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="py-20 text-center space-y-2">
              <Loader2 className="w-7 h-7 animate-spin mx-auto text-neutral-400" />
              <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">Loading categories...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    <th className="py-3 px-4 min-w-[200px]">Category & Details</th>
                    <th className="py-3 px-2 text-center w-28">Hero Banner</th>
                    <th className="py-3 px-2 text-center w-28">Live / Catalog</th>
                    <th className="py-3 px-2 text-center w-28">Storefront Nav</th>
                    <th className="py-3 px-2 text-center w-32">Our Collections</th>
                    <th className="py-3 px-4 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-neutral-400">
                        <Tag className="w-7 h-7 mx-auto text-neutral-300 mb-2" />
                        No categories found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const isInNav = cat.is_in_nav ?? true;
                      const isInCollections = cat.is_in_collections ?? true;
                      const liveCount = cat.live_products_count ?? 0;
                      const totalCount = cat.total_products_count ?? 0;
                      const hasBanner = Boolean(cat.banner_image_url || cat.banner_mobile_image_url);

                      return (
                        <tr
                          key={cat.id}
                          className="hover:bg-neutral-50/70 transition group"
                        >
                          {/* 1. Category Silhouette & Details */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {/* Round Thumbnail */}
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200 shadow-2xs">
                                {cat.image_url ? (
                                  <Image
                                    src={cat.image_url}
                                    alt={cat.name}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                    <Tag className="w-3.5 h-3.5 opacity-50" />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Link
                                    href={`/admin/categories/${cat.id}/edit`}
                                    className="font-bold text-neutral-900 text-sm hover:underline truncate"
                                    title="Click to edit category details"
                                  >
                                    {cat.name}
                                  </Link>
                                  {cat.slug === "uncategorized" && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      Orphaned Queue
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Link
                                    href={`/category/${cat.slug}`}
                                    target="_blank"
                                    className="font-mono text-[10px] text-neutral-400 hover:text-black transition inline-flex items-center gap-1"
                                    title="Open live category page in new tab"
                                  >
                                    <span>/category/{cat.slug}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Hero Banner (Compact) */}
                          <td className="py-3 px-2 text-center align-middle">
                            <Link
                              href={`/admin/categories/${cat.id}/banner`}
                              className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap ${
                                hasBanner
                                  ? "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                                  : "bg-neutral-50 hover:bg-neutral-100 text-neutral-500 border-neutral-200"
                              }`}
                              title={hasBanner ? "Edit Category Hero Banner" : "Set Category Hero Banner"}
                            >
                              <Monitor className={`w-3.5 h-3.5 ${hasBanner ? "text-purple-600" : "text-neutral-400"}`} />
                              <span>{hasBanner ? "Banner" : "+ Set"}</span>
                            </Link>
                          </td>

                          {/* 3. Live / Catalog Products (Compact) */}
                          <td className="py-3 px-2 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => openManageProducts(cat)}
                              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 transition cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap"
                              title={`Manage products: ${liveCount} live, ${totalCount} total`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-neutral-500" />
                              <span className={liveCount > 0 ? "text-emerald-700 font-bold" : "text-neutral-500"}>
                                {liveCount}
                              </span>
                              <span className="text-neutral-400 font-normal">/ {totalCount}</span>
                            </button>
                          </td>

                          {/* 4. Storefront Nav Bar (Compact Toggle) */}
                          <td className="py-3 px-2 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleToggleNav(cat)}
                              disabled={togglingNavId === cat.id}
                              className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap ${
                                isInNav
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-400 border-neutral-200"
                              }`}
                              title={
                                isInNav
                                  ? "Visible in Storefront Nav Bar (Click to hide)"
                                  : "Hidden from Storefront Nav Bar (Click to show)"
                              }
                            >
                              {togglingNavId === cat.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isInNav ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                  <span>Visible</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>Hidden</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* 5. Our Collections Circles (Compact Toggle) */}
                          <td className="py-3 px-2 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleToggleCollections(cat)}
                              disabled={togglingCollectionsId === cat.id}
                              className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap ${
                                isInCollections
                                  ? "bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200"
                                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-400 border-neutral-200"
                              }`}
                              title={
                                isInCollections
                                  ? "Shown in Storefront Circular Highlights (Click to hide)"
                                  : "Hidden from Storefront Circular Highlights (Click to show)"
                              }
                            >
                              {togglingCollectionsId === cat.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isInCollections ? (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Shown</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>Hidden</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* 6. Actions (Prominent Edit & Delete Buttons) */}
                          <td className="py-3 px-4 text-right align-middle shrink-0">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* Edit Button */}
                              <Link
                                href={`/admin/categories/${cat.id}/edit`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-800 border border-neutral-300 transition cursor-pointer active:scale-95 shadow-2xs"
                                title="Edit Category Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </Link>

                              {/* Delete Button */}
                              {cat.slug !== "uncategorized" && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm(cat)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 transition cursor-pointer active:scale-95 shadow-2xs"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MANAGE PRODUCTS MODAL (Fixed screen overflow & fast parallel data loading) */}
      {productModalCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="shrink-0 px-6 py-4 border-b border-neutral-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                  {productModalCat.image_url ? (
                    <Image
                      src={productModalCat.image_url}
                      alt={productModalCat.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold text-xs">
                      {productModalCat.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-neutral-900 truncate">
                    Manage Products in &quot;{productModalCat.name}&quot;
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono truncate">
                    /category/{productModalCat.slug}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProductModalCat(null)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold cursor-pointer p-1.5 rounded-lg hover:bg-neutral-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Tabs & Search */}
            <div className="shrink-0 px-6 py-3 bg-neutral-50/90 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center bg-neutral-200/70 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setProductModalTab("assigned")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    productModalTab === "assigned"
                      ? "bg-white text-black shadow-2xs"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>In Category ({assignedProducts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductModalTab("add_new")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    productModalTab === "add_new"
                      ? "bg-white text-black shadow-2xs"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add from Store ({availableToAddProducts.length})</span>
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productModalSearch}
                  onChange={(e) => setProductModalSearch(e.target.value)}
                  placeholder="Filter products..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-black transition"
                />
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 overscroll-contain">
              {loadingProducts ? (
                <div className="py-16 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
                  <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
                    Loading products...
                  </p>
                </div>
              ) : productModalTab === "assigned" ? (
                /* TAB 1: In Category */
                assignedFilteredProducts.length === 0 ? (
                  <div className="py-14 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 space-y-2">
                    <Package className="w-7 h-7 mx-auto text-neutral-300" />
                    <p className="text-xs font-semibold text-neutral-700">
                      No products assigned to this category yet.
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Click the &quot;Add from Store&quot; tab to select catalog products.
                    </p>
                    <button
                      type="button"
                      onClick={() => setProductModalTab("add_new")}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-black rounded-lg mt-2 cursor-pointer shadow-2xs"
                    >
                      + Add Products Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedFilteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 bg-neutral-50 hover:bg-neutral-100/90 border border-neutral-200 rounded-xl transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300">
                            {p.image_url ? (
                              <Image
                                src={p.image_url}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                                👜
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-neutral-900 truncate">{p.name}</h4>
                            <p className="text-[10px] font-mono text-neutral-400">
                              SKU: {p.sku || "N/A"} • ₹{p.price.toLocaleString("en-IN")}
                            </p>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                p.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-neutral-200 text-neutral-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p.id)}
                          disabled={removingProductId === p.id}
                          className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-lg transition cursor-pointer shrink-0 ml-2"
                          title="Remove from this category"
                        >
                          {removingProductId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Remove"
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* TAB 2: Add Available Products from Store */
                availableToAddProducts.length === 0 ? (
                  <div className="py-14 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 space-y-2">
                    <CheckCircle className="w-7 h-7 mx-auto text-emerald-500" />
                    <p className="text-xs font-semibold text-neutral-700">
                      All store products matching your search are already in this category!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2 py-1 text-xs font-medium text-neutral-500">
                      <span>{availableToAddProducts.length} products available</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedProductIdsToAdd.length === availableToAddProducts.length) {
                            setSelectedProductIdsToAdd([]);
                          } else {
                            setSelectedProductIdsToAdd(availableToAddProducts.map((p) => p.id));
                          }
                        }}
                        className="text-[11px] text-neutral-800 hover:text-black font-bold underline cursor-pointer"
                      >
                        {selectedProductIdsToAdd.length === availableToAddProducts.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    {availableToAddProducts.map((p) => {
                      const isSelected = selectedProductIdsToAdd.includes(p.id);

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProductIdsToAdd((prev) =>
                              isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            );
                          }}
                          className={`flex items-center justify-between p-2.5 border rounded-xl transition cursor-pointer ${
                            isSelected
                              ? "bg-purple-50/70 border-purple-300"
                              : "bg-white hover:bg-neutral-50 border-neutral-200"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-black border-neutral-300 focus:ring-0 cursor-pointer shrink-0"
                            />
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                              {p.image_url ? (
                                <Image
                                  src={p.image_url}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                                  👜
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-neutral-900 truncate">{p.name}</h4>
                              <p className="text-[10px] font-mono text-neutral-400">
                                SKU: {p.sku || "N/A"} • ₹{p.price.toLocaleString("en-IN")}
                              </p>
                              {p.categories && p.categories.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5 truncate">
                                  <span className="text-[9px] text-neutral-400">Current:</span>
                                  {p.categories.map((c) => (
                                    <span
                                      key={c.id}
                                      className="px-1.5 py-0.2 rounded text-[9px] bg-neutral-200 text-neutral-700 font-medium truncate"
                                    >
                                      {c.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setSelectedProductIdsToAdd([p.id]);
                              setAddingProducts(true);
                              try {
                                const res = await fetch(`/api/categories/${productModalCat.id}/products`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ product_id: p.id }),
                                });
                                if (res.ok) {
                                  const json = await res.json();
                                  setAssignedProducts(json.products || []);
                                  showStatus("success", `Added "${p.name}" to category!`);
                                  setCategories((prev) =>
                                    prev.map((c) =>
                                      c.id === productModalCat.id
                                        ? {
                                            ...c,
                                            live_products_count: (json.products || []).filter(
                                              (item: CatalogProductItem) => item.status === "active"
                                            ).length,
                                            total_products_count: (json.products || []).length,
                                          }
                                        : c
                                    )
                                  );
                                }
                              } finally {
                                setAddingProducts(false);
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg transition cursor-pointer shrink-0 ml-2"
                          >
                            + Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* Modal Fixed Footer */}
            <div className="shrink-0 px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-medium">
                {productModalTab === "add_new"
                  ? `${selectedProductIdsToAdd.length} products selected`
                  : `${assignedProducts.length} total in this category`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalCat(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black rounded-lg cursor-pointer"
                >
                  Close
                </button>

                {productModalTab === "add_new" && selectedProductIdsToAdd.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddProductsToCategory}
                    disabled={addingProducts}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    {addingProducts ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Add Selected ({selectedProductIdsToAdd.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-neutral-900">
                Delete Category &quot;{deleteConfirm.name}&quot;?
              </h3>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Automatic Product Safety:</span>
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Products in this category will <strong>not</strong> be deleted. Any product that has no other remaining category will automatically be moved to <strong>Uncategorized</strong> so no catalog items are lost.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm & Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
