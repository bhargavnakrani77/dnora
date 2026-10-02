export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";
import { heroBannerUpdateSchema } from "@/lib/validation/hero";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { HeroBanner } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const banner = await store.getHeroBannerById(id);
  if (!banner) {
    return NextResponse.json({ error: "Hero banner not found" }, { status: 404 });
  }
  return NextResponse.json({ banner });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = heroBannerUpdateSchema.parse(body);

    const updatePayload: Partial<HeroBanner> = {
      ...validated,
    };

    if ("heading" in body) {
      updatePayload.heading = validated.heading && validated.heading.trim() ? validated.heading.trim() : null;
    }
    if ("subtitle" in body) {
      updatePayload.subtitle = validated.subtitle && validated.subtitle.trim() ? validated.subtitle.trim() : null;
    }
    if ("button_text" in body) {
      updatePayload.button_text = validated.button_text && validated.button_text.trim() ? validated.button_text.trim() : null;
    }
    if ("tablet_media_url" in body) {
      updatePayload.tablet_media_url = validated.tablet_media_url && validated.tablet_media_url.trim() ? validated.tablet_media_url.trim() : null;
    }
    if ("mobile_media_url" in body) {
      updatePayload.mobile_media_url = validated.mobile_media_url && validated.mobile_media_url.trim() ? validated.mobile_media_url.trim() : null;
    }
    if ("start_date" in body) {
      updatePayload.start_date = validated.start_date || null;
    }
    if ("end_date" in body) {
      updatePayload.end_date = validated.end_date || null;
    }

    const updated = await store.updateHeroBanner(id, updatePayload);
    if (!updated) {
      return NextResponse.json({ error: "Hero banner not found" }, { status: 404 });
    }

    revalidatePath("/");
    return NextResponse.json({ success: true, banner: updated });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const success = await store.deleteHeroBanner(id);

  if (!success) {
    return NextResponse.json({ error: "Hero banner not found" }, { status: 404 });
  }

  revalidatePath("/");
  return NextResponse.json({ success: true });
}
