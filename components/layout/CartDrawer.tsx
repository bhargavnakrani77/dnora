"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    itemCount,
    subtotal,
    freeShippingProgress,
    amountToFreeShipping,
  } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    closeCart();
    try {
      const res = await fetch("/api/user/session");
      const data = await res.json();
      if (!data.authenticated) {
        router.push("/login?redirect=/checkout");
      } else {
        router.push("/checkout");
      }
    } catch {
      router.push("/login?redirect=/checkout");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-neutral-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 bg-white">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-neutral-900" />
              <h2 className="text-sm font-semibold text-neutral-900 tracking-[0.16em] uppercase">
                Shopping Bag ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              aria-label="Close cart"
              className="p-1.5 rounded-md text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="bg-[#f4f4f5] px-6 py-3.5 border-b border-neutral-200">
            {amountToFreeShipping === 0 ? (
              <p className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Complimentary White-Glove Express Shipping Unlocked</span>
              </p>
            ) : (
              <div>
                <p className="text-xs font-medium text-neutral-700">
                  Add <span className="font-bold text-neutral-950">{formatPrice(amountToFreeShipping)}</span> more for Complimentary Shipping
                </p>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-neutral-900 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 uppercase tracking-[0.1em] mb-2">
                  Your bag is empty
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto mb-6 leading-relaxed">
                  Explore our architectural silhouettes and handcrafted Tuscan leather pieces.
                </p>
                <button
                  onClick={closeCart}
                  className="inline-flex items-center justify-center px-6 py-3 bg-neutral-900 text-white text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-black transition-all cursor-pointer rounded-xs"
                >
                  Discover Collections
                </button>
              </div>
            ) : (
              items.map(({ product, quantity, selectedVariant }) => {
                const imageUrl = product.images?.[0]?.secure_url || "";
                return (
                  <div key={product.id} className="flex gap-4 pb-6 border-b border-neutral-100 last:border-0">
                    <div className="relative w-20 h-24 bg-neutral-100 rounded-xs overflow-hidden shrink-0 border border-neutral-200">
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={closeCart}
                            className="text-xs font-semibold text-neutral-900 hover:underline leading-snug tracking-wide uppercase"
                          >
                            {product.name}
                          </Link>
                          <button
                            onClick={() => removeItem(product.id)}
                            className="text-neutral-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {selectedVariant && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-500">
                            {typeof selectedVariant === "object" && selectedVariant.color_hex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                                style={{ backgroundColor: selectedVariant.color_hex }}
                              />
                            )}
                            {(typeof selectedVariant === "string" ? selectedVariant : selectedVariant.name)?.trim() ? (
                              <span>{typeof selectedVariant === "string" ? selectedVariant : selectedVariant.name}</span>
                            ) : null}
                          </div>
                        )}
                        <p className="text-[11px] text-neutral-400 mt-0.5">{product.sku}</p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-neutral-200 bg-white rounded-xs">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="p-1 text-neutral-500 hover:text-black cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-neutral-900">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="p-1 text-neutral-500 hover:text-black cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-neutral-900 tracking-wider">
                          {formatPrice(product.price * quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer / Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-neutral-200 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Subtotal</span>
                <span className="font-semibold text-neutral-950 text-base tracking-wider">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Taxes, customs & complimentary express shipping calculated during checkout.
              </p>
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all rounded-xs cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartDrawer;
