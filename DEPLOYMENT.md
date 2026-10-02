# DNORA — Production Deployment Guide (Vercel & Supabase)

This guide walks through deploying the DNORA luxury e-commerce platform to **Vercel** with **Supabase PostgreSQL** and **Cloudinary**.

---

## Step 1: Provision Supabase Database

1. Navigate to [Supabase](https://supabase.com) and create a new project (e.g. `dnora-production`).
2. Open the **SQL Editor** in the Supabase dashboard.
3. Paste and execute the contents of [`lib/supabase/schema.sql`](lib/supabase/schema.sql). This will create all tables, indexes, RLS policies, and seed data.
4. Obtain your API credentials from **Project Settings &gt; API**:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

---

## Step 2: Provision Cloudinary

1. Sign in to your [Cloudinary Console](https://cloudinary.com).
2. Copy your credentials from the Dashboard:
   - `Cloud Name`
   - `API Key`
   - `API Secret`
3. Ensure unsigned or authenticated uploads to `dnora/*` folders are permitted.

---

## Step 3: Deploy to Vercel

1. Push your DNORA repository to GitHub / GitLab.
2. Log into [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your DNORA repository.
4. Configure the **Environment Variables** in the Vercel deployment wizard:

| Variable Name | Value Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role secret |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `NEXT_PUBLIC_SITE_URL` | Your production custom domain (e.g., `https://dnora.luxury`) |
| `ADMIN_EMAIL` | Admin login email (`admin@dnora.luxury`) |

5. Click **Deploy**. Vercel will run Turbopack compilation and generate all static pages and edge routes.

---

## Step 4: Verification & Cache Invalidation

Once deployed:
1. Visit your live domain. Verify the top bar, dual-media hero slider, category cards, Best Sellers, and Seen On You vertical videos.
2. Navigate to `/admin/login` and authenticate with administrative credentials.
3. Edit or publish a hero banner from the **Hero Banner Manager**. Verify that the change updates the live storefront instantly without redeployment (`revalidatePath('/')` ensures real-time invalidation).

---

## Step 5: Deploy to Render (Low Memory / 512 MB Optimization)

When deploying to [Render](https://render.com) Web Services on the Free or Starter tier (512 MB RAM):

### Settings in Render Dashboard
| Field | Value |
|---|---|
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |

### Required Environment Variables on Render
| Variable Name | Value | Purpose |
|---|---|---|
| `NODE_OPTIONS` | `--max-old-space-size=384` | Forces Node V8 garbage collection under 384 MB so memory never hits Render's 512 MB container limit |
| `NODE_ENV` | `production` | Production mode |
| `DATABASE_URL` | Your PostgreSQL connection string | Database pooler |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous public key | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role secret | Service role key |
| `SESSION_SECRET` | High-entropy random string (32+ chars) | Session encryption |
| `ADMIN_PASSWORD` | Secure password | Admin panel |
| `ADMIN_EMAIL` | Admin email | Admin user |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name | Media delivery |
| `CLOUDINARY_API_KEY` | Cloudinary key | Media API |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | Media API |
| `NEXT_PUBLIC_SITE_URL` | Your live Render domain (e.g., `https://dnora.onrender.com`) | Canonical URL |

### Memory Optimizations Applied in Code
1. **Direct CDN Image Delivery**: `images: { unoptimized: true }` in `next.config.ts` prevents Node.js from buffering and re-encoding high-resolution images in memory. Images stream directly from Cloudinary CDN edge.
2. **V8 Max Old Space Limit**: Set to 384 MB to ensure garbage collection fires before reaching the 512 MB threshold.
3. **Singleton Pool**: Singleton PostgreSQL connection pool with `max: 5` concurrent connections to avoid socket buffer bloat.

