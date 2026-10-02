"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

interface TopBarSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Product[];
  isSearching: boolean;
  suggestions: string[];
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function TopBarSearchModal({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  suggestions,
  searchInputRef,
}: TopBarSearchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-white border-b border-neutral-200 shadow-2xl z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          {/* Header with Close */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-bold text-neutral-400">
              MAISON SEARCH
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="mt-6 relative">
            <div className="flex items-center border-b-2 border-neutral-900 pb-3">
              <Search className="w-6 h-6 text-neutral-900 shrink-0 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="WHAT ARE YOU SEARCHING FOR?"
                className="w-full text-base sm:text-xl font-medium tracking-wider uppercase placeholder:text-neutral-300 text-neutral-950 focus:outline-hidden bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-neutral-400 hover:text-black p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Suggestions Tags */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-neutral-400 mr-2">
              SUGGESTIONS:
            </span>
            {suggestions.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="text-[11px] tracking-wider uppercase font-medium px-3 py-1 bg-neutral-100 hover:bg-neutral-900 hover:text-white transition-colors rounded-full cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Live Search Results */}
          <div className="mt-8">
            {isSearching ? (
              <div className="py-12 text-center text-xs text-neutral-400 tracking-widest uppercase">
                Searching collections...
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <h5 className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-4">
                  SEARCH RESULTS ({searchResults.length})
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {searchResults.map((product) => {
                    const img = product.images?.[0]?.secure_url || "";
                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        onClick={onClose}
                        className="group block space-y-2"
                      >
                        <div className="relative aspect-3/4 bg-neutral-100 rounded-xs overflow-hidden border border-neutral-200">
                          {img && (
                            <Image
                              src={img}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="160px"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-900 uppercase tracking-wider truncate group-hover:underline">
                            {product.name}
                          </p>
                          <p className="text-xs font-bold text-neutral-900 mt-0.5">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : searchQuery ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No silhouettes found matching &quot;{searchQuery}&quot;. Try another term.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
