import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";
import { AnnouncementItem } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await store.getAnnouncementsConfig();
    return NextResponse.json(config);
  } catch (err: unknown) {
    console.error("Error fetching announcements config:", err);
    return NextResponse.json(
      { id: "default", interval_seconds: 4, is_active: true, items: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      interval_seconds = 4,
      is_active = true,
      items = [],
    } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid payload: 'items' must be an array." },
        { status: 400 }
      );
    }

    const cleanInterval = Math.max(1, Math.min(60, Number(interval_seconds) || 4));

    // Sanitize and structure items
    const sanitizedItems: AnnouncementItem[] = items.map((item, idx) => ({
      id: String(item.id || `ann-${Date.now()}-${idx}`),
      text: String(item.text || "").trim(),
      link: item.link ? String(item.link).trim() : "/shop",
      badge: item.badge ? String(item.badge).trim() : undefined,
      is_active: Boolean(item.is_active ?? true),
      sort_order: Number(item.sort_order ?? idx + 1),
    })).filter((item) => item.text.length > 0);

    const updatedConfig = await store.saveAnnouncementsConfig({
      interval_seconds: cleanInterval,
      is_active: Boolean(is_active),
      items: sanitizedItems,
    });

    return NextResponse.json({
      success: true,
      message: "Announcement bar settings saved successfully.",
      config: updatedConfig,
    });
  } catch (err: unknown) {
    console.error("Error updating announcement bar config:", err);
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      { error: "Failed to update announcement bar config: " + msg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const deleteId = searchParams.get("id");

    if (!deleteId) {
      return NextResponse.json({ error: "Missing announcement id to delete." }, { status: 400 });
    }

    const currentConfig = await store.getAnnouncementsConfig();
    const filteredItems = currentConfig.items.filter((i) => i.id !== deleteId);

    const updated = await store.saveAnnouncementsConfig({
      interval_seconds: currentConfig.interval_seconds,
      is_active: currentConfig.is_active,
      items: filteredItems,
    });

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully.",
      deletedId: deleteId,
      remainingCount: updated.items.length,
      config: updated,
    });
  } catch (err: unknown) {
    console.error("Error deleting announcement:", err);
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      { error: "Failed to delete announcement: " + msg },
      { status: 500 }
    );
  }
}
