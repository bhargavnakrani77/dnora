import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Sparkles, ChevronRight, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { store } from "@/lib/data/store";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const pageConfig = await store.getStorefrontPageConfig("trending-now");
  return {
    title: pageConfig?.meta_title || `${pageConfig?.title || "Trending Now"} | Handcrafted Luxury Handbags | DNORA`,
    description:
      pageConfig?.meta_description ||
      pageConfig?.subtitle ||
      "Shop the most sought-after architectural luxury handbags, totes, and clutches trending this season.",
  };
}

interface TrendingNowPageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function TrendingNowPage({ searchParams }: TrendingNowPageProps) {
  const { sort } = await searchParams;

  // 1. Fetch Dynamic Page Config, Trending Items, & All Active Products
  const [pageConfig, trendingItems, allProducts] = await Promise.all([
    store.getStorefrontPageConfig("trending-now"),
    store.getTrendingNowItems(true),
    store.getProducts({ status: "active" }),
  ]);

  // 2. Identify products marked as trending or featured by admin
  let featuredProducts: Product[] = [];

  if (pageConfig?.featured_product_ids && pageConfig.featured_product_ids.length > 0) {
    // Custom curated products chosen by admin in Storefront Pages Editor
    const featuredSet = new Set(pageConfig.featured_product_ids);
    featuredProducts = allProducts.filter((p) => featuredSet.has(p.id));
  } else {
    // Default to items in trending_now_items
    const trendingProductIds = new Set(
      trendingItems.map((it) => it.product_id).filter(Boolean) as string[]
    );
    const trendingProductSlugs = new Set(
      trendingItems.map((it) => it.product_slug).filter(Boolean) as string[]
    );

    featuredProducts = allProducts.filter(
      (p) =>
        trendingProductIds.has(p.id) ||
        trendingProductSlugs.has(p.slug) ||
        trendingItems.some((it) => it.target_link && it.target_link.includes(p.slug))
    );
  }

  // If fewer than 4 items are in trending, augment with active catalog items
  if (featuredProducts.length < 4) {
    const additional = allProducts
      .filter((p) => !featuredProducts.some((fp) => fp.id === p.id))
      .sort((a, b) => (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0));
    featuredProducts = [...featuredProducts, ...additional.slice(0, 12 - featuredProducts.length)];
  }

  // 3. Sort Products
  if (sort === "price-asc") {
    featuredProducts.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    featuredProducts.sort((a, b) => b.price - a.price);
  } else if (sort === "newest") {
    featuredProducts.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const title = pageConfig?.title || "TRENDING NOW";
  const badgeLabel = pageConfig?.badge_label || "Trending Now Collection";
  const subtitle = pageConfig?.subtitle || "Curated visual edits and architectural silhouettes.";
  const description =
    pageConfig?.description ||
    "Curated visual edits and architectural silhouettes capturing this season's most sought-after luxury handbag aesthetics. Each piece is handcrafted in limited runs from full-grain Italian leather.";

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-neutral-900 pb-24">
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
              {title}
            </span>
          </nav>
        </div>
      </div>

      {/* Editorial Banner (If configured) */}
      {pageConfig?.banner_image_url && (
        <div className="relative w-full aspect-[21/9] sm:aspect-[24/7] max-h-[380px] bg-black overflow-hidden">
          <Image
            src={pageConfig.banner_image_url}
            alt={pageConfig.banner_headline || title}
            fill
            priority
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-12 text-white">
            {pageConfig.banner_headline && (
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif drop-shadow-md">
                {pageConfig.banner_headline}
              </h2>
            )}
            {pageConfig.banner_subheadline && (
              <p className="text-xs sm:text-sm text-neutral-200 font-light mt-1 max-w-xl drop-shadow-sm">
                {pageConfig.banner_subheadline}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Editorial Header Section */}
      <section className="bg-white border-b border-neutral-200/80 pt-10 pb-10 sm:pt-14 sm:pb-12">
        <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{badgeLabel}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-950 font-serif uppercase">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm font-medium text-neutral-800">
                  {subtitle}
                </p>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-neutral-600 font-light max-w-2xl leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>View Full Catalog</span>
              </Link>
            </div>
          </div>

          {/* Sort Controls (Category Filter Tabs Completely Removed as Requested) */}
          <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between gap-4">
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
              Showing <span className="font-bold text-neutral-900 font-mono">{featuredProducts.length}</span> curated silhouettes
            </p>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-neutral-500 font-medium">Sort by:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: "featured", label: "Featured" },
                  { id: "price-asc", label: "Price: Low to High" },
                  { id: "price-desc", label: "Price: High to Low" },
                  { id: "newest", label: "Newest" },
                ].map((s) => (
                  <Link
                    key={s.id}
                    href={`/trending-now?sort=${s.id}`}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] transition-colors ${
                      (sort || "featured") === s.id
                        ? "bg-neutral-200/80 text-neutral-900 font-bold"
                        : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 sm:pt-12">
        {featuredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200 p-8 space-y-3">
            <h3 className="text-base font-bold text-neutral-900">No silhouettes found</h3>
            <p className="text-xs text-neutral-500">
              There are currently no items selected for this collection.
            </p>
            <Link
              href="/shop"
              className="inline-block mt-3 px-5 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg"
            >
              Browse Boutique Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 xl:gap-8">
            {featuredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={idx < 4}
                showBuyNow={true}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
