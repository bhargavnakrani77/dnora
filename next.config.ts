import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "assets.mixkit.co",
      },
      {
        protocol: "https",
        hostname: "player.vimeo.com",
      },
      {
        protocol: "https",
        hostname: "www.linoperros.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin/home",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/admin/HOME",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/admin/Home",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/admin/dashboard",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/admin/DASHBOARD",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/admin/Dashboard",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/shop",
        has: [{ type: "query", key: "new_arrival" }],
        destination: "/new-in",
        permanent: false,
      },
      {
        source: "/shop",
        has: [{ type: "query", key: "new_in" }],
        destination: "/new-in",
        permanent: false,
      },
      {
        source: "/shop",
        has: [{ type: "query", key: "best_seller" }],
        destination: "/bestseller",
        permanent: false,
      },
      {
        source: "/shop",
        has: [{ type: "query", key: "bestseller" }],
        destination: "/bestseller",
        permanent: false,
      },
      {
        source: "/shop",
        has: [{ type: "query", key: "trending" }],
        destination: "/trending-now",
        permanent: false,
      },
      {
        source: "/shop",
        has: [{ type: "query", key: "trending_now" }],
        destination: "/trending-now",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
