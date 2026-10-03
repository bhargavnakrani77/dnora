import {
  Product,
  HeroBanner,
  ProductCategory,
  CustomerReview,
  SeenOnYouVideo,
  AdminDashboardStats,
  Order,
  OrderItem,
  HomepageConfig,
  AnnouncementConfig,
  AnnouncementItem,
  CircularCollectionItem,
  HomepageSection,
  TrendingNowItem,
  ShippingConfig,
  StorefrontPageConfig,
} from "@/types";
import { db } from "@/lib/db";
import { slugify } from "../utils";
import { SEED_PRODUCTS } from "./seed-data";


class DataStore {
  // HERO BANNERS
  async getHeroBanners(includeDrafts: boolean = false): Promise<HeroBanner[]> {
    try {
      let query = `SELECT * FROM public.hero_banners`;
      if (!includeDrafts) {
        query += ` WHERE status = 'published' AND is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now())`;
      }
      query += ` ORDER BY sort_order ASC, created_at DESC`;
      const res = await db.query(query);
      return res.rows.map((row) => ({
        ...row,
        duration_seconds: Number(row.duration_seconds || 5),
        sort_order: Number(row.sort_order || 0),
        is_active: Boolean(row.is_active),
      }));
    } catch (err) {
      console.error("Error fetching hero banners from database:", err);
      return [];
    }
  }

  async getHeroBannerById(id: string): Promise<HeroBanner | null> {
    try {
      const res = await db.query(`SELECT * FROM public.hero_banners WHERE id = $1 LIMIT 1`, [id]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        ...row,
        duration_seconds: Number(row.duration_seconds || 5),
        sort_order: Number(row.sort_order || 0),
        is_active: Boolean(row.is_active),
      };
    } catch (err) {
      console.error("Error fetching hero banner by ID:", err);
      return null;
    }
  }

  async createHeroBanner(data: Omit<HeroBanner, "id" | "created_at" | "updated_at">): Promise<HeroBanner> {
    const res = await db.query(
      `INSERT INTO public.hero_banners 
        (title, heading, subtitle, media_type, cloudinary_public_id, media_url, tablet_media_url, mobile_media_url, button_text, button_link, duration_seconds, sort_order, is_active, status, text_alignment, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        data.title,
        data.heading || null,
        data.subtitle || null,
        data.media_type,
        data.cloudinary_public_id || null,
        data.media_url,
        data.tablet_media_url || null,
        data.mobile_media_url || null,
        data.button_text ?? null,
        data.button_link || "/shop",
        data.duration_seconds || 5,
        data.sort_order || 0,
        data.is_active ?? true,
        data.status || "draft",
        data.text_alignment || "left",
        data.start_date || null,
        data.end_date || null,
      ]
    );
    return res.rows[0];
  }

  async updateHeroBanner(id: string, updates: Partial<HeroBanner>): Promise<HeroBanner | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let i = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key !== "id" && key !== "created_at" && val !== undefined) {
        fields.push(`${key} = $${i}`);
        values.push(val);
        i++;
      }
    }

    if (fields.length === 0) return this.getHeroBannerById(id);

    fields.push(`updated_at = now()`);
    values.push(id);

    const res = await db.query(
      `UPDATE public.hero_banners SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  async deleteHeroBanner(id: string): Promise<boolean> {
    try {
      const res = await db.query(`DELETE FROM public.hero_banners WHERE id = $1`, [id]);
      return (res.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async setHeroPublishStatus(id: string, status: "published" | "draft" | "archived"): Promise<HeroBanner | null> {
    return this.updateHeroBanner(id, {
      status,
      is_active: status === "published",
    });
  }

  // CIRCULAR COLLECTIONS ("Our Collections")
  async getCircularCollections(includeInactive: boolean = false): Promise<CircularCollectionItem[]> {
    try {
      let query = `SELECT * FROM public.circular_collections`;
      if (!includeInactive) {
        query += ` WHERE is_active = true`;
      }
      query += ` ORDER BY sort_order ASC, created_at ASC`;
      const res = await db.query(query);
      return res.rows.map((row) => ({
        id: row.id,
        label: row.label,
        href: row.href,
        image: row.image,
        badge: row.badge || undefined,
        alt: row.alt || undefined,
        sort_order: Number(row.sort_order || 0),
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (err) {
      console.error("Error fetching circular collections from database:", err);
      return [];
    }
  }

  async getCircularCollectionById(id: string): Promise<CircularCollectionItem | null> {
    try {
      const res = await db.query(`SELECT * FROM public.circular_collections WHERE id = $1 LIMIT 1`, [id]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        label: row.label,
        href: row.href,
        image: row.image,
        badge: row.badge || undefined,
        alt: row.alt || undefined,
        sort_order: Number(row.sort_order || 0),
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (err) {
      console.error("Error fetching circular collection by id:", err);
      return null;
    }
  }

  async createCircularCollection(data: {
    label: string;
    href: string;
    image: string;
    badge?: string;
    alt?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<CircularCollectionItem> {
    const res = await db.query(
      `INSERT INTO public.circular_collections (label, href, image, badge, alt, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.label.trim(),
        data.href.trim(),
        data.image.trim(),
        data.badge?.trim() || null,
        data.alt?.trim() || null,
        data.sort_order ?? 0,
        data.is_active ?? true,
      ]
    );
    const row = res.rows[0];
    return {
      id: row.id,
      label: row.label,
      href: row.href,
      image: row.image,
      badge: row.badge || undefined,
      alt: row.alt || undefined,
      sort_order: Number(row.sort_order || 0),
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async updateCircularCollection(
    id: string,
    updates: Partial<{
      label: string;
      href: string;
      image: string;
      badge: string | null;
      alt: string | null;
      sort_order: number;
      is_active: boolean;
    }>
  ): Promise<CircularCollectionItem | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let i = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        fields.push(`${key} = $${i}`);
        values.push(val);
        i++;
      }
    }

    if (fields.length === 0) return this.getCircularCollectionById(id);

    fields.push(`updated_at = now()`);
    values.push(id);

    const res = await db.query(
      `UPDATE public.circular_collections SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      label: row.label,
      href: row.href,
      image: row.image,
      badge: row.badge || undefined,
      alt: row.alt || undefined,
      sort_order: Number(row.sort_order || 0),
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async deleteCircularCollection(id: string): Promise<boolean> {
    try {
      const res = await db.query(`DELETE FROM public.circular_collections WHERE id = $1`, [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error("Error deleting circular collection:", err);
      return false;
    }
  }

  // PRODUCTS
  async getProducts(filter?: {
    status?: string;
    is_best_seller?: boolean;
    is_new_arrival?: boolean;
    category_slug?: string;
    search?: string;
  }): Promise<Product[]> {
    try {
      const conditions: string[] = ["1=1"];
      const params: (string | number | boolean)[] = [];
      let idx = 1;

      if (filter?.status && filter.status !== "all") {
        conditions.push(`p.status = $${idx++}`);
        params.push(filter.status);
      } else if (!filter?.status) {
        conditions.push(`p.status = 'active'`);
      }

      if (filter?.is_best_seller !== undefined) {
        conditions.push(`COALESCE(pf.is_best_seller, false) = $${idx++}`);
        params.push(filter.is_best_seller);
      }

      if (filter?.is_new_arrival !== undefined) {
        conditions.push(`COALESCE(pf.is_new_arrival, false) = $${idx++}`);
        params.push(filter.is_new_arrival);
      }

      if (filter?.search) {
        conditions.push(
          `(LOWER(p.name) LIKE $${idx} OR LOWER(p.short_description) LIKE $${idx} OR LOWER(p.sku) LIKE $${idx})`
        );
        params.push(`%${filter.search.toLowerCase()}%`);
        idx++;
      }

      if (filter?.category_slug) {
        conditions.push(`
          EXISTS (
            SELECT 1 FROM public.product_category_relations pcr
            JOIN public.product_categories cat ON cat.id = pcr.category_id
            WHERE pcr.product_id = p.id AND cat.slug = $${idx++}
          )
        `);
        params.push(filter.category_slug);
      }

      const sql = `
        SELECT p.*,
          COALESCE(pf.is_best_seller, false) as is_best_seller,
          COALESCE(pf.is_new_arrival, false) as is_new_arrival,
          COALESCE(pf.sort_order, 0) as sort_order,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pi.id,
                'secure_url', pi.secure_url,
                'cloudinary_public_id', pi.cloudinary_public_id,
                'alt_text', pi.alt_text,
                'sort_order', pi.sort_order
              ) ORDER BY pi.sort_order ASC
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::json
          ) as images,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', cat.id,
                  'name', cat.name,
                  'slug', cat.slug,
                  'description', cat.description,
                  'image_url', cat.image_url
                )
              )
              FROM public.product_category_relations pcr
              JOIN public.product_categories cat ON cat.id = pcr.category_id
              WHERE pcr.product_id = p.id
            ),
            '[]'::json
          ) as categories
        FROM public.products p
        LEFT JOIN public.product_flags pf ON pf.product_id = p.id
        LEFT JOIN public.product_images pi ON pi.product_id = p.id
        WHERE ${conditions.join(" AND ")}
        GROUP BY p.id, pf.is_best_seller, pf.is_new_arrival, pf.sort_order
        ORDER BY COALESCE(pf.sort_order, 0) ASC, p.created_at DESC
      `;

      const res = await db.query(sql, params);
      const rows = res.rows.map((row) => ({
        ...row,
        price: Number(row.price),
        compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null,
        cost_price: row.cost_price !== undefined && row.cost_price !== null ? Number(row.cost_price) : null,
        stock: Number(row.stock),
        color_variants:
          typeof row.color_variants === "string"
            ? JSON.parse(row.color_variants)
            : Array.isArray(row.color_variants)
            ? row.color_variants
            : [],
        categories: Array.isArray(row.categories) ? row.categories : [],
      }));

      if (rows.length === 0) {
        let seed = [...SEED_PRODUCTS];
        if (filter?.is_best_seller !== undefined) {
          seed = seed.filter((p) => !!p.is_best_seller === filter.is_best_seller);
        }
        if (filter?.is_new_arrival !== undefined) {
          seed = seed.filter((p) => !!p.is_new_arrival === filter.is_new_arrival);
        }
        if (filter?.category_slug) {
          seed = seed.filter((p) => p.categories?.some((c: { slug?: string }) => c.slug === filter.category_slug));
        }
        return seed;
      }

      return rows;
    } catch (err) {
      console.error("Error fetching products from database:", err);
      let seed = [...SEED_PRODUCTS];
      if (filter?.is_best_seller !== undefined) {
        seed = seed.filter((p) => !!p.is_best_seller === filter.is_best_seller);
      }
      if (filter?.is_new_arrival !== undefined) {
        seed = seed.filter((p) => !!p.is_new_arrival === filter.is_new_arrival);
      }
      return seed;
    }
  }

  async getAllAdminProducts(search?: string, categorySlug?: string): Promise<Product[]> {
    return this.getProducts({
      status: undefined,
      search,
      category_slug: categorySlug,
    });
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const sql = `
        SELECT p.*,
          COALESCE(pf.is_best_seller, false) as is_best_seller,
          COALESCE(pf.is_new_arrival, false) as is_new_arrival,
          COALESCE(pf.sort_order, 0) as sort_order,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pi.id,
                'secure_url', pi.secure_url,
                'cloudinary_public_id', pi.cloudinary_public_id,
                'alt_text', pi.alt_text,
                'sort_order', pi.sort_order
              ) ORDER BY pi.sort_order ASC
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::json
          ) as images,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', cat.id,
                  'name', cat.name,
                  'slug', cat.slug,
                  'description', cat.description,
                  'image_url', cat.image_url
                )
              )
              FROM public.product_category_relations pcr
              JOIN public.product_categories cat ON cat.id = pcr.category_id
              WHERE pcr.product_id = p.id
            ),
            '[]'::json
          ) as categories
        FROM public.products p
        LEFT JOIN public.product_flags pf ON pf.product_id = p.id
        LEFT JOIN public.product_images pi ON pi.product_id = p.id
        WHERE p.slug = $1 OR p.id::text = $1
        GROUP BY p.id, pf.is_best_seller, pf.is_new_arrival, pf.sort_order
        LIMIT 1
      `;
      const res = await db.query(sql, [slug]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        ...row,
        price: Number(row.price),
        compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null,
        cost_price: row.cost_price !== undefined && row.cost_price !== null ? Number(row.cost_price) : null,
        stock: Number(row.stock),
        color_variants:
          typeof row.color_variants === "string"
            ? JSON.parse(row.color_variants)
            : Array.isArray(row.color_variants)
            ? row.color_variants
            : [],
        categories: Array.isArray(row.categories) ? row.categories : [],
      };
    } catch (err) {
      console.error("Error fetching product by slug from database:", err);
      return null;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const sql = `
        SELECT p.*,
          COALESCE(pf.is_best_seller, false) as is_best_seller,
          COALESCE(pf.is_new_arrival, false) as is_new_arrival,
          COALESCE(pf.sort_order, 0) as sort_order,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pi.id,
                'secure_url', pi.secure_url,
                'cloudinary_public_id', pi.cloudinary_public_id,
                'alt_text', pi.alt_text,
                'sort_order', pi.sort_order
              ) ORDER BY pi.sort_order ASC
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::json
          ) as images,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', cat.id,
                  'name', cat.name,
                  'slug', cat.slug,
                  'description', cat.description,
                  'image_url', cat.image_url
                )
              )
              FROM public.product_category_relations pcr
              JOIN public.product_categories cat ON cat.id = pcr.category_id
              WHERE pcr.product_id = p.id
            ),
            '[]'::json
          ) as categories
        FROM public.products p
        LEFT JOIN public.product_flags pf ON pf.product_id = p.id
        LEFT JOIN public.product_images pi ON pi.product_id = p.id
        WHERE p.id = $1
        GROUP BY p.id, pf.is_best_seller, pf.is_new_arrival, pf.sort_order
        LIMIT 1
      `;
      const res = await db.query(sql, [id]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        ...row,
        price: Number(row.price),
        compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null,
        cost_price: row.cost_price !== undefined && row.cost_price !== null ? Number(row.cost_price) : null,
        stock: Number(row.stock),
        color_variants:
          typeof row.color_variants === "string"
            ? JSON.parse(row.color_variants)
            : Array.isArray(row.color_variants)
            ? row.color_variants
            : [],
        categories: Array.isArray(row.categories) ? row.categories : [],
      };
    } catch (err) {
      console.error("Error fetching product by ID from database:", err);
      return null;
    }
  }

  async createProduct(data: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
    const slug = data.slug || slugify(data.name);
    // Ensure color_variants, cost_price, and detail columns exist
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_variants JSONB DEFAULT '[]'::jsonb;`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT NULL;`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS craftsmanship_details TEXT DEFAULT NULL;`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS craftsmanship_heading TEXT DEFAULT NULL;`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS craftsmanship_mode TEXT DEFAULT 'bullets';`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_customs TEXT DEFAULT NULL;`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_heading TEXT DEFAULT NULL;`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_mode TEXT DEFAULT 'text';`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS leather_care TEXT DEFAULT NULL;`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS leather_heading TEXT DEFAULT NULL;`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS leather_mode TEXT DEFAULT 'text';`).catch(() => {});

    const res = await db.query(
      `INSERT INTO public.products 
        (name, slug, short_description, description, price, compare_at_price, cost_price, sku, stock, status, color_variants, craftsmanship_heading, craftsmanship_details, craftsmanship_mode, shipping_heading, shipping_customs, shipping_mode, leather_heading, leather_care, leather_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        data.name,
        slug,
        data.short_description || "",
        data.description || "",
        data.price,
        data.compare_at_price || null,
        data.cost_price !== undefined && data.cost_price !== null ? data.cost_price : null,
        data.sku,
        data.stock || 0,
        data.status || "draft",
        JSON.stringify(data.color_variants || []),
        data.craftsmanship_heading || null,
        data.craftsmanship_details || null,
        data.craftsmanship_mode || "bullets",
        data.shipping_heading || null,
        data.shipping_customs || null,
        data.shipping_mode || "text",
        data.leather_heading || null,
        data.leather_care || null,
        data.leather_mode || "text",
      ]
    );
    const prod = res.rows[0];

    // Flags
    await db.query(
      `INSERT INTO public.product_flags (product_id, is_best_seller, is_new_arrival, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id) DO UPDATE
       SET is_best_seller = EXCLUDED.is_best_seller,
           is_new_arrival = EXCLUDED.is_new_arrival,
           sort_order = EXCLUDED.sort_order`,
      [prod.id, !!data.is_best_seller, !!data.is_new_arrival, data.sort_order || 0]
    );

    // Images
    if (data.images && data.images.length > 0) {
      for (const img of data.images) {
        await db.query(
          `INSERT INTO public.product_images (product_id, cloudinary_public_id, secure_url, alt_text, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [prod.id, img.cloudinary_public_id, img.secure_url, img.alt_text, img.sort_order]
        );
      }
    }

    // Category relations
    if (data.categories && data.categories.length > 0) {
      for (const cat of data.categories) {
        if (cat.id) {
          await db.query(
            `INSERT INTO public.product_category_relations (product_id, category_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [prod.id, cat.id]
          );
        }
      }
    }

    return (await this.getProductById(prod.id))!;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_variants JSONB DEFAULT '[]'::jsonb;`).catch(() => {});
    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT NULL;`).catch(() => {});

    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let i = 1;

    if (updates.name && !updates.slug) {
      updates.slug = slugify(updates.name);
    }

    const prodCols: (keyof Product)[] = [
      "name", "slug", "short_description", "description",
      "craftsmanship_heading", "craftsmanship_details", "craftsmanship_mode",
      "shipping_heading", "shipping_customs", "shipping_mode",
      "leather_heading", "leather_care", "leather_mode",
      "price", "compare_at_price", "cost_price", "sku", "stock", "status"
    ];
    for (const col of prodCols) {
      const val = updates[col];
      if (val !== undefined) {
        if (col === "sku" && (!val || !String(val).trim())) {
          continue;
        }
        fields.push(`${col} = $${i}`);
        values.push(val as string | number | null);
        i++;
      }
    }

    if (updates.color_variants !== undefined) {
      fields.push(`color_variants = $${i}`);
      values.push(JSON.stringify(updates.color_variants || []));
      i++;
    }

    if (fields.length > 0) {
      fields.push(`updated_at = now()`);
      values.push(id);
      await db.query(`UPDATE public.products SET ${fields.join(", ")} WHERE id = $${i}`, values);
    }

    // Images
    if (updates.images !== undefined && Array.isArray(updates.images)) {
      await db.query(`DELETE FROM public.product_images WHERE product_id = $1`, [id]).catch(() => {});
      for (const img of updates.images) {
        await db.query(
          `INSERT INTO public.product_images (product_id, cloudinary_public_id, secure_url, alt_text, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, img.cloudinary_public_id, img.secure_url, img.alt_text || "", img.sort_order || 0]
        ).catch(() => {});
      }
    }

    // Update flags
    if (updates.is_best_seller !== undefined || updates.is_new_arrival !== undefined || updates.sort_order !== undefined) {
      await db.query(
        `INSERT INTO public.product_flags (product_id, is_best_seller, is_new_arrival, sort_order)
         VALUES ($1, COALESCE($2, false), COALESCE($3, false), COALESCE($4, 0))
         ON CONFLICT (product_id) DO UPDATE 
         SET is_best_seller = COALESCE($2, public.product_flags.is_best_seller),
             is_new_arrival = COALESCE($3, public.product_flags.is_new_arrival),
             sort_order = COALESCE($4, public.product_flags.sort_order)`,
        [id, updates.is_best_seller ?? null, updates.is_new_arrival ?? null, updates.sort_order ?? null]
      );
    }

    // Update Category relations
    if (updates.categories !== undefined) {
      await db.query(`DELETE FROM public.product_category_relations WHERE product_id = $1`, [id]);
      if (Array.isArray(updates.categories)) {
        for (const cat of updates.categories) {
          if (cat.id) {
            await db.query(
              `INSERT INTO public.product_category_relations (product_id, category_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [id, cat.id]
            );
          }
        }
      }
    }

    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await db.query(`DELETE FROM public.products WHERE id = $1`, [id]);
      return (res.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async toggleProductFlag(id: string, flag: "is_best_seller" | "is_new_arrival"): Promise<Product | null> {
    const prod = await this.getProductById(id);
    if (!prod) return null;

    const newVal = !prod[flag];
    await db.query(
      `INSERT INTO public.product_flags (product_id, ${flag}, sort_order)
       VALUES ($1, $2, 0)
       ON CONFLICT (product_id) DO UPDATE SET ${flag} = $2`,
      [id, newVal]
    );

    return this.getProductById(id);
  }

  // CATEGORIES
  async ensureCategoryColumns(): Promise<void> {
    try {
      await db.query(`
        ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
        ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS banner_mobile_image_url TEXT;
        ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS banner_heading TEXT;
        ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS banner_subtitle TEXT;
        ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS banner_media_type TEXT DEFAULT 'image';
        ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS banner_fit TEXT DEFAULT 'cover';
        ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS banner_position TEXT DEFAULT 'center';
        ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS banner_aspect_ratio TEXT DEFAULT 'storefront';
        ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS is_in_nav BOOLEAN DEFAULT true;
        ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS is_in_collections BOOLEAN DEFAULT true;
      `);
    } catch {
      // non-blocking
    }
  }

  async ensureCategoryBannerColumns(): Promise<void> {
    return this.ensureCategoryColumns();
  }

  async getCategories(includeUncategorized: boolean = false): Promise<ProductCategory[]> {
    try {
      await this.ensureCategoryColumns();
      const whereClause = !includeUncategorized ? "WHERE cat.slug != 'uncategorized'" : "";
      const res = await db.query(`
        SELECT cat.*,
          COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END)::int AS live_products_count,
          COUNT(DISTINCT p.id)::int AS total_products_count
        FROM public.product_categories cat
        LEFT JOIN public.product_category_relations pcr ON pcr.category_id = cat.id
        LEFT JOIN public.products p ON p.id = pcr.product_id
        ${whereClause}
        GROUP BY cat.id
        ORDER BY cat.created_at ASC
      `);
      return res.rows.map((row) => ({
        ...row,
        is_in_nav: row.is_in_nav ?? true,
        is_in_collections: row.is_in_collections ?? true,
        live_products_count: Number(row.live_products_count || 0),
        total_products_count: Number(row.total_products_count || 0),
        product_count: Number(row.live_products_count || 0),
      }));
    } catch (err) {
      console.error("Error fetching categories from database:", err);
      return [];
    }
  }

  async getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
    try {
      await this.ensureCategoryColumns();
      const res = await db.query(
        `SELECT cat.*,
          COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END)::int AS live_products_count,
          COUNT(DISTINCT p.id)::int AS total_products_count
        FROM public.product_categories cat
        LEFT JOIN public.product_category_relations pcr ON pcr.category_id = cat.id
        LEFT JOIN public.products p ON p.id = pcr.product_id
        WHERE cat.slug = $1
        GROUP BY cat.id
        LIMIT 1`,
        [slug]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        ...row,
        is_in_nav: row.is_in_nav ?? true,
        is_in_collections: row.is_in_collections ?? true,
        live_products_count: Number(row.live_products_count || 0),
        total_products_count: Number(row.total_products_count || 0),
        product_count: Number(row.live_products_count || 0),
      };
    } catch (err) {
      console.error("Error fetching category by slug:", err);
      return null;
    }
  }

  async getCategoryById(id: string): Promise<ProductCategory | null> {
    try {
      await this.ensureCategoryColumns();
      const res = await db.query(
        `SELECT cat.*,
          COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END)::int AS live_products_count,
          COUNT(DISTINCT p.id)::int AS total_products_count
        FROM public.product_categories cat
        LEFT JOIN public.product_category_relations pcr ON pcr.category_id = cat.id
        LEFT JOIN public.products p ON p.id = pcr.product_id
        WHERE cat.id = $1
        GROUP BY cat.id
        LIMIT 1`,
        [id]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        ...row,
        is_in_nav: row.is_in_nav ?? true,
        is_in_collections: row.is_in_collections ?? true,
        live_products_count: Number(row.live_products_count || 0),
        total_products_count: Number(row.total_products_count || 0),
        product_count: Number(row.live_products_count || 0),
      };
    } catch (err) {
      console.error("Error fetching category by id:", err);
      return null;
    }
  }

  async createCategory(data: {
    name: string;
    slug?: string;
    description?: string;
    image_url?: string;
    banner_image_url?: string;
    banner_mobile_image_url?: string;
    banner_heading?: string;
    banner_subtitle?: string;
    banner_media_type?: "image" | "video";
    is_in_nav?: boolean;
    is_in_collections?: boolean;
  }): Promise<ProductCategory> {
    await this.ensureCategoryColumns();
    const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.name);
    const res = await db.query(
      `INSERT INTO public.product_categories 
        (name, slug, description, image_url, banner_image_url, banner_mobile_image_url, banner_heading, banner_subtitle, banner_media_type, is_in_nav, is_in_collections)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.name.trim(),
        slug,
        data.description || null,
        data.image_url || null,
        data.banner_image_url || null,
        data.banner_mobile_image_url || null,
        data.banner_heading || null,
        data.banner_subtitle || null,
        data.banner_media_type || "image",
        data.is_in_nav ?? true,
        data.is_in_collections ?? true,
      ]
    );
    const cat = res.rows[0];
    await this.syncNavigationCategories();
    return {
      ...cat,
      is_in_nav: cat.is_in_nav ?? true,
      is_in_collections: cat.is_in_collections ?? true,
      live_products_count: 0,
      total_products_count: 0,
      product_count: 0,
    };
  }

  async updateCategory(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      image_url: string;
      banner_image_url: string;
      banner_mobile_image_url: string;
      banner_heading: string;
      banner_subtitle: string;
      banner_media_type: "image" | "video";
      banner_fit: "cover" | "contain";
      banner_position: string;
      banner_aspect_ratio: "storefront" | "natural" | "ultrawide" | "video";
      is_in_nav: boolean;
      is_in_collections: boolean;
    }>
  ): Promise<ProductCategory | null> {
    await this.ensureCategoryColumns();
    const updates: string[] = [];
    const params: (string | boolean | null)[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(data.name.trim());
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${idx++}`);
      params.push(slugify(data.slug));
    }
    if (data.description !== undefined) {
      updates.push(`description = $${idx++}`);
      params.push(data.description || null);
    }
    if (data.image_url !== undefined) {
      updates.push(`image_url = $${idx++}`);
      params.push(data.image_url || null);
    }
    if (data.banner_image_url !== undefined) {
      updates.push(`banner_image_url = $${idx++}`);
      params.push(data.banner_image_url || null);
    }
    if (data.banner_mobile_image_url !== undefined) {
      updates.push(`banner_mobile_image_url = $${idx++}`);
      params.push(data.banner_mobile_image_url || null);
    }
    if (data.banner_heading !== undefined) {
      updates.push(`banner_heading = $${idx++}`);
      params.push(data.banner_heading || null);
    }
    if (data.banner_subtitle !== undefined) {
      updates.push(`banner_subtitle = $${idx++}`);
      params.push(data.banner_subtitle || null);
    }
    if (data.banner_media_type !== undefined) {
      updates.push(`banner_media_type = $${idx++}`);
      params.push(data.banner_media_type || "image");
    }
    if (data.banner_fit !== undefined) {
      updates.push(`banner_fit = $${idx++}`);
      params.push(data.banner_fit || "cover");
    }
    if (data.banner_position !== undefined) {
      updates.push(`banner_position = $${idx++}`);
      params.push(data.banner_position || "center");
    }
    if (data.banner_aspect_ratio !== undefined) {
      updates.push(`banner_aspect_ratio = $${idx++}`);
      params.push(data.banner_aspect_ratio || "storefront");
    }
    if (data.is_in_nav !== undefined) {
      updates.push(`is_in_nav = $${idx++}`);
      params.push(Boolean(data.is_in_nav));
    }
    if (data.is_in_collections !== undefined) {
      updates.push(`is_in_collections = $${idx++}`);
      params.push(Boolean(data.is_in_collections));
    }

    if (updates.length === 0) return this.getCategoryById(id);

    params.push(id);
    const res = await db.query(
      `UPDATE public.product_categories SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );
    const updated = res.rows[0] || null;

    if (updated && (data.image_url !== undefined || data.name !== undefined)) {
      try {
        const newImg = data.image_url !== undefined ? (data.image_url ? String(data.image_url).trim() : null) : null;
        if (newImg) {
          await db.query(
            `UPDATE public.circular_collections 
             SET image = $1 
             WHERE href ILIKE $2 OR label ILIKE $3`,
            [newImg, `%/category/${updated.slug}%`, updated.name]
          );
        }
      } catch (circErr) {
        console.warn("Circular collection sync warning:", circErr);
      }
    }

    await this.syncNavigationCategories();
    return this.getCategoryById(id);
  }

  async deleteCategory(id: string): Promise<{ success: boolean; movedToUncategorizedCount?: number; error?: string }> {
    try {
      const existing = await this.getCategoryById(id);
      if (!existing) return { success: false, error: "Category not found" };

      if (existing.slug === "uncategorized") {
        return { success: false, error: "The 'Uncategorized' category is the system fallback category and cannot be deleted." };
      }

      // 1. Find all products associated with this category
      const prodsRes = await db.query(
        `SELECT product_id FROM public.product_category_relations WHERE category_id = $1`,
        [id]
      );
      const affectedProductIds = prodsRes.rows.map((r: { product_id: string }) => r.product_id);

      // 2. Delete the relations for this category
      await db.query(`DELETE FROM public.product_category_relations WHERE category_id = $1`, [id]).catch(() => {});

      let movedCount = 0;
      if (affectedProductIds.length > 0) {
        // 3. Ensure 'Uncategorized' category exists
        const uncatRes = await db.query(
          `SELECT id FROM public.product_categories WHERE slug = 'uncategorized' LIMIT 1`
        );
        let uncatId: string;
        if (uncatRes.rows.length === 0) {
          const insertUncat = await db.query(
            `INSERT INTO public.product_categories (name, slug, description, is_in_nav)
             VALUES ('Uncategorized', 'uncategorized', 'Default collection for unassigned products', false)
             RETURNING id`
          );
          uncatId = insertUncat.rows[0].id;
        } else {
          uncatId = uncatRes.rows[0].id;
        }

        // 4. Find which affected products now have 0 remaining categories
        const orphansRes = await db.query(
          `SELECT p.id FROM public.products p
           WHERE p.id = ANY($1::uuid[])
           AND NOT EXISTS (
             SELECT 1 FROM public.product_category_relations pcr WHERE pcr.product_id = p.id
           )`,
          [affectedProductIds]
        );

        for (const orphan of orphansRes.rows) {
          await db.query(
            `INSERT INTO public.product_category_relations (product_id, category_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [orphan.id, uncatId]
          );
          movedCount++;
        }
      }

      // 5. Delete category itself
      const res = await db.query(`DELETE FROM public.product_categories WHERE id = $1`, [id]);

      // 6. Synchronize navigation
      await this.syncNavigationCategories();

      return { success: (res.rowCount ?? 0) > 0, movedToUncategorizedCount: movedCount };
    } catch (err) {
      console.error("Error deleting category:", err);
      return { success: false, error: "Database error while deleting category" };
    }
  }

  async syncNavigationCategories(): Promise<void> {
    try {
      const catsRes = await db.query(`
        SELECT id, name, slug 
        FROM public.product_categories 
        WHERE (is_in_nav IS NULL OR is_in_nav = true) AND slug != 'uncategorized'
        ORDER BY created_at ASC
      `);
      const activeCats = catsRes.rows;

      const navRes = await db.query(
        `SELECT items FROM public.site_navigation_config WHERE id = 'storefront' LIMIT 1`
      );
      if (navRes.rows.length === 0) return;

      const items = navRes.rows[0].items;
      if (!Array.isArray(items)) return;

      const categorySubmenus = activeCats.map((cat: { id: string; name: string; slug: string }) => ({
        id: `sf-cat-${cat.id}`,
        label: cat.name,
        href: `/category/${cat.slug}`,
        is_active: true,
      }));

      let found = false;
      const updatedItems = items.map((item: any) => {
        if (item.id === "sf-categories" || item.label?.toLowerCase() === "categories") {
          found = true;
          return {
            ...item,
            submenus: categorySubmenus,
          };
        }
        return item;
      });

      if (!found) {
        updatedItems.splice(2, 0, {
          id: "sf-categories",
          label: "Categories",
          href: "/#categories",
          icon: "Box",
          is_active: true,
          submenus: categorySubmenus,
        });
      }

      await db.query(
        `UPDATE public.site_navigation_config 
         SET items = $1, updated_at = timezone('utc'::text, now()) 
         WHERE id = 'storefront'`,
        [JSON.stringify(updatedItems)]
      );
    } catch (err) {
      console.error("Error synchronizing navigation categories:", err);
    }
  }

  // CATEGORY PRODUCT MANAGEMENT
  async getCategoryProducts(categoryId: string): Promise<Product[]> {
    try {
      const sql = `
        SELECT p.*,
          COALESCE(pf.is_best_seller, false) as is_best_seller,
          COALESCE(pf.is_new_arrival, false) as is_new_arrival,
          COALESCE(pf.sort_order, 0) as sort_order,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pi.id,
                'secure_url', pi.secure_url,
                'cloudinary_public_id', pi.cloudinary_public_id,
                'alt_text', pi.alt_text,
                'sort_order', pi.sort_order
              ) ORDER BY pi.sort_order ASC
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::json
          ) as images
        FROM public.products p
        JOIN public.product_category_relations pcr ON pcr.product_id = p.id
        LEFT JOIN public.product_flags pf ON pf.product_id = p.id
        LEFT JOIN public.product_images pi ON pi.product_id = p.id
        WHERE pcr.category_id = $1
        GROUP BY p.id, pf.is_best_seller, pf.is_new_arrival, pf.sort_order
        ORDER BY p.name ASC
      `;
      const res = await db.query(sql, [categoryId]);
      return res.rows.map((row) => ({
        ...row,
        price: Number(row.price),
        compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null,
        stock: Number(row.stock),
      }));
    } catch (err) {
      console.error("Error fetching category products:", err);
      return [];
    }
  }

  async addProductToCategory(categoryId: string, productId: string): Promise<boolean> {
    try {
      await db.query(
        `INSERT INTO public.product_category_relations (product_id, category_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [productId, categoryId]
      );

      // If category is not "uncategorized", remove any "uncategorized" relation
      const uncatRes = await db.query(`SELECT id FROM public.product_categories WHERE slug = 'uncategorized' LIMIT 1`);
      if (uncatRes.rows.length > 0 && uncatRes.rows[0].id !== categoryId) {
        await db.query(
          `DELETE FROM public.product_category_relations 
           WHERE product_id = $1 AND category_id = $2`,
          [productId, uncatRes.rows[0].id]
        );
      }

      return true;
    } catch (err) {
      console.error("Error adding product to category:", err);
      return false;
    }
  }

  async removeProductFromCategory(categoryId: string, productId: string): Promise<boolean> {
    try {
      await db.query(
        `DELETE FROM public.product_category_relations 
         WHERE product_id = $1 AND category_id = $2`,
        [productId, categoryId]
      );

      // Check if product now has 0 categories; if so, assign to uncategorized
      const remaining = await db.query(
        `SELECT 1 FROM public.product_category_relations WHERE product_id = $1 LIMIT 1`,
        [productId]
      );
      if (remaining.rows.length === 0) {
        const uncatRes = await db.query(`SELECT id FROM public.product_categories WHERE slug = 'uncategorized' LIMIT 1`);
        let uncatId: string;
        if (uncatRes.rows.length === 0) {
          const insertUncat = await db.query(
            `INSERT INTO public.product_categories (name, slug, description, is_in_nav)
             VALUES ('Uncategorized', 'uncategorized', 'Default collection for unassigned products', false)
             RETURNING id`
          );
          uncatId = insertUncat.rows[0].id;
        } else {
          uncatId = uncatRes.rows[0].id;
        }

        await db.query(
          `INSERT INTO public.product_category_relations (product_id, category_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [productId, uncatId]
        );
      }

      return true;
    } catch (err) {
      console.error("Error removing product from category:", err);
      return false;
    }
  }

  // REVIEWS
  async getReviews(activeOnly = true): Promise<CustomerReview[]> {
    try {
      await db
        .query(
          `CREATE TABLE IF NOT EXISTS public.customer_reviews (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_name TEXT NOT NULL,
            rating INTEGER NOT NULL DEFAULT 5,
            review TEXT NOT NULL,
            image_url TEXT,
            verified_purchase BOOLEAN DEFAULT true,
            product_name TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
          );`
        )
        .catch(() => {});

      const where = activeOnly ? "WHERE status = 'active'" : "";
      const res = await db.query(
        `SELECT * FROM public.customer_reviews ${where} ORDER BY created_at DESC`
      );
      if (res.rows.length === 0) {
        return [];
      }
      return res.rows;
    } catch (err) {
      console.error("Error fetching reviews from database:", err);
      return [];
    }
  }

  async getReviewById(id: string): Promise<CustomerReview | null> {
    try {
      const res = await db.query(`SELECT * FROM public.customer_reviews WHERE id = $1 LIMIT 1`, [id]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  }

  async createReview(data: Omit<CustomerReview, "id" | "created_at">): Promise<CustomerReview> {
    const res = await db.query(
      `INSERT INTO public.customer_reviews 
        (customer_name, rating, review, image_url, verified_purchase, product_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.customer_name.trim(),
        Number(data.rating) || 5,
        data.review.trim(),
        data.image_url || null,
        data.verified_purchase ?? true,
        data.product_name || null,
        data.status || "active",
      ]
    );
    return res.rows[0];
  }

  async updateReview(id: string, updates: Partial<CustomerReview>): Promise<CustomerReview | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let i = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key !== "id" && key !== "created_at" && val !== undefined) {
        fields.push(`${key} = $${i}`);
        values.push(val);
        i++;
      }
    }

    if (fields.length === 0) return this.getReviewById(id);

    values.push(id);
    const res = await db.query(
      `UPDATE public.customer_reviews SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  async deleteReview(id: string): Promise<boolean> {
    try {
      const res = await db.query(`DELETE FROM public.customer_reviews WHERE id = $1`, [id]);
      return (res.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  // ANNOUNCEMENTS
  async getAnnouncements(activeOnly = false): Promise<AnnouncementItem[]> {
    try {
      const where = activeOnly ? "WHERE is_active = true" : "";
      const res = await db.query(
        `SELECT * FROM public.announcements ${where} ORDER BY sort_order ASC, created_at ASC`
      );
      return res.rows.map((r) => ({
        id: r.id,
        text: r.text,
        link: r.link,
        badge: r.badge,
        is_active: Boolean(r.is_active),
        sort_order: Number(r.sort_order),
      }));
    } catch (err) {
      console.error("Error fetching announcements from database:", err);
      return [];
    }
  }

  async getAnnouncementsConfig(): Promise<AnnouncementConfig> {
    try {
      const [items, cfgRes] = await Promise.all([
        this.getAnnouncements(false),
        db.query(`SELECT interval_seconds, is_active, updated_at FROM public.announcements_config WHERE id = 'default' LIMIT 1`),
      ]);
      const cfg = cfgRes.rows[0] || {};
      return {
        id: "default",
        interval_seconds: Number(cfg.interval_seconds) || 4,
        is_active: cfg.is_active !== undefined ? Boolean(cfg.is_active) : true,
        items,
        updated_at: cfg.updated_at,
      };
    } catch (err) {
      console.error("Error fetching announcements config:", err);
      return {
        id: "default",
        interval_seconds: 4,
        is_active: true,
        items: [],
      };
    }
  }

  async saveAnnouncementsConfig(config: {
    interval_seconds: number;
    is_active: boolean;
    items: AnnouncementItem[];
  }): Promise<AnnouncementConfig> {
    // 1. Sync items into public.announcements
    for (let i = 0; i < config.items.length; i++) {
      const it = config.items[i];
      const id = it.id || `ann-${Date.now()}-${i}`;
      await db.query(
        `INSERT INTO public.announcements (id, text, link, badge, is_active, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, timezone('utc'::text, now()))
         ON CONFLICT (id) DO UPDATE SET
           text = EXCLUDED.text,
           link = EXCLUDED.link,
           badge = EXCLUDED.badge,
           is_active = EXCLUDED.is_active,
           sort_order = EXCLUDED.sort_order,
           updated_at = timezone('utc'::text, now())`,
        [id, it.text, it.link || "/shop", it.badge || null, it.is_active ?? true, it.sort_order ?? (i + 1)]
      );
    }

    // Remove deleted announcements
    const currentIds = config.items.map((it) => it.id).filter(Boolean);
    if (currentIds.length > 0) {
      await db.query(`DELETE FROM public.announcements WHERE id NOT IN (${currentIds.map((_, idx) => `$${idx + 1}`).join(", ")})`, currentIds);
    }

    // 2. Update announcements_config table
    await db.query(
      `INSERT INTO public.announcements_config (id, interval_seconds, is_active, items, updated_at)
       VALUES ('default', $1, $2, $3, timezone('utc'::text, now()))
       ON CONFLICT (id) DO UPDATE SET
         interval_seconds = EXCLUDED.interval_seconds,
         is_active = EXCLUDED.is_active,
         items = EXCLUDED.items,
         updated_at = timezone('utc'::text, now())`,
      [config.interval_seconds || 4, config.is_active ?? true, JSON.stringify(config.items)]
    );

    return this.getAnnouncementsConfig();
  }

  // MIDDLE BANNER
  async getMiddleBanner(): Promise<Record<string, unknown> | null> {
    try {
      const res = await db.query(`SELECT * FROM public.middle_banners WHERE id = 'default' LIMIT 1`);
      if (res.rows.length > 0) return res.rows[0];
      return null;
    } catch (err) {
      console.error("Error fetching middle banner:", err);
      return null;
    }
  }

  async updateMiddleBanner(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await db.query(
      `INSERT INTO public.middle_banners 
        (id, eyebrow, title, description, button_text, button_link, media_type, media_url, image_url, height, is_active, updated_at)
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, timezone('utc'::text, now()))
       ON CONFLICT (id) DO UPDATE SET
         eyebrow = EXCLUDED.eyebrow,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         button_text = EXCLUDED.button_text,
         button_link = EXCLUDED.button_link,
         media_type = EXCLUDED.media_type,
         media_url = EXCLUDED.media_url,
         image_url = EXCLUDED.image_url,
         height = EXCLUDED.height,
         is_active = EXCLUDED.is_active,
         updated_at = timezone('utc'::text, now())
       RETURNING *`,
      [
        (data.eyebrow as string) || null,
        (data.title as string) || "ARCHITECTURAL LEATHER",
        (data.description as string) || null,
        (data.button_text as string) || "DISCOVER THE ATELIER",
        (data.button_link as string) || "/shop",
        (data.media_type as string) || "image",
        (data.media_url as string) || null,
        (data.image_url as string) || null,
        (data.height as string) || "55vh",
        (data.is_active as boolean) ?? (data.enabled as boolean) ?? true,
      ]
    );
    return res.rows[0];
  }

  // SEEN ON YOU
  async getSeenOnYou(): Promise<SeenOnYouVideo[]> {
    try {
      await db
        .query(
          `CREATE TABLE IF NOT EXISTS public.customer_videos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_name TEXT NOT NULL,
            video_url TEXT NOT NULL,
            thumbnail_url TEXT,
            cloudinary_public_id TEXT,
            caption TEXT,
            product_name TEXT,
            product_slug TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
          );`
        )
        .catch(() => {});

      await db.query(`ALTER TABLE public.customer_videos ALTER COLUMN caption DROP NOT NULL;`).catch(() => {});

      const res = await db.query(
        `SELECT * FROM public.customer_videos WHERE status = 'active' ORDER BY sort_order ASC, created_at DESC`
      );
      if (res.rows.length === 0) {
        return [];
      }
      return res.rows;
    } catch (err) {
      console.error("Error fetching videos from database:", err);
      return [];
    }
  }

  // DASHBOARD STATS
  async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const [
        totalProd,
        bestSellers,
        newArrivals,
        activeHeroes,
        draftHeroes,
        lowStock,
        totalCust,
        totalOrd,
        totalRev,
        pendingOrd,
      ] = await Promise.all([
        db.query(`SELECT COUNT(*) FROM public.products`),
        db.query(`SELECT COUNT(*) FROM public.product_flags WHERE is_best_seller = true`),
        db.query(`SELECT COUNT(*) FROM public.product_flags WHERE is_new_arrival = true`),
        db.query(`SELECT COUNT(*) FROM public.hero_banners WHERE status = 'published' AND is_active = true`),
        db.query(`SELECT COUNT(*) FROM public.hero_banners WHERE status = 'draft'`),
        db.query(`SELECT COUNT(*) FROM public.products WHERE stock < 10`),
        db.query(`SELECT COUNT(*) FROM public.users`),
        db.query(`SELECT COUNT(*) FROM public.orders`),
        db.query(`SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status != 'cancelled'`),
        db.query(`SELECT COUNT(*) FROM public.orders WHERE status = 'processing'`),
      ]);

      return {
        totalProducts: parseInt(totalProd.rows[0].count),
        totalCustomers: parseInt(totalCust.rows[0].count),
        totalOrders: parseInt(totalOrd.rows[0].count),
        totalRevenue: Number(totalRev.rows[0].coalesce || 0),
        pendingOrders: parseInt(pendingOrd.rows[0].count),
        bestSellersCount: parseInt(bestSellers.rows[0].count),
        newArrivalsCount: parseInt(newArrivals.rows[0].count),
        activeHeroBanners: parseInt(activeHeroes.rows[0].count),
        draftHeroBanners: parseInt(draftHeroes.rows[0].count),
        lowStockCount: parseInt(lowStock.rows[0].count),
      };
    } catch (err) {
      console.error("Error fetching dashboard stats from database:", err);
      return {
        totalProducts: 0,
        totalCustomers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        bestSellersCount: 0,
        newArrivalsCount: 0,
        activeHeroBanners: 0,
        draftHeroBanners: 0,
        lowStockCount: 0,
      };
    }
  }

  // ==========================================
  // ORDERS MANAGEMENT
  // ==========================================
  async getOrders(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    try {
      const conditions: string[] = [];
      const values: (string | number)[] = [];
      let idx = 1;

      if (params?.status && params.status !== "all") {
        conditions.push(`o.status = $${idx++}`);
        values.push(params.status);
      }

      if (params?.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`;
        conditions.push(
          `(o.order_number ILIKE $${idx} OR o.customer_name ILIKE $${idx} OR o.customer_email ILIKE $${idx} OR o.customer_phone ILIKE $${idx})`
        );
        values.push(term);
        idx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const countRes = await db.query(
        `SELECT COUNT(*) FROM public.orders o ${whereClause}`,
        values
      );
      const total = parseInt(countRes.rows[0]?.count || "0", 10);

      const limit = params?.limit || 20;
      const offset = params?.offset || 0;

      const orderQuery = `
        SELECT 
          o.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'order_id', oi.order_id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'product_slug', oi.product_slug,
                'price', oi.price,
                'quantity', oi.quantity,
                'image_url', oi.image_url,
                'attributes', oi.attributes,
                'created_at', oi.created_at
              )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'
          ) as items
        FROM public.orders o
        LEFT JOIN public.order_items oi ON o.id = oi.order_id
        ${whereClause}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `;

      values.push(limit, offset);
      const res = await db.query(orderQuery, values);

      const orders: Order[] = res.rows.map((row) => ({
        ...row,
        total_amount: Number(row.total_amount),
        shipping_address:
          typeof row.shipping_address === "string"
            ? JSON.parse(row.shipping_address)
            : row.shipping_address,
        items: (row.items || []).map((it: OrderItem) => ({
          ...it,
          price: Number(it.price),
          quantity: Number(it.quantity),
          attributes:
            typeof it.attributes === "string"
              ? JSON.parse(it.attributes)
              : it.attributes,
        })),
      }));

      return { orders, total };
    } catch (err) {
      console.error("Error fetching orders:", err);
      return { orders: [], total: 0 };
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const orderRes = await db.query(
        `SELECT * FROM public.orders WHERE id::text = $1 OR order_number = $1 LIMIT 1`,
        [id]
      );
      if (orderRes.rows.length === 0) return null;
      const row = orderRes.rows[0];

      const itemsRes = await db.query(
        `SELECT * FROM public.order_items WHERE order_id = $1 ORDER BY created_at ASC`,
        [row.id]
      );

      return {
        ...row,
        total_amount: Number(row.total_amount),
        shipping_address:
          typeof row.shipping_address === "string"
            ? JSON.parse(row.shipping_address)
            : row.shipping_address,
        items: itemsRes.rows.map((it) => ({
          ...it,
          price: Number(it.price),
          quantity: Number(it.quantity),
          attributes:
            typeof it.attributes === "string"
              ? JSON.parse(it.attributes)
              : it.attributes,
        })),
      };
    } catch (err) {
      console.error("Error fetching order by ID:", err);
      return null;
    }
  }

  async createOrder(
    data: Omit<Order, "id" | "created_at" | "updated_at">,
    items?: Omit<OrderItem, "id" | "order_id" | "created_at">[]
  ): Promise<Order> {
    const orderNumber =
      data.order_number ||
      `DN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const isValidUUID = (id?: string | null) =>
      Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
    const passedUserId = isValidUUID(data.user_id) ? data.user_id : null;

    let finalUserId: string | null = null;
    if (passedUserId) {
      try {
        const userCheck = await db.query(
          `SELECT id FROM public.users WHERE id = $1 LIMIT 1`,
          [passedUserId]
        );
        if (userCheck.rows && userCheck.rows.length > 0) {
          finalUserId = userCheck.rows[0].id;
        }
      } catch (err) {
        console.warn("Could not verify user_id in public.users:", err);
      }
    }

    // Fallback: If user_id wasn't in public.users, check if customer_email matches a registered user
    if (!finalUserId && data.customer_email) {
      try {
        const emailCheck = await db.query(
          `SELECT id FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [data.customer_email.trim()]
        );
        if (emailCheck.rows && emailCheck.rows.length > 0) {
          finalUserId = emailCheck.rows[0].id;
        }
      } catch {
        // Safe fallback to null for guest checkout
      }
    }

    const res = await db.query(
      `INSERT INTO public.orders 
        (order_number, user_id, customer_email, customer_name, customer_phone, total_amount, status, payment_status, payment_method, shipping_address, tracking_number, carrier, estimated_delivery, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        orderNumber,
        finalUserId,
        data.customer_email,
        data.customer_name,
        data.customer_phone || null,
        data.total_amount,
        data.status || "processing",
        data.payment_status || "paid",
        data.payment_method || "card",
        JSON.stringify(data.shipping_address || {}),
        data.tracking_number || null,
        data.carrier || null,
        data.estimated_delivery || null,
        data.notes || null,
      ]
    );

    const createdOrder = res.rows[0];
    const createdItems: OrderItem[] = [];

    if (items && items.length > 0) {
      for (const item of items) {
        const itemRes = await db.query(
          `INSERT INTO public.order_items
            (order_id, product_id, product_name, product_slug, price, quantity, image_url, attributes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            createdOrder.id,
            item.product_id || null,
            item.product_name,
            item.product_slug || null,
            item.price,
            item.quantity,
            item.image_url || null,
            JSON.stringify(item.attributes || {}),
          ]
        );
        createdItems.push({
          ...itemRes.rows[0],
          price: Number(itemRes.rows[0].price),
          quantity: Number(itemRes.rows[0].quantity),
        });
      }
    }

    return {
      ...createdOrder,
      total_amount: Number(createdOrder.total_amount),
      shipping_address:
        typeof createdOrder.shipping_address === "string"
          ? JSON.parse(createdOrder.shipping_address)
          : createdOrder.shipping_address,
      items: createdItems,
    };
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let i = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key !== "id" && key !== "created_at" && key !== "items" && val !== undefined) {
        if (key === "shipping_address") {
          fields.push(`${key} = $${i}`);
          values.push(JSON.stringify(val));
        } else {
          fields.push(`${key} = $${i}`);
          values.push(val as string | number | boolean | null);
        }
        i++;
      }
    }

    if (fields.length === 0) return this.getOrderById(id);

    fields.push(`updated_at = timezone('utc'::text, now())`);
    values.push(id);

    await db.query(
      `UPDATE public.orders SET ${fields.join(", ")} WHERE id = $${i} OR order_number = $${i}`,
      values
    );

    return this.getOrderById(id);
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      const res = await db.query(
        `DELETE FROM public.orders WHERE id::text = $1 OR order_number = $1 RETURNING id`,
        [id]
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error("Error deleting order:", err);
      return false;
    }
  }

  // ==========================================
  // HOMEPAGE CONFIGURATION
  // ==========================================
  async getHomepageConfig(): Promise<HomepageConfig> {
    const fallback: HomepageConfig = {
      topbar: {
        enabled: true,
        text: "COMPLIMENTARY WHITE-GLOVE EXPRESS DELIVERY ON ALL LUXURY ORDERS",
        link: "/shop",
      },
      hero: {
        enabled: true,
      },
      categories: {
        enabled: true,
        title: "CATEGORIES",
        heading_color: "#0E0E0E",
        heading_font_size: "32px",
        heading_font_family: "arial-rounded",
        heading_font_weight: "800",
        card_gap: 24,
      },
      best_sellers: {
        enabled: true,
        title: "BEST SELLERS",
        view_all_link: "/shop?best_seller=true",
        view_all_text: "VIEW ALL",
        heading_color: "#0E0E0E",
        heading_font_size: "32px",
        heading_font_family: "arial-rounded",
        heading_font_weight: "800",
        card_gap: 20,
      },
      new_in: {
        enabled: true,
        title: "NEW IN",
        view_all_link: "/shop?new_arrival=true",
        view_all_text: "VIEW ALL",
        heading_color: "#0E0E0E",
        heading_font_size: "32px",
        heading_font_family: "arial-rounded",
        heading_font_weight: "800",
        card_gap: 20,
      },
      middle_banner: {
        enabled: true,
        eyebrow: "Atelier Edition • Florence",
        title: "ARCHITECTURAL LEATHER",
        description: "Sculpted with uncompromising discipline. Cut from certified full-grain Tuscan calfskin and finished with bespoke satin metal hardware.",
        button_text: "DISCOVER THE ATELIER",
        button_link: "/shop",
        image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1800&q=85",
      },
      seen_on_you: {
        enabled: true,
        title: "SEEN ON YOU",
        heading_color: "#0E0E0E",
        heading_font_size: "32px",
        heading_font_family: "arial-rounded",
        heading_font_weight: "800",
        card_gap: 12,
      },
      customer_reviews: {
        enabled: true,
        title: "CUSTOMER REVIEWS",
      },
      footer: {
        subtitle: "Artisan Handbags • Florence • New York",
        story_text: "Architectural silhouettes, meticulous artisan leatherwork, and timeless aesthetics designed for the modern woman. Handcrafted with bespoke calfskin and precision hardware.",
        instagram_url: "https://www.instagram.com/dnora_lifestyle/?hl=en",
        facebook_url: "https://www.facebook.com/share/18Na18aHCQ/?mibextid=wwXIfr",
        whatsapp_number: "9016047308",
        whatsapp_url: "https://wa.me/919016047308",
        pinterest_url: "https://pinterest.com/dnoralifestyle",
      },
      sections: [
        {
          id: "sec-bestsellers",
          title: "BEST SELLERS",
          subtitle: "The most coveted architectural silhouettes from our Florentine atelier.",
          type: "best_sellers",
          display_style: "carousel",
          view_all_link: "/shop?best_seller=true",
          view_all_text: "VIEW ALL",
          limit: 10,
          is_active: true,
          sort_order: 1,
        },
        {
          id: "sec-newin",
          title: "NEW IN",
          subtitle: "Fresh artisan silhouettes sculpted for modern elegance.",
          type: "new_in",
          display_style: "carousel",
          view_all_link: "/shop?new_arrival=true",
          view_all_text: "VIEW ALL",
          limit: 10,
          is_active: true,
          sort_order: 2,
        },
      ],
    };

    try {
      await db
        .query(
          `CREATE TABLE IF NOT EXISTS public.homepage_config (
            id TEXT PRIMARY KEY,
            config JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
          );`
        )
        .catch(() => {});

      const res = await db.query(`SELECT config FROM public.homepage_config WHERE id = 'default' LIMIT 1`);
      if (res.rows.length === 0) return fallback;
      const raw = res.rows[0].config;
      const parsed: HomepageConfig = typeof raw === "string" ? JSON.parse(raw) : (raw || fallback);
      if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        parsed.sections = fallback.sections;
      }
      return parsed;
    } catch {
      return fallback;
    }
  }

  async updateHomepageConfig(config: HomepageConfig): Promise<HomepageConfig> {
    try {
      await db
        .query(
          `CREATE TABLE IF NOT EXISTS public.homepage_config (
            id TEXT PRIMARY KEY,
            config JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
          );`
        )
        .catch(() => {});

      await db.query(
        `INSERT INTO public.homepage_config (id, config, updated_at)
         VALUES ('default', $1, timezone('utc'::text, now()))
         ON CONFLICT (id) DO UPDATE SET
           config = EXCLUDED.config,
           updated_at = timezone('utc'::text, now())`,
        [JSON.stringify(config)]
      );
      return config;
    } catch (err) {
      console.error("Error updating homepage config:", err);
      return config;
    }
  }

  async getHomepageSections(): Promise<HomepageSection[]> {
    const config = await this.getHomepageConfig();
    return (config.sections || []).sort((a, b) => a.sort_order - b.sort_order);
  }

  async saveHomepageSections(sections: HomepageSection[]): Promise<HomepageSection[]> {
    const config = await this.getHomepageConfig();
    config.sections = sections;
    await this.updateHomepageConfig(config);
    return sections;
  }

  // TRENDING NOW (Pure Editorial Image Lookbook)
  async getTrendingNowItems(activeOnly = true): Promise<TrendingNowItem[]> {
    const fallback: TrendingNowItem[] = [
      {
        id: "trend-1",
        title: "The Florentine Monogram Tote",
        image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85",
        alt_text: "Florentine Monogram Tote",
        sort_order: 1,
        is_active: true,
      },
      {
        id: "trend-2",
        title: "Architectural Top Handle in Noir",
        image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85",
        alt_text: "Top Handle Bag in Noir Calfskin",
        sort_order: 2,
        is_active: true,
      },
      {
        id: "trend-3",
        title: "Crossbody Saddle in Caramel Tan",
        image_url: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1000&q=85",
        alt_text: "Saddle Crossbody in Caramel Tan",
        sort_order: 3,
        is_active: true,
      },
      {
        id: "trend-4",
        title: "Minimalist Soft Bucket in Cognac",
        image_url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85",
        alt_text: "Minimalist Soft Bucket Bag",
        sort_order: 4,
        is_active: true,
      },
      {
        id: "trend-5",
        title: "The Grand Weekend Duffle",
        image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85",
        alt_text: "Weekend Duffle in Vegetable Tanned Leather",
        sort_order: 5,
        is_active: true,
      },
      {
        id: "trend-6",
        title: "Crescent Shoulder Silhouette in Olive",
        image_url: "https://images.unsplash.com/photo-1575032617751-6ddec2089882?auto=format&fit=crop&w=1000&q=85",
        alt_text: "Crescent Shoulder Bag",
        sort_order: 6,
        is_active: true,
      },
    ];

    try {
      await db
        .query(
          `CREATE TABLE IF NOT EXISTS public.trending_now_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT,
            image_url TEXT NOT NULL,
            alt_text TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            target_link TEXT,
            product_id UUID,
            product_slug TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
          );
          ALTER TABLE public.trending_now_items ADD COLUMN IF NOT EXISTS target_link TEXT;
          ALTER TABLE public.trending_now_items ADD COLUMN IF NOT EXISTS product_id UUID;
          ALTER TABLE public.trending_now_items ADD COLUMN IF NOT EXISTS product_slug TEXT;
          `
        )
        .catch(() => {});

      const where = activeOnly ? "WHERE t.is_active = true" : "";
      const res = await db.query(
        `SELECT 
          t.id,
          COALESCE(p.name, t.title, '') as title,
          COALESCE(
            (SELECT pi.secure_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1),
            t.image_url
          ) as image_url,
          COALESCE(t.alt_text, p.name, 'DNORA Trending') as alt_text,
          t.sort_order,
          t.is_active,
          t.target_link,
          COALESCE(t.product_id, p.id) as product_id,
          COALESCE(t.product_slug, p.slug) as product_slug,
          p.price,
          p.compare_at_price,
          t.created_at
        FROM public.trending_now_items t
        LEFT JOIN public.products p 
          ON p.id = t.product_id OR (t.product_slug IS NOT NULL AND p.slug = t.product_slug)
        ${where} 
        ORDER BY t.sort_order ASC, t.created_at DESC`
      );
      if (res.rows.length === 0) {
        // Fallback to active catalog products
        const catProds = await db.query(`
          SELECT p.id, p.name as title, p.slug as product_slug, p.price, p.compare_at_price,
                 (SELECT pi.secure_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) as image_url
          FROM public.products p
          WHERE p.status = 'active'
          ORDER BY p.is_best_seller DESC, p.created_at DESC
          LIMIT 8
        `).catch(() => ({ rows: [] }));

        if (catProds.rows.length > 0) {
          return catProds.rows.map((p, i) => ({
            id: p.id,
            title: p.title || "DNORA Luxury Handbag",
            image_url: p.image_url || fallback[i % fallback.length].image_url,
            alt_text: p.title,
            sort_order: i + 1,
            is_active: true,
            product_id: p.id,
            product_slug: p.product_slug,
            price: Number(p.price || 1999),
            compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
          }));
        }
        return fallback;
      }
      return res.rows.map((row) => ({
        id: row.id,
        title: row.title || "",
        image_url: row.image_url,
        alt_text: row.alt_text || row.title || "DNORA Trending",
        sort_order: Number(row.sort_order ?? 0),
        is_active: Boolean(row.is_active ?? true),
        target_link: row.target_link || undefined,
        product_id: row.product_id || undefined,
        product_slug: row.product_slug || undefined,
        price: row.price !== null && row.price !== undefined ? Number(row.price) : undefined,
        compare_at_price: row.compare_at_price !== null && row.compare_at_price !== undefined ? Number(row.compare_at_price) : null,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      }));
    } catch {
      return fallback;
    }
  }

  async createTrendingNowItem(data: {
    title?: string;
    image_url: string;
    alt_text?: string;
    sort_order?: number;
    is_active?: boolean;
    target_link?: string;
    product_id?: string;
    product_slug?: string;
  }): Promise<TrendingNowItem> {
    await db
      .query(
        `CREATE TABLE IF NOT EXISTS public.trending_now_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT,
          image_url TEXT NOT NULL,
          alt_text TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          target_link TEXT,
          product_id UUID,
          product_slug TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
        );
        ALTER TABLE public.trending_now_items ADD COLUMN IF NOT EXISTS target_link TEXT;
        ALTER TABLE public.trending_now_items ADD COLUMN IF NOT EXISTS product_id UUID;
        ALTER TABLE public.trending_now_items ADD COLUMN IF NOT EXISTS product_slug TEXT;
        `
      )
      .catch(() => {});

    const res = await db.query(
      `INSERT INTO public.trending_now_items (title, image_url, alt_text, sort_order, is_active, target_link, product_id, product_slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.title || "",
        data.image_url,
        data.alt_text || data.title || "",
        data.sort_order ?? 0,
        data.is_active ?? true,
        data.target_link || null,
        data.product_id || null,
        data.product_slug || null,
      ]
    );

    const row = res.rows[0];
    return {
      id: row.id,
      title: row.title,
      image_url: row.image_url,
      alt_text: row.alt_text,
      sort_order: Number(row.sort_order),
      is_active: Boolean(row.is_active),
      target_link: row.target_link || undefined,
      product_id: row.product_id || undefined,
      product_slug: row.product_slug || undefined,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };
  }

  async updateTrendingNowItem(
    id: string,
    data: Partial<TrendingNowItem>
  ): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: unknown[] = [];
      let i = 1;

      if (data.title !== undefined) {
        updates.push(`title = $${i++}`);
        values.push(data.title);
      }
      if (data.image_url !== undefined) {
        updates.push(`image_url = $${i++}`);
        values.push(data.image_url);
      }
      if (data.alt_text !== undefined) {
        updates.push(`alt_text = $${i++}`);
        values.push(data.alt_text);
      }
      if (data.sort_order !== undefined) {
        updates.push(`sort_order = $${i++}`);
        values.push(data.sort_order);
      }
      if (data.is_active !== undefined) {
        updates.push(`is_active = $${i++}`);
        values.push(data.is_active);
      }
      if (data.target_link !== undefined) {
        updates.push(`target_link = $${i++}`);
        values.push(data.target_link || null);
      }
      if (data.product_id !== undefined) {
        updates.push(`product_id = $${i++}`);
        values.push(data.product_id || null);
      }
      if (data.product_slug !== undefined) {
        updates.push(`product_slug = $${i++}`);
        values.push(data.product_slug || null);
      }

      if (updates.length === 0) return true;

      values.push(id);
      await db.query(
        `UPDATE public.trending_now_items SET ${updates.join(", ")} WHERE id = $${i}`,
        values
      );
      return true;
    } catch (err) {
      console.error("Error updating trending now item:", err);
      return false;
    }
  }

  async deleteTrendingNowItem(id: string): Promise<boolean> {
    try {
      await db.query(`DELETE FROM public.trending_now_items WHERE id = $1`, [id]);
      return true;
    } catch (err) {
      console.error("Error deleting trending now item:", err);
      return false;
    }
  }

  // PROMO / CAMPAIGN BANNER (THE ARCHITECTURE OF LUXURY)
  async ensurePromoBannerTable(): Promise<void> {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS public.promo_banner_config (
          id TEXT PRIMARY KEY DEFAULT 'default',
          heading TEXT NOT NULL DEFAULT 'THE ARCHITECTURE OF LUXURY',
          tagline TEXT NOT NULL DEFAULT 'THE FLORENTINE ATELIER',
          description TEXT NOT NULL DEFAULT 'Cut from full-grain vegetable-tanned Italian calfskin with hand-painted beveled edges and signature brushed champagne brass hardware.',
          button_text TEXT NOT NULL DEFAULT 'EXPLORE THE CAMPAIGN',
          button_link TEXT NOT NULL DEFAULT '/shop',
          image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85',
          is_active BOOLEAN NOT NULL DEFAULT true,
          slides JSONB DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
        );
        INSERT INTO public.promo_banner_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
        ALTER TABLE public.promo_banner_config ADD COLUMN IF NOT EXISTS slides JSONB DEFAULT '[]'::jsonb;
      `);
    } catch {
      // non-blocking
    }
  }

  async getPromoBannerConfig(): Promise<PromoBannerConfig> {
    const defaultVal: PromoBannerConfig = {
      id: "default",
      heading: "THE ARCHITECTURE OF LUXURY",
      tagline: "THE FLORENTINE ATELIER",
      description:
        "Cut from full-grain vegetable-tanned Italian calfskin with hand-painted beveled edges and signature brushed champagne brass hardware.",
      button_text: "EXPLORE THE CAMPAIGN",
      button_link: "/shop",
      image_url:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
      is_active: true,
      slides: [
        {
          id: "default-slide-1",
          heading: "THE ARCHITECTURE OF LUXURY",
          tagline: "THE FLORENTINE ATELIER",
          description:
            "Cut from full-grain vegetable-tanned Italian calfskin with hand-painted beveled edges and signature brushed champagne brass hardware.",
          button_text: "EXPLORE THE CAMPAIGN",
          button_link: "/shop",
          media_type: "image",
          media_url:
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
          duration_seconds: 6,
        },
      ],
    };

    try {
      await this.ensurePromoBannerTable();
      const res = await db.query(
        `SELECT * FROM public.promo_banner_config WHERE id = 'default' LIMIT 1`
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];

        let parsedSlides: CampaignSlide[] = [];
        if (row.slides) {
          try {
            parsedSlides = typeof row.slides === "string" ? JSON.parse(row.slides) : row.slides;
          } catch {
            parsedSlides = [];
          }
        }

        // If no slides array yet, seed with primary banner data
        if (!Array.isArray(parsedSlides) || parsedSlides.length === 0) {
          parsedSlides = [
            {
              id: "slide-1",
              heading: row.heading || defaultVal.heading,
              tagline: row.tagline || defaultVal.tagline,
              description: row.description || defaultVal.description,
              button_text: row.button_text || defaultVal.button_text,
              button_link: row.button_link || defaultVal.button_link,
              media_type: "image",
              media_url: row.image_url || defaultVal.image_url,
              duration_seconds: 6,
            },
          ];
        }

        return {
          id: row.id,
          heading: row.heading || defaultVal.heading,
          tagline: row.tagline || defaultVal.tagline,
          description: row.description || defaultVal.description,
          button_text: row.button_text || defaultVal.button_text,
          button_link: row.button_link || defaultVal.button_link,
          image_url: row.image_url || defaultVal.image_url,
          is_active: row.is_active !== undefined ? Boolean(row.is_active) : true,
          slides: parsedSlides,
          updated_at: row.updated_at,
        };
      }
    } catch (err) {
      console.error("Error fetching promo banner config:", err);
    }
    return defaultVal;
  }

  async updatePromoBannerConfig(
    data: Partial<Omit<PromoBannerConfig, "id">>
  ): Promise<PromoBannerConfig> {
    await this.ensurePromoBannerTable();
    const fields: string[] = [];
    const values: (string | boolean)[] = [];
    let i = 1;

    if (data.heading !== undefined) {
      fields.push(`heading = $${i++}`);
      values.push(data.heading);
    }
    if (data.tagline !== undefined) {
      fields.push(`tagline = $${i++}`);
      values.push(data.tagline);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(data.description);
    }
    if (data.button_text !== undefined) {
      fields.push(`button_text = $${i++}`);
      values.push(data.button_text);
    }
    if (data.button_link !== undefined) {
      fields.push(`button_link = $${i++}`);
      values.push(data.button_link);
    }
    if (data.image_url !== undefined) {
      fields.push(`image_url = $${i++}`);
      values.push(data.image_url);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${i++}`);
      values.push(Boolean(data.is_active));
    }
    if (data.slides !== undefined) {
      fields.push(`slides = $${i++}`);
      values.push(JSON.stringify(data.slides));
    }

    if (fields.length > 0) {
      fields.push(`updated_at = timezone('utc'::text, now())`);
      await db.query(
        `UPDATE public.promo_banner_config SET ${fields.join(", ")} WHERE id = 'default'`,
        values
      );
    }

    return this.getPromoBannerConfig();
  }

  // SHIPPING CONFIG
  async getShippingConfig(): Promise<ShippingConfig> {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS public.shipping_config (
          id TEXT PRIMARY KEY DEFAULT 'default',
          is_standard_enabled BOOLEAN DEFAULT true,
          standard_title TEXT DEFAULT 'Complimentary Insured Courier',
          standard_rate NUMERIC(10, 2) DEFAULT 0,
          free_shipping_threshold NUMERIC(10, 2) DEFAULT 0,
          standard_estimated_days TEXT DEFAULT '3-5 business days',
          is_express_enabled BOOLEAN DEFAULT true,
          express_title TEXT DEFAULT 'VIP Express Air Courier',
          express_rate NUMERIC(10, 2) DEFAULT 150,
          express_estimated_days TEXT DEFAULT '1-2 business days',
          is_cod_enabled BOOLEAN DEFAULT true,
          cod_charge NUMERIC(10, 2) DEFAULT 0,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
        INSERT INTO public.shipping_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
      `);

      const res = await db.query(`SELECT * FROM public.shipping_config WHERE id = 'default' LIMIT 1`);
      if (res.rows.length === 0) {
        return {
          id: "default",
          is_standard_enabled: true,
          standard_title: "Complimentary Insured Courier",
          standard_rate: 0,
          free_shipping_threshold: 0,
          standard_estimated_days: "3-5 business days",
          is_express_enabled: true,
          express_title: "VIP Express Air Courier",
          express_rate: 150,
          express_estimated_days: "1-2 business days",
          is_cod_enabled: true,
          cod_charge: 0,
        };
      }
      const r = res.rows[0];
      return {
        id: r.id,
        is_standard_enabled: Boolean(r.is_standard_enabled),
        standard_title: r.standard_title || "Complimentary Insured Courier",
        standard_rate: Number(r.standard_rate || 0),
        free_shipping_threshold: Number(r.free_shipping_threshold || 0),
        standard_estimated_days: r.standard_estimated_days || "3-5 business days",
        is_express_enabled: Boolean(r.is_express_enabled),
        express_title: r.express_title || "VIP Express Air Courier",
        express_rate: Number(r.express_rate || 150),
        express_estimated_days: r.express_estimated_days || "1-2 business days",
        is_cod_enabled: Boolean(r.is_cod_enabled),
        cod_charge: Number(r.cod_charge || 0),
        updated_at: r.updated_at,
      };
    } catch (err) {
      console.error("Error fetching shipping config:", err);
      return {
        id: "default",
        is_standard_enabled: true,
        standard_title: "Complimentary Insured Courier",
        standard_rate: 0,
        free_shipping_threshold: 0,
        standard_estimated_days: "3-5 business days",
        is_express_enabled: true,
        express_title: "VIP Express Air Courier",
        express_rate: 150,
        express_estimated_days: "1-2 business days",
        is_cod_enabled: true,
        cod_charge: 0,
      };
    }
  }

  async updateShippingConfig(data: Partial<ShippingConfig>): Promise<ShippingConfig> {
    await this.getShippingConfig(); // ensure table exists
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.is_standard_enabled !== undefined) {
      fields.push(`is_standard_enabled = $${idx++}`);
      values.push(Boolean(data.is_standard_enabled));
    }
    if (data.standard_title !== undefined) {
      fields.push(`standard_title = $${idx++}`);
      values.push(data.standard_title.trim());
    }
    if (data.standard_rate !== undefined) {
      fields.push(`standard_rate = $${idx++}`);
      values.push(Math.max(0, Number(data.standard_rate)));
    }
    if (data.free_shipping_threshold !== undefined) {
      fields.push(`free_shipping_threshold = $${idx++}`);
      values.push(Math.max(0, Number(data.free_shipping_threshold)));
    }
    if (data.standard_estimated_days !== undefined) {
      fields.push(`standard_estimated_days = $${idx++}`);
      values.push(data.standard_estimated_days.trim());
    }
    if (data.is_express_enabled !== undefined) {
      fields.push(`is_express_enabled = $${idx++}`);
      values.push(Boolean(data.is_express_enabled));
    }
    if (data.express_title !== undefined) {
      fields.push(`express_title = $${idx++}`);
      values.push(data.express_title.trim());
    }
    if (data.express_rate !== undefined) {
      fields.push(`express_rate = $${idx++}`);
      values.push(Math.max(0, Number(data.express_rate)));
    }
    if (data.express_estimated_days !== undefined) {
      fields.push(`express_estimated_days = $${idx++}`);
      values.push(data.express_estimated_days.trim());
    }
    if (data.is_cod_enabled !== undefined) {
      fields.push(`is_cod_enabled = $${idx++}`);
      values.push(Boolean(data.is_cod_enabled));
    }
    if (data.cod_charge !== undefined) {
      fields.push(`cod_charge = $${idx++}`);
      values.push(Math.max(0, Number(data.cod_charge)));
    }

    if (fields.length > 0) {
      fields.push(`updated_at = timezone('utc'::text, now())`);
      await db.query(
        `UPDATE public.shipping_config SET ${fields.join(", ")} WHERE id = 'default'`,
        values
      );
    }

    return this.getShippingConfig();
  }

  // STOREFRONT CUSTOMIZABLE PAGES (/bestseller, /new-in, /trending-now)
  async getStorefrontPageConfig(pageKey: string): Promise<StorefrontPageConfig | null> {
    try {
      const res = await db.query(
        `SELECT * FROM public.storefront_pages WHERE page_key = $1 LIMIT 1`,
        [pageKey]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        page_key: row.page_key,
        title: row.title,
        badge_label: row.badge_label,
        subtitle: row.subtitle,
        description: row.description,
        banner_image_url: row.banner_image_url,
        banner_headline: row.banner_headline,
        banner_subheadline: row.banner_subheadline,
        meta_title: row.meta_title,
        meta_description: row.meta_description,
        is_active: Boolean(row.is_active),
        featured_product_ids: Array.isArray(row.featured_product_ids)
          ? row.featured_product_ids
          : typeof row.featured_product_ids === "string"
          ? JSON.parse(row.featured_product_ids)
          : [],
        updated_at: row.updated_at,
      };
    } catch (err) {
      console.error(`Error fetching storefront page ${pageKey}:`, err);
      return null;
    }
  }

  async saveStorefrontPageConfig(
    config: Partial<StorefrontPageConfig> & { page_key: string }
  ): Promise<StorefrontPageConfig | null> {
    try {
      const sql = `
        INSERT INTO public.storefront_pages (
          page_key, title, badge_label, subtitle, description,
          banner_image_url, banner_headline, banner_subheadline,
          meta_title, meta_description, is_active, featured_product_ids, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11, $12, NOW()
        )
        ON CONFLICT (page_key) DO UPDATE SET
          title = EXCLUDED.title,
          badge_label = EXCLUDED.badge_label,
          subtitle = EXCLUDED.subtitle,
          description = EXCLUDED.description,
          banner_image_url = EXCLUDED.banner_image_url,
          banner_headline = EXCLUDED.banner_headline,
          banner_subheadline = EXCLUDED.banner_subheadline,
          meta_title = EXCLUDED.meta_title,
          meta_description = EXCLUDED.meta_description,
          is_active = EXCLUDED.is_active,
          featured_product_ids = EXCLUDED.featured_product_ids,
          updated_at = NOW()
        RETURNING *;
      `;
      const values = [
        config.page_key,
        config.title || "PAGE TITLE",
        config.badge_label || null,
        config.subtitle || null,
        config.description || null,
        config.banner_image_url || null,
        config.banner_headline || null,
        config.banner_subheadline || null,
        config.meta_title || null,
        config.meta_description || null,
        config.is_active !== undefined ? config.is_active : true,
        JSON.stringify(config.featured_product_ids || []),
      ];
      await db.query(sql, values);
      return this.getStorefrontPageConfig(config.page_key);
    } catch (err) {
      console.error(`Error saving storefront page ${config.page_key}:`, err);
      throw err;
    }
  }

  // SYSTEM SETTINGS & TELEMETRY
  async getSystemSetting<T = any>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const res = await db.query(
        `SELECT value FROM public.system_settings WHERE key = $1 LIMIT 1`,
        [key]
      );
      if (res.rows.length === 0) return defaultValue !== undefined ? defaultValue : null;
      return res.rows[0].value as T;
    } catch (err) {
      console.error(`Error reading system setting ${key}:`, err);
      return defaultValue !== undefined ? defaultValue : null;
    }
  }

  async setSystemSetting<T = any>(key: string, value: T, _updatedBy: string = "system"): Promise<boolean> {
    try {
      await db.query(
        `INSERT INTO public.system_settings (key, value, updated_at)
         VALUES ($1, $2, timezone('utc'::text, now()))
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = timezone('utc'::text, now())`,
        [key, JSON.stringify(value)]
      );
      return true;
    } catch (err) {
      console.error(`Error saving system setting ${key}:`, err);
      return false;
    }
  }

  async getSiteStatus(): Promise<{
    status: "online" | "terminated";
    mode?: string;
    message?: string;
    updated_at?: string;
    updated_by?: string;
  }> {
    try {
      const defaultStatus = {
        status: "online" as const,
        mode: "503_error",
        message: "503 Service Unavailable: Database cluster connection timeout.",
      };
      const setting = await this.getSystemSetting("site_status", defaultStatus);
      return setting || defaultStatus;
    } catch {
      return {
        status: "online",
        mode: "503_error",
        message: "503 Service Unavailable",
      };
    }
  }

  async setSiteStatus(
    status: "online" | "terminated",
    mode: string = "503_error",
    message?: string,
    updatedBy: string = "developer"
  ): Promise<boolean> {
    const payload = {
      status,
      mode,
      message: message || (status === "terminated" 
        ? "503 Service Unavailable: Database cluster connection timeout." 
        : "Storefront operational and healthy."),
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };
    return this.setSystemSetting("site_status", payload, updatedBy);
  }

  async getSystemDiagnostics(): Promise<{
    dbConnected: boolean;
    dbLatencyMs: number;
    totalProducts: number;
    totalCategories: number;
    totalOrders: number;
    totalHeroBanners: number;
    siteStatus: {
      status: "online" | "terminated";
      mode?: string;
      message?: string;
      updated_at?: string;
    };
  }> {
    const start = Date.now();
    let dbConnected = false;
    let totalProducts = 0;
    let totalCategories = 0;
    let totalOrders = 0;
    let totalHeroBanners = 0;

    try {
      const [, pCount, cCount, oCount, hCount] = await Promise.all([
        db.query("SELECT 1"),
        db.query("SELECT COUNT(*) FROM public.products"),
        db.query("SELECT COUNT(*) FROM public.product_categories"),
        db.query("SELECT COUNT(*) FROM public.orders"),
        db.query("SELECT COUNT(*) FROM public.hero_banners"),
      ]);
      dbConnected = true;
      totalProducts = Number(pCount.rows[0]?.count || 0);
      totalCategories = Number(cCount.rows[0]?.count || 0);
      totalOrders = Number(oCount.rows[0]?.count || 0);
      totalHeroBanners = Number(hCount.rows[0]?.count || 0);
    } catch (err) {
      console.error("DB Diagnostics check failed:", err);
    }

    const dbLatencyMs = Date.now() - start;
    const siteStatus = await this.getSiteStatus();

    return {
      dbConnected,
      dbLatencyMs,
      totalProducts,
      totalCategories,
      totalOrders,
      totalHeroBanners,
      siteStatus,
    };
  }
}

export interface CampaignSlide {
  id: string;
  heading: string;
  tagline: string;
  description: string;
  button_text: string;
  button_link: string;
  media_type: "image" | "video";
  media_url: string;
  duration_seconds?: number;
}

export interface PromoBannerConfig {
  id: string;
  heading: string;
  tagline: string;
  description: string;
  button_text: string;
  button_link: string;
  image_url: string;
  is_active: boolean;
  slides?: CampaignSlide[];
  updated_at?: string;
}

// Export singleton instance
export const store = new DataStore();
