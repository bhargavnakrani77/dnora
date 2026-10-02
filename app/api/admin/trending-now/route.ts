import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const items = await store.getTrendingNowItems(false);
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error("Failed to fetch trending items:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    let finalImageUrl = body.image_url;
    let finalTitle = body.title || "";
    let finalSlug = body.product_slug;

    if (body.product_id && (!finalImageUrl || !finalTitle)) {
      const prodRes = await db.query(
        `SELECT p.name, p.slug, (SELECT pi.secure_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) as img 
         FROM public.products p WHERE p.id = $1`,
        [body.product_id]
      );
      if (prodRes.rows.length > 0) {
        if (!finalImageUrl) {
          finalImageUrl = prodRes.rows[0].img || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80";
        }
        if (!finalTitle) finalTitle = prodRes.rows[0].name;
        if (!finalSlug) finalSlug = prodRes.rows[0].slug;
      }
    }

    if (!finalImageUrl) {
      return NextResponse.json({ error: "Product or image is required" }, { status: 400 });
    }

    const item = await store.createTrendingNowItem({
      title: finalTitle,
      image_url: finalImageUrl,
      alt_text: body.alt_text || finalTitle || "",
      sort_order: Number(body.sort_order ?? 0),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      target_link: body.target_link || (finalSlug ? `/product/${finalSlug}` : undefined),
      product_id: body.product_id || undefined,
      product_slug: finalSlug || undefined,
    });

    revalidatePath("/");
    revalidatePath("/trending-now");

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (err) {
    console.error("Failed to create trending item:", err);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    await store.updateTrendingNowItem(body.id, {
      title: body.title,
      image_url: body.image_url,
      alt_text: body.alt_text,
      sort_order: body.sort_order !== undefined ? Number(body.sort_order) : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      target_link: body.target_link !== undefined ? body.target_link : undefined,
      product_id: body.product_id !== undefined ? body.product_id : undefined,
      product_slug: body.product_slug !== undefined ? body.product_slug : undefined,
    });

    revalidatePath("/");
    revalidatePath("/trending-now");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update trending item:", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    await store.deleteTrendingNowItem(id);

    revalidatePath("/");
    revalidatePath("/trending-now");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete trending item:", err);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
