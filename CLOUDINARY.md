# DNORA — Cloudinary Media Pipeline & Transformation Architecture

DNORA offloads all binary media assets (hero videos, editorial photography, handbag product shots, customer videos, and review portraits) to **Cloudinary**. Supabase retains only the metadata (`public_id`, `secure_url`, and dimension specifications).

---

## Folder Organization

Assets are systematically partitioned within Cloudinary to prevent root contamination:

```
dnora/
├── heroes/           # High-resolution 4K/2K banner images and 1080p looped MP4 videos
├── products/         # Handbag studio shots, angle variations, and leather macro close-ups
├── reviews/          # Verified buyer customer avatars
└── customer-videos/  # 9:16 vertical MP4 reels for "Seen On You"
```

---

## Media Upload Architecture

Uploads are executed securely through the server-side API route:
`POST /api/media/upload`

### Safeguards Implemented:
1. **Server-Side Authorization**: Invokes `verifyAdminSession()`. Non-administrators are rejected with HTTP 401 Unauthorized.
2. **MIME Type Inspection**:
   - Images allowed: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
   - Videos allowed: `video/mp4`, `video/webm`, `video/quicktime`
3. **File Size Limits**:
   - Image maximum: **10 MB**
   - Video maximum: **50 MB**
4. **Direct Cloudinary Stream**: Files are streamed into Cloudinary using `cloudinary.uploader.upload_stream`. Secret API keys are never exposed to the client browser.

---

## Responsive Transformation Presets

Dynamic transformation builders are located in [`lib/cloudinary/transformations.ts`](lib/cloudinary/transformations.ts):

| Preset Function | Transformations Applied | Intended Touchpoint |
|---|---|---|
| `getProductThumbnailUrl(url)` | `w_160,h_160,c_fill,q_auto,f_auto` | Cart drawer, search results, admin tables |
| `getProductCardUrl(url)` | `w_800,c_limit,q_auto:good,f_auto` | Best Sellers & New Arrivals grids |
| `getProductHeroUrl(url)` | `w_1600,c_limit,q_auto:best,f_auto` | Product Detail Page main display |
| `getCategoryCardUrl(url)` | `w_1000,h_1200,c_fill,q_auto:good,f_auto` | Editorial category grid cards |

### Automated Format & Quality Negotiation
By injecting `f_auto,q_auto`, Cloudinary automatically serves:
- **AVIF** to modern Chromium / Safari browsers for optimal compression
- **WebP** as a fallback
- Compressed **JPEG** for legacy browsers
- Retina DPR scaling via `dpr_auto` where supported
