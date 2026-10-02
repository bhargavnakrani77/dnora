# DNORA — System Architecture & Component Design

This document details the architectural decisions, component graph, state boundaries, and data flow of the DNORA luxury e-commerce platform.

---

## High-Level Architecture

```mermaid
graph TD
    Client[Browser / User Device] --> CDN[Vercel Edge Network / Next.js]
    CDN --> AppRouter[Next.js App Router]
    
    subgraph Storefront [Storefront Routes: / , /shop, /product/:slug]
        AppRouter --> Layout[StorefrontLayout + CartProvider + ToastProvider]
        Layout --> Nav[Navbar + SearchModal + CartDrawer]
        Layout --> Home[HomePage 9-Section Flow]
        Layout --> Catalog[Shop Catalog Page]
        Layout --> PDP[ProductDetailPage]
    end

    subgraph AdminSuite [Admin Routes: /admin/*]
        AppRouter --> AdminMW[Admin Session Guard Middleware]
        AdminMW --> AdminLayout[AdminLayout + AdminSidebar + AdminHeader]
        AdminLayout --> Dashboard[Executive Overview Dashboard]
        AdminLayout --> HeroMgr[Hero Banner Manager + Live Simulator]
        AdminLayout --> ProdMgr[Product Manager + Flag Toggles]
    end

    subgraph APIRoutes [API Route Handlers: /api/*]
        AppRouter --> AuthAPI[/api/auth/login & logout]
        AppRouter --> HeroesAPI[/api/heroes & /api/heroes/:id/publish]
        AppRouter --> ProductsAPI[/api/products & /api/products/:id/toggle]
        AppRouter --> MediaAPI[/api/media/upload]
    end

    subgraph DataServices [Data & Media Services]
        HeroesAPI --> DataStore[DataStore Repository / Supabase Client]
        ProductsAPI --> DataStore
        MediaAPI --> CloudinarySDK[Cloudinary Node SDK]
        DataStore --> SupabasePG[(Supabase PostgreSQL + RLS)]
        CloudinarySDK --> CloudinaryStorage[(Cloudinary Media Storage)]
    end
```

---

## Directory Structure

```
dnoralifestyle/
├── admin/                           # Admin Domain Module
│   ├── components/index.ts          # Barrel Exports for Admin Components
│   └── services/                    # Admin Catalog, Customers, Orders Services
├── storefront/                      # Storefront Domain Module
│   ├── components/index.ts          # Barrel Exports for Storefront Touchpoints
│   └── services/                    # Storefront Catalog & Homepage Data Services
├── member/                          # Member Domain Module
│   ├── components/index.ts          # Member Drawer & Account Client Barrels
│   └── services/                    # Customer Authentication & Profile Services
├── shared/                          # Cross-Cutting Core Module
│   ├── components/index.ts          # Shared UI: BrandLogo, LuxuryPageLoader, Toast, Modal, Skeleton
│   ├── config/                      # Global Site & Asset Configurations
│   ├── utils/                       # Shared Formatting & Classnames
│   └── validators/                  # Shared Input & Form Validators
├── app/                             # Next.js App Router
│   ├── (storefront)/
│   │   ├── layout.tsx               # Storefront Layout (TopBar, Navbar, CartDrawer, Footer)
│   │   ├── loading.tsx              # Storefront Streaming Fallback (LuxuryPageLoader)
│   │   ├── page.tsx                 # Luxury Homepage Flow
│   │   ├── shop/page.tsx            # Handbag Catalog with Category Tabs & Sorting
│   │   ├── category/[slug]/page.tsx # Category Silhouette Catalog
│   │   ├── account/page.tsx         # Patron Account Suite
│   │   └── product/[slug]/
│   │       ├── page.tsx             # PDP Server Component (SEO metadata, specifications)
│   │       └── ProductDetailClient.tsx # PDP Client Component (Gallery, Cart Controls)
│   ├── admin/
│   │   ├── layout.tsx               # Admin Layout (Sidebar, Header, ToastProvider)
│   │   ├── loading.tsx              # Admin Streaming Fallback (LuxuryPageLoader)
│   │   ├── page.tsx                 # Executive Dashboard with Customization Hub Cards
│   │   ├── login/page.tsx           # Admin Authentication View
│   │   ├── customization/[section]/ # Customizer Studio (Announcement, Hero, Categories, Bestsellers, etc.)
│   │   ├── heroes/page.tsx          # Hero Banner Manager
│   │   ├── products/page.tsx        # Product Manager with Table & Toggles
│   │   ├── orders/page.tsx          # Orders & Fulfillment Manager
│   │   └── customers/page.tsx       # Customer CRM Directory
│   ├── api/                         # Backend Route Handlers
│   │   ├── auth/                    # Session Login/Logout & User Auth
│   │   ├── heroes/                  # Hero Banner CRUD & Revalidation
│   │   ├── products/                # Product CRUD & Filtering
│   │   ├── orders/                  # Order Processing & Tracking
│   │   ├── media/upload/            # Cloudinary Upload with MIME/Size Inspection
│   │   └── homepage-config/         # Landing Page Customization State Persister
│   ├── globals.css                  # Theme Tokens, Signature Stroke Keyframes & Shimmer
│   ├── layout.tsx                   # Root Layout with NavigationLoadingProvider
│   ├── loading.tsx                  # Global LuxuryPageLoader Transition Fallback
│   ├── robots.ts                    # Search Engine Crawling Rules
│   └── sitemap.ts                   # Dynamic XML Sitemap Generator
├── components/                      # Component Implementations
│   ├── account/                     # AccountClient
│   ├── admin/                       # AdminHeader, AdminSidebar, CustomizationManager, ProductEditor
│   │   └── customization/           # Section Managers (Announcement, Hero, Category, Reviews, etc.)
│   ├── hero/                        # Cinematic HeroSlider
│   ├── seo/                         # StructuredData JSON-LD
│   ├── storefront/                  # Navbar, Footer, ProductCard, CartDrawer, MemberDrawer, etc.
│   └── ui/                          # BrandLogo, LuxuryPageLoader, NavigationLoadingProvider, ProductCardSkeleton, Toast
└── lib/                             # Backend Logic & Core Infrastructure
    ├── auth/                        # Server Sessions & Token Verification
    ├── cloudinary/                  # Cloudinary SDK & Transformations
    ├── data/                        # store.ts (Unified DAL) & seed-data.ts
    ├── db/                          # PostgreSQL Connection Pool (db.ts)
    ├── email/                       # Transactional Email Notifiers
    ├── store/                       # Cart & Wishlist Client Stores
    └── supabase/                    # Supabase Client & PostgreSQL Schema
```

---

## State Management Boundaries

1. **Server State (Database / Store)**: Handbag inventory, category taxonomy, active hero slides, and customer testimonials are fetched on the server using Next.js Server Components.
2. **Client State (Shopping Bag)**: Managed via `CartProvider` in `lib/store/cart-store.tsx`. Tracks items, quantities, subtotal, and calculates the free worldwide shipping progress threshold ($250). Persisted to `localStorage`.
3. **Admin State**: Interactive modals, draft/publish toggles, search filters, and file upload progress states are isolated within client components using lightweight React hooks (`useState`, `useCallback`, `useRef`).
