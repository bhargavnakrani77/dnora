import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
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
      banner_fit,
      banner_position,
      banner_aspect_ratio,
      is_in_nav,
      is_in_collections,
    } = body;

    const existing = await store.getCategoryById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const updated = await store.updateCategory(id, {
      name: typeof name === "string" ? name.trim() : undefined,
      slug: typeof slug === "string" ? slug.trim() : undefined,
      description: typeof description === "string" ? description.trim() : undefined,
      image_url: image_url !== undefined ? (image_url ? String(image_url).trim() : "") : undefined,
      banner_image_url:
        banner_image_url !== undefined
          ? banner_image_url
            ? String(banner_image_url).trim()
            : ""
          : undefined,
      banner_mobile_image_url:
        banner_mobile_image_url !== undefined
          ? banner_mobile_image_url
            ? String(banner_mobile_image_url).trim()
            : ""
          : undefined,
      banner_heading:
        banner_heading !== undefined
          ? banner_heading
            ? String(banner_heading).trim()
            : ""
          : undefined,
      banner_subtitle:
        banner_subtitle !== undefined
          ? banner_subtitle
            ? String(banner_subtitle).trim()
            : ""
          : undefined,
      banner_media_type:
        banner_media_type !== undefined
          ? banner_media_type === "video"
            ? "video"
            : "image"
          : undefined,
      banner_fit:
        banner_fit !== undefined
          ? banner_fit === "contain"
            ? "contain"
            : "cover"
          : undefined,
      banner_position:
        banner_position !== undefined
          ? typeof banner_position === "string" && banner_position.trim().length <= 40
            ? banner_position.trim()
            : "center"
          : undefined,
      banner_aspect_ratio:
        banner_aspect_ratio !== undefined
          ? ["storefront", "natural", "ultrawide", "video"].includes(banner_aspect_ratio)
            ? banner_aspect_ratio
            : "storefront"
          : undefined,
      is_in_nav: is_in_nav !== undefined ? Boolean(is_in_nav) : undefined,
      is_in_collections: is_in_collections !== undefined ? Boolean(is_in_collections) : undefined,
    });

    try {
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath(`/category/${existing.slug}`);
      if (updated?.slug && updated.slug !== existing.slug) {
        revalidatePath(`/category/${updated.slug}`);
      }
      revalidatePath("/admin/categories");
    } catch (revalErr) {
      console.warn("Path revalidation warning:", revalErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("Error updating category:", error);
    const errMessage = error instanceof Error ? error.message : "";
    const message = errMessage.includes("unique")
      ? "Category name or slug already exists"
      : "Failed to update category";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existing = await store.getCategoryById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const updatePayload: { is_in_nav?: boolean; is_in_collections?: boolean } = {};

    if (body.is_in_nav !== undefined) {
      updatePayload.is_in_nav = Boolean(body.is_in_nav);
    }
    if (body.is_in_collections !== undefined) {
      updatePayload.is_in_collections = Boolean(body.is_in_collections);
    }
    if (Object.keys(updatePayload).length === 0) {
      updatePayload.is_in_nav = !existing.is_in_nav;
    }

    const updated = await store.updateCategory(id, updatePayload);

    try {
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/admin/categories");
    } catch {
      // non-blocking
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("Error toggling category nav:", error);
    return NextResponse.json({ success: false, error: "Failed to update navigation status" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existing = await store.getCategoryById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const result = await store.deleteCategory(id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to delete category" },
        { status: 400 }
      );
    }

    // Invalidate storefront and admin paths safely
    try {
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/admin/categories");
    } catch (revalErr) {
      console.warn("Path revalidation warning:", revalErr);
    }

    return NextResponse.json({
      success: true,
      message: `Category "${existing.name}" deleted successfully.`,
      movedToUncategorizedCount: result.movedToUncategorizedCount || 0,
    });
  } catch (error: unknown) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 });
  }
}
