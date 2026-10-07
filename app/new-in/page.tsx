import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Clock, ChevronRight, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { store } from "@/lib/data/store";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const pageConfig = await store.getStorefrontPageConfig("new-in");
  return {
    title: pageConfig?.meta_title || `${pageConfig?.title || "New In"} | Handcrafted Luxury Handbags | DNORA`,
    description:
      pageConfig?.meta_description ||
      pageConfig?.subtitle ||
      "Discover the latest seasonal arrivals and handcrafted luxury Italian leather silhouettes from DNORA.",
  };
}

interface NewInPageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function NewInPage({ searchParams }: NewInPageProps) {
  const { sort } = await searchParams;

  // 1. Fetch Dynamic Page Config & All Active Products
  const [pageConfig, allProducts] = await Promise.all([
    store.getStorefrontPageConfig("new-in"),
    store.getProducts({ status: "active" }),
  ]);

  // 2. Identify products marked as new arrivals or curated by admin
  let featuredProducts: Product[] = [];

  const newArrivalProducts = allProducts.filter((p) => p.is_new_arrival);

  if (pageConfig?.featured_product_ids && pageConfig.featured_product_ids.length > 0) {
    const featuredSet = new Set(pageConfig.featured_product_ids);
    const explicitlyFeatured = allProducts.filter((p) => featuredSet.has(p.id));

    const seenIds = new Set(explicitlyFeatured.map((p) => p.id));
    const additionalNewArrivals = newArrivalProducts.filter((p) => !seenIds.has(p.id));
    featuredProducts = [...explicitlyFeatured, ...additionalNewArrivals];
  } else {
    // Default to is_new_arrival flag
    featuredProducts = newArrivalProducts;
  }

  if (featuredProducts.length < 4) {
    const seenIds = new Set(featuredProducts.map((p) => p.id));
    const additional = allProducts
      .filter((p) => !seenIds.has(p.id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    featuredProducts = [...featuredProducts, ...additional.slice(0, 12 - featuredProducts.length)];
  }

  // 3. Sort Products
  if (sort === "price-asc") {
    featuredProducts.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    featuredProducts.sort((a, b) => b.price - a.price);
  } else if (sort === "newest" || !sort) {
    featuredProducts.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const title = pageConfig?.title || "NEW IN";
  const badgeLabel = pageConfig?.badge_label || "Seasonal Arrivals";
  const subtitle = pageConfig?.subtitle || "Latest drops and architectural silhouettes fresh from the atelier.";
  const description =
    pageConfig?.description ||
    "Discover the newest seasonal drops from the DNORA Florence atelier. Contemporary silhouettes engineered with precision craftsmanship and sustainably-sourced Italian calfskin.";

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
                <Clock className="w-3.5 h-3.5 text-amber-600" />
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

          {/* Sort Controls */}
          <div className="mt-8 pt-6 border-t border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
              Showing <span className="font-bold text-neutral-900 font-mono">{featuredProducts.length}</span> {featuredProducts.length === 1 ? "curated silhouette" : "curated silhouettes"}
            </p>

            <div className="flex items-center gap-2 text-xs overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-1.5 text-neutral-500 font-medium shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  { id: "newest", label: "Newest" },
                  { id: "featured", label: "Featured" },
                  { id: "price-asc", label: "Price: Low to High" },
                  { id: "price-desc", label: "Price: High to Low" },
                ].map((s) => (
                  <Link
                    key={s.id}
                    href={`/new-in?sort=${s.id}`}
                    className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium whitespace-nowrap transition-all shrink-0 ${
                      (sort || "newest") === s.id
                        ? "bg-neutral-950 text-white font-bold shadow-xs"
                        : "text-neutral-600 hover:text-black bg-neutral-100 hover:bg-neutral-200"
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-4 lg:gap-5 xl:gap-5 items-stretch">
            {featuredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={idx < 4}
                className="h-full"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
