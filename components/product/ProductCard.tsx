"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Check, Zap } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/lib/store/cart-store";
import { useWishlist } from "@/lib/store/wishlist-store";
import { getProductCardUrl } from "@/lib/cloudinary/transformations";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  showBuyNow?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  priority = false,
  showBuyNow = false,
  className,
}: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);

  const isFavorited = isInWishlist(product.id);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1, activeVariant || undefined);
    router.push("/checkout");
  };

  // Fallback chain for primary image
  const primaryImage =
    product.images?.[0]?.secure_url ||
    product.color_variants?.[0]?.images?.[0]?.secure_url ||
    "";

  // Active variant based on selected color variant index
  const activeVariant =
    selectedVariantIndex !== null && product.color_variants && product.color_variants[selectedVariantIndex]
      ? product.color_variants[selectedVariantIndex]
      : null;

  const currentDisplayImage =
    activeVariant?.images?.[0]?.secure_url || primaryImage;

  // Hover image logic: STRICTLY bound to active color variant or product images
  // NEVER fall back to a different color's image!
  let currentHoverImage = "";

  if (activeVariant) {
    // If user clicked or selected a specific color variant:
    if (activeVariant.hover_disabled) {
      currentHoverImage = ""; // Hover explicitly turned off
    } else if (activeVariant.hover_image_url) {
      currentHoverImage = activeVariant.hover_image_url;
    } else if (
      typeof activeVariant.hover_image_index === "number" &&
      activeVariant.images?.[activeVariant.hover_image_index]?.secure_url
    ) {
      currentHoverImage = activeVariant.images[activeVariant.hover_image_index].secure_url;
    } else if (activeVariant.images && activeVariant.images.length > 1 && activeVariant.images[1]?.secure_url) {
      currentHoverImage = activeVariant.images[1].secure_url;
    } else {
      // ONLY 1 IMAGE IN THIS COLOR VARIANT: NO HOVER IMAGE SWAP, ONLY SMOOTH ZOOM!
      currentHoverImage = "";
    }
  } else if (product.color_variants && product.color_variants.length > 0) {
    // Default color variant shown on storefront before any swatch is clicked:
    const defaultVar = product.color_variants.find((v) => v.is_default) || product.color_variants[0];
    if (defaultVar?.hover_disabled) {
      currentHoverImage = "";
    } else if (defaultVar?.hover_image_url) {
      currentHoverImage = defaultVar.hover_image_url;
    } else if (
      typeof defaultVar?.hover_image_index === "number" &&
      defaultVar.images?.[defaultVar.hover_image_index]?.secure_url
    ) {
      currentHoverImage = defaultVar.images[defaultVar.hover_image_index].secure_url;
    } else if (defaultVar?.images && defaultVar.images.length > 1 && defaultVar.images[1]?.secure_url) {
      currentHoverImage = defaultVar.images[1].secure_url;
    } else {
      // ONLY 1 IMAGE IN DEFAULT VARIANT: NO HOVER IMAGE SWAP, ONLY SMOOTH ZOOM!
      currentHoverImage = "";
    }
  } else {
    // Single product (no color variants)
    if (product.hover_disabled) {
      currentHoverImage = "";
    } else if (product.hover_image_url) {
      currentHoverImage = product.hover_image_url;
    } else if (product.images && product.images.length > 1 && product.images[1]?.secure_url) {
      currentHoverImage = product.images[1].secure_url;
    }
  }

  const optimizedDisplayImage = currentDisplayImage ? getProductCardUrl(currentDisplayImage) : "";
  const optimizedHoverImage = currentHoverImage ? getProductCardUrl(currentHoverImage) : "";

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1, activeVariant || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const hasHoverImage =
    Boolean(currentHoverImage) && currentHoverImage !== currentDisplayImage;

  // Active product link with selected color variant query param
  const productHref = React.useMemo(() => {
    if (activeVariant?.name) {
      return `/product/${product.slug}?color=${encodeURIComponent(activeVariant.name.toLowerCase().trim())}`;
    }
    return `/product/${product.slug}`;
  }, [product.slug, activeVariant]);

  return (
    <div className={cn("h-full w-full flex flex-col justify-between bg-white relative", className)}>
      {/* Product Image Frame with Smooth Rounded Edges — scoped with group/image so hover triggers ONLY on image */}
      <div className="group/image relative aspect-3/4 rounded-xl overflow-hidden bg-[#FAF8F5] border border-neutral-200/70 shrink-0">
        <Link href={productHref} className="block relative w-full h-full">
          {optimizedDisplayImage ? (
            <Image
              src={optimizedDisplayImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              className={`object-cover transition-all duration-500 group-hover/image:scale-105 ${
                hasHoverImage ? "group-hover/image:opacity-0" : ""
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <ShoppingBag className="w-10 h-10" />
            </div>
          )}

          {hasHoverImage && optimizedHoverImage && (
            <Image
              src={optimizedHoverImage}
              alt={`${product.name} alternate angle`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover absolute inset-0 opacity-0 transition-all duration-500 group-hover/image:opacity-100 group-hover/image:scale-105"
            />
          )}
        </Link>

        {/* Aesthetic Refined Luxury Discount Badge */}
        {discountPercent && discountPercent > 0 && (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 pointer-events-none">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-600/95 text-white flex flex-col items-center justify-center shadow-xs border border-white/30 select-none backdrop-blur-xs">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-tight leading-none">
                -{discountPercent}%
              </span>
              <span className="text-[6px] sm:text-[6.5px] font-semibold uppercase tracking-wider leading-none mt-0.5 opacity-90">
                OFF
              </span>
            </div>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs cursor-pointer ${isFavorited
              ? "bg-rose-50 text-rose-600"
              : "bg-white/90 text-neutral-700 hover:text-black hover:bg-white hover:scale-105 opacity-90 group-hover:opacity-100"
            }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* Quick Add To Bag Overlay (Desktop Hover Slide Up) */}
        <div className="hidden md:block absolute inset-x-2 bottom-2 z-10 transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full py-2.5 px-3 bg-black/95 text-white hover:bg-black text-[11px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer no-underline whitespace-nowrap select-none"
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="no-underline whitespace-nowrap">Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-white" />
                <span className="no-underline whitespace-nowrap">Add to Bag</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Details: Stretches to full height with button pinned to bottom */}
      <div className="flex-1 flex flex-col justify-between pt-2 sm:pt-3">
        {/* Info Top Block */}
        <div className="flex-1 flex flex-col space-y-1">
          {/* Color Variants: Fixed slot height (h-5) ensures product title starts at identical level */}
          <div className="h-5 flex items-center">
            {product.color_variants && product.color_variants.length > 0 ? (
              <div className="flex items-center gap-1.5 py-0.5 overflow-x-auto scrollbar-none w-full">
                {product.color_variants.map((variant, idx) => {
                  const hex = variant.color_hex || variant.hex || "#1A1A1A";
                  const isSelected = selectedVariantIndex === idx;
                  return (
                    <button
                      key={variant.id || idx}
                      type="button"
                      title={variant.name}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedVariantIndex(isSelected ? null : idx);
                      }}
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 relative cursor-pointer shrink-0 ${isSelected
                          ? "ring-2 ring-black ring-offset-1 scale-110 shadow-xs"
                          : "hover:scale-115 opacity-85 hover:opacity-100"
                        }`}
                      style={{
                        backgroundColor: hex,
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                      }}
                      aria-label={variant.name ? `Select color ${variant.name}` : `Select color`}
                    />
                  );
                })}
                {activeVariant?.name?.trim() ? (
                  <span className="text-[10px] text-neutral-500 font-medium pl-1 truncate">
                    {activeVariant.name}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <Link
            href={productHref}
            className="block text-xs sm:text-[13px] font-semibold tracking-wider uppercase text-neutral-900 hover:text-black line-clamp-1 transition-colors min-h-[18px]"
          >
            {product.name}
          </Link>

          <p className="text-[11px] text-neutral-500 line-clamp-1 font-light min-h-[16px]">
            {product.short_description || "\u00A0"}
          </p>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs sm:text-sm font-bold text-neutral-950">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-[10px] sm:text-[11px] text-neutral-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Pinned to bottom using mt-auto */}
        <div className="mt-auto pt-2.5">
          {showBuyNow ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-2 px-2 rounded-lg border border-neutral-300 hover:border-black bg-white text-neutral-900 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs no-underline whitespace-nowrap select-none"
              >
                {added ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="no-underline">Added</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="no-underline">Add to Bag</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-2 px-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs no-underline whitespace-nowrap select-none"
              >
                <span className="no-underline">Buy Now</span>
              </button>
            </div>
          ) : (
            /* Mobile Quick Add Button */
            <button
              type="button"
              onClick={handleAddToCart}
              className="md:hidden w-full py-1.5 sm:py-2 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-1.5 active:bg-black cursor-pointer shadow-xs no-underline whitespace-nowrap select-none"
            >
              {added ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="no-underline">Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3 h-3" />
                  <span className="no-underline">Add to Bag</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
