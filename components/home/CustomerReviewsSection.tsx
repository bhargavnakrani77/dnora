import React from "react";
import Image from "next/image";
import { Star, CheckCircle, Quote } from "lucide-react";
import { CustomerReview } from "@/types";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface CustomerReviewsSectionProps {
  reviews: CustomerReview[];
}

export function CustomerReviewsSection({ reviews }: CustomerReviewsSectionProps) {
  // Show up to 3 or 6 top reviews
  const displayReviews = reviews.slice(0, 6);

  if (displayReviews.length === 0) return null;

  return (
    <section
      id="customer-reviews"
      aria-label="Customer Reviews"
      className="w-full bg-[#FAF8F5] pt-10 pb-12 sm:pt-14 sm:pb-16 md:pt-16 md:pb-20 border-b border-neutral-200/60"
    >
      <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Heading with Montserrat Font identical to Our Collections */}
        <SectionHeading title="CUSTOMER REVIEWS" />

        {/* Global Rating Score Summary */}
        <div className="flex items-center justify-center gap-2 mb-8 sm:mb-10 text-xs sm:text-sm font-medium text-neutral-700">
          <div className="flex items-center gap-1 text-[#D4AF37]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span className="font-bold text-neutral-900">4.9 / 5.0</span>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-500">Based on 1,400+ Verified Deliveries</span>
        </div>

        {/* Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 sm:p-7 rounded-md border border-neutral-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative group"
            >
              <Quote className="absolute top-5 right-5 w-8 h-8 text-neutral-100 group-hover:text-neutral-200 transition-colors pointer-events-none" />

              <div>
                {/* Star Rating */}
                <div className="flex items-center gap-1 text-[#D4AF37] mb-3">
                  {[...Array(rev.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-light italic mb-6">
                  &ldquo;{rev.review}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {rev.image_url ? (
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-neutral-200 shrink-0">
                      <Image
                        src={rev.image_url}
                        alt={rev.customer_name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {rev.customer_name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                      <span>{rev.customer_name}</span>
                      {rev.verified_purchase && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                      )}
                    </h3>
                    {rev.product_name && (
                      <span className="text-[11px] text-neutral-500 font-light block truncate max-w-[170px]">
                        Purchased: {rev.product_name}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                  Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CustomerReviewsSection;
