import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageKey = searchParams.get("page") || "bestseller";

    const [pageConfig, allProducts] = await Promise.all([
      store.getStorefrontPageConfig(pageKey),
      store.getProducts({ status: "active" }),
    ]);

    return NextResponse.json({
      success: true,
      page: pageConfig,
      products: allProducts,
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/storefront-pages error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.page_key) {
      return NextResponse.json(
        { success: false, error: "Missing required field: page_key" },
        { status: 400 }
      );
    }

    const saved = await store.saveStorefrontPageConfig({
      page_key: body.page_key,
      title: body.title,
      badge_label: body.badge_label,
      subtitle: body.subtitle,
      description: body.description,
      banner_image_url: body.banner_image_url,
      banner_headline: body.banner_headline,
      banner_subheadline: body.banner_subheadline,
      meta_title: body.meta_title,
      meta_description: body.meta_description,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      featured_product_ids: Array.isArray(body.featured_product_ids) ? body.featured_product_ids : [],
    });

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (err: unknown) {
    console.error("PUT /api/admin/storefront-pages error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to save storefront page" },
      { status: 500 }
    );
  }
}
