import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";
    const items = await store.getCircularCollections(includeInactive);
    return NextResponse.json({ success: true, items });
  } catch (error: unknown) {
    console.error("Error fetching circular collections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch collections" },
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
    const { label, href, image, badge, alt, sort_order, is_active } = body;

    if (!label || typeof label !== "string" || !label.trim()) {
      return NextResponse.json(
        { success: false, error: "Collection label is required" },
        { status: 400 }
      );
    }

    if (!image || typeof image !== "string" || !image.trim()) {
      return NextResponse.json(
        { success: false, error: "Collection image URL is required" },
        { status: 400 }
      );
    }

    const item = await store.createCircularCollection({
      label: label.trim(),
      href: typeof href === "string" && href.trim() ? href.trim() : "/shop",
      image: image.trim(),
      badge: typeof badge === "string" ? badge.trim() : undefined,
      alt: typeof alt === "string" ? alt.trim() : undefined,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    revalidatePath("/");
    revalidatePath("/admin/collections");

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    console.error("Error creating circular collection:", error);
    const message = error instanceof Error ? error.message : "Failed to create collection";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
