"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Star,
  Sparkles,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  Plus,
  Trash2,
  X,
  Tag,
  Upload,
  Edit,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Eye,
  SlidersHorizontal,
  Boxes,
  TrendingUp,
  Percent,
} from "lucide-react";
import { Product, ProductCategory, ProductStatus } from "@/types";
import { formatPrice, slugify } from "@/lib/utils";
import { uploadDirectToCloudinary } from "@/lib/cloudinary/client-upload";

type FilterTab = "all" | "bestseller" | "newin" | "lowstock" | "active" | "draft";
type SortOption = "newest" | "oldest" | "price-high" | "price-low" | "stock-low" | "stock-high" | "name-asc";

const ITEMS_PER_PAGE = 15;

export default function AdminAllItemsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Notifications & Feedback
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Quick Add Product Modal State
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const isSubmittingProductRef = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State for Quick Add
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategoryId, setNewProdCategoryId] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdComparePrice, setNewProdComparePrice] = useState("");
  const [newProdCostPrice, setNewProdCostPrice] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdStock, setNewProdStock] = useState("20");
  const [newProdShortDesc, setNewProdShortDesc] = useState("");
  const [newProdImageUrl, setNewProdImageUrl] = useState("");
  const [newProdImages, setNewProdImages] = useState<{ secure_url: string; alt_text: string }[]>([]);
  const [newProdIsBestSeller, setNewProdIsBestSeller] = useState(false);
  const [newProdIsNewArrival, setNewProdIsNewArrival] = useState(true);
  const [newProdStatus, setNewProdStatus] = useState<"active" | "draft">("active");
  const [uploadingImage, setUploadingImage] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Delete Product Modal State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSku(text);
    showStatus("success", `SKU "${text}" copied to clipboard`);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Data fetching
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setProducts(json.products || []);
      } else {
        showStatus("error", "Failed to load products from server");
      }
    } catch {
      showStatus("error", "Network error fetching catalog");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setCategories(json.data);
          if (json.data.length > 0 && !newProdCategoryId) {
            setNewProdCategoryId(json.data[0].id);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Quick Flag Toggle (Best Seller / New In)
  const handleToggleFlag = async (productId: string, flag: "is_best_seller" | "is_new_arrival") => {
    setTogglingId(`${productId}-${flag}`);

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, [flag]: !p[flag] };
        }
        return p;
      })
    );

    try {
      const res = await fetch(`/api/products/${productId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag }),
      });

      if (res.ok) {
        const data = await res.json();
        const flagLabel = flag === "is_best_seller" ? "Best Seller" : "New In";
        const stateText = data.product[flag] ? "active" : "inactive";
        showStatus("success", `${flagLabel} is now ${stateText} for "${data.product.name}"`);
      } else {
        // Revert
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              return { ...p, [flag]: !p[flag] };
            }
            return p;
          })
        );
        showStatus("error", "Failed to update item flag");
      }
    } catch {
      // Revert
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return { ...p, [flag]: !p[flag] };
          }
          return p;
        })
      );
      showStatus("error", "Network error toggling flag");
    } finally {
      setTogglingId(null);
    }
  };

  // Quick Status Toggle (Active <-> Draft)
  const handleToggleStatus = async (productId: string, currentStatus: ProductStatus) => {
    const nextStatus: ProductStatus = currentStatus === "active" ? "draft" : "active";
    setStatusTogglingId(productId);

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: nextStatus } : p))
    );

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        showStatus("success", `Product status switched to ${nextStatus.toUpperCase()}`);
      } else {
        // Revert
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: currentStatus } : p))
        );
        showStatus("error", "Failed to update product status");
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: currentStatus } : p))
      );
      showStatus("error", "Network error updating status");
    } finally {
      setStatusTogglingId(null);
    }
  };

  // Helper to generate SKU
  const handleGenerateSku = () => {
    const prefix = newProdName.trim()
      ? newProdName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "DNR")
      : "DNR";
    const rand = Math.floor(100 + Math.random() * 900);
    setNewProdSku(`DNR-${prefix}-${rand}`);
  };

  // Quick Add Image Upload
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadDirectToCloudinary(file, {
        folder: "dnora/products",
        resourceType: "image",
      });

      const url = res.secure_url;
      if (url) {
        setNewProdImages((prev) => [
          ...prev,
          { secure_url: url, alt_text: newProdName || "DNORA Luxury Handbag" },
        ]);
        showStatus("success", "Image uploaded to Cloudinary CDN");
      }
    } catch {
      showStatus("error", "Failed to upload image to CDN");
    } finally {
      setUploadingImage(false);
      if (modalFileInputRef.current) {
        modalFileInputRef.current.value = "";
      }
    }
  };

  // Create Product Submission (Protected with double-click guard)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isSubmittingProductRef.current || submittingProduct) {
      return;
    }

    if (!newProdName.trim()) {
      setFormError("Product title is required.");
      return;
    }
    if (!newProdCategoryId) {
      setFormError("Please select a category.");
      return;
    }
    const priceNum = parseFloat(newProdPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError("Please enter a valid price greater than 0.");
      return;
    }
    if (!newProdSku.trim()) {
      setFormError("Product SKU is required.");
      return;
    }

    // Auto-add pending image url if filled
    const finalImages = [...newProdImages];
    if (newProdImageUrl.trim()) {
      try {
        new URL(newProdImageUrl.trim());
        finalImages.push({
          secure_url: newProdImageUrl.trim(),
          alt_text: newProdName || "DNORA Luxury Silhouette",
        });
      } catch {
        // ignore
      }
    }

    if (finalImages.length === 0) {
      setFormError("Please upload or enter at least one product image.");
      return;
    }

    const payload = {
      name: newProdName.trim(),
      slug: slugify(newProdName.trim()) || undefined,
      short_description: newProdShortDesc.trim() || `Handcrafted Tuscan architectural silhouette in fine Italian leather.`,
      description: `Exquisite handcrafted luxury piece created in Florence atelier with vegetable-tanned Italian calfskin, archival edge painting, and bespoke golden hardware.`,
      price: priceNum,
      compare_at_price: newProdComparePrice ? parseFloat(newProdComparePrice) : null,
      cost_price: newProdCostPrice ? parseFloat(newProdCostPrice) : null,
      sku: newProdSku.trim(),
      stock: parseInt(newProdStock, 10) || 0,
      category_id: newProdCategoryId,
      is_best_seller: newProdIsBestSeller,
      is_new_arrival: newProdIsNewArrival,
      status: newProdStatus,
      images: finalImages.map((img, idx) => ({
        cloudinary_public_id: `prod-img-${Date.now()}-${idx}`,
        secure_url: img.secure_url,
        alt_text: img.alt_text || newProdName,
        sort_order: idx + 1,
      })),
      color_variants: [],
    };

    isSubmittingProductRef.current = true;
    setSubmittingProduct(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create product.");
        return;
      }

      // Success
      if (data.product) {
        setProducts((prev) => [data.product, ...prev]);
        showStatus("success", `Product "${data.product.name}" created successfully.`);
      }

      setQuickAddModalOpen(false);

      // Reset form
      setNewProdName("");
      setNewProdPrice("");
      setNewProdComparePrice("");
      setNewProdCostPrice("");
      setNewProdSku("");
      setNewProdStock("20");
      setNewProdShortDesc("");
      setNewProdImageUrl("");
      setNewProdImages([]);
      setNewProdIsBestSeller(false);
      setNewProdIsNewArrival(true);
    } catch {
      setFormError("Network error occurred while creating product.");
    } finally {
      setSubmittingProduct(false);
      isSubmittingProductRef.current = false;
    }
  };

  // Delete Product Handler
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setDeletingProduct(true);
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        showStatus("success", `Product "${productToDelete.name}" deleted.`);
        setProductToDelete(null);
      } else {
        const data = await res.json();
        showStatus("error", data.error || "Failed to delete product.");
      }
    } catch {
      showStatus("error", "Network error deleting product.");
    } finally {
      setDeletingProduct(false);
    }
  };

  // Live Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const bestSellers = products.filter((p) => p.is_best_seller).length;
    const newArrivals = products.filter((p) => p.is_new_arrival).length;
    const lowStock = products.filter((p) => p.stock <= 5).length;
    const totalUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
    const activeCount = products.filter((p) => p.status === "active").length;
    const draftCount = products.filter((p) => p.status === "draft").length;

    return { total, bestSellers, newArrivals, lowStock, totalUnits, activeCount, draftCount };
  }, [products]);

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categories?.some((c) => c.name.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) =>
        p.categories?.some((c) => c.id === selectedCategory || c.slug === selectedCategory)
      );
    }

    // Tab filter
    if (activeTab === "bestseller") {
      result = result.filter((p) => p.is_best_seller);
    } else if (activeTab === "newin") {
      result = result.filter((p) => p.is_new_arrival);
    } else if (activeTab === "lowstock") {
      result = result.filter((p) => p.stock <= 5);
    } else if (activeTab === "active") {
      result = result.filter((p) => p.status === "active");
    } else if (activeTab === "draft") {
      result = result.filter((p) => p.status === "draft");
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "stock-low":
          return Number(a.stock) - Number(b.stock);
        case "stock-high":
          return Number(b.stock) - Number(a.stock);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "oldest":
          return (
            new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          );
        case "newest":
        default:
          return (
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
      }
    });

    return result;
  }, [products, searchQuery, selectedCategory, activeTab, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, activeTab, sortBy]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {statusMsg && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold tracking-wide transition-all ${
            statusMsg.type === "success"
              ? "bg-neutral-950 text-white border-neutral-800"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight font-heading">
              Items &amp; Catalog Master
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
              {products.length} Total
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-light mt-1">
            Manage your handbags, prices, margins, inventory, 1-click flags, and edit details.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-black transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-neutral-500" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!newProdSku) handleGenerateSku();
              setQuickAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-900 hover:bg-neutral-50 hover:border-black transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Add</span>
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Item (Wizard)</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Items</span>
            <Package className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900">{stats.total}</div>
          <div className="text-[10.5px] text-neutral-400 mt-0.5">
            {stats.activeCount} live • {stats.draftCount} draft
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#B89025] mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Best Sellers</span>
            <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#B89025]">{stats.bestSellers}</div>
          <div className="text-[10.5px] text-neutral-400 mt-0.5">coveted icons on storefront</div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">New In Active</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600">{stats.newArrivals}</div>
          <div className="text-[10.5px] text-neutral-400 mt-0.5">featured in new drop</div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Low Stock (&le; 5)</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600">{stats.lowStock}</div>
          <div className="text-[10.5px] text-neutral-400 mt-0.5">requires restock</div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-600 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Stock Units</span>
            <Boxes className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700">{stats.totalUnits}</div>
          <div className="text-[10.5px] text-neutral-400 mt-0.5">units in inventory</div>
        </div>
      </div>

      {/* Controls Bar: Search, Category, Tabs & Sorting */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, SKU, or category..."
              className="w-full pl-10 pr-9 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown & Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs text-neutral-800 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs text-neutral-800 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="stock-low">Stock: Low to High</option>
                <option value="stock-high">Stock: High to Low</option>
                <option value="name-asc">Title: A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === "all"
                ? "bg-neutral-950 text-white shadow-2xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            All Items ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bestseller")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === "bestseller"
                ? "bg-[#D4AF37] text-black shadow-2xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            ★ Best Sellers ({stats.bestSellers})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("newin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === "newin"
                ? "bg-amber-500 text-black shadow-2xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            ✦ New In ({stats.newArrivals})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lowstock")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === "lowstock"
                ? "bg-rose-600 text-white shadow-2xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Low Stock ({stats.lowStock})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === "active"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Active ({stats.activeCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("draft")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === "draft"
                ? "bg-neutral-700 text-white shadow-2xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Drafts ({stats.draftCount})
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      {loading ? (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          <p className="text-xs text-neutral-500 font-medium">Loading catalog items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-16 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">No products match your criteria</h3>
            <p className="text-xs text-neutral-500 mt-1">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search query or category filters."
                : "No products exist under the selected tab."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {(searchQuery || selectedCategory !== "all" || activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setActiveTab("all");
                }}
                className="px-3.5 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[10.5px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="py-3.5 px-4 w-16">Item</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Product Title &amp; SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Cost / MRP</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">Unit Margin</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4 text-center">Best Seller</th>
                  <th className="py-3.5 px-4 text-center">New In</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {paginatedProducts.map((p) => {
                  const isTogglingBS = togglingId === `${p.id}-is_best_seller`;
                  const isTogglingNew = togglingId === `${p.id}-is_new_arrival`;
                  const isTogglingStatus = statusTogglingId === p.id;
                  const primaryImg = p.images?.[0]?.secure_url;

                  const cost = Number(p.cost_price);
                  const selling = Number(p.price);
                  const hasCost = p.cost_price !== undefined && p.cost_price !== null && !isNaN(cost);
                  const profit = hasCost ? selling - cost : null;
                  const marginPct = hasCost && selling > 0 ? Math.round(((selling - cost) / selling) * 100) : null;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="relative block w-12 h-15 rounded-lg bg-white overflow-hidden border border-neutral-200 shrink-0 group shadow-2xs"
                          title="View on storefront"
                        >
                          {primaryImg ? (
                            <Image
                              src={primaryImg}
                              alt={p.name}
                              fill
                              className="object-contain p-0.5 group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                        </Link>
                      </td>

                      {/* Title & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900 line-clamp-1 hover:text-black">
                          <Link href={`/admin/products/${p.id}/edit`} className="hover:underline">
                            {p.name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.sku)}
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-500 hover:text-neutral-900 bg-neutral-100/90 px-1.5 py-0.5 rounded cursor-pointer transition"
                            title="Click to copy SKU"
                          >
                            <span>{p.sku}</span>
                            {copiedSku === p.sku ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-neutral-400" />
                            )}
                          </button>

                          {p.color_variants && p.color_variants.length > 0 && (
                            <span className="text-[10px] text-neutral-400 font-medium">
                              • {p.color_variants.length} colors
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200/60">
                          <Tag className="w-2.5 h-2.5 text-neutral-400" />
                          <span>{p.categories?.[0]?.name || "Uncategorized"}</span>
                        </span>
                      </td>

                      {/* Cost / MRP */}
                      <td className="py-3.5 px-4 font-mono text-neutral-700 whitespace-nowrap">
                        {p.compare_at_price && p.compare_at_price > p.price && (
                          <div className="text-[10.5px] text-neutral-400 line-through">
                            MRP {formatPrice(p.compare_at_price)}
                          </div>
                        )}
                        {hasCost ? (
                          <div className="text-[11px] font-medium text-neutral-700">
                            Cost {formatPrice(cost)}
                          </div>
                        ) : (
                          <span className="text-[10.5px] text-neutral-400 italic">No cost set</span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="font-bold text-neutral-900 text-sm">
                          {formatPrice(selling)}
                        </div>
                        {p.compare_at_price && p.compare_at_price > p.price && (
                          <span className="inline-block text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5">
                            {Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)}% OFF
                          </span>
                        )}
                      </td>

                      {/* Margin / Profit */}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        {hasCost && profit !== null ? (
                          <div>
                            <span
                              className={`text-[11px] font-bold ${
                                profit >= 0 ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {profit >= 0 ? `+${formatPrice(profit)}` : `-${formatPrice(Math.abs(profit))}`}
                            </span>
                            <span className="block text-[10px] text-neutral-400">
                              {marginPct}% margin
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-400">-</span>
                        )}
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.stock === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            0 • Out of Stock
                          </span>
                        ) : p.stock <= 5 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {p.stock} • Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {p.stock} in stock
                          </span>
                        )}
                      </td>

                      {/* Best Seller 1-Click Toggle */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(p.id, "is_best_seller")}
                          disabled={isTogglingBS}
                          title={p.is_best_seller ? "Remove from Best Sellers" : "Add to Best Sellers"}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            p.is_best_seller
                              ? "bg-[#D4AF37] text-black shadow-2xs hover:bg-[#c29e2f]"
                              : "border border-neutral-200 bg-white text-neutral-500 hover:text-black hover:border-neutral-300"
                          }`}
                        >
                          {isTogglingBS ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Star className={`w-3.5 h-3.5 ${p.is_best_seller ? "fill-current" : ""}`} />
                          )}
                          <span>{p.is_best_seller ? "Active" : "Add"}</span>
                        </button>
                      </td>

                      {/* New In 1-Click Toggle */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(p.id, "is_new_arrival")}
                          disabled={isTogglingNew}
                          title={p.is_new_arrival ? "Remove from New In" : "Add to New In"}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            p.is_new_arrival
                              ? "bg-amber-500 text-black shadow-2xs hover:bg-amber-400"
                              : "border border-neutral-200 bg-white text-neutral-500 hover:text-black hover:border-neutral-300"
                          }`}
                        >
                          {isTogglingNew ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className={`w-3.5 h-3.5 ${p.is_new_arrival ? "fill-current" : ""}`} />
                          )}
                          <span>{p.is_new_arrival ? "Active" : "Add"}</span>
                        </button>
                      </td>

                      {/* Active / Draft Status Toggle */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p.id, p.status || "active")}
                          disabled={isTogglingStatus}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider transition cursor-pointer ${
                            p.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200"
                          }`}
                          title={`Click to switch to ${p.status === "active" ? "Draft" : "Active"}`}
                        >
                          {isTogglingStatus ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.status === "active" ? "bg-emerald-500" : "bg-neutral-400"
                              }`}
                            />
                          )}
                          <span>{p.status || "active"}</span>
                        </button>
                      </td>

                      {/* Row Actions: Edit, View Storefront, Delete */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dedicated Edit Link */}
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200/90 border border-neutral-200 rounded-lg transition shadow-2xs"
                            title="Edit Product Details & Variants"
                          >
                            <Edit className="w-3.5 h-3.5 text-neutral-700" />
                            <span>Edit</span>
                          </Link>

                          {/* View Storefront */}
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg transition"
                            title="Open Product on Storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50/50">
              <div className="text-xs text-neutral-500">
                Showing{" "}
                <span className="font-semibold text-neutral-800">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-neutral-800">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                </span>{" "}
                of <span className="font-semibold text-neutral-800">{filteredProducts.length}</span> items
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-1 text-xs text-neutral-400">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 text-xs font-semibold rounded-lg transition cursor-pointer ${
                            currentPage === page
                              ? "bg-neutral-950 text-white shadow-2xs"
                              : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Add Product Modal */}
      {quickAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-neutral-900 text-base">Quick Add Product</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Fast 1-minute basic item entry. For multi-photo color swatches, use the full wizard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Florentine Saddle Crossbody"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              {/* Category & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newProdCategoryId}
                    onChange={(e) => setNewProdCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:border-neutral-900 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                      SKU *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="text-[10px] font-semibold text-neutral-500 hover:text-black cursor-pointer underline"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="DNR-BAG-101"
                    className="w-full px-3 py-2 font-mono bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="1299"
                    className="w-full px-3 py-2 font-mono bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Compare MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newProdComparePrice}
                    onChange={(e) => setNewProdComparePrice(e.target.value)}
                    placeholder="2499"
                    className="w-full px-3 py-2 font-mono bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProdCostPrice}
                    onChange={(e) => setNewProdCostPrice(e.target.value)}
                    placeholder="600"
                    className="w-full px-3 py-2 font-mono bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Initial Stock Inventory
                </label>
                <input
                  type="number"
                  min="0"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Product Image *
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="url"
                    value={newProdImageUrl}
                    onChange={(e) => setNewProdImageUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                    className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:border-neutral-900"
                  />
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImageFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload</span>
                  </button>
                </div>

                {newProdImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {newProdImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-12 h-14 rounded-lg bg-neutral-100 overflow-hidden border border-neutral-200 group"
                      >
                        <Image src={img.secure_url} alt="" fill className="object-contain p-0.5" />
                        <button
                          type="button"
                          onClick={() => setNewProdImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-800">
                  <input
                    type="checkbox"
                    checked={newProdIsBestSeller}
                    onChange={(e) => setNewProdIsBestSeller(e.target.checked)}
                    className="rounded text-neutral-900 focus:ring-black"
                  />
                  <span>Mark as Best Seller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-800">
                  <input
                    type="checkbox"
                    checked={newProdIsNewArrival}
                    onChange={(e) => setNewProdIsNewArrival(e.target.checked)}
                    className="rounded text-neutral-900 focus:ring-black"
                  />
                  <span>Mark as New In</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setQuickAddModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {submittingProduct ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-neutral-900 text-base">Delete Catalog Item</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-neutral-800">&quot;{productToDelete.name}&quot;</span> (SKU:{" "}
                {productToDelete.sku})?
              </p>
              <p className="text-[11px] text-rose-600 mt-2 font-medium">
                This action cannot be undone and will remove the product from the storefront.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deletingProduct}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {deletingProduct ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
