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
    const { label, href, image, badge, alt, sort_order, is_active } = body;

    const existing = await store.getCircularCollectionById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Collection not found" }, { status: 404 });
    }

    const updated = await store.updateCircularCollection(id, {
      label: typeof label === "string" ? label.trim() : undefined,
      href: typeof href === "string" ? href.trim() : undefined,
      image: typeof image === "string" ? image.trim() : undefined,
      badge: badge !== undefined ? (badge ? String(badge).trim() : null) : undefined,
      alt: alt !== undefined ? (alt ? String(alt).trim() : null) : undefined,
      sort_order: typeof sort_order === "number" ? sort_order : undefined,
      is_active: is_active !== undefined ? Boolean(is_active) : undefined,
    });

    revalidatePath("/");
    revalidatePath("/admin/collections");

    return NextResponse.json({ success: true, item: updated });
  } catch (error: unknown) {
    console.error("Error updating circular collection:", error);
    const message = error instanceof Error ? error.message : "Failed to update collection";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
    const existing = await store.getCircularCollectionById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Collection not found" }, { status: 404 });
    }

    const deleted = await store.deleteCircularCollection(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Failed to delete collection" }, { status: 500 });
    }

    revalidatePath("/");
    revalidatePath("/admin/collections");

    return NextResponse.json({ success: true, message: "Collection item deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting circular collection:", error);
    const message = error instanceof Error ? error.message : "Failed to delete collection";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
