import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await store.getPromoBannerConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("GET /api/promo-banner error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo banner configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updated = await store.updatePromoBannerConfig({
      heading: body.heading,
      tagline: body.tagline,
      description: body.description,
      button_text: body.button_text,
      button_link: body.button_link,
      image_url: body.image_url,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      slides: Array.isArray(body.slides) ? body.slides : undefined,
    });

    revalidatePath("/");

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error("PUT /api/promo-banner error:", error);
    return NextResponse.json(
      { error: "Failed to update promo banner configuration" },
      { status: 500 }
    );
  }
}
