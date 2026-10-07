import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { TopBar, NavCategory } from "@/components/TopBar";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { GlobalPreloader } from "@/components/ui/GlobalPreloader";
import { CartProvider } from "@/lib/store/cart-store";
import { WishlistProvider } from "@/lib/store/wishlist-store";
import { store } from "@/lib/data/store";
import { db } from "@/lib/db";
import { AnnouncementConfig } from "@/types";
import { LiveVisitorHeartbeat } from "@/components/LiveVisitorHeartbeat";
import { cookies, headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#0E0E0E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "DNORA | Luxury Handbags & Modern Leather Goods",
    template: "%s | DNORA",
  },
  description:
    "Discover DNORA: Architectural silhouettes, meticulous artisan craft, and timeless modern women's handbags, totes, and purses. Designed for discerning taste.",
  keywords: [
    "DNORA",
    "luxury handbags",
    "designer purses",
    "modern leather goods",
    "women's luxury bags",
    "tote bags",
    "crossbody bags",
    "shoulder bags",
  ],
  authors: [{ name: "DNORA Luxury House" }],
  creator: "DNORA",
  publisher: "DNORA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/images/logo/dnora-d-icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "DNORA | Luxury Handbags & Modern Leather Goods",
    description:
      "Architectural silhouettes, meticulous craft, and modern luxury handbags.",
    url: "https://dnora.luxury",
    siteName: "DNORA",
    images: [
      {
        url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85",
        width: 1200,
        height: 630,
        alt: "DNORA Luxury Handbag Collection",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DNORA | Modern Luxury Handbags",
    description:
      "Architectural silhouettes, meticulous artisan craft, and modern women's handbags.",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Completely isolate /sys-diagnostics from storefront headers, bars, and scripts
  let isSysDiagnostics = false;
  try {
    const headerList = await headers();
    const pathname = headerList.get("x-pathname") || "";
    if (pathname.startsWith("/sys-diagnostics")) {
      isSysDiagnostics = true;
    }
  } catch {
    // fallback
  }

  if (isSysDiagnostics) {
    return (
      <html lang="en" className="h-full bg-[#FAFAFA] text-zinc-900" suppressHydrationWarning>
        <head>
          <title>System Operations & Infrastructure Portal | DNORA</title>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        <body className="min-h-full bg-[#FAFAFA] text-zinc-900 font-sans antialiased" suppressHydrationWarning>
          {children}
        </body>
      </html>
    );
  }

  // Check Site Status (Killswitch secondary safeguard)
  let hasDevBypass = false;
  try {
    const cookieStore = await cookies();
    hasDevBypass = Boolean(cookieStore.get("_dnora_dev_bypass")?.value);
  } catch {
    // cookies() unavailable in static prerender
  }

  let siteStatus: { status: "online" | "terminated"; message?: string } | null = null;
  try {
    siteStatus = await store.getSiteStatus();
  } catch {
    // fallback to online
  }

  if (siteStatus?.status === "terminated" && !hasDevBypass) {
    const trace = siteStatus.message || "503 Service Unavailable: Database cluster connection timeout.";
    return (
      <html lang="en">
        <head>
          <title>503 Service Temporarily Unavailable</title>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        <body style={{ margin: 0, padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", background: "#fafafa", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ maxWidth: "620px", width: "100%", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "40px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "inline-block", padding: "2px 8px", borderRadius: "4px", background: "#fee2e2", color: "#991b1b", fontWeight: 600, fontSize: "12px", marginBottom: "8px" }}>HTTP 503</div>
            <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#111827", borderBottom: "1px solid #f3f4f6", paddingBottom: "16px", margin: "0 0 16px 0" }}>503 Service Temporarily Unavailable</h1>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#4b5563", margin: "0 0 16px 0" }}>The server is temporarily unable to service your request due to maintenance downtime or capacity problems. Please try again later.</p>
            <div style={{ marginTop: "24px", padding: "16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", fontFamily: "monospace", fontSize: "11px", color: "#6b7280", lineHeight: "1.8" }}>
              <div>Server: cloudflare-nginx / vercel-edge</div>
              <div>Cluster: AWS-0-AP-NE-1 (Database Timeout)</div>
              <div>Diagnostic Trace: {trace}</div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  let announcementConfig: AnnouncementConfig | null = null;
  let initialNavCategories: NavCategory[] | undefined = undefined;
  try {
    const [annCfg, navRes] = await Promise.all([
      store.getAnnouncementsConfig().catch(() => null),
      db.query(`SELECT items FROM public.site_navigation_config WHERE id = 'storefront' LIMIT 1`).catch(() => ({ rows: [] })),
    ]);
    announcementConfig = annCfg;
    if (navRes.rows.length > 0 && Array.isArray(navRes.rows[0].items)) {
      initialNavCategories = navRes.rows[0].items
        .filter((item: any) => item.is_active)
        .map((item: any) => ({
          id: item.id,
          label: item.label,
          href: item.href || "/shop",
          badge: item.badge,
          subcategories:
            item.submenus && item.submenus.length > 0
              ? [
                  {
                    title: "EXPLORE EDITS",
                    items: item.submenus.map((s: any) => ({
                      label: s.label,
                      href: s.href,
                      badge: s.badge,
                    })),
                  },
                ]
              : undefined,
        }));
    }
  } catch (err) {
    console.error("Failed to prefetch header data:", err);
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${inter.variable} ${montserrat.variable} h-full`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cinzel:wght@400..900&family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:ital,wght@0,400..900;1,400..900&family=Italiana&family=Lora:ital,wght@0,400..700;1,400..700&family=Marcellus&family=Montserrat:wght@400;600;700;800&family=Oswald:wght@500;600;700&family=Outfit:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Prata&family=Space+Grotesk:wght@400..700&family=Syne:wght@500;700;800&family=Tenor+Sans&family=Urbanist:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-white text-[#0E0E0E] antialiased selection:bg-[#0E0E0E] selection:text-white">
        <Suspense fallback={null}>
          <GlobalPreloader />
        </Suspense>
        <LiveVisitorHeartbeat />
        <WishlistProvider>
          <CartProvider>
            <AnnouncementBar initialConfig={announcementConfig} />
            <TopBar initialNavCategories={initialNavCategories} />
            <div className="flex-1 flex flex-col min-h-[70vh]">{children}</div>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </WishlistProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
