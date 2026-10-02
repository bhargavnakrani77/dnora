export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";
import { heroBannerSchema } from "@/lib/validation/hero";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeDrafts = searchParams.get("includeDrafts") === "true";

  // Only authorized admins can request drafts
  if (includeDrafts) {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const banners = await store.getHeroBanners(true);
    return NextResponse.json({ banners });
  }

  const banners = await store.getHeroBanners(false);
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = heroBannerSchema.parse(body);

    const newBanner = await store.createHeroBanner({
      ...validated,
      button_link: validated.button_link || "/shop",
      button_text: validated.button_text && validated.button_text.trim() ? validated.button_text.trim() : null,
      heading: validated.heading && validated.heading.trim() ? validated.heading.trim() : null,
      tablet_media_url: validated.tablet_media_url && validated.tablet_media_url.trim() ? validated.tablet_media_url.trim() : null,
      mobile_media_url: validated.mobile_media_url && validated.mobile_media_url.trim() ? validated.mobile_media_url.trim() : null,
      subtitle: validated.subtitle && validated.subtitle.trim() ? validated.subtitle.trim() : null,
      start_date: validated.start_date || null,
      end_date: validated.end_date || null,
    });

    // Revalidate live storefront
    revalidatePath("/");

    return NextResponse.json({ success: true, banner: newBanner }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create hero banner:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
