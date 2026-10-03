"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShoppingBag,
  RefreshCw,
  Palette,
  Eye,
  Tag,
  Wand2,
  DollarSign,
  Layers,
  FileText,
  List,
  AlignLeft,
  Check,
  ChevronRight,
} from "lucide-react";
import { ProductCategory, ProductColorVariant, ProductImage } from "@/types";
import { getValidColorHex } from "@/lib/utils";

const LUXURY_COLOR_PRESETS = [
  { name: "Noir Black", hex: "#111111" },
  { name: "Caramel Tan", hex: "#9E6740" },
  { name: "Ivory Cream", hex: "#EAE6DF" },
  { name: "Cognac Amber", hex: "#8A4117" },
  { name: "Espresso", hex: "#2E1C14" },
  { name: "Forest Olive", hex: "#2B3A2C" },
  { name: "Burgundy Wine", hex: "#4A1521" },
  { name: "Classic Navy", hex: "#162032" },
];

const WIZARD_STEPS = [
  { id: 1, label: "Vital Info", subtitle: "Name, SKU & Category" },
  { id: 2, label: "Pricing & Profit", subtitle: "MRP & Live Margins" },
  { id: 3, label: "Images & Colors", subtitle: "Photos & Swatches" },
  { id: 4, label: "Product Details & Tabs", subtitle: "Custom Accordion Tabs" },
];

export default function AdminNewProductPage() {
  const router = useRouter();

  // Wizard Step State (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Categories
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Step 1: Vital Info
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("20");
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);

  // Step 2: Pricing & Margins
  const [costPrice, setCostPrice] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");

  // Step 3: Images & Color Variants
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [manualUrlInput, setManualUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetSlotToUpload, setTargetSlotToUpload] = useState<number | null>(null);

  const [colorVariants, setColorVariants] = useState<ProductColorVariant[]>([]);
  const [variantUploadingIndex, setVariantUploadingIndex] = useState<number | null>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const [variantUploadTarget, setVariantUploadTarget] = useState<{
    variantIndex: number;
    type: "main" | "hover" | "extra";
    extraIndex?: number;
  } | null>(null);

  // Step 4: Customizable Product Detail Tabs (Craftsmanship, Shipping, Leather Care)
  // Tab 1: Craftsmanship & Details
  const [craftsmanshipHeading, setCraftsmanshipHeading] = useState("Florentine Craftsmanship & Details");
  const [craftsmanshipMode, setCraftsmanshipMode] = useState<"bullets" | "text">("bullets");
  const [craftsmanshipDetails, setCraftsmanshipDetails] = useState(
    "Origin: Handcrafted in Florence, Italy\nMaterial: 100% Certified Italian Calfskin\nHardware: Palladium-finish reinforced alloy\nLining: Breathable natural suede interior"
  );

  // Tab 2: Shipping & Worldwide Customs
  const [shippingHeading, setShippingHeading] = useState("Shipping & Worldwide Customs");
  const [shippingMode, setShippingMode] = useState<"bullets" | "text">("text");
  const [shippingCustoms, setShippingCustoms] = useState(
    "All DNORA creations are dispatched under white-glove, insured courier transit directly to your doorstep. Complimentary express delivery included across India (3 - 5 business days). Signature required upon receipt."
  );

  // Tab 3: Florentine Leather Care
  const [leatherHeading, setLeatherHeading] = useState("Florentine Leather Care");
  const [leatherMode, setLeatherMode] = useState<"bullets" | "text">("text");
  const [leatherCare, setLeatherCare] = useState(
    "Vegetable-tanned leather develops an exquisite natural patina over time. To maintain its supple texture, avoid prolonged exposure to direct sunlight and high humidity. Clean with a soft, dry cotton cloth."
  );

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculations
  const numPrice = parseFloat(price);
  const numCompare = parseFloat(compareAtPrice);
  const numCost = parseFloat(costPrice);
  const calculatedDiscount =
    !isNaN(numPrice) && !isNaN(numCompare) && numCompare > numPrice && numPrice > 0
      ? Math.round(((numCompare - numPrice) / numCompare) * 100)
      : null;
  const unitProfit = !isNaN(numPrice) && !isNaN(numCost) ? numPrice - numCost : null;
  const marginPercent = unitProfit !== null && numPrice > 0 ? Math.round((unitProfit / numPrice) * 100) : null;

  // Auto-generate unique SKU
  const generateSkuString = useCallback((prodName?: string, catId?: string) => {
    const targetName = prodName !== undefined ? prodName : name;
    const targetCat = categories.find((c) => c.id === (catId !== undefined ? catId : categoryId));
    const catPart = targetCat?.name ? targetCat.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() : "BAG";
    const namePart = targetName.trim() ? targetName.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() : "DNR";
    const prefix = namePart.length >= 2 ? namePart : catPart;
    const rand = Math.floor(100 + Math.random() * 900);
    return `DNR-${prefix}-${rand}`;
  }, [name, categories, categoryId]);

  const handleGenerateSku = () => {
    setSku(generateSkuString());
  };

  // Load Categories on mount
  useEffect(() => {
    async function fetchCats() {
      try {
        setLoadingCategories(true);
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          const list: ProductCategory[] = json.data || [];
          setCategories(list);
          if (list.length > 0) {
            setCategoryId((prev) => prev || list[0].id);
          }
          // Auto-generate initial SKU if empty
          setSku((prev) => prev || `DNR-AUR-${Math.floor(100 + Math.random() * 900)}`);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCats();
  }, []);

  // Step Validation & Navigation
  const validateStep = (stepNumber: number): boolean => {
    setErrorMsg(null);
    if (stepNumber === 1) {
      if (!name.trim()) {
        setErrorMsg("Please enter a product title/name in Step 1.");
        return false;
      }
      if (!sku.trim()) {
        setSku(generateSkuString());
      }
    } else if (stepNumber === 2) {
      if (isNaN(numPrice) || numPrice <= 0) {
        setErrorMsg("Please enter a valid Selling Price (greater than 0) in Step 2.");
        return false;
      }
    } else if (stepNumber === 3) {
      if (images.length === 0) {
        setErrorMsg("Please upload at least 1 Main Image for this product in Step 3.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Upload an image file for product main/hover slots
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const slot = targetSlotToUpload !== null ? targetSlotToUpload : (images.length < 2 ? images.length : 0);
    setUploadingSlot(slot);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "dnora/products");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.secure_url) {
        throw new Error(json.error || "Failed to upload image");
      }

      const newImage: ProductImage = {
        secure_url: json.secure_url,
        cloudinary_public_id: json.public_id || "",
        alt_text: `${name} View ${slot + 1}`,
        sort_order: slot + 1,
      };

      setImages((prev) => {
        const next = [...prev];
        next[slot] = newImage;
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed";
      setErrorMsg(msg);
    } finally {
      setUploadingSlot(null);
      setTargetSlotToUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrlInput.trim()) return;
    const slot = images.length < 2 ? images.length : images.length;
    const newImage: ProductImage = {
      secure_url: manualUrlInput.trim(),
      cloudinary_public_id: "",
      alt_text: `${name} View ${slot + 1}`,
      sort_order: slot + 1,
    };
    setImages((prev) => [...prev, newImage]);
    setManualUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Color Variants
  const handleAddColorVariant = () => {
    const newVariant: ProductColorVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      color_hex: "#111111",
      images: images.length > 0 ? [images[0]] : [],
    };
    setColorVariants((prev) => [...prev, newVariant]);
  };

  const handleRemoveColorVariant = (index: number) => {
    setColorVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleVariantFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !variantUploadTarget) return;

    const { variantIndex, type, extraIndex } = variantUploadTarget;
    setVariantUploadingIndex(variantIndex);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "dnora/products");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.secure_url) {
        throw new Error(json.error || "Failed to upload image");
      }

      const newImg: ProductImage = {
        secure_url: json.secure_url,
        cloudinary_public_id: json.public_id || "",
        alt_text: "Color Variant Photo",
        sort_order: 1,
      };

      setColorVariants((prev) => {
        const next = [...prev];
        const targetVar = next[variantIndex];
        if (!targetVar) return prev;

        const currentImages = targetVar.images ? [...targetVar.images] : [];
        if (type === "main") {
          currentImages[0] = newImg;
        } else if (type === "hover") {
          currentImages[1] = newImg;
        } else if (type === "extra" && extraIndex !== undefined) {
          currentImages[extraIndex] = newImg;
        } else {
          currentImages.push(newImg);
        }

        next[variantIndex] = { ...targetVar, images: currentImages };
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Variant upload failed";
      setErrorMsg(msg);
    } finally {
      setVariantUploadingIndex(null);
      setVariantUploadTarget(null);
      if (variantFileInputRef.current) variantFileInputRef.current.value = "";
    }
  };

  const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
    setColorVariants((prev) => {
      const next = [...prev];
      const targetVar = next[variantIndex];
      if (!targetVar) return prev;
      const filtered = targetVar.images.filter((_, idx) => idx !== imageIndex);
      next[variantIndex] = { ...targetVar, images: filtered };
      return next;
    });
  };

  // Submit Product Creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Please enter a product title in Step 1.");
      setCurrentStep(1);
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg("Please enter a valid selling price in Step 2.");
      setCurrentStep(2);
      return;
    }
    if (images.length === 0) {
      setErrorMsg("Please upload at least one image in Step 3.");
      setCurrentStep(3);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        category_id: categoryId || (categories[0]?.id ?? ""),
        sku: sku.trim() || generateSkuString(),
        price: numPrice,
        compare_at_price: !isNaN(numCompare) && numCompare > numPrice ? numCompare : null,
        cost_price: !isNaN(numCost) && numCost >= 0 ? numCost : null,
        stock: parseInt(stock, 10) || 0,
        short_description: `${name} in fine Italian calfskin`,
        description: `${name} handcrafted by master artisans in Florence, Italy.`,
        craftsmanship_heading: craftsmanshipHeading.trim() || "Florentine Craftsmanship & Details",
        craftsmanship_details: craftsmanshipDetails.trim() || null,
        craftsmanship_mode: craftsmanshipMode,
        shipping_heading: shippingHeading.trim() || "Shipping & Worldwide Customs",
        shipping_customs: shippingCustoms.trim() || null,
        shipping_mode: shippingMode,
        leather_heading: leatherHeading.trim() || "Florentine Leather Care",
        leather_care: leatherCare.trim() || null,
        leather_mode: leatherMode,
        is_best_seller: isBestSeller,
        is_new_arrival: isNewArrival,
        status: status,
        images: images.slice(0, 2).map((img, idx) => ({
          ...img,
          sort_order: idx + 1,
        })),
        color_variants: colorVariants.map((v) => ({
          id: v.id,
          name: v.name?.trim() || "",
          color_hex: getValidColorHex(v.color_hex),
          images: v.images && v.images.length > 0 ? v.images : [],
        })),
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create product");
      }

      setSuccessMsg("Product published successfully! Redirecting to catalog...");
      setTimeout(() => {
        router.push("/admin/items");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMsg(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-4">
        <div>
          <Link
            href="/admin/items"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Items</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight font-heading">
            Add New Product
          </h1>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Step-by-step listing wizard. Complete each section to publish your product to the storefront.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/items"
            className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Publish Now</span>
          </button>
        </div>
      </div>

      {/* AMAZON-STYLE STEPPER TABS (1 Step at a time) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-2 sm:p-3 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {WIZARD_STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (validateStep(currentStep) || step.id < currentStep) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`relative flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-xs"
                    : isCompleted
                    ? "bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-200"
                    : "bg-white hover:bg-neutral-50 text-neutral-500 border border-transparent"
                }`}
              >
                {/* Step Icon / Number */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                    isActive
                      ? "bg-white text-neutral-900"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 text-emerald-700" /> : step.id}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-tight truncate leading-tight">
                    {step.label}
                  </p>
                  <p
                    className={`text-[10.5px] truncate font-light mt-0.5 ${
                      isActive ? "text-neutral-300" : "text-neutral-400"
                    }`}
                  >
                    {step.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
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

      {/* STEP CONTENT CONTAINER */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* STEP 1: VITAL INFO */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
            <div className="border-b border-neutral-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
                Step 1 of 4
              </span>
              <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
                Vital Product Information
              </h2>
              <p className="text-xs text-neutral-500 font-light">
                Define the primary product title, category, automatic SKU, and inventory allocation.
              </p>
            </div>

            <div className="space-y-4">
              {/* Product Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center justify-between">
                  <span>Product Name / Title <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-neutral-400 font-normal">e.g. The Palazzo Grand Tote</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!sku || sku.startsWith("DNR-")) {
                      setSku(generateSkuString(e.target.value, categoryId));
                    }
                  }}
                  placeholder="e.g. The Palazzo Grand Tote"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all font-medium"
                />
              </div>

              {/* Category & Auto-Generated SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      if (!sku || sku.startsWith("DNR-")) {
                        setSku(generateSkuString(name, e.target.value));
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SKU with Auto-Generate Button */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Product SKU <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-800 hover:text-black bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      title="Generate new unique SKU"
                    >
                      <Wand2 className="w-3 h-3 text-[#B89025]" />
                      <span>Auto-Generate SKU</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. DNR-PAL-842"
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Units & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Initial Stock */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Initial Stock Inventory <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="20"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all font-mono"
                  />
                  <p className="text-[10.5px] text-neutral-400 font-light">
                    Units available for instant order dispatch.
                  </p>
                </div>

                {/* Publication Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Publication Status
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-800">
                      <input
                        type="radio"
                        name="prod_status"
                        checked={status === "active"}
                        onChange={() => setStatus("active")}
                        className="text-neutral-900 focus:ring-neutral-900"
                      />
                      <span>Active (Live on Website)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-800">
                      <input
                        type="radio"
                        name="prod_status"
                        checked={status === "draft"}
                        onChange={() => setStatus("draft")}
                        className="text-neutral-900 focus:ring-neutral-900"
                      />
                      <span>Draft (Hidden)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Storefront Merchandising Flags */}
              <div className="pt-3 border-t border-neutral-100 flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-white transition-all text-xs font-semibold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900"
                  />
                  <span>★ Mark as Best Seller</span>
                </label>

                <label className="inline-flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-white transition-all text-xs font-semibold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900"
                  />
                  <span>✦ Mark as New Arrival</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PRICING & MARGINS */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
            <div className="border-b border-neutral-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
                Step 2 of 4
              </span>
              <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
                Pricing, Cost &amp; Profit Tracking
              </h2>
              <p className="text-xs text-neutral-500 font-light">
                Enter your cost price and customer selling price. Live gross profit &amp; margin will calculate automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* 1. Cost Price / MRP */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Cost Price / MRP (₹)
                  </label>
                  <span className="text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded font-mono font-medium">
                    Internal Cost
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="e.g. 3500 (Production / wholesale expense)"
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white font-mono font-bold text-neutral-900 focus:outline-none focus:border-black"
                />
                <p className="text-[10.5px] text-neutral-500 font-light">
                  What it costs your brand to manufacture or acquire this item.
                </p>
              </div>

              {/* 2. Customer Selling Price */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Selling Price (₹) <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-mono">
                    Sale Price
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 6000 (Checkout price)"
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white font-mono font-bold text-neutral-900 focus:outline-none focus:border-black"
                />
                <p className="text-[10.5px] text-neutral-500 font-light">
                  Active price paid by customers during online checkout.
                </p>
              </div>

              {/* 3. Original Compare At Price */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Regular / MRP Price (₹)
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Strikethrough
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="e.g. 7500"
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white font-mono focus:outline-none focus:border-black"
                />
                <p className="text-[10.5px] text-neutral-500 font-light">
                  Shown with strikethrough if higher than Selling Price.
                </p>
              </div>
            </div>

            {/* Profit & Margin Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {unitProfit !== null ? (
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    unitProfit >= 0
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider block">
                      Estimated Unit Profit &amp; Margin
                    </span>
                    <span className="text-xl font-extrabold font-mono">
                      {unitProfit >= 0 ? `+₹${unitProfit.toLocaleString("en-IN")}` : `-₹${Math.abs(unitProfit).toLocaleString("en-IN")}`}
                    </span>
                    <span className="text-xs font-semibold ml-2 opacity-90">
                      ({marginPercent}% profit margin)
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      unitProfit >= 0 ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                    }`}
                  >
                    {unitProfit >= 0 ? "Profitable" : "Selling at Loss"}
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-500 text-xs flex items-center">
                  Enter both Cost Price and Selling Price to view unit profit &amp; margin %.
                </div>
              )}

              {calculatedDiscount && calculatedDiscount > 0 ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 block">
                      Customer Discount Tag
                    </span>
                    <span className="text-xl font-extrabold text-rose-800 font-mono">
                      -{calculatedDiscount}% OFF
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-200 text-rose-900">
                    Badge Enabled
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-400 text-xs flex items-center font-light">
                  Discount badge will show if Original MRP &gt; Selling Price.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: IMAGES & COLOR VARIANTS */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            {/* Main Product Photos */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-neutral-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
                  Step 3 of 4
                </span>
                <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
                  Product Photos (Main &amp; Hover)
                </h2>
                <p className="text-xs text-neutral-500 font-light">
                  Upload Slot 1 (Main Card Photo) and Slot 2 (Interactive Hover Photo).
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Slot 0: Main Image */}
                <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden group">
                  {images[0] ? (
                    <>
                      <Image
                        src={images[0].secure_url}
                        alt="Main view"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetSlotToUpload(0);
                            fileInputRef.current?.click();
                          }}
                          className="px-3 py-1.5 bg-white text-xs font-bold rounded-lg text-black hover:bg-neutral-100 cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(0)}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider">
                        Slot 1: Main Photo
                      </span>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-neutral-900">Upload Main Image *</p>
                      <p className="text-[10.5px] text-neutral-400 mt-0.5">Primary storefront catalog view</p>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSlotToUpload(0);
                          fileInputRef.current?.click();
                        }}
                        disabled={uploadingSlot !== null}
                        className="mt-3 px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-black cursor-pointer"
                      >
                        {uploadingSlot === 0 ? "Uploading..." : "Browse Image"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Slot 1: Hover Image */}
                <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden group">
                  {images[1] ? (
                    <>
                      <Image
                        src={images[1].secure_url}
                        alt="Hover view"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetSlotToUpload(1);
                            fileInputRef.current?.click();
                          }}
                          className="px-3 py-1.5 bg-white text-xs font-bold rounded-lg text-black hover:bg-neutral-100 cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(1)}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider">
                        Slot 2: Hover Photo
                      </span>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-neutral-900">Upload Hover Image</p>
                      <p className="text-[10.5px] text-neutral-400 mt-0.5">Smooth cursor-hover reveal view</p>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSlotToUpload(1);
                          fileInputRef.current?.click();
                        }}
                        disabled={uploadingSlot !== null}
                        className="mt-3 px-4 py-2 bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer border border-neutral-300"
                      >
                        {uploadingSlot === 1 ? "Uploading..." : "Browse Image"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Image URL input */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="url"
                  value={manualUrlInput}
                  onChange={(e) => setManualUrlInput(e.target.value)}
                  placeholder="Or paste external Cloudinary / CDN image URL..."
                  className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddManualUrl}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-black cursor-pointer"
                >
                  Add URL
                </button>
              </div>
            </div>

            {/* Color Swatch Variants (Optional) */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-neutral-950 font-serif">Color Swatches &amp; Variant Imagery</h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      Optional
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-light mt-0.5">
                    Optional: Add available colors. Customers see matching photos when clicking each color swatch!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddColorVariant}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Color Variant</span>
                </button>
              </div>

              <input
                type="file"
                ref={variantFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleVariantFileSelect}
              />

              {colorVariants.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-xs text-neutral-500 font-light">
                  No additional color variants added (Optional). Click &quot;Add Color Variant&quot; if this silhouette comes in multiple shades.
                </div>
              ) : (
                <div className="space-y-4">
                  {colorVariants.map((variant, vIdx) => {
                    const safeHex = getValidColorHex(variant.color_hex);
                    const isUploadingThis = variantUploadingIndex === vIdx;
                    return (
                      <div
                        key={variant.id || vIdx}
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-6 h-6 rounded-full border border-neutral-300 shadow-xs shrink-0"
                              style={{ backgroundColor: safeHex }}
                            />
                            <input
                              type="color"
                              value={safeHex}
                              onChange={(e) => {
                                const val = e.target.value;
                                setColorVariants((prev) => {
                                  const next = [...prev];
                                  next[vIdx].color_hex = val;
                                  return next;
                                });
                              }}
                              className="w-8 h-8 rounded-lg border border-neutral-300 cursor-pointer p-0.5 bg-white"
                              title="Pick Color Code"
                            />
                            <input
                              type="text"
                              value={variant.name || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setColorVariants((prev) => {
                                  const next = [...prev];
                                  next[vIdx].name = val;
                                  return next;
                                });
                              }}
                              placeholder="Color Name (Optional - leave blank for dot only)"
                              className="text-xs font-medium text-neutral-900 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg w-72 focus:outline-none focus:border-black"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveColorVariant(vIdx)}
                            className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove Variant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Variant Photos */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                              Variant Photos ({variant.images?.length || 0})
                            </span>
                            <span className="text-[10.5px] text-neutral-400">
                              When customers select this color, only these photos will be shown
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2.5 items-center">
                            {variant.images?.map((img, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="relative w-16 h-20 rounded-xl bg-white overflow-hidden border border-neutral-300 group shrink-0 shadow-xs"
                              >
                                <Image src={img.secure_url} alt="" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantImage(vIdx, imgIdx)}
                                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
                                    title="Remove Photo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[8px] font-mono font-bold">
                                  #{imgIdx + 1}
                                </span>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => {
                                setVariantUploadTarget({
                                  variantIndex: vIdx,
                                  type: "extra",
                                  extraIndex: variant.images ? variant.images.length : 0,
                                });
                                variantFileInputRef.current?.click();
                              }}
                              disabled={isUploadingThis}
                              className="w-16 h-20 rounded-xl border-2 border-dashed border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 flex flex-col items-center justify-center text-[10.5px] text-neutral-600 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                            >
                              {isUploadingThis ? (
                                <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 text-neutral-500 mb-0.5" />
                                  <span className="font-semibold text-[9px]">Add Photo</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: CUSTOM PRODUCT DETAIL ACCORDION TABS */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
            <div className="border-b border-neutral-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
                Step 4 of 4
              </span>
              <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
                Product Details &amp; Accordion Tabs
              </h2>
              <p className="text-xs text-neutral-500 font-light">
                Configure the 3 customer accordion tabs on your product page. Type custom headings and choose between <b>Bullet Points</b> or <b>Paragraph Text</b> mode!
              </p>
            </div>

            <div className="space-y-6">
              {/* TAB 1: Craftsmanship & Details */}
              <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Tab 1: Heading &amp; Content
                    </span>
                  </div>

                  {/* Bullet vs Text Mode Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 self-start">
                    <button
                      type="button"
                      onClick={() => setCraftsmanshipMode("bullets")}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        craftsmanshipMode === "bullets"
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-600 hover:text-neutral-950"
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Bullet Points</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCraftsmanshipMode("text")}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        craftsmanshipMode === "text"
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-600 hover:text-neutral-950"
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Paragraph Text</span>
                    </button>
                  </div>
                </div>

                {/* Heading Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Tab Heading (Click to customize)
                  </label>
                  <input
                    type="text"
                    value={craftsmanshipHeading}
                    onChange={(e) => setCraftsmanshipHeading(e.target.value)}
                    placeholder="Florentine Craftsmanship & Details"
                    className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-black"
                  />
                </div>

                {/* Content Box */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                      {craftsmanshipMode === "bullets" ? "Bullet Points (1 per line)" : "Paragraph Text"}
                    </label>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {craftsmanshipMode === "bullets" ? "Auto-renders as bullets" : "Plain narrative"}
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={craftsmanshipDetails}
                    onChange={(e) => setCraftsmanshipDetails(e.target.value)}
                    placeholder={
                      craftsmanshipMode === "bullets"
                        ? "Origin: Handcrafted in Florence, Italy\nMaterial: 100% Certified Italian Calfskin\nHardware: Palladium-finish reinforced alloy\nLining: Breathable natural suede interior"
                        : "Every piece is sculpted with architectural discipline using sustainably-sourced Italian calfskin and palladium-finish alloy."
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-black font-mono leading-relaxed"
                  />
                  <p className="text-[10.5px] text-neutral-500 font-light">
                    {craftsmanshipMode === "bullets"
                      ? "Tip: Enter each bullet point on a separate line. The storefront will display them as styled bullet points."
                      : "Tip: Standard continuous narrative description."}
                  </p>
                </div>
              </div>

              {/* TAB 2: Shipping & Worldwide Customs */}
              <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Tab 2: Heading &amp; Content
                    </span>
                  </div>

                  {/* Bullet vs Text Mode Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 self-start">
                    <button
                      type="button"
                      onClick={() => setShippingMode("bullets")}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        shippingMode === "bullets"
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-600 hover:text-neutral-950"
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Bullet Points</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingMode("text")}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        shippingMode === "text"
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-600 hover:text-neutral-950"
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Paragraph Text</span>
                    </button>
                  </div>
                </div>

                {/* Heading Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Tab Heading (Click to customize)
                  </label>
                  <input
                    type="text"
                    value={shippingHeading}
                    onChange={(e) => setShippingHeading(e.target.value)}
                    placeholder="Shipping & Worldwide Customs"
                    className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-black"
                  />
                </div>

                {/* Content Box */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                      {shippingMode === "bullets" ? "Bullet Points (1 per line)" : "Paragraph Text"}
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    value={shippingCustoms}
                    onChange={(e) => setShippingCustoms(e.target.value)}
                    placeholder="All DNORA creations are dispatched under white-glove, insured courier transit directly to your doorstep. Complimentary express delivery included across India (3 - 5 business days)."
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-black font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* TAB 3: Florentine Leather Care */}
              <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Tab 3: Heading &amp; Content
                    </span>
                  </div>

                  {/* Bullet vs Text Mode Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 self-start">
                    <button
                      type="button"
                      onClick={() => setLeatherMode("bullets")}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        leatherMode === "bullets"
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-600 hover:text-neutral-950"
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Bullet Points</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeatherMode("text")}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        leatherMode === "text"
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-600 hover:text-neutral-950"
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Paragraph Text</span>
                    </button>
                  </div>
                </div>

                {/* Heading Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Tab Heading (Click to customize)
                  </label>
                  <input
                    type="text"
                    value={leatherHeading}
                    onChange={(e) => setLeatherHeading(e.target.value)}
                    placeholder="Florentine Leather Care"
                    className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-black"
                  />
                </div>

                {/* Content Box */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                      {leatherMode === "bullets" ? "Bullet Points (1 per line)" : "Paragraph Text"}
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    value={leatherCare}
                    onChange={(e) => setLeatherCare(e.target.value)}
                    placeholder="Vegetable-tanned leather develops an exquisite natural patina over time. To maintain its supple texture, avoid prolonged exposure to direct sunlight and high humidity. Clean with a soft, dry cotton cloth."
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-black font-mono leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BOTTOM WIZARD CONTROLS (Back / Save & Continue / Publish) */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-xs">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : (
              <Link
                href="/admin/items"
                className="px-5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:bg-neutral-100 transition-colors inline-block"
              >
                Cancel
              </Link>
            )}
          </div>

          <div className="text-center hidden sm:block">
            <span className="text-xs font-bold text-neutral-900 font-mono">
              Step {currentStep} of 4: {WIZARD_STEPS[currentStep - 1].label}
            </span>
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Save &amp; Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-7 py-3 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Publishing Product...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Save &amp; Publish Product</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
