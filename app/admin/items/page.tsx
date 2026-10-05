"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Product, ProductCategory } from "@/types";
import { formatPrice, slugify } from "@/lib/utils";
import { uploadDirectToCloudinary } from "@/lib/cloudinary/client-upload";

export default function AdminAllItemsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "bestseller" | "newin" | "lowstock">("all");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add Product Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Product Form State
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategoryId, setNewProdCategoryId] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdComparePrice, setNewProdComparePrice] = useState("");
  const [newProdCostPrice, setNewProdCostPrice] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdStock, setNewProdStock] = useState("25");
  const [newProdShortDesc, setNewProdShortDesc] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdImageUrl, setNewProdImageUrl] = useState("");
  const [newProdImages, setNewProdImages] = useState<{ secure_url: string; alt_text: string }[]>([]);
  const [newProdIsBestSeller, setNewProdIsBestSeller] = useState(false);
  const [newProdIsNewArrival, setNewProdIsNewArrival] = useState(true);
  const [newProdStatus, setNewProdStatus] = useState<"active" | "draft">("active");

  // Delete Product Modal State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (res.ok) {
        const json = await res.json();
        setProducts(json.products || []);
      } else {
        showStatus("error", "Failed to load products from server");
      }
    } catch {
      showStatus("error", "Network error fetching products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
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

  const handleToggleFlag = async (productId: string, flag: "is_best_seller" | "is_new_arrival") => {
    setTogglingId(`${productId}-${flag}`);
    // Optimistic UI update
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
        const flagName = flag === "is_best_seller" ? "Best Seller" : "New In";
        const stateText = data.product[flag] ? "enabled" : "disabled";
        showStatus("success", `${flagName} ${stateText} for "${data.product.name}"`);
      } else {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              return { ...p, [flag]: !p[flag] };
            }
            return p;
          })
        );
        showStatus("error", "Failed to update product status");
      }
    } catch {
      // Revert on catch
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return { ...p, [flag]: !p[flag] };
          }
          return p;
        })
      );
      showStatus("error", "Network error updating flag");
    } finally {
      setTogglingId(null);
    }
  };

  // Helper to generate SKU
  const handleGenerateSku = () => {
    const prefix = newProdName.trim() ? newProdName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "DN") : "DN";
    const rand = Math.floor(100 + Math.random() * 900);
    setNewProdSku(`DN-${prefix}-${rand}`);
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const modalFileInputRef = React.useRef<HTMLInputElement>(null);

  // Upload Image File directly
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
      if (!url) {
        throw new Error("Upload failed");
      }

      setNewProdImages((prev) => [
        ...prev,
        {
          secure_url: url,
          alt_text: newProdName || "DNORA Luxury Silhouette",
        },
      ]);
      showStatus("success", "Image uploaded successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error uploading file";
      showStatus("error", msg);
    } finally {
      setUploadingImage(false);
      if (modalFileInputRef.current) modalFileInputRef.current.value = "";
    }
  };

  // Add Image URL to List
  const handleAddImage = () => {
    if (!newProdImageUrl.trim()) return;
    try {
      new URL(newProdImageUrl.trim());
      setNewProdImages((prev) => [
        ...prev,
        {
          secure_url: newProdImageUrl.trim(),
          alt_text: newProdName || "DNORA Luxury Silhouette",
        },
      ]);
      setNewProdImageUrl("");
    } catch {
      alert("Please enter a valid HTTP/HTTPS image URL.");
    }
  };

  // Create Product Submission
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newProdName.trim()) {
      setFormError("Product name is required.");
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
    if (newProdImages.length === 0 && !newProdImageUrl.trim()) {
      setFormError("At least one product image is required.");
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
      setFormError("Please add at least one product image URL.");
      return;
    }

    const payload = {
      name: newProdName.trim(),
      slug: slugify(newProdName.trim()),
      short_description: newProdShortDesc.trim() || `Handcrafted Tuscan architectural silhouette in fine Italian leather.`,
      description: newProdDesc.trim() || `Exquisite handcrafted luxury piece created in Florence atelier with vegetable-tanned Italian calfskin, archival edge painting, and bespoke golden hardware.`,
      price: priceNum,
      compare_at_price: newProdComparePrice ? parseFloat(newProdComparePrice) : null,
      cost_price: newProdCostPrice ? parseFloat(newProdCostPrice) : null,
      sku: newProdSku.trim(),
      stock: parseInt(newProdStock) || 0,
      category_id: newProdCategoryId,
      is_best_seller: newProdIsBestSeller,
      is_new_arrival: newProdIsNewArrival,
      status: newProdStatus,
      images: finalImages.map((img, idx) => ({
        cloudinary_public_id: `prod-img-${Date.now()}-${idx}`,
        secure_url: img.secure_url,
        alt_text: img.alt_text || newProdName,
        sort_order: idx,
      })),
      color_variants: [],
    };

    try {
      setSubmittingProduct(true);
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
      setProducts((prev) => [data.product, ...prev]);
      showStatus("success", `Product "${data.product.name}" created successfully.`);
      setAddModalOpen(false);

      // Reset form
      setNewProdName("");
      setNewProdPrice("");
      setNewProdComparePrice("");
      setNewProdCostPrice("");
      setNewProdSku("");
      setNewProdStock("25");
      setNewProdShortDesc("");
      setNewProdDesc("");
      setNewProdImageUrl("");
      setNewProdImages([]);
      setNewProdIsBestSeller(false);
      setNewProdIsNewArrival(true);
    } catch {
      setFormError("Network error occurred while creating product.");
    } finally {
      setSubmittingProduct(false);
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

      if (!res.ok) {
        showStatus("error", "Failed to delete product from database.");
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      showStatus("success", `Product "${productToDelete.name}" permanently deleted.`);
      setProductToDelete(null);
    } catch {
      showStatus("error", "Network error deleting product.");
    } finally {
      setDeletingProduct(false);
    }
  };

  // Filtered items
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.categories?.[0]?.name && p.categories[0].name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === "bestseller") return !!p.is_best_seller;
    if (activeTab === "newin") return !!p.is_new_arrival;
    if (activeTab === "lowstock") return p.stock < 10;
    return true;
  });

  const bestSellersCount = products.filter((p) => p.is_best_seller).length;
  const newInCount = products.filter((p) => p.is_new_arrival).length;
  const lowStockCount = products.filter((p) => p.stock < 10).length;

  return (
    <div className="space-y-8 w-full pb-16 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-700 border border-amber-200">
              Catalog & Merchandising
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            All Items & Products
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Create new products, delete obsolete items, and toggle Best Sellers & New In status.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="p-2.5 text-neutral-600 hover:text-black bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 shadow-xs transition cursor-pointer"
            title="Refresh Products"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/shop"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl shadow-xs transition"
          >
            <span>Live Catalog</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </Link>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Items</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{products.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">Best Sellers Active</div>
          <div className="text-2xl font-bold text-[#B89025] mt-1">{bestSellersCount}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600">New In Active</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{newInCount}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Low Stock (&lt; 10)</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{lowStockCount}</div>
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-neutral-200 p-3 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, SKU, or category..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all"
          />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === "all"
                ? "bg-neutral-900 text-white shadow-xs"
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
                ? "bg-[#D4AF37] text-black shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            ★ Best Sellers ({bestSellersCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("newin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === "newin"
                ? "bg-amber-500 text-black shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            ✦ New In ({newInCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lowstock")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === "lowstock"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      {loading ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          <p className="text-xs text-neutral-500 font-medium">Loading catalog items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">No products found</h3>
            <p className="text-xs text-neutral-500 mt-1">
              {searchQuery ? "Try refining your search query." : "No items match the selected filter."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!newProdSku) handleGenerateSku();
              setAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Product</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="py-3.5 px-4 w-16">Item</th>
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Cost Price / MRP</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">Unit Margin</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4 text-center">Best Seller</th>
                  <th className="py-3.5 px-4 text-center">New In</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredProducts.map((p) => {
                  const isTogglingBS = togglingId === `${p.id}-is_best_seller`;
                  const isTogglingNew = togglingId === `${p.id}-is_new_arrival`;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="relative w-12 h-14 rounded-lg bg-neutral-100 overflow-hidden border border-neutral-200 shrink-0">
                          {p.images?.[0]?.secure_url ? (
                            <Image
                              src={p.images[0].secure_url}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name & SKU */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-neutral-900 line-clamp-1">{p.name}</div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                          SKU: {p.sku}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                          <Tag className="w-2.5 h-2.5 text-neutral-400" />
                          <span>{p.categories?.[0]?.name || "Uncategorized"}</span>
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 font-mono text-neutral-700 whitespace-nowrap">
                        {p.cost_price !== undefined && p.cost_price !== null ? (
                          <div className="font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 w-fit">
                            {formatPrice(p.cost_price)}
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                        {formatPrice(p.price)}
                        {p.compare_at_price && p.compare_at_price > p.price && (
                          <span className="block text-[10px] text-neutral-400 line-through">
                            {formatPrice(p.compare_at_price)}
                          </span>
                        )}
                      </td>

                      {/* Unit Margin / Profit */}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        {p.cost_price !== undefined && p.cost_price !== null ? (
                          (() => {
                            const profit = p.price - p.cost_price;
                            const margin = p.price > 0 ? Math.round((profit / p.price) * 100) : 0;
                            return (
                              <div className="flex flex-col">
                                <span className={`text-[11px] font-bold ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                  {profit >= 0 ? `+${formatPrice(profit)}` : `-${formatPrice(Math.abs(profit))}`}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {margin}% margin
                                </span>
                              </div>
                            );
                          })()
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
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {p.stock} • Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {p.stock} • In Stock
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
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            p.is_best_seller
                              ? "bg-[#D4AF37] text-black shadow-xs hover:bg-[#c29e2f]"
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
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            p.is_new_arrival
                              ? "bg-amber-500 text-black shadow-xs hover:bg-amber-400"
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

                      {/* Row Actions: Edit, View Storefront & Delete Product */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-neutral-800 hover:text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/80 rounded-lg transition shadow-2xs"
                            title="Edit Product Details & Variants"
                          >
                            <Edit className="w-3 h-3 text-neutral-600" />
                            <span>Edit</span>
                          </Link>

                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-black bg-neutral-50 hover:bg-neutral-100 rounded-lg transition"
                            title="View on Storefront"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-neutral-900">
                  Add New Catalog Product
                </h3>
                <p className="text-xs text-neutral-500">
                  Fill in product details to publish a new Tuscan silhouette to the storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Florence Archival Top Handle Bag"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all"
                />
              </div>

              {/* Category & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={newProdCategoryId}
                    onChange={(e) => setNewProdCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-neutral-700">
                      SKU Code *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="text-[10px] text-amber-700 hover:underline font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Generate SKU
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DN-BAG-101"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all"
                  />
                </div>
              </div>

              {/* Price, Cost Price, Compare Price, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-neutral-800 mb-1">
                    Cost Price / MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 12000"
                    value={newProdCostPrice}
                    onChange={(e) => setNewProdCostPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-bold text-neutral-900 focus:outline-hidden focus:border-black transition-all"
                  />
                  <span className="text-[9.5px] text-neutral-500 mt-0.5 block">Purchase/cost</span>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 24900"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all font-bold"
                  />
                  <span className="text-[9.5px] text-neutral-400 mt-0.5 block">Customer price</span>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Compare Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 29900"
                    value={newProdComparePrice}
                    onChange={(e) => setNewProdComparePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all"
                  />
                  <span className="text-[9.5px] text-neutral-400 mt-0.5 block">MRP strikethrough</span>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all font-bold"
                  />
                  <span className="text-[9.5px] text-neutral-400 mt-0.5 block">Units available</span>
                </div>
              </div>

              {/* Short & Detailed Description */}
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="A concise luxury tagline describing the silhouette"
                  value={newProdShortDesc}
                  onChange={(e) => setNewProdShortDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Full Detailed Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the craftsmanship, Tuscan calfskin, hardware, and interior compartments..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white"
                />
              </div>

              {/* Product Images */}
              <div>
                <input
                  type="file"
                  ref={modalFileInputRef}
                  onChange={handleUploadImageFile}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                />

                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-neutral-700">
                    Product Imagery (Photos) *
                  </label>
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white hover:bg-neutral-800 text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        <span>Upload Image File</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or enter image URL (https://...)"
                    value={newProdImageUrl}
                    onChange={(e) => setNewProdImageUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>

                {/* Images Preview List */}
                {newProdImages.length > 0 && (
                  <div className="flex items-center gap-3 mt-3 overflow-x-auto pb-1">
                    {newProdImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-20 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 group"
                      >
                        <Image
                          src={img.secure_url}
                          alt="preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewProdImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Initial Badges & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdIsBestSeller}
                    onChange={(e) => setNewProdIsBestSeller(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-neutral-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs text-neutral-800 font-medium">Mark as Best Seller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdIsNewArrival}
                    onChange={(e) => setNewProdIsNewArrival(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className="text-xs text-neutral-800 font-medium">Mark as New In</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600">Status:</span>
                  <select
                    value={newProdStatus}
                    onChange={(e) => setNewProdStatus(e.target.value as "active" | "draft")}
                    className="px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-neutral-600 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submittingProduct ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Save & Publish Product</span>
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[1.5]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-serif font-bold text-neutral-900">
                Delete Product?
              </h3>
              <p className="text-xs text-neutral-500">
                Are you sure you want to permanently remove this product from the DNORA catalog?
              </p>
            </div>

            {/* Product Card Preview */}
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-3">
              <div className="relative w-12 h-14 rounded-lg bg-neutral-200 overflow-hidden shrink-0">
                {productToDelete.images?.[0]?.secure_url && (
                  <Image
                    src={productToDelete.images[0].secure_url}
                    alt={productToDelete.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-neutral-900 truncate">
                  {productToDelete.name}
                </h4>
                <div className="text-[11px] font-mono text-neutral-500">
                  SKU: {productToDelete.sku} · {formatPrice(productToDelete.price)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingProduct}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 text-xs font-bold text-neutral-600 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingProduct}
                onClick={handleDeleteProduct}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {deletingProduct ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
