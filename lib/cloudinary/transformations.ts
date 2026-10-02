/**
 * Cloudinary Transformation Helpers for High-Performance Delivery
 */

export interface ImageTransformationOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "scale" | "thumb";
  quality?: "auto" | "auto:best" | "auto:good" | "auto:eco" | "auto:low" | number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  dpr?: number;
}

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dnora-luxury";

/**
 * Builds an optimized Cloudinary delivery URL with quality and format negotiation
 */
export function getCloudinaryUrl(
  publicIdOrUrl: string,
  options: ImageTransformationOptions = {}
): string {
  if (!publicIdOrUrl) return "";

  // If it's an Unsplash image (used for seed/demo), apply Unsplash optimization params
  if (publicIdOrUrl.includes("images.unsplash.com")) {
    const url = new URL(publicIdOrUrl);
    if (options.width) url.searchParams.set("w", options.width.toString());
    if (options.quality) url.searchParams.set("q", "85");
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", options.crop === "fill" ? "crop" : "max");
    return url.toString();
  }

  // If it's already an external non-Cloudinary URL, return as-is
  if (publicIdOrUrl.startsWith("http") && !publicIdOrUrl.includes("res.cloudinary.com")) {
    return publicIdOrUrl;
  }

  // Extract public ID if full Cloudinary URL was provided
  let publicId = publicIdOrUrl;
  if (publicIdOrUrl.includes("res.cloudinary.com")) {
    const parts = publicIdOrUrl.split("/upload/");
    if (parts[1]) {
      // Remove existing transformations if any
      const subparts = parts[1].split("/");
      publicId = subparts.slice(1).join("/");
    }
  }

  const transformations: string[] = ["f_auto", "q_auto"];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality && options.quality !== "auto") {
    transformations.push(`q_${options.quality}`);
  }
  if (options.dpr) transformations.push(`dpr_${options.dpr}`);

  const transformString = transformations.join(",");
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformString}/${publicId}`;
}

/**
 * Optimized transforms for specific luxury UI touchpoints
 */
export function getProductThumbnailUrl(url: string): string {
  return getCloudinaryUrl(url, { width: 160, height: 160, crop: "fill", quality: "auto" });
}

export function getProductCardUrl(url: string): string {
  return getCloudinaryUrl(url, { width: 800, crop: "limit", quality: "auto:good" });
}

export function getProductHeroUrl(url: string): string {
  return getCloudinaryUrl(url, { width: 1600, crop: "limit", quality: "auto:best" });
}

export function getCategoryCardUrl(url: string): string {
  return getCloudinaryUrl(url, { width: 1000, height: 1200, crop: "fill", quality: "auto:good" });
}
