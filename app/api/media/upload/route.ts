import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { uploadMedia, MediaFolder } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/m4v",
  "video/x-m4v",
  "video/3gpp",
  "video/ogg",
  "video/x-msvideo",
  "video/avi",
];

const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"];
const ALLOWED_VIDEO_EXTS = [".mp4", ".webm", ".mov", ".m4v", ".mkv", ".3gp", ".ogv", ".avi"];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Server-Side Admin Authorization
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as MediaFolder) || "dnora/herobanner";
    const resourceTypeParam = formData.get("resource_type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. MIME & Resource Type Validation (supporting both MIME header and filename extension)
    const fileName = (file.name || "").toLowerCase();
    const fileExt = fileName.includes(".") ? "." + fileName.split(".").pop() : "";
    const rawType = (file.type || "").toLowerCase().split(";")[0].trim();

    const isImageByMime = ALLOWED_IMAGE_TYPES.includes(rawType) || rawType.startsWith("image/");
    const isImageByExt = ALLOWED_IMAGE_EXTS.includes(fileExt);
    const isImage = isImageByMime || isImageByExt;

    const isVideoByMime = ALLOWED_VIDEO_TYPES.includes(rawType) || rawType.startsWith("video/");
    const isVideoByExt = ALLOWED_VIDEO_EXTS.includes(fileExt);
    const isVideo = isVideoByMime || isVideoByExt;

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error: `Unsupported file format (${file.type || fileExt || "unknown"}). Supported video formats: MP4, WebM, MOV, M4V. Supported images: JPG, PNG, WebP, AVIF.`,
        },
        { status: 400 }
      );
    }

    // 3. Size Limits Validation
    const resourceType: "image" | "video" =
      resourceTypeParam === "video" || isVideo ? "video" : "image";
    const maxSize = resourceType === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    // 4. Convert File to Buffer and Upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let result;
    try {
      result = await uploadMedia(buffer, folder, resourceType, file.name.split(".")[0]);
    } catch (cloudErr) {
      console.warn("Cloudinary upload fallback to local storage:", cloudErr);
      const fs = await import("fs/promises");
      const path = await import("path");
      const subFolder = folder.replace("dnora/", "");
      const uploadDir = path.join(process.cwd(), "public", "uploads", subFolder);
      await fs.mkdir(uploadDir, { recursive: true });
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, safeName);
      await fs.writeFile(filePath, buffer);
      result = {
        secure_url: `/uploads/${subFolder}/${safeName}`,
        public_id: safeName,
        format: file.name.split(".").pop() || "jpg",
        resource_type: resourceType,
      };
    }

    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      url: result.secure_url,
      media: result,
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload media. Please check server logs." },
      { status: 500 }
    );
  }
}
