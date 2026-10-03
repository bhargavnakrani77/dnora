"use client";

import React, { useState, useEffect, useRef, use, useCallback } from "react";
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
  Save,
} from "lucide-react";
import { ProductCategory, ProductColorVariant, ProductImage } from "@/types";

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

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminEditProductPage({ params }: EditPageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Wizard Step State (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Categories & Loading State
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);

  // Step 1: Vital Info
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("20");
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);

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

  // Preserve underlying narrative fields silently without presenting them to user
  const [shortDesc, setShortDesc] = useState("");
  const [desc, setDesc] = useState("");

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

  // Load product and categories on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingProduct(true);
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch(`/api/products/${id}`),
        ]);

        if (catRes.ok) {
          const catJson = await catRes.json();
          setCategories(catJson.data || []);
        }

        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          const p = prodJson.product;
          if (p) {
            setName(p.name || "");
            setCategoryId(p.categories?.[0]?.id || p.category_id || "");
            setSku(p.sku || "");
            setPrice(p.price !== undefined ? String(p.price) : "");
            setCompareAtPrice(p.compare_at_price ? String(p.compare_at_price) : "");
            setCostPrice(p.cost_price !== undefined && p.cost_price !== null ? String(p.cost_price) : "");
            setStock(p.stock !== undefined ? String(p.stock) : "20");
            setStatus(p.status || "active");
            setIsBestSeller(Boolean(p.is_best_seller));
            setIsNewArrival(Boolean(p.is_new_arrival));
            setImages(p.images || []);
            setColorVariants(p.color_variants || []);
            setShortDesc(p.short_description || "");
            setDesc(p.description || "");

            if (p.craftsmanship_heading) setCraftsmanshipHeading(p.craftsmanship_heading);
            if (p.craftsmanship_mode) setCraftsmanshipMode(p.craftsmanship_mode);
            if (p.craftsmanship_details) setCraftsmanshipDetails(p.craftsmanship_details);

            if (p.shipping_heading) setShippingHeading(p.shipping_heading);
            if (p.shipping_mode) setShippingMode(p.shipping_mode);
            if (p.shipping_customs) setShippingCustoms(p.shipping_customs);

            if (p.leather_heading) setLeatherHeading(p.leather_heading);
            if (p.leather_mode) setLeatherMode(p.leather_mode);
            if (p.leather_care) setLeatherCare(p.leather_care);
          }
        } else {
          setErrorMsg("Could not find product to edit.");
        }
      } catch (err) {
        console.error("Failed to load product data:", err);
        setErrorMsg("Network error loading product.");
      } finally {
        setLoadingProduct(false);
      }
    }

    loadData();
  }, [id]);

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
        cloudinary_public_id: json.public_id || `img_${Date.now()}`,
        alt_text: `${name || "DNORA"} View ${slot + 1}`,
        sort_order: slot + 1,
      };

      setImages((prev) => {
        const next = [...prev];
        if (slot < next.length) {
          next[slot] = newImage;
        } else {
          next.push(newImage);
        }
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

  const triggerUploadForSlot = (slotIndex: number) => {
    setTargetSlotToUpload(slotIndex);
    fileInputRef.current?.click();
  };

  const triggerAddExtraImage = () => {
    setTargetSlotToUpload(images.length);
    fileInputRef.current?.click();
  };

  const handleAddManualUrl = () => {
    if (!manualUrlInput.trim()) return;
    try {
      new URL(manualUrlInput.trim());
      const newImg: ProductImage = {
        secure_url: manualUrlInput.trim(),
        cloudinary_public_id: `manual_${Date.now()}`,
        alt_text: name || "DNORA Luxury Product",
        sort_order: images.length + 1,
      };
      setImages((prev) => [...prev, newImg]);
      setManualUrlInput("");
    } catch {
      setErrorMsg("Please enter a valid HTTP/HTTPS URL");
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Color Variants Management
  const handleAddColorVariant = () => {
    const newVariant: ProductColorVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      color_hex: LUXURY_COLOR_PRESETS[colorVariants.length % LUXURY_COLOR_PRESETS.length].hex,
      images: [],
    };
    setColorVariants((prev) => [...prev, newVariant]);
  };

  const handleUpdateVariant = (index: number, updates: Partial<ProductColorVariant>) => {
    setColorVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleRemoveVariant = (indexToRemove: number) => {
    setColorVariants((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const triggerVariantImageUpload = (
    variantIndex: number,
    type: "main" | "hover" | "extra",
    extraIndex?: number
  ) => {
    setVariantUploadTarget({ variantIndex, type, extraIndex });
    variantFileInputRef.current?.click();
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
      formData.append("folder", "dnora/products/variants");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.secure_url) {
        throw new Error(json.error || "Failed to upload variant image");
      }

      const newImg: ProductImage = {
        secure_url: json.secure_url,
        cloudinary_public_id: json.public_id || `var_${Date.now()}`,
        alt_text: `${name || "DNORA"} - Variant Image`,
        sort_order: type === "main" ? 1 : type === "hover" ? 2 : 3,
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

  // Submit Product Updates
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        short_description: shortDesc || `${name} in fine Italian calfskin`,
        description: desc || `${name} handcrafted by master artisans in Florence, Italy.`,
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
        images: images.map((img, idx) => ({
          ...img,
          sort_order: idx + 1,
        })),
        color_variants: colorVariants.map((v) => ({
          id: v.id,
          name: v.name?.trim() || "",
          color_hex: v.color_hex,
          images: v.images && v.images.length > 0 ? v.images : (images.length > 0 ? [images[0]] : []),
        })),
      };

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update product");
      }

      setSuccessMsg("Product updated successfully! Redirecting to catalog...");
      setTimeout(() => {
        router.push("/admin/items");
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
          <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">
            Loading Product Details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 pb-28">
      {/* Hidden file input for main/hover image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Hidden file input for variant image upload */}
      <input
        ref={variantFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleVariantFileSelect}
      />

      {/* TOP HEADER */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/items"
            className="p-2 text-neutral-500 hover:text-black rounded-lg hover:bg-neutral-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#B89025]">
                Amazon-Style Listing Wizard
              </span>
              <span className="text-[10px] font-mono text-neutral-400">ID: {id}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 font-serif">
              {name || "Edit Product"}
            </h1>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/items"
            className="px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        if (!sku || sku.startsWith("DNR-")) {
                          setSku(generateSkuString(name, e.target.value));
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all font-medium cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SKU with 1-Click Auto-Generator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                        SKU (Auto-Generated)
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateSku}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-black hover:underline cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3 text-[#B89025]" />
                        <span>Regenerate SKU</span>
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="DNR-PAL-842"
                        className="w-full px-4 py-2.5 font-mono text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stock Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Total Units In Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all font-mono"
                    />
                  </div>

                  {/* Listing Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Listing Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as "active" | "draft")}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all font-medium cursor-pointer"
                    >
                      <option value="active">Active (Published on Storefront)</option>
                      <option value="draft">Draft (Hidden from Catalog)</option>
                    </select>
                  </div>
                </div>

                {/* Luxury Merchandising Flags */}
                <div className="pt-2 border-t border-neutral-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block mb-2.5">
                    Merchandising Badges
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isBestSeller
                          ? "bg-amber-50/60 border-amber-300 text-amber-950"
                          : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isBestSeller}
                        onChange={(e) => setIsBestSeller(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold">Best Seller Badge</p>
                        <p className="text-[11px] text-neutral-500">
                          Highlights this silhouette in curated Best Seller carousels.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isNewArrival
                          ? "bg-neutral-100 border-neutral-900 text-neutral-950"
                          : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isNewArrival}
                        onChange={(e) => setIsNewArrival(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold">New Arrival Tag</p>
                        <p className="text-[11px] text-neutral-500">
                          Places the item prominently under latest seasonal drops.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PRICING & PROFIT */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
              <div className="border-b border-neutral-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
                  Step 2 of 4
                </span>
                <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
                  Pricing & Profit Margins
                </h2>
                <p className="text-xs text-neutral-500 font-light">
                  Input your Cost / Purchase Price, Selling Price, and Compare-at Price. Live profit margins are calculated automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Cost Price */}
                <div className="space-y-1.5 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
                    Cost / Purchase Price (₹)
                  </label>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Your wholesale / procurement cost (Padtar Bhav). Kept strictly private.
                  </p>
                  <div className="relative mt-2">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-mono font-medium"
                    />
                  </div>
                </div>

                {/* Selling Price */}
                <div className="space-y-1.5 p-4 rounded-xl bg-white border-2 border-neutral-900 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-950">
                      Selling Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-neutral-900 text-white">
                      Live
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    The final retail price charged to shoppers at checkout.
                  </p>
                  <div className="relative mt-2">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-950 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="2990.00"
                      className="w-full pl-8 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-950 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/15 focus:border-neutral-900"
                    />
                  </div>
                </div>

                {/* Compare-at Price */}
                <div className="space-y-1.5 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
                    Original / MRP Price (₹)
                  </label>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Crossed-out list price to display an attractive markdown discount.
                  </p>
                  <div className="relative mt-2">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      placeholder="4990.00"
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-mono font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE PROFIT & MARGIN DASHBOARD */}
              <div className="p-5 rounded-2xl bg-neutral-900 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">
                      Live Profit & Margin Analytics
                    </span>
                  </div>
                  {calculatedDiscount !== null && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/30">
                      Save {calculatedDiscount}% OFF
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                      Per-Unit Net Profit
                    </p>
                    <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {unitProfit !== null ? `₹${unitProfit.toLocaleString("en-IN")}` : "—"}
                    </p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                      Profit Margin %
                    </p>
                    <p className="text-lg font-bold font-mono text-white mt-0.5">
                      {marginPercent !== null ? `${marginPercent}%` : "—"}
                    </p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                      Total Potential Value
                    </p>
                    <p className="text-lg font-bold font-mono text-[#D4AF37] mt-0.5">
                      {!isNaN(numPrice) && !isNaN(parseInt(stock, 10))
                        ? `₹${(numPrice * (parseInt(stock, 10) || 0)).toLocaleString("en-IN")}`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: IMAGES & COLORS */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              {/* Main Silhouette Imagery */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-neutral-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
                    Step 3 of 4
                  </span>
                  <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
                    Catalog Imagery & Hover Reveals
                  </h2>
                  <p className="text-xs text-neutral-500 font-light">
                    Upload your high-definition photography. Slot 1 is the default catalog image; Slot 2 is revealed on customer mouse hover.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Slot 0: Main Image */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-neutral-900" />
                        1. Main Catalog Image <span className="text-rose-500">*</span>
                      </span>
                      {images[0] && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(0)}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div
                      onClick={() => triggerUploadForSlot(0)}
                      className={`relative aspect-[4/5] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer group overflow-hidden ${
                        images[0]
                          ? "border-neutral-300 bg-white"
                          : "border-neutral-300 hover:border-black bg-neutral-50 hover:bg-neutral-100/60"
                      }`}
                    >
                      {images[0] ? (
                        <>
                          <Image
                            src={images[0].secure_url}
                            alt="Main Product"
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-contain p-2"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg shadow-sm">
                              Change Photo
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-2">
                          {uploadingSlot === 0 ? (
                            <Loader2 className="w-8 h-8 animate-spin text-neutral-600 mx-auto" />
                          ) : (
                            <Upload className="w-8 h-8 text-neutral-400 group-hover:text-black mx-auto transition-colors" />
                          )}
                          <p className="text-xs font-bold text-neutral-700">Click to Upload Main Image</p>
                          <p className="text-[10px] text-neutral-400">PNG, JPG or WebP (Recommended 1200x1500)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Slot 1: Hover Image */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-neutral-400" />
                        2. Hover / Silhouette Reveal (Optional)
                      </span>
                      {images[1] && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(1)}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div
                      onClick={() => triggerUploadForSlot(1)}
                      className={`relative aspect-[4/5] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer group overflow-hidden ${
                        images[1]
                          ? "border-neutral-300 bg-white"
                          : "border-neutral-300 hover:border-black bg-neutral-50 hover:bg-neutral-100/60"
                      }`}
                    >
                      {images[1] ? (
                        <>
                          <Image
                            src={images[1].secure_url}
                            alt="Hover Reveal"
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-contain p-2"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg shadow-sm">
                              Change Photo
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-2">
                          {uploadingSlot === 1 ? (
                            <Loader2 className="w-8 h-8 animate-spin text-neutral-600 mx-auto" />
                          ) : (
                            <Upload className="w-8 h-8 text-neutral-400 group-hover:text-black mx-auto transition-colors" />
                          )}
                          <p className="text-xs font-bold text-neutral-700">Click to Upload Hover Image</p>
                          <p className="text-[10px] text-neutral-400">Side silhouette, back angle, or lifestyle shot</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div className="pt-2 border-t border-neutral-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block mb-1.5">
                    Or Add Image via Public CDN / Web URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={manualUrlInput}
                      onChange={(e) => setManualUrlInput(e.target.value)}
                      placeholder="https://example.com/dnora-bag.jpg"
                      className="flex-1 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualUrl}
                      className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                    >
                      Attach URL
                    </button>
                  </div>
                </div>

                {/* Extra Gallery Photos */}
                {images.length > 2 && (
                  <div className="pt-3 border-t border-neutral-100 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 block">
                      Additional Gallery Shots ({images.length - 2})
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {images.slice(2).map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-24 rounded-lg border border-neutral-200 overflow-hidden group bg-white"
                        >
                          <Image
                            src={img.secure_url}
                            alt="Gallery extra"
                            fill
                            className="object-contain p-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx + 2)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={triggerAddExtraImage}
                        className="w-20 h-24 rounded-lg border-2 border-dashed border-neutral-300 hover:border-black flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-black cursor-pointer transition"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Add</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Color Variants & Swatches */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
                      Visual Variations
                    </span>
                    <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
                      Color Swatches & Dedicated Gallery
                    </h2>
                    <p className="text-xs text-neutral-500 font-light">
                      Add colorway swatches. Each color swatch can have its own dedicated primary and angle imagery.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddColorVariant}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-black transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Color</span>
                  </button>
                </div>

                {colorVariants.length === 0 ? (
                  <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <Palette className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-neutral-700">No Color Variants Configured</p>
                    <p className="text-[11px] text-neutral-400 max-w-sm mx-auto mt-0.5">
                      If this silhouette is available in multiple Italian shades (e.g. Noir, Cognac, Olive), add them here.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddColorVariant}
                      className="mt-3 px-4 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-black cursor-pointer"
                    >
                      + Add First Color Variant
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {colorVariants.map((variant, vIdx) => (
                      <div
                        key={variant.id || vIdx}
                        className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full border border-neutral-300 shadow-xs shrink-0" style={{ backgroundColor: variant.color_hex }} />
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => handleUpdateVariant(vIdx, { name: e.target.value })}
                              placeholder="Color Name (Optional - leave blank for dot only)"
                              className="px-2.5 py-1 text-xs font-medium bg-white border border-neutral-300 rounded-lg text-neutral-900 w-64"
                            />
                            <input
                              type="color"
                              value={variant.color_hex}
                              onChange={(e) => handleUpdateVariant(vIdx, { color_hex: e.target.value })}
                              className="w-7 h-7 rounded border border-neutral-300 p-0.5 cursor-pointer bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(vIdx)}
                            className="text-neutral-400 hover:text-rose-600 transition cursor-pointer p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Variant Photos */}
                        <div className="flex items-center gap-3 pt-1">
                          {/* Main Variant Photo */}
                          <div
                            onClick={() => triggerVariantImageUpload(vIdx, "main")}
                            className="relative w-16 h-20 rounded-lg border-2 border-dashed border-neutral-300 hover:border-black bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
                          >
                            {variant.images && variant.images[0] ? (
                              <Image
                                src={variant.images[0].secure_url}
                                alt={variant.name || "Variant Main"}
                                fill
                                className="object-contain p-1"
                              />
                            ) : (
                              <div className="text-center p-1">
                                <Plus className="w-4 h-4 text-neutral-400 mx-auto" />
                                <span className="text-[9px] font-bold text-neutral-500">Main</span>
                              </div>
                            )}
                          </div>

                          {/* Hover Variant Photo */}
                          <div
                            onClick={() => triggerVariantImageUpload(vIdx, "hover")}
                            className="relative w-16 h-20 rounded-lg border-2 border-dashed border-neutral-300 hover:border-black bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
                          >
                            {variant.images && variant.images[1] ? (
                              <Image
                                src={variant.images[1].secure_url}
                                alt={`${variant.name || "Variant"} hover`}
                                fill
                                className="object-contain p-1"
                              />
                            ) : (
                              <div className="text-center p-1">
                                <Plus className="w-4 h-4 text-neutral-400 mx-auto" />
                                <span className="text-[9px] font-bold text-neutral-500">Angle</span>
                              </div>
                            )}
                          </div>

                          <p className="text-[11px] text-neutral-500 font-light">
                            Click boxes to upload color-specific photos.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: PRODUCT DETAILS & ACCORDION TABS */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-neutral-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89025]">
                    Step 4 of 4
                  </span>
                  <h2 className="text-lg font-bold text-neutral-950 font-serif mt-0.5">
                    Customizable Product Details & Accordion Tabs
                  </h2>
                  <p className="text-xs text-neutral-500 font-light">
                    Customize the tab titles, write details directly, and select whether to present content as crisp <strong>Bullet Points</strong> or clean <strong>Paragraph Text</strong>.
                  </p>
                </div>

                {/* TAB 1: CRAFTSMANSHIP & DETAILS */}
                <div className="p-5 rounded-2xl border-2 border-neutral-900/10 bg-neutral-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/70 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                        1
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                        Tab 1: Craftsmanship & Details
                      </span>
                    </div>

                    {/* Mode Toggle: Bullet Points vs Paragraph Text */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setCraftsmanshipMode("bullets")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          craftsmanshipMode === "bullets"
                            ? "bg-neutral-900 text-white shadow-xs"
                            : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>Bullet Points</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCraftsmanshipMode("text")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          craftsmanshipMode === "text"
                            ? "bg-neutral-900 text-white shadow-xs"
                            : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>Paragraph Text</span>
                      </button>
                    </div>
                  </div>

                  {/* Heading Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Tab Heading (Customizable Title)
                    </label>
                    <input
                      type="text"
                      value={craftsmanshipHeading}
                      onChange={(e) => setCraftsmanshipHeading(e.target.value)}
                      placeholder="Florentine Craftsmanship & Details"
                      className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-medium"
                    />
                  </div>

                  {/* Content Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center justify-between">
                      <span>Tab Content ({craftsmanshipMode === "bullets" ? "Each line becomes a bullet point" : "Formatted paragraph"})</span>
                      <span className="text-[11px] text-neutral-400 font-normal">
                        {craftsmanshipMode === "bullets" ? "1 bullet point per line" : "Free text"}
                      </span>
                    </label>
                    <textarea
                      rows={5}
                      value={craftsmanshipDetails}
                      onChange={(e) => setCraftsmanshipDetails(e.target.value)}
                      placeholder={
                        craftsmanshipMode === "bullets"
                          ? "Origin: Handcrafted in Florence, Italy\nMaterial: 100% Certified Italian Calfskin\nHardware: Palladium-finish reinforced alloy\nLining: Breathable natural suede interior"
                          : "Every DNORA piece is sculpted by master artisans in Florence using centuries-old Tuscan tanning discipline."
                      }
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-normal leading-relaxed"
                    />
                  </div>
                </div>

                {/* TAB 2: SHIPPING & WORLDWIDE CUSTOMS */}
                <div className="p-5 rounded-2xl border-2 border-neutral-900/10 bg-neutral-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/70 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                        2
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                        Tab 2: Shipping & Worldwide Customs
                      </span>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setShippingMode("bullets")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          shippingMode === "bullets"
                            ? "bg-neutral-900 text-white shadow-xs"
                            : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>Bullet Points</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingMode("text")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          shippingMode === "text"
                            ? "bg-neutral-900 text-white shadow-xs"
                            : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>Paragraph Text</span>
                      </button>
                    </div>
                  </div>

                  {/* Heading Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Tab Heading (Customizable Title)
                    </label>
                    <input
                      type="text"
                      value={shippingHeading}
                      onChange={(e) => setShippingHeading(e.target.value)}
                      placeholder="Shipping & Worldwide Customs"
                      className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-medium"
                    />
                  </div>

                  {/* Content Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center justify-between">
                      <span>Delivery & Dispatch Information</span>
                      <span className="text-[11px] text-neutral-400 font-normal">
                        {shippingMode === "bullets" ? "1 bullet point per line" : "Free text"}
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      value={shippingCustoms}
                      onChange={(e) => setShippingCustoms(e.target.value)}
                      placeholder="All DNORA creations are dispatched under white-glove, insured courier transit directly to your doorstep. Complimentary express delivery included across India."
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-normal leading-relaxed"
                    />
                  </div>
                </div>

                {/* TAB 3: LEATHER CARE */}
                <div className="p-5 rounded-2xl border-2 border-neutral-900/10 bg-neutral-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/70 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                        3
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                        Tab 3: Florentine Leather Care
                      </span>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setLeatherMode("bullets")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          leatherMode === "bullets"
                            ? "bg-neutral-900 text-white shadow-xs"
                            : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>Bullet Points</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeatherMode("text")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          leatherMode === "text"
                            ? "bg-neutral-900 text-white shadow-xs"
                            : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>Paragraph Text</span>
                      </button>
                    </div>
                  </div>

                  {/* Heading Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Tab Heading (Customizable Title)
                    </label>
                    <input
                      type="text"
                      value={leatherHeading}
                      onChange={(e) => setLeatherHeading(e.target.value)}
                      placeholder="Florentine Leather Care"
                      className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-medium"
                    />
                  </div>

                  {/* Content Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center justify-between">
                      <span>Leather Care Guide & Recommendations</span>
                      <span className="text-[11px] text-neutral-400 font-normal">
                        {leatherMode === "bullets" ? "1 bullet point per line" : "Free text"}
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      value={leatherCare}
                      onChange={(e) => setLeatherCare(e.target.value)}
                      placeholder="Vegetable-tanned leather develops an exquisite natural patina over time. To maintain its supple texture, avoid prolonged exposure to direct sunlight and high humidity. Clean with a soft, dry cotton cloth."
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 font-normal leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* FIXED BOTTOM NAVIGATION BAR (Amazon-Style Stepper Controls) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Previous Step Button */}
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              currentStep === 1
                ? "text-neutral-300 bg-neutral-100 cursor-not-allowed"
                : "text-neutral-800 bg-neutral-100 hover:bg-neutral-200"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          {/* Center Step Counter */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <span>Step {currentStep} of 4:</span>
            <span className="text-neutral-950 font-bold font-serif">
              {WIZARD_STEPS.find((s) => s.id === currentStep)?.label}
            </span>
          </div>

          {/* Next / Submit Button */}
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>Save & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-2.5 bg-[#B89025] hover:bg-[#9B771A] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
