# DNORA — Modern Minimal Luxury Fashion E-Commerce

DNORA is an enterprise-grade, modern minimal luxury fashion e-commerce application designed and engineered for premier women's designer handbags. Built with Next.js 16 (Turbopack), TypeScript (Strict Mode), Tailwind CSS v4, Supabase PostgreSQL, and Cloudinary.

---

## Architecture Overview

The repository is organized following high-cohesion domain separation across four distinct boundaries:

```
dnoralifestyle/
├── admin/                      # Executive Administration Domain
│   ├── components/             # Reusable admin UI (barrels in index.ts)
│   ├── services/               # Admin business logic & CRM / Catalog CRUD
│   │   ├── admin-catalog.service.ts
│   │   ├── admin-orders.service.ts
│   │   └── admin-customers.service.ts
│   └── routes/                 # Admin route handlers & controllers
├── storefront/                 # Public Luxury Fashion Storefront
│   ├── components/             # Storefront sections, drawers & carousels
│   ├── services/               # Public catalog queries & homepage configuration
│   │   ├── storefront-catalog.service.ts
│   │   └── homepage.service.ts
│   └── routes/                 # Storefront route definitions
├── member/                     # Authenticated Customer Account Area
│   ├── components/             # Member UI and drawers
│   ├── services/               # Address book & order history services
│   │   └── member-account.service.ts
│   └── routes/                 # Member account routes
├── shared/                     # Cross-Domain Enterprise Core
│   ├── components/             # Foundational UI (Logo, Toast, Modal, Badge)
│   ├── config/                 # Typed environment validation (env.ts)
│   ├── utils/                  # Standardized API responses & formatting
│   └── validators/             # Zod validation schemas (orders, products, addresses)
├── proxy.ts                    # Edge-level middleware proxy protecting /admin & /api/admin
└── app/                        # Next.js 16 App Router endpoints & page entry points
```

---

## Security & Defense-In-Depth

1. **Edge Proxy Protection (`proxy.ts`)**:
   - Every request to `/admin/*` and `/api/admin/*` is intercepted at the edge.
   - Unauthorized UI navigation is redirected to `/admin/login`.
   - Unauthorized API requests are halted immediately with `{ "success": false, "error": "Unauthorized" }` (HTTP 401).

2. **Server-Side Session Verification**:
   - Admin authentication uses cryptographically signed, HTTP-only session cookies with expiration checks (`lib/auth/session.ts`).
   - Customer accounts support Supabase Auth with OAuth callbacks and phone OTP verification.

3. **Input Sanitization & Schema Validation**:
   - All critical mutations (orders, products, categories, saved addresses) are validated via Zod schemas in `@/shared/validators`.
   - Database operations use parameterized queries (`pg`) preventing SQL injection.

4. **Zero Frontend Secret Leaks**:
   - Database connection strings, Supabase service roles, and Cloudinary API secrets are strictly isolated to server runtimes.
   - Verified clean browser DevTools and console output.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.3.5 (App Router with Turbopack) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS v4 + Curated Monochromatic Luxury Tokens |
| **Database** | PostgreSQL (Supabase) via connection pooling (`pg`) |
| **Media Engine** | Cloudinary CDN (Automated responsive formats & optimization) |
| **Icons** | Lucide React |
| **Validation** | Zod v4 |
| **State Management**| React 19 `useSyncExternalStore` for reactive persistent cart |

---

## Environment Configuration

Create `.env.local` or provide server environment variables:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/dbname"
DATABASE_SSL="false"             # Set to "true" in hosted environments like Render/Neon

# Supabase Auth & Storage
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Cloudinary Media Management
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Admin Authentication
ADMIN_SECRET="your-secure-random-hmac-secret-at-least-32-chars"
```

The application automatically validates environment integrity at startup via `shared/config/env.ts`.

---

## Development & Production Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run strict ESLint checks (0 errors, 0 warnings standard)
npm run lint

# Compile production build (All 34 static and dynamic routes)
npm run build

# Start production server
npm run start
```

---

## Architecture Standards & Conventions

1. **Layered Flow**:
   `Route Handler (app/api/...)` → `Service Domain (@/admin, @/storefront, @/member)` → `Database Pool (@/lib/db)` → `Standardized JSON Response (@/shared/utils/api-response)`.

2. **React 19 & Next.js 16 Standards**:
   - No unconditional early returns before hook calls.
   - All asynchronous data fetching inside client effects utilizes cleanup cancellation flags (`let ignore = false;`).
   - Pure state initialization avoids cascading renders.
   - Re-exports through path aliases `@/admin/*`, `@/storefront/*`, `@/member/*`, `@/shared/*`.
