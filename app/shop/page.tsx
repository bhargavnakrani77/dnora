import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { store } from "@/lib/data/store";
import { formatPrice } from "@/lib/utils";
import { ChevronRight, ArrowLeft, Sparkles, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Collections | DNORA Luxury Leather Goods",
  description: "Explore the complete collection of luxury handbags, totes, and leather goods handcrafted in Italy by DNORA.",
};

interface ShopPageProps {
  searchParams: Promise<{
    sort?: string;
    category?: string;
    collection?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { sort, category } = await searchParams;

  const allCategories = await store.getCategories();
  const products = await store.getProducts({
    category_slug: category,
    status: "active",
  });

  if (sort === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === "newest") {
    products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-24">
      {/* Editorial Header Banner */}
      <section className="relative w-full bg-[#FAF8F5] border-b border-neutral-200/80 pt-10 pb-12 sm:pt-14 sm:pb-16 md:pt-18 md:pb-20">
        <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          
          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500 mb-6">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            <span className="text-neutral-900 font-semibold tracking-wide">
              All Collections
            </span>
          </nav>

          {/* Title & Editorial Narrative */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>Full Maison Catalog</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-normal tracking-[0.16em] uppercase text-neutral-950">
              All Handbags & Leather Goods
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-neutral-600 font-light leading-relaxed max-w-2xl">
              Sculptural geometry meets enduring Italian artistry. Explore our complete repertoire of handcrafted totes, crossbodies, and iconic top handles.
            </p>
          </div>

          {/* Quick Silhouette Filter Badges */}
          {allCategories.length > 0 && (
            <div className="mt-8 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 pt-2">
              <Link
                href="/shop"
                className={`text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider font-medium transition-all shrink-0 ${
                  !category
                    ? "bg-black text-white shadow-xs"
                    : "bg-white text-neutral-700 border border-neutral-200/80 hover:border-black hover:text-black"
                }`}
              >
                All Silhouettes
              </Link>
              {allCategories.map((c) => {
                const isActive = c.slug === category;
                return (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    className={`text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider font-medium transition-all shrink-0 ${
                      isActive
                        ? "bg-black text-white shadow-xs"
                        : "bg-white text-neutral-700 border border-neutral-200/80 hover:border-black hover:text-black"
                    }`}
                  >
                    {c.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Main Grid */}
      <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-8 sm:mt-10">
        
        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
          <p className="text-xs font-medium tracking-widest uppercase text-neutral-500">
            Showing <span className="font-bold text-neutral-900">{products.length}</span> Silhouettes
          </p>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Sort By:</span>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Link
                href="/shop"
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  !sort ? "bg-black text-white font-bold" : "text-neutral-600 hover:text-black bg-neutral-100"
                }`}
              >
                Featured
              </Link>
              <Link
                href="/shop?sort=newest"
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sort === "newest" ? "bg-black text-white font-bold" : "text-neutral-600 hover:text-black bg-neutral-100"
                }`}
              >
                New In
              </Link>
              <Link
                href="/shop?sort=price-asc"
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sort === "price-asc" ? "bg-black text-white font-bold" : "text-neutral-600 hover:text-black bg-neutral-100"
                }`}
              >
                Price: Low to High
              </Link>
              <Link
                href="/shop?sort=price-desc"
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sort === "price-desc" ? "bg-black text-white font-bold" : "text-neutral-600 hover:text-black bg-neutral-100"
                }`}
              >
                Price: High to Low
              </Link>
            </div>
          </div>
        </div>

        {/* Product Grid: 2 on mobile, 4 on big screen */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {products.map((product, idx) => (
            <div key={product.id} className="flex flex-col justify-between">
              <ProductCard product={product} priority={idx < 4} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
