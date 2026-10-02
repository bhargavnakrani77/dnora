import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

export function getRequestOrigin(req?: {
  headers?: { get: (name: string) => string | null };
  nextUrl?: { origin: string };
}): string {
  // 1. Explicit site URL from environment in production
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  // 2. Request headers (Host / X-Forwarded-Host)
  if (req?.headers) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) {
      const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
      const proto = isLocal
        ? "http"
        : (req.headers.get("x-forwarded-proto") || "https");
      return `${proto}://${host}`;
    }
  }

  // 3. Fallback to NextUrl origin or localhost default
  return req?.nextUrl?.origin || "http://localhost:3000";
}

