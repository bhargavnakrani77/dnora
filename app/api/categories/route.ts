import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeUncategorized = searchParams.get("include_uncategorized") === "true";
    const categories = await store.getCategories(includeUncategorized);
    return NextResponse.json({ success: true, data: categories });
  } catch (error: unknown) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      slug,
      description,
      image_url,
      banner_image_url,
      banner_mobile_image_url,
      banner_heading,
      banner_subtitle,
      banner_media_type,
      is_in_nav,
      is_in_collections,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    const category = await store.createCategory({
      name: name.trim(),
      slug: typeof slug === "string" ? slug.trim() : undefined,
      description: typeof description === "string" ? description.trim() : undefined,
      image_url: typeof image_url === "string" ? image_url.trim() : undefined,
      banner_image_url: typeof banner_image_url === "string" ? banner_image_url.trim() : undefined,
      banner_mobile_image_url: typeof banner_mobile_image_url === "string" ? banner_mobile_image_url.trim() : undefined,
      banner_heading: typeof banner_heading === "string" ? banner_heading.trim() : undefined,
      banner_subtitle: typeof banner_subtitle === "string" ? banner_subtitle.trim() : undefined,
      banner_media_type: banner_media_type === "video" ? "video" : "image",
      is_in_nav: is_in_nav !== undefined ? Boolean(is_in_nav) : true,
      is_in_collections: is_in_collections !== undefined ? Boolean(is_in_collections) : true,
    });

    try {
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/admin/categories");
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error: unknown) {
    console.error("Error creating category:", error);
    const errMessage = error instanceof Error ? error.message : "";
    const message = errMessage.includes("unique")
      ? "Category name or slug already exists"
      : "Failed to create category";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
