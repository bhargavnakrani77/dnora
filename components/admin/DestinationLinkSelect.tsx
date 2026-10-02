"use client";

import React, { useState, useEffect } from "react";
import { Link2, Layers, ShoppingBag, Globe, Sparkles, ExternalLink } from "lucide-react";

interface DestinationLinkSelectProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  id?: string;
}

const STATIC_DESTINATIONS = [
  { group: "Core Pages", items: [
    { label: "Home Page (/)", url: "/" },
    { label: "All Collections (/shop)", url: "/shop" },
    { label: "New Arrivals (/new-in)", url: "/new-in" },
    { label: "Best Sellers (/best-sellers)", url: "/best-sellers" },
    { label: "Trending Now Lookbook (/trending-now)", url: "/trending-now" },
  ]},
  { group: "Maison & Client Services", items: [
    { label: "About DNORA (/about)", url: "/about" },
    { label: "Leather Care Guide (/care)", url: "/care" },
    { label: "Authenticity Guarantee (/authenticity)", url: "/authenticity" },
    { label: "Shipping Policy (/shipping)", url: "/shipping" },
    { label: "Returns & Exchanges (/returns)", url: "/returns" },
    { label: "Frequently Asked Questions (/faq)", url: "/faq" },
    { label: "Member Portal / Account (/account)", url: "/account" },
  ]},
];

export function DestinationLinkSelect({
  value,
  onChange,
  label = "Target Link / URL",
  placeholder = "/shop or /category/tote-bags",
  helperText,
  id = "destination-link-select",
}: DestinationLinkSelectProps) {
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [mode, setMode] = useState<"preset" | "custom">("preset");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories").catch(() => null),
          fetch("/api/products?status=active").catch(() => null),
        ]);

        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          if (isMounted && catData.data && Array.isArray(catData.data)) {
            setCategories(catData.data);
          }
        }

        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json();
          if (isMounted) {
            const list = Array.isArray(prodData) ? prodData : (prodData.products || prodData.data || []);
            if (Array.isArray(list)) {
              setProducts(list.map((p: { id: string; name: string; slug: string }) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
              })));
            }
          }
        }
      } catch {
        // non-blocking
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__custom__") {
      setMode("custom");
    } else {
      onChange(selected);
    }
  };

  // Check if current value matches one of known presets
  const knownUrls = new Set<string>();
  STATIC_DESTINATIONS.forEach((g) => g.items.forEach((i) => knownUrls.add(i.url)));
  categories.forEach((c) => knownUrls.add(`/category/${c.slug}`));
  products.forEach((p) => knownUrls.add(`/product/${p.slug}`));

  const isMatchedInDropdown = Boolean(value && knownUrls.has(value));

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-neutral-700">
          {label}
        </label>
      )}

      <div className="space-y-1.5">
        {/* Dropdown Selection */}
        <div className="relative">
          <select
            id={id}
            value={isMatchedInDropdown ? value : "__custom__"}
            onChange={handleSelectChange}
            className="w-full pl-3 pr-8 py-2 text-xs border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:outline-none focus:border-black appearance-none cursor-pointer"
          >
            <option value="" disabled>-- Select Active Page or Destination --</option>
            {STATIC_DESTINATIONS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.items.map((item) => (
                  <option key={item.url} value={item.url}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}

            {categories.length > 0 && (
              <optgroup label="Live Categories / Collections">
                {categories.map((c) => (
                  <option key={c.id} value={`/category/${c.slug}`}>
                    Category: {c.name} (/category/{c.slug})
                  </option>
                ))}
              </optgroup>
            )}

            {products.length > 0 && (
              <optgroup label="Live Products (Silhouettes)">
                {products.map((p) => (
                  <option key={p.id} value={`/product/${p.slug}`}>
                    Product: {p.name} (/product/{p.slug})
                  </option>
                ))}
              </optgroup>
            )}

            <option value="__custom__">Custom URL / Manual Path...</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-neutral-500">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        {/* Live URL Input / Display */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
              <Link2 className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:outline-none focus:border-black text-neutral-800"
            />
          </div>
          {value && (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              title="Test destination link"
              className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md border border-neutral-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {helperText ? (
        <p className="text-[10px] text-neutral-400">{helperText}</p>
      ) : (
        <p className="text-[10px] text-neutral-400">
          Pick any active page, category, or product from the dropdown or customize the URL above.
        </p>
      )}
    </div>
  );
}
