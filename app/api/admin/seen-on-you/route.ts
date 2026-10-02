import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
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
      `SELECT * FROM public.customer_videos ORDER BY sort_order ASC, created_at DESC`
    );
    return NextResponse.json({ success: true, videos: res.rows });
  } catch (err) {
    console.error("Failed to load customer videos:", err);
    return NextResponse.json({ error: "Failed to load customer videos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      customer_name = "DNORA Patron",
      video_url,
      thumbnail_url,
      caption = "",
      product_name = "",
      product_slug = "",
      status = "active",
      sort_order = 0,
    } = body;

    if (!video_url) {
      return NextResponse.json({ error: "video_url is required" }, { status: 400 });
    }

    const res = await db.query(
      `INSERT INTO public.customer_videos
        (customer_name, video_url, thumbnail_url, caption, product_name, product_slug, status, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        customer_name.trim(),
        video_url.trim(),
        (thumbnail_url || "").trim(),
        caption.trim(),
        product_name.trim(),
        product_slug.trim(),
        status,
        Number(sort_order) || 0,
      ]
    );

    revalidatePath("/");

    return NextResponse.json({ success: true, video: res.rows[0] }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to create customer video:", err);
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: "Failed to create video: " + msg }, { status: 500 });
  }
}
