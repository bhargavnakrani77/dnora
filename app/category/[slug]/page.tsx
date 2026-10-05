import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { store } from "@/lib/data/store";
import { formatPrice } from "@/lib/utils";
import { ChevronRight, ArrowLeft, Sparkles, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await store.getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found | DNORA",
    };
  }

  return {
    title: `${category.name} | DNORA Luxury Leather Goods`,
    description:
      category.description ||
      `Explore luxury ${category.name.toLowerCase()} handcrafted from full-grain Italian leather at DNORA.`,
  };
}

function getBannerObjectPosition(pos?: string): string {
  if (!pos || pos === "center") return "50% 50%";
  if (pos === "top") return "50% 0%";
  if (pos === "bottom") return "50% 100%";
  const parsed = parseInt(pos, 10);
  if (!isNaN(parsed)) {
    const clamped = Math.max(0, Math.min(100, parsed));
    return `50% ${clamped}%`;
  }
  return pos;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { sort } = await searchParams;

  const category = await store.getCategoryBySlug(slug);
  const allCategories = await store.getCategories();

  // If not found in DB, check if it's a known silhouette or format title from slug
  const title = category?.name || slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const description = category?.description || `Explore our bespoke curated range of ${title.toLowerCase()}, sculpted with artisanal Italian craftsmanship.`;

  // Fetch products associated with this category
  let products = await store.getProducts({
    category_slug: slug,
    status: "active",
  });

  // If no direct category relations found, try case-insensitive name matching
  if (products.length === 0 && category) {
    const allActive = await store.getProducts({ status: "active" });
    products = allActive.filter((p) =>
      p.categories?.some((c) => c.slug === slug || c.id === category.id)
    );
  }

  // Sort products if specified
  if (sort === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === "newest") {
    products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const hasBannerText = Boolean(category?.banner_heading?.trim() || category?.banner_subtitle?.trim());

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-neutral-900 pb-24">
      {/* Top Breadcrumb Trail - Above the Banner */}
      <div className="bg-[#FAF8F5] border-b border-neutral-200/70 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            <Link href="/shop" className="hover:text-black transition-colors">
              Collections
            </Link>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            <span className="text-neutral-900 font-semibold tracking-wide">
              {title}
            </span>
          </nav>
        </div>
      </div>

      {/* Category Hero Banner (Matches Main Storefront Hero Banner with no-crop & adjust support) */}
      {(category?.banner_image_url || category?.banner_mobile_image_url) ? (
        <section
          className={`relative w-full bg-neutral-950 overflow-hidden flex items-end ${
            category.banner_aspect_ratio === "natural"
              ? "aspect-[4/3] sm:aspect-video md:aspect-[16/7] min-h-[260px] max-h-[720px]"
              : category.banner_aspect_ratio === "video"
              ? "aspect-video max-h-[640px]"
              : category.banner_aspect_ratio === "ultrawide"
              ? "aspect-video md:aspect-[21/9] max-h-[600px]"
              : "aspect-square sm:aspect-video md:aspect-[1024/346] max-h-[640px]"
          }`}
        >
          {/* Ambient blurred backdrop when in contain mode */}
          {category.banner_fit === "contain" && (category.banner_image_url || category.banner_mobile_image_url) && (
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-40 scale-110 pointer-events-none"
              style={{
                backgroundImage: `url(${category.banner_image_url || category.banner_mobile_image_url})`,
              }}
            />
          )}

          {category.banner_media_type === "video" ? (
            <video
              src={category.banner_image_url || category.banner_mobile_image_url}
              autoPlay
              loop
              muted
              playsInline
              style={{
                objectPosition: getBannerObjectPosition(category.banner_position),
              }}
              className={`absolute inset-0 w-full h-full ${
                category.banner_fit === "contain" ? "object-contain relative z-1" : "object-cover"
              }`}
            />
          ) : (
            <>
              {/* Desktop / Laptop Banner */}
              {category.banner_image_url && (
                <div
                  className={`absolute inset-0 w-full h-full ${
                    category.banner_mobile_image_url ? "hidden sm:block" : "block"
                  } ${category.banner_fit === "contain" ? "z-1" : ""}`}
                >
                  <Image
                    src={category.banner_image_url}
                    alt={title}
                    fill
                    priority
                    style={{
                      objectPosition: getBannerObjectPosition(category.banner_position),
                    }}
                    className={category.banner_fit === "contain" ? "object-contain" : "object-cover"}
                    sizes="100vw"
                  />
                </div>
              )}

              {/* Mobile Banner (for smartphones) */}
              {category.banner_mobile_image_url && (
                <div
                  className={`absolute inset-0 w-full h-full ${
                    category.banner_image_url ? "block sm:hidden" : "block"
                  } ${category.banner_fit === "contain" ? "z-1" : ""}`}
                >
                  <Image
                    src={category.banner_mobile_image_url}
                    alt={title}
                    fill
                    priority
                    style={{
                      objectPosition: getBannerObjectPosition(category.banner_position),
                    }}
                    className={category.banner_fit === "contain" ? "object-contain" : "object-cover"}
                    sizes="100vw"
                  />
                </div>
              )}
            </>
          )}

          {/* Only render text & gradient overlay if the admin explicitly provided headline or subtitle */}
          {hasBannerText && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
              <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 md:pb-12">
                <div className="max-w-2xl space-y-2 text-white">
                  {category.banner_subtitle?.trim() && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#E5C378] text-[10px] font-bold uppercase tracking-[0.25em]">
                      <Sparkles className="w-3 h-3" />
                      <span>{category.banner_subtitle.trim()}</span>
                    </div>
                  )}

                  {category.banner_heading?.trim() && (
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-light tracking-[0.16em] uppercase text-white drop-shadow-sm">
                      {category.banner_heading.trim()}
                    </h1>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      ) : (
        /* Fallback Editorial Header if banner is not uploaded */
        <section className="relative w-full bg-[#FAF8F5] border-b border-neutral-200/80 pt-8 pb-8 sm:pt-12 sm:pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-2.5">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-normal tracking-[0.16em] uppercase text-neutral-950">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed max-w-xl">
                {category?.description || `Explore our bespoke curated range of ${title.toLowerCase()}, sculpted with artisanal Italian craftsmanship.`}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid & Content: Compact Container Matching Storefront */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10">
        {/* Silhouette Quick Filter Pills */}
        {allCategories.length > 0 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 mr-2 shrink-0">
              Silhouettes:
            </span>
            {allCategories.map((c) => {
              const isActive = c.slug === slug;
              return (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className={`text-[11px] px-3.5 py-1.5 rounded-full uppercase tracking-wider font-medium transition-all shrink-0 ${
                    isActive
                      ? "bg-black text-white shadow-xs"
                      : "bg-white text-neutral-700 border border-neutral-200 hover:border-black hover:text-black"
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        )}
        
        {/* Results Bar & Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
          <p className="text-xs font-medium tracking-widest uppercase text-neutral-500">
            Showing <span className="font-bold text-neutral-900">{products.length}</span> {products.length === 1 ? "Silhouette" : "Silhouettes"}
          </p>

          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 shrink-0">Sort By:</span>
            <div className="flex items-center gap-1.5 text-xs font-medium shrink-0">
              <Link
                href={`/category/${slug}`}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  !sort ? "bg-black text-white font-bold" : "text-neutral-600 hover:text-black bg-neutral-100"
                }`}
              >
                Featured
              </Link>
              <Link
                href={`/category/${slug}?sort=price-asc`}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  sort === "price-asc" ? "bg-black text-white font-bold" : "text-neutral-600 hover:text-black bg-neutral-100"
                }`}
              >
                Price: Low to High
              </Link>
              <Link
                href={`/category/${slug}?sort=price-desc`}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  sort === "price-desc" ? "bg-black text-white font-bold" : "text-neutral-600 hover:text-black bg-neutral-100"
                }`}
              >
                Price: High to Low
              </Link>
            </div>
          </div>
        </div>

        {/* Product Grid or Haute Couture Empty State */}
        {products.length === 0 ? (
          <div className="py-20 sm:py-28 text-center max-w-lg mx-auto space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-400">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-400">
                Atelier Production
              </span>
              <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-neutral-900">
                The {title} Collection Is Arriving Soon
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed font-light">
                Our master artisans are currently handcrafting the initial release of this silhouette. In the meantime, explore our other bespoke collections or preview best sellers.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-neutral-800 rounded-full transition shadow-md"
              >
                <span>Explore All Handbags</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-full transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return Home</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {products.map((product, idx) => (
              <div key={product.id} className="flex flex-col justify-between">
                <ProductCard product={product} priority={idx < 4} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
