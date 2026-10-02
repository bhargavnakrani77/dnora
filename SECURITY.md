# DNORA — Security Architecture & Hardening Guide

Security in DNORA is designed around zero-trust client assumptions, defense-in-depth, and strict administrative role verification.

---

## Security Principles & Implementations

### 1. Server-Side Administrative Authorization
- **No Client-Side Trust**: Client-side state is strictly for rendering UI state. All mutating actions (creating products, updating hero banners, toggling flags, deleting assets) are guarded on the server via `verifyAdminSession()`.
- **Protected Routes**: Next.js middleware intercepts all requests matching `/admin/:path*` (except `/admin/login`) and verifies authentication before rendering.
- **HTTP-Only Cookies**: Administrative session tokens are stored with `httpOnly: true`, `secure: true` (in production), and `sameSite: 'lax'` to prevent Cross-Site Scripting (XSS) extraction.

### 2. Database Protection (Supabase Row Level Security)
- **RLS Enabled on All Tables**: No table permits blanket public writes.
- **Read Segmentation**: Unauthenticated visitors can only read products with `status = 'active'` and hero banners with `status = 'published' AND is_active = true`.
- **Security Definer Function**: Administrative access is evaluated via `public.is_admin()`, which inspects the user's role directly within the PostgreSQL context.

### 3. Media Upload Hardening
- **Strict File Type Verification**: Restricts uploads to verified MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `video/mp4`, `video/webm`).
- **File Size Caps**: Rejects image files exceeding 10MB and videos exceeding 50MB before uploading to Cloudinary.
- **Isolated Credentials**: `CLOUDINARY_API_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are strictly server-side environment variables and are never bundled into client JavaScript.

### 4. Input Validation & Sanitization
- **Zod Schemas**: Every payload sent to `/api/heroes` and `/api/products` is validated against strict Zod definitions (`lib/validation/hero.ts`, `lib/validation/product.ts`).
- **SQL Injection Prevention**: Supabase client uses parameterized PostgreSQL queries.
- **SEO & Search Sanitization**: Slugs and search terms are sanitized with regex character stripping (`lib/utils.ts`).
