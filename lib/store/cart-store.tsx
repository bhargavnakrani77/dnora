"use client";

import React, { createContext, useContext, useState, useSyncExternalStore, ReactNode } from "react";
import { CartItem, Product } from "@/types";

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (
    product: Product,
    quantity?: number,
    selectedColorOrVariant?: string | CartItem["selectedVariant"]
  ) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;
  amountToFreeShipping: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 250; // $250 luxury threshold
const CART_STORAGE_KEY = "dnora_cart_items_v1";

let memoryCart: CartItem[] = [];
let initialized = false;
const listeners = new Set<() => void>();

function getCartSnapshot(): CartItem[] {
  if (!initialized && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        memoryCart = JSON.parse(stored);
      }
    } catch {
      // Ignore localStorage errors
    }
    initialized = true;
  }
  return memoryCart;
}

const emptySnapshot: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return emptySnapshot;
}

function subscribeCart(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setCartItems(newItems: CartItem[]) {
  memoryCart = newItems;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch {
      // Ignore quota errors
    }
  }
  listeners.forEach((listener) => listener());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addItem = (
    product: Product,
    quantity: number = 1,
    selectedColorOrVariant?: string | CartItem["selectedVariant"]
  ) => {
    const variantObj = typeof selectedColorOrVariant === "object" ? selectedColorOrVariant : undefined;
    const colorStr = typeof selectedColorOrVariant === "string" ? selectedColorOrVariant : variantObj?.name;

    const existingIndex = items.findIndex(
      (item) =>
        item.product.id === product.id &&
        (item.selectedVariant?.name === variantObj?.name || item.selectedColor === colorStr)
    );
    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      };
    } else {
      updated = [
        ...items,
        {
          product,
          quantity,
          selectedColor: colorStr,
          selectedVariant: variantObj,
        },
      ];
    }
    setCartItems(updated);
    setIsOpen(true);
  };

  const removeItem = (productId: string) => {
    setCartItems(items.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setCartItems(
      items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingProgress,
        amountToFreeShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
