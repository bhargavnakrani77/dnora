"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  ArrowRight,
  Trash2,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useWishlist } from "@/lib/store/wishlist-store";
import { useCart } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";

export default function WishlistPage() {
  const router = useRouter();
  const { items, removeItem } = useWishlist();
  const { addItem: addToCart, openCart } = useCart();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(product, 1);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    openCart();

    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleInstantBuy = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(product, 1);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-neutral-900 pb-28">
      {/* Top Breadcrumbs */}
      <div className="bg-[#FAF8F5] border-b border-neutral-200/70 py-3.5">
        <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <Link href="/shop" className="hover:text-black transition-colors">
              Boutique
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-900 font-semibold tracking-wide">
              Wishlist
            </span>
          </nav>
        </div>
      </div>

      {/* Editorial Header Section */}
      <section className="bg-white border-b border-neutral-200/80 pt-10 pb-10 sm:pt-14 sm:pb-12">
        <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold uppercase tracking-wider">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                <span>Private Atelier Curation</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-950 font-serif uppercase">
                My Wishlist
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 font-light max-w-2xl leading-relaxed">
                Your private collection of handcrafted Italian calfskin silhouettes. Saved for your next order or signature seasonal gifting.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Wishlist Content */}
      <section className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 sm:pt-12">
        {items.length === 0 ? (
          /* Empty State */
          <div className="max-w-xl mx-auto text-center py-20 px-6 bg-white rounded-2xl border border-neutral-200/80 shadow-xs space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
              <Heart className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-neutral-900 font-serif">
                Your Wishlist is Empty
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed max-w-md mx-auto">
                Explore our curated atelier drops and timeless silhouettes. Click the heart icon on any piece to save it to your private wishlist.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer"
              >
                <span>Explore Full Boutique</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/bestseller"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-300 hover:border-black text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                <span>View Best Sellers</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => {
              const primaryImg = product.images?.[0]?.secure_url || "/images/placeholder.jpg";
              const hoverImg = product.images?.[1]?.secure_url;
              const hasDiscount =
                product.compare_at_price && product.compare_at_price > product.price;
              const discountPercent = hasDiscount
                ? Math.round(
                    ((product.compare_at_price! - product.price) / product.compare_at_price!) * 100
                  )
                : null;
              const isAdded = addedIds[product.id];

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Top Image Frame */}
                  <div className="relative aspect-[4/5] bg-neutral-50 overflow-hidden">
                    <Link href={`/product/${product.slug || product.id}`} className="block w-full h-full">
                      <Image
                        src={primaryImg}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className={`object-contain p-4 transition-all duration-500 ease-out group-hover:scale-104 ${
                          hoverImg ? "group-hover:opacity-0" : ""
                        }`}
                      />
                      {hoverImg && (
                        <Image
                          src={hoverImg}
                          alt={`${product.name} hover view`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-contain p-4 absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out group-hover:scale-104"
                        />
                      )}
                    </Link>

                    {/* Discount Pill */}
                    {discountPercent && (
                      <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                        -{discountPercent}% OFF
                      </div>
                    )}

                    {/* Remove from Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      title="Remove from wishlist"
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-neutral-500 hover:text-rose-600 hover:bg-white shadow-xs flex items-center justify-center transition-all cursor-pointer border border-neutral-200/60"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#B89025]">
                        {product.category_name || "Italian Leather"}
                      </p>
                      <Link
                        href={`/product/${product.slug || product.id}`}
                        className="block text-sm font-bold text-neutral-900 font-serif line-clamp-1 hover:text-[#B89025] transition-colors"
                      >
                        {product.name}
                      </Link>

                      {/* Pricing */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-base font-bold font-mono text-neutral-950">
                          {formatPrice(product.price)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-xs text-neutral-400 line-through font-mono">
                            {formatPrice(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      {/* Add to Bag Button */}
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(product, e)}
                        className="w-full py-2.5 px-4 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Added to Bag</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Bag</span>
                          </>
                        )}
                      </button>

                      {/* Instant Checkout Button */}
                      <button
                        type="button"
                        onClick={(e) => handleInstantBuy(product, e)}
                        className="w-full py-2 px-4 border border-neutral-300 hover:border-black text-neutral-900 text-xs font-semibold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Instant Buy</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
