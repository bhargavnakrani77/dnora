import { store } from "@/lib/data/store";
import { HeroBanner, HeroSlide } from "@/components/HeroBanner";
import { CircularCollections, CircularCollectionItem } from "@/components/CircularCollections";
import { PromoBanner } from "@/components/PromoBanner";
import { SeenOnYouSection } from "@/components/SeenOnYouSection";
import { CustomerReviewsSection } from "@/components/CustomerReviewsSection";
import { DynamicHomeSection } from "@/components/DynamicHomeSection";
import { TrendingNowSection } from "@/components/TrendingNowSection";
import { HomepageSection, Product } from "@/types";
import React from "react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banners, categories, allProducts, videos, reviews, sections, trendingItems, promoConfig] = await Promise.all([
    store.getHeroBanners(false),
    store.getCategories(),
    store.getProducts(),
    store.getSeenOnYou(),
    store.getReviews(true),
    store.getHomepageSections(),
    store.getTrendingNowItems(true),
    store.getPromoBannerConfig(),
  ]);

  const slides: HeroSlide[] = banners.map((b) => ({
    id: b.id,
    media_type: b.media_type,
    media_url: b.media_url,
    tablet_media_url: b.tablet_media_url || undefined,
    mobile_media_url: b.mobile_media_url || undefined,
    heading: b.heading || undefined,
    subtitle: b.subtitle || undefined,
    button_text: b.button_text || undefined,
    link: b.button_link || "/shop",
    duration_seconds: b.duration_seconds || 5,
  }));

  // Map Admin Categories directly to Our Collections round items (only active/unhidden collections)
  const collectionItems: CircularCollectionItem[] = categories
    .filter((cat) => cat.is_in_collections ?? true)
    .map((cat) => ({
      id: `cat-${cat.id}`,
      label: cat.name,
      href: `/category/${cat.slug}`,
      image:
        cat.image_url ||
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80",
      alt: `${cat.name} Luxury Collection`,
    }));

  // Always append an extra round circle for "View All" at the end
  collectionItems.push({
    id: "col-view-all",
    label: "View All",
    href: "/shop",
    image:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80",
    badge: "All",
    alt: "Explore All Silhouettes",
    isViewAll: true,
  });

  // Filter and sort active sections
  const activeSections = sections.filter((s) => s.is_active);

  // Helper to extract products for each section
  const getSectionProducts = (sec: HomepageSection): Product[] => {
    if (sec.type === "best_sellers") {
      const filtered = allProducts.filter((p) => !!p.is_best_seller);
      return filtered.length > 0 ? filtered : allProducts.slice(0, 8);
    }
    if (sec.type === "new_in") {
      const filtered = allProducts.filter((p) => !!p.is_new_arrival);
      return filtered.length > 0 ? filtered : allProducts.slice(0, 8);
    }
    if (sec.type === "category" && sec.category_slug) {
      return allProducts.filter((p) =>
        p.categories?.some((c: { slug?: string }) => c.slug === sec.category_slug)
      );
    }
    if (sec.type === "custom_products" && sec.product_ids && sec.product_ids.length > 0) {
      return allProducts.filter((p) => sec.product_ids?.includes(p.id));
    }
    return allProducts;
  };

  return (
    <main className="w-full min-h-screen bg-white text-neutral-900 overflow-x-clip">
      {/* 1. Hero Banner */}
      <HeroBanner initialSlides={slides} />

      {/* 2. Our Collections (Circular Category Browser) */}
      <div className="mt-1 sm:mt-2 md:mt-3">
        <CircularCollections items={collectionItems} />
      </div>

      {/* 3. Dynamic Homepage Sections (Managed from Admin) */}
      {(() => {
        const hasNewInSection = activeSections.some(
          (sec) => sec.type === "new_in" && getSectionProducts(sec).length > 0
        );

        const isPromoActive =
          Boolean(promoConfig.is_active) &&
          (!promoConfig.slides ||
            promoConfig.slides.length === 0 ||
            promoConfig.slides.some((s) => s.is_active !== false));

        const rendered = activeSections.map((sec, idx) => {
          const secProducts = getSectionProducts(sec);
          if (secProducts.length === 0) return null;

          const isNewIn = sec.type === "new_in";

          return (
            <React.Fragment key={sec.id}>
              {/* Promo banner placed seamlessly after the first section */}
              {isPromoActive && idx === 1 && (
                <PromoBanner
                  slides={promoConfig.slides}
                  heading={promoConfig.heading}
                  tagline={promoConfig.tagline}
                  description={promoConfig.description}
                  buttonText={promoConfig.button_text}
                  buttonLink={promoConfig.button_link}
                  imageUrl={promoConfig.image_url}
                  isActive={promoConfig.is_active}
                />
              )}
              {/* "TRENDING NOW NEW IN NI UPER LY LE" - Render Trending Now ABOVE New In */}
              {isNewIn && <TrendingNowSection items={trendingItems} />}
              <DynamicHomeSection section={sec} products={secProducts} />
            </React.Fragment>
          );
        });

        return (
          <>
            {rendered}
            {/* If New In section was not present in dynamic sections, ensure Trending Now still renders */}
            {!hasNewInSection && <TrendingNowSection items={trendingItems} />}
          </>
        );
      })()}

      {/* If only 0 or 1 section was rendered, ensure PromoBanner still displays if active */}
      {promoConfig.is_active &&
        (!promoConfig.slides ||
          promoConfig.slides.length === 0 ||
          promoConfig.slides.some((s) => s.is_active !== false)) &&
        activeSections.length <= 1 && (
          <PromoBanner
            slides={promoConfig.slides}
            heading={promoConfig.heading}
            tagline={promoConfig.tagline}
            description={promoConfig.description}
            buttonText={promoConfig.button_text}
            buttonLink={promoConfig.button_link}
            imageUrl={promoConfig.image_url}
            isActive={promoConfig.is_active}
          />
        )}

      {/* 4. Seen On You (Videos / Reels Section) */}
      <SeenOnYouSection videos={videos} />

      {/* 5. Customer Reviews Section */}
      <CustomerReviewsSection reviews={reviews} />
    </main>
  );
}

