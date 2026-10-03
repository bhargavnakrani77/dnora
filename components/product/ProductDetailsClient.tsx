"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Truck,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  Star,
} from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/store/cart-store";
import { useWishlist } from "@/lib/store/wishlist-store";
import { ProductCard } from "@/components/ProductCard";

interface ProductDetailsClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailsClient({ product, relatedProducts }: ProductDetailsClientProps) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // State
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(
    product.color_variants && product.color_variants.length > 0 ? 0 : null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string>("details");

  const isFavorited = isInWishlist(product.id);

  // Active color variant
  const activeVariant =
    selectedColorIndex !== null && product.color_variants && product.color_variants[selectedColorIndex]
      ? product.color_variants[selectedColorIndex]
      : null;

  // Combine variant images and all base product images (main + hover + extra) so no images are ever lost
  const displayImages = React.useMemo(() => {
    const list: typeof product.images = [];
    const seen = new Set<string>();

    const addImg = (img?: { id?: string; secure_url?: string; alt_text?: string; sort_order?: number; cloudinary_public_id?: string }) => {
      if (img?.secure_url && !seen.has(img.secure_url)) {
        seen.add(img.secure_url);
        list.push({
          id: img.id || `img-${seen.size}`,
          secure_url: img.secure_url,
          cloudinary_public_id: img.cloudinary_public_id || "",
          alt_text: img.alt_text || product.name,
          sort_order: img.sort_order || list.length,
        });
      }
    };

    // If active variant has images, add them first
    if (activeVariant?.images && activeVariant.images.length > 0) {
      activeVariant.images.forEach(addImg);
    }
    // Add all base product images (index 0 is main, index 1 is hover, extra images follow)
    if (product.images && product.images.length > 0) {
      product.images.forEach(addImg);
    }

    if (list.length === 0) {
      list.push({
        id: "fallback",
        secure_url: "/images/placeholder.jpg",
        alt_text: product.name,
        sort_order: 0,
        cloudinary_public_id: "",
      });
    }

    return list;
  }, [activeVariant, product.images, product.name]);

  const currentImage = displayImages[activeImageIndex] || displayImages[0];
  const hoverImage = displayImages[1]?.secure_url || currentImage.secure_url;

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : null;

  // Handlers
  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(product, quantity, activeVariant || undefined);
    setTimeout(() => {
      setIsAdding(false);
      openCart();
    }, 400);
  };

  const handleBuyNow = () => {
    addItem(product, quantity, activeVariant || undefined);
    router.push("/checkout");
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? "" : id));
  };

  return (
    <div className="w-full bg-white text-neutral-900 pb-20">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-neutral-100 bg-[#FAF9F6]">
        <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3.5 flex items-center gap-2 text-[11px] text-neutral-500 font-light overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
          <Link href="/shop" className="hover:text-black transition-colors">
            Shop
          </Link>
          {product.category_name && (
            <>
              <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
              <Link
                href={`/category/${product.category_slug || "handbags"}`}
                className="hover:text-black transition-colors"
              >
                {product.category_name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
          <span className="text-neutral-900 font-medium truncate">{product.name}</span>
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* LEFT: Image Gallery (7 Cols on LG) - Main Image with Horizontal Thumbnails Below */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Main Stage Image Frame */}
            <div className="group/stage relative w-full aspect-[4/5] sm:aspect-[4/5] max-h-[620px] rounded-2xl overflow-hidden bg-white border border-neutral-200/80 shadow-xs flex items-center justify-center">
              <Image
                src={currentImage.secure_url}
                alt={currentImage.alt_text || product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-contain p-3 sm:p-5 transition-all duration-300"
              />

              {/* Previous / Next Arrow Controls on Main Image */}
              {displayImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 shadow-md text-neutral-800 hover:text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-neutral-200/70"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 shadow-md text-neutral-800 hover:text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-neutral-200/70"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Luxury Discount Pill */}
              {discountPercent && discountPercent > 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="px-2.5 py-1 rounded-full bg-rose-600/95 text-white flex items-center gap-1 shadow-sm border border-white/20 select-none backdrop-blur-xs">
                    <span className="text-xs font-bold tracking-tight">-{discountPercent}%</span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider">OFF</span>
                  </div>
                </div>
              )}

              {/* Wishlist Button on Image */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                className={`absolute top-4 right-4 z-10 p-2.5 rounded-full backdrop-blur-md shadow-xs transition-transform active:scale-90 cursor-pointer ${
                  isFavorited
                    ? "bg-rose-50 text-rose-600"
                    : "bg-white/80 text-neutral-700 hover:bg-white hover:text-black"
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Horizontal Thumbnail Strip directly below the main image (exact Lino Perros layout) */}
            {displayImages.length > 1 && (
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-2 px-1 scrollbar-none">
                {displayImages.map((img, idx) => (
                  <button
                    key={`${img.id || idx}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-16 sm:w-16 sm:h-20 rounded-md overflow-hidden transition-all shrink-0 bg-white cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-2 border-black ring-1 ring-black shadow-xs scale-102"
                        : "border border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img.secure_url}
                      alt={img.alt_text || `${product.name} thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Information & Purchase Controls (5 Cols on LG) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
            {/* Header Titles */}
            <div className="space-y-2.5 border-b border-neutral-100 pb-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                <span>Handcrafted Luxury</span>
                <span>•</span>
                <span className="font-mono text-neutral-400">{product.sku}</span>
              </div>

              {/* Product Title in Bold Uppercase like screenshot */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 leading-tight">
                {product.name}
              </h1>

              {/* Highlight Pill / Tag (Matching screenshot: A Fashion-Forward Tote Bag for Every Moment) */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>A Fashion-Forward Luxury Silhouette for Every Moment</span>
              </div>

              {/* Star Rating & Reviews (Matching screenshot: 4.7 | 19 Reviews) */}
              <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium pt-1">
                <div className="flex items-center text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 mr-1" />
                  <span className="font-bold text-neutral-900">4.8</span>
                </div>
                <span className="text-neutral-300">|</span>
                <span className="text-neutral-500 underline underline-offset-2">24 Verified Reviews</span>
              </div>

              {/* Price & Savings (Matching screenshot: Current Price + MRP + Saved % + Incl of all taxes) */}
              <div className="space-y-1 pt-2">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 font-mono tracking-tight">
                    {formatPrice(product.price)}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <>
                      <span className="text-sm text-neutral-400 font-mono line-through">
                        MRP: {formatPrice(product.compare_at_price)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide">
                        Saved {discountPercent}%
                      </span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-neutral-500 font-light">
                  Inclusive of all taxes & luxury packaging
                </div>
              </div>
            </div>

            {/* Color Variant Selector */}
            {product.color_variants && product.color_variants.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-neutral-900">
                    Color{activeVariant?.name?.trim() ? `: ` : ""}
                    {activeVariant?.name?.trim() ? (
                      <strong className="font-medium text-neutral-600">
                        {activeVariant.name}
                      </strong>
                    ) : null}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {product.color_variants.length} available
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {product.color_variants.map((variant, idx) => {
                    const isSelected = selectedColorIndex === idx;
                    const hasName = Boolean(variant.name && variant.name.trim().length > 0);
                    return (
                      <button
                        key={`${variant.name || variant.color_hex || idx}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedColorIndex(idx);
                          setActiveImageIndex(0);
                        }}
                        title={variant.name || `Color option ${idx + 1}`}
                        aria-label={variant.name ? `Select color ${variant.name}` : `Select color option ${idx + 1}`}
                        className={
                          hasName
                            ? `group relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? "border-neutral-950 bg-neutral-950 text-white font-medium shadow-xs"
                                  : "border-neutral-200 hover:border-neutral-400 bg-white text-neutral-800"
                              }`
                            : `group relative p-1 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? "border-neutral-950 ring-2 ring-neutral-950 ring-offset-2 scale-105"
                                  : "border-neutral-300 hover:border-neutral-500 hover:scale-105"
                              }`
                        }
                      >
                        {variant.color_hex && (
                          <span
                            className={`${hasName ? "w-3.5 h-3.5" : "w-6 h-6 sm:w-7 sm:h-7"} rounded-full border border-black/15 shrink-0 shadow-inner`}
                            style={{ backgroundColor: variant.color_hex }}
                          />
                        )}
                        {hasName && <span>{variant.name}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-neutral-300 rounded-lg p-1 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-semibold text-neutral-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-2 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 py-3.5 px-6 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-75 no-underline whitespace-nowrap select-none"
                >
                  {isAdding ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="no-underline whitespace-nowrap">Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span className="no-underline whitespace-nowrap">Add to Bag</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instant Buy Now Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full py-3.5 px-6 border-2 border-neutral-950 text-neutral-950 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-950 hover:text-white transition-all rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <span>Instant Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Artisan Value Propositions */}
            <div className="p-4 bg-[#FAF9F6] rounded-xl border border-neutral-200/70 space-y-2.5 text-xs text-neutral-700 font-light">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>Certified 100% Italian Vegetable-Tanned Leather</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>Complimentary Express Delivery & Signature Dispatch</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>14-Day Complimentary Atelier Returns & Size Exchanges</span>
              </div>
            </div>

            {/* Accordion Tabs */}
            <div className="border-t border-neutral-200 divide-y divide-neutral-200 pt-2">
              {/* Tab 1: Craftsmanship & Details */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion("details")}
                  className="w-full py-3.5 flex items-center justify-between text-left cursor-pointer group"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-900 group-hover:text-neutral-600 transition-colors">
                    {product.craftsmanship_heading || "Florentine Craftsmanship & Details"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                      openAccordion === "details" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordion === "details" && (
                  <div className="pb-4 text-xs text-neutral-600 leading-relaxed font-light space-y-2">
                    {product.craftsmanship_details ? (
                      product.craftsmanship_mode === "text" ? (
                        <div className="whitespace-pre-line leading-relaxed font-light text-neutral-700 text-xs">
                          {product.craftsmanship_details}
                        </div>
                      ) : (
                        <ul className="space-y-1.5 text-[11.5px] text-neutral-700 pt-1">
                          {product.craftsmanship_details
                            .split("\n")
                            .map((l) => l.trim())
                            .filter((l) => l.length > 0)
                            .map((line, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                                <span>{line.replace(/^[•\-\*]\s*/, "")}</span>
                              </li>
                            ))}
                        </ul>
                      )
                    ) : (
                      <ul className="space-y-1.5 text-[11.5px] text-neutral-700 pt-1">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                          <span>Origin: Handcrafted in Florence, Italy</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                          <span>Material: 100% Certified Italian Calfskin</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                          <span>Hardware: Palladium-finish reinforced architectural alloy</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                          <span>Lining: Breathable natural suede interior</span>
                        </li>
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Tab 2: Shipping & Customs */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion("delivery")}
                  className="w-full py-3.5 flex items-center justify-between text-left cursor-pointer group"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-900 group-hover:text-neutral-600 transition-colors">
                    {product.shipping_heading || "Shipping & Worldwide Customs"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                      openAccordion === "delivery" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordion === "delivery" && (
                  <div className="pb-4 text-xs text-neutral-600 leading-relaxed font-light space-y-2">
                    {product.shipping_customs ? (
                      product.shipping_mode === "bullets" ? (
                        <ul className="space-y-1.5 text-[11.5px] text-neutral-700 pt-1">
                          {product.shipping_customs
                            .split("\n")
                            .map((l) => l.trim())
                            .filter((l) => l.length > 0)
                            .map((line, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                                <span>{line.replace(/^[•\-\*]\s*/, "")}</span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <div className="whitespace-pre-line leading-relaxed font-light text-neutral-700 text-xs">
                          {product.shipping_customs}
                        </div>
                      )
                    ) : (
                      <>
                        <p>
                          All DNORA creations are dispatched under white-glove, insured courier transit directly to your doorstep. Complimentary express delivery is included across India.
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          Standard delivery: 3 – 5 business days. Signature required upon receipt.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Tab 3: Leather Care */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion("care")}
                  className="w-full py-3.5 flex items-center justify-between text-left cursor-pointer group"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-900 group-hover:text-neutral-600 transition-colors">
                    {product.leather_heading || "Florentine Leather Care"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                      openAccordion === "care" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordion === "care" && (
                  <div className="pb-4 text-xs text-neutral-600 leading-relaxed font-light space-y-2">
                    {product.leather_care ? (
                      product.leather_mode === "bullets" ? (
                        <ul className="space-y-1.5 text-[11.5px] text-neutral-700 pt-1">
                          {product.leather_care
                            .split("\n")
                            .map((l) => l.trim())
                            .filter((l) => l.length > 0)
                            .map((line, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                                <span>{line.replace(/^[•\-\*]\s*/, "")}</span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <div className="whitespace-pre-line leading-relaxed font-light text-neutral-700 text-xs">
                          {product.leather_care}
                        </div>
                      )
                    ) : (
                      <p>
                        Vegetable-tanned leather develops an exquisite natural patina over time. To maintain its supple texture, avoid prolonged exposure to direct sunlight and high humidity. Clean with a soft, dry cotton cloth.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* You May Also Covet / Related Silhouettes Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif text-neutral-950 font-normal">
                  You May Also Covet
                </h3>
                <p className="text-xs text-neutral-500 font-light mt-0.5">
                  Complementary artisanal silhouettes sculpted for modern elegance.
                </p>
              </div>
              <Link
                href="/shop"
                className="text-xs font-semibold tracking-wider uppercase text-neutral-900 hover:text-neutral-600 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.slice(0, 4).map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ProductDetailsClient;
