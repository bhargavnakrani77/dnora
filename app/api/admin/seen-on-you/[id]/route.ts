import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      customer_name,
      video_url,
      thumbnail_url,
      caption,
      product_name,
      product_slug,
      status,
      sort_order,
    } = body;

    const res = await db.query(
      `UPDATE public.customer_videos
       SET customer_name = COALESCE($1, customer_name),
           video_url = COALESCE($2, video_url),
           thumbnail_url = COALESCE($3, thumbnail_url),
           caption = COALESCE($4, caption),
           product_name = COALESCE($5, product_name),
           product_slug = COALESCE($6, product_slug),
           status = COALESCE($7, status),
           sort_order = COALESCE($8, sort_order)
       WHERE id = $9
       RETURNING *`,
      [
        customer_name,
        video_url,
        thumbnail_url,
        caption,
        product_name,
        product_slug,
        status,
        sort_order !== undefined ? Number(sort_order) : null,
        id,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    revalidatePath("/");

    return NextResponse.json({ success: true, video: res.rows[0] });
  } catch (err: unknown) {
    console.error("Failed to update customer video:", err);
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: "Failed to update video: " + msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const res = await db.query(
      `DELETE FROM public.customer_videos WHERE id = $1 RETURNING id`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Video deleted successfully" });
  } catch (err: unknown) {
    console.error("Failed to delete customer video:", err);
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: "Failed to delete video: " + msg }, { status: 500 });
  }
}
