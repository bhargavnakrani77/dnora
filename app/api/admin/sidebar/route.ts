import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_SIDEBAR_ITEMS } from "@/lib/sidebar-constants";
import { SidebarMenuItem } from "@/types";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await db.query(
      `SELECT items FROM public.admin_sidebar_config WHERE id = 'default' LIMIT 1`
    );

    if (res.rows.length > 0 && Array.isArray(res.rows[0].items)) {
      const dbItems: SidebarMenuItem[] = res.rows[0].items;

      const allowedIds = new Set([
        "nav-dashboard",
        "nav-orders",
        "nav-categories",
        "nav-products",
        "nav-customization",
        "nav-storefront",
      ]);

      // Check if dbItems strictly has the allowed items and exact count, and modern path-based URLs
      const custItem = dbItems.find((it) => it.id === "nav-customization");
      const hasOldQueryUrls = custItem?.submenus?.some((sub) => sub.href.includes("?tab="));

      const isExactMatch =
        !hasOldQueryUrls &&
        dbItems.length === DEFAULT_SIDEBAR_ITEMS.length &&
        dbItems.every((it) => allowedIds.has(it.id));

      if (!isExactMatch) {
        // Enforce the requested clean 6-item structure in DB
        await db.query(
          `INSERT INTO public.admin_sidebar_config (id, items, updated_at)
           VALUES ('default', $1, timezone('utc'::text, now()))
           ON CONFLICT (id) DO UPDATE SET 
             items = EXCLUDED.items,
             updated_at = EXCLUDED.updated_at;`,
          [JSON.stringify(DEFAULT_SIDEBAR_ITEMS)]
        );
        return NextResponse.json({ items: DEFAULT_SIDEBAR_ITEMS });
      }

      return NextResponse.json({ items: dbItems });
    }

    // Default initialization in DB
    await db.query(
      `INSERT INTO public.admin_sidebar_config (id, items, updated_at)
       VALUES ('default', $1, timezone('utc'::text, now()))
       ON CONFLICT (id) DO UPDATE SET 
         items = EXCLUDED.items,
         updated_at = EXCLUDED.updated_at;`,
      [JSON.stringify(DEFAULT_SIDEBAR_ITEMS)]
    );

    return NextResponse.json({ items: DEFAULT_SIDEBAR_ITEMS });
  } catch (err: unknown) {
    console.error("Error fetching admin sidebar config:", err);
    return NextResponse.json({ items: DEFAULT_SIDEBAR_ITEMS });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid payload. 'items' must be an array." },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO public.admin_sidebar_config (id, items, updated_at)
       VALUES ('default', $1, timezone('utc'::text, now()))
       ON CONFLICT (id) DO UPDATE SET 
         items = EXCLUDED.items,
         updated_at = EXCLUDED.updated_at;`,
      [JSON.stringify(items)]
    );

    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    console.error("Error saving admin sidebar config:", err);
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      { error: "Failed to save sidebar config: " + message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.query(
      `INSERT INTO public.admin_sidebar_config (id, items, updated_at)
       VALUES ('default', $1, timezone('utc'::text, now()))
       ON CONFLICT (id) DO UPDATE SET 
         items = EXCLUDED.items,
         updated_at = EXCLUDED.updated_at;`,
      [JSON.stringify(DEFAULT_SIDEBAR_ITEMS)]
    );

    return NextResponse.json({
      success: true,
      message: "Sidebar configuration reset to factory default.",
      items: DEFAULT_SIDEBAR_ITEMS,
    });
  } catch (err: unknown) {
    console.error("Error resetting sidebar config:", err);
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      { error: "Failed to reset sidebar config: " + message },
      { status: 500 }
    );
  }
}
