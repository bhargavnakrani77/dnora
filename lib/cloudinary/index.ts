import { v2 as cloudinary } from "cloudinary";

function configureCloudinary(): boolean {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl) {
    cloudinary.config(true);
    return true;
  }

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret && !apiKey.includes("mock")) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }

  return false;
}

// Initial config
configureCloudinary();

export interface UploadResult {
  public_id: string;
  secure_url: string;
  short_url: string;
  format: string;
  resource_type: "image" | "video";
  width?: number;
  height?: number;
  duration?: number;
}

export type MediaFolder =
  | "dnora/hero"
  | "dnora/heroes"
  | "dnora/herobanner"
  | "dnora/prod"
  | "dnora/products"
  | "dnora/cat"
  | "dnora/categories"
  | "dnora/reviews"
  | "dnora/customer-videos"
  | "dnora/seenonyou"
  | "dnora/seenonyou/thumbs"
  | (string & {});

/**
 * Converts any long, bloated Cloudinary URL into a concise, professional CDN URL.
 * Strips unnecessary version hashes (`/v1234567890/`) and cleans trailing parameters.
 * Example:
 *   Input:  https://res.cloudinary.com/demo/image/upload/v1790123456/dnora/herobanner/long_messy_name_12345.jpg
 *   Output: https://res.cloudinary.com/demo/image/upload/dnora/herobanner/long_messy_name_12345.jpg
 */
export function toShortCloudinaryUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("res.cloudinary.com")) return url;

  // Remove redundant /v[0-9]+/ version tag
  return url.replace(/\/upload\/v\d+\//, "/upload/");
}

/**
 * Generates a clean, short, professional public ID.
 * Example: "luxury-tote-9z3k" instead of "WhatsApp_Image_2024-03-24_1790123456789_preview_full"
 */
export function generateShortPublicId(originalName?: string): string {
  let baseSlug = "asset";
  if (originalName) {
    const clean = originalName
      .replace(/\.[^/.]+$/, "") // remove extension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // sanitize to alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // trim hyphens

    if (clean) {
      baseSlug = clean.slice(0, 16).replace(/-+$/, "");
    }
  }

  // Generate 4-character alphanumeric hash for uniqueness without bloating the URL
  const shortHash = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${shortHash}`;
}

/**
 * Standardizes folder names into compact, elegant paths
 */
function normalizeFolder(folder: MediaFolder): string {
  switch (folder) {
    case "dnora/herobanner":
    case "dnora/heroes":
      return "dnora/hero";
    case "dnora/products":
      return "dnora/prod";
    case "dnora/categories":
      return "dnora/cat";
    default:
      return folder;
  }
}

/**
 * Uploads a file buffer or base64 to Cloudinary with short, professional naming.
 * Dynamically adapts to any new Cloudinary credentials set in .env.
 */
export async function uploadMedia(
  fileBuffer: Buffer,
  folder: MediaFolder,
  resourceType: "image" | "video" = "image",
  fileName?: string
): Promise<UploadResult> {
  const isCloudinaryConfigured = configureCloudinary();

  if (!isCloudinaryConfigured) {
    throw new Error(
      "Cloudinary credentials not configured. Please specify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_URL) in your .env file."
    );
  }

  const cleanFolder = normalizeFolder(folder);
  const shortPublicId = generateShortPublicId(fileName);

  return new Promise((resolve, reject) => {
    // For video uploads, use upload_chunked_stream with 6MB chunks to reliably support larger video files up to 100MB
    const uploaderMethod =
      resourceType === "video" && typeof cloudinary.uploader.upload_chunked_stream === "function"
        ? cloudinary.uploader.upload_chunked_stream.bind(cloudinary.uploader)
        : cloudinary.uploader.upload_stream.bind(cloudinary.uploader);

    const uploadStream = uploaderMethod(
      {
        folder: cleanFolder,
        public_id: shortPublicId,
        resource_type: resourceType,
        chunk_size: 6000000,
        // Preserve pristine original resolution and quality
        transformation: undefined,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }

        // Clean short URL without redundant version hashes
        const shortUrl = toShortCloudinaryUrl(result.secure_url);

        resolve({
          public_id: result.public_id,
          secure_url: shortUrl, // Use short URL as default for clean, professional links
          short_url: shortUrl,
          format: result.format,
          resource_type: result.resource_type as "image" | "video",
          width: result.width,
          height: result.height,
          duration: result.duration,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Fast ping check to verify Cloudinary API connectivity and calculate latency
 */
export async function checkCloudinaryHealth(): Promise<{
  connected: boolean;
  cloudName: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const configured = configureCloudinary();
    if (!configured) {
      return {
        connected: false,
        cloudName: "unconfigured",
        latencyMs: 0,
        error: "Credentials missing",
      };
    }
    const res = await cloudinary.api.ping();
    return {
      connected: res?.status === "ok",
      cloudName: cloudinary.config().cloud_name || "unknown",
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      connected: false,
      cloudName: cloudinary.config().cloud_name || "unknown",
      latencyMs: Date.now() - start,
      error: err?.message || "Ping failed",
    };
  }
}

export { cloudinary };

