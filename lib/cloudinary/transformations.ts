/**
 * DNORA Luxury Lifestyle — Cloudinary Transformation & Delivery Engine
 * Enterprise-grade CDN optimization with dynamic cloud-name negotiation,
 * automated WebP/AVIF format conversion, and responsive srcset generators.
 */

export interface ImageTransformationOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "scale" | "thumb" | "crop" | "pad";
  gravity?: "auto" | "face" | "center" | "custom";
  quality?: "auto" | "auto:best" | "auto:good" | "auto:eco" | "auto:low" | number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  dpr?: number;
  blur?: number;
  aspectRatio?: string;
  background?: string;
}

const DEFAULT_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  "rvtnjdih";

/**
 * Builds a clean, high-performance Cloudinary delivery URL.
 * Automatically parses existing Cloudinary URLs to preserve original cloud instances,
 * strips redundant version tags, and applies high-speed CDN transforms.
 */
export function getCloudinaryUrl(
  publicIdOrUrl: string,
  options: ImageTransformationOptions = {}
): string {
  if (!publicIdOrUrl || typeof publicIdOrUrl !== "string") return "";

  // 1. Unsplash seed image optimization
  if (publicIdOrUrl.includes("images.unsplash.com")) {
    try {
      const url = new URL(publicIdOrUrl);
      if (options.width) url.searchParams.set("w", options.width.toString());
      if (options.quality) url.searchParams.set("q", "85");
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", options.crop === "fill" ? "crop" : "max");
      return url.toString();
    } catch {
      return publicIdOrUrl;
    }
  }

  // 2. Generic external HTTP URLs without Cloudinary CDN
  if (publicIdOrUrl.startsWith("http") && !publicIdOrUrl.includes("res.cloudinary.com")) {
    return publicIdOrUrl;
  }

  // 3. Local relative paths (e.g., /images/... or /uploads/...)
  if (publicIdOrUrl.startsWith("/") && !publicIdOrUrl.includes("res.cloudinary.com")) {
    return publicIdOrUrl;
  }

  let cloudName = DEFAULT_CLOUD_NAME;
  let resourceType = "image";
  let assetPath = publicIdOrUrl;

  // 4. Parse full Cloudinary URL to extract cloud name and relative asset path
  if (publicIdOrUrl.includes("res.cloudinary.com/")) {
    const match = publicIdOrUrl.match(
      /res\.cloudinary\.com\/([^/]+)\/(image|video)\/upload\/(?:v\d+\/)?(.+)$/
    );
    if (match) {
      cloudName = match[1];
      resourceType = match[2];
      assetPath = match[3];

      // Remove existing inline transformation segments if any (e.g. w_800,q_auto/)
      if (assetPath.includes("/") && /^[a-z0-9_,:]+\//i.test(assetPath)) {
        const parts = assetPath.split("/");
        // If the first segment looks like Cloudinary flags (e.g. f_auto,q_auto,w_500)
        if (parts[0].includes(",") || parts[0].includes("_")) {
          parts.shift();
          assetPath = parts.join("/");
        }
      }
    }
  }

  // Build transformation chain
  const transformations: string[] = [];

  // Default to automatic modern format (AVIF/WebP) and intelligent perceptual quality
  transformations.push(options.format ? `f_${options.format}` : "f_auto");
  transformations.push(
    options.quality && options.quality !== "auto" ? `q_${options.quality}` : "q_auto:good"
  );

  if (options.aspectRatio) transformations.push(`ar_${options.aspectRatio}`);
  if (options.background) transformations.push(`b_${options.background}`);
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  if (options.dpr) transformations.push(`dpr_${options.dpr}`);
  if (options.blur) transformations.push(`e_blur:${options.blur}`);

  const transformString = transformations.join(",");
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transformString}/${assetPath}`;
}

/**
 * Generates an ultra-lightweight base64-friendly blur placeholder URL for smooth Next.js image loading
 */
export function getBlurPlaceholderUrl(url: string): string {
  return getCloudinaryUrl(url, {
    width: 32,
    quality: "auto:low",
    blur: 1000,
    crop: "scale",
  });
}

/**
 * Ultra-crisp thumbnail for cart, order summaries, and admin lists (160x160)
 */
export function getProductThumbnailUrl(url: string): string {
  return getCloudinaryUrl(url, {
    width: 200,
    height: 200,
    crop: "fill",
    gravity: "center",
    quality: "auto:good",
  });
}

/**
 * High-definition catalog and product grid card (auto-padded to 3:4 with intelligent background fill)
 */
export function getProductCardUrl(url: string): string {
  return getCloudinaryUrl(url, {
    width: 800,
    aspectRatio: "3:4",
    crop: "pad",
    background: "auto",
    quality: "auto:good",
  });
}

/**
 * Ultra-high-resolution product detail view & zoom hero (1800w)
 */
export function getProductHeroUrl(url: string): string {
  return getCloudinaryUrl(url, {
    width: 1800,
    crop: "limit",
    quality: "auto:best",
  });
}

/**
 * Circular collection badge thumbnail (400x400)
 */
export function getCollectionCircleUrl(url: string): string {
  return getCloudinaryUrl(url, {
    width: 400,
    height: 400,
    crop: "fill",
    gravity: "center",
    quality: "auto:good",
  });
}

/**
 * Category banner & header display (1400x800)
 */
export function getCategoryCardUrl(url: string): string {
  return getCloudinaryUrl(url, {
    width: 1400,
    height: 800,
    crop: "fill",
    gravity: "center",
    quality: "auto:good",
  });
}

/**
 * Fullscreen luxury hero campaign banner (2400w)
 */
export function getHeroBannerUrl(url: string, isMobile: boolean = false): string {
  if (isMobile) {
    return getCloudinaryUrl(url, {
      width: 1080,
      height: 1440,
      crop: "fill",
      gravity: "center",
      quality: "auto:good",
    });
  }
  return getCloudinaryUrl(url, {
    width: 2400,
    crop: "limit",
    quality: "auto:best",
  });
}
