"use client";

import React, { createContext, useContext, useSyncExternalStore, ReactNode } from "react";
import { Product } from "@/types";

interface WishlistContextType {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "dnora_wishlist_items_v1";

let memoryWishlist: Product[] = [];
let initialized = false;
const listeners = new Set<() => void>();

function getWishlistSnapshot(): Product[] {
  if (!initialized && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        memoryWishlist = JSON.parse(stored);
      }
    } catch {
      // Ignore localStorage read errors
    }
    initialized = true;
  }
  return memoryWishlist;
}

const emptySnapshot: Product[] = [];
function getServerSnapshot(): Product[] {
  return emptySnapshot;
}

function subscribeWishlist(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function persistWishlist(items: Product[]) {
  memoryWishlist = items;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }
  listeners.forEach((listener) => listener());
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribeWishlist, getWishlistSnapshot, getServerSnapshot);

  const addItem = (product: Product) => {
    if (items.some((i) => i.id === product.id)) return;
    persistWishlist([product, ...items]);
  };

  const removeItem = (productId: string) => {
    persistWishlist(items.filter((i) => i.id !== productId));
  };

  const toggleWishlist = (product: Product) => {
    if (items.some((i) => i.id === product.id)) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((i) => i.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        toggleWishlist,
        isInWishlist,
        itemCount: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    // Graceful fallback for components outside provider
    return {
      items: memoryWishlist,
      addItem: () => {},
      removeItem: () => {},
      toggleWishlist: () => {},
      isInWishlist: () => false,
      itemCount: memoryWishlist.length,
    };
  }
  return context;
}
