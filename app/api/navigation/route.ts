import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { store } from "@/lib/data/store";
import { SidebarMenuItem } from "@/types";
import {
  DEFAULT_STOREFRONT_NAVIGATION,
  DEFAULT_ACCOUNT_NAVIGATION,
} from "@/lib/navigation-constants";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("target") || "storefront";

    const defaultItems =
      target === "account"
        ? DEFAULT_ACCOUNT_NAVIGATION
        : DEFAULT_STOREFRONT_NAVIGATION;

    const res = await db.query(
      `SELECT items FROM public.site_navigation_config WHERE id = $1 LIMIT 1`,
      [target]
    );

    let items: SidebarMenuItem[] =
      res.rows.length > 0 && Array.isArray(res.rows[0].items)
        ? res.rows[0].items
        : defaultItems;

    // Dynamically synchronize categories for storefront navigation
    if (target === "storefront") {
      try {
        const categories = await store.getCategories();
        if (categories && categories.length > 0) {
          const activeCategories = categories.filter(
            (cat) => (cat.is_in_nav ?? true) && cat.slug !== "uncategorized"
          );
          const categorySubmenus = activeCategories.map((cat) => ({
            id: `sf-cat-${cat.id}`,
            label: cat.name,
            href: `/category/${cat.slug}`,
            is_active: true,
          }));

          let found = false;
          items = items.map((item) => {
            if (
              item.id === "sf-categories" ||
              item.label?.toLowerCase() === "categories"
            ) {
              found = true;
              return {
                ...item,
                submenus: categorySubmenus,
              };
            }
            return item;
          });

          if (!found) {
            items.splice(2, 0, {
              id: "sf-categories",
              label: "Categories",
              href: "/#categories",
              icon: "Box",
              is_active: true,
              submenus: categorySubmenus,
            });
          }
        }
      } catch (catErr) {
        console.error("Error populating dynamic categories for navigation:", catErr);
      }

      // Synchronize Member Portal submenus only if user hasn't configured custom submenus
      items = items.map((item) => {
        if (
          item.id === "sf-account" ||
          item.label?.toLowerCase().includes("member") ||
          item.label?.toLowerCase().includes("account")
        ) {
          if (item.submenus && item.submenus.length > 0) {
            return item;
          }
          return {
            ...item,
            label: "Member Portal",
            submenus: [
              { id: "sf-sub-track", label: "Track Your Order", href: "/account?tab=orders", badge: "Live" },
              { id: "sf-sub-profile", label: "My Profile", href: "/account?tab=profile" },
              { id: "sf-sub-orders", label: "Orders & Purchases", href: "/account?tab=orders" },
              { id: "sf-sub-addresses", label: "Delivery Addresses", href: "/account?tab=addresses" },
            ],
          };
        }
        return item;
      });
    }

    return NextResponse.json({ target, items });
  } catch (err: unknown) {
    console.error("Error fetching site navigation config:", err);
    return NextResponse.json({
      target: "storefront",
      items: DEFAULT_STOREFRONT_NAVIGATION,
    });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { target = "storefront", items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid payload. 'items' must be an array." },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO public.site_navigation_config (id, items, updated_at)
       VALUES ($1, $2, timezone('utc'::text, now()))
       ON CONFLICT (id) DO UPDATE SET 
         items = EXCLUDED.items,
         updated_at = EXCLUDED.updated_at;`,
      [target, JSON.stringify(items)]
    );

    return NextResponse.json({ success: true, target, items });
  } catch (err: unknown) {
    console.error("Error saving site navigation config:", err);
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      { error: "Failed to save navigation config: " + message },
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
    const target = searchParams.get("target") || "storefront";

    const defaultItems =
      target === "account"
        ? DEFAULT_ACCOUNT_NAVIGATION
        : DEFAULT_STOREFRONT_NAVIGATION;

    await db.query(
      `INSERT INTO public.site_navigation_config (id, items, updated_at)
       VALUES ($1, $2, timezone('utc'::text, now()))
       ON CONFLICT (id) DO UPDATE SET 
         items = EXCLUDED.items,
         updated_at = EXCLUDED.updated_at;`,
      [target, JSON.stringify(defaultItems)]
    );

    return NextResponse.json({
      success: true,
      message: `Reset navigation for '${target}' to factory defaults.`,
      target,
      items: defaultItems,
    });
  } catch (err: unknown) {
    console.error("Error resetting site navigation config:", err);
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      { error: "Failed to reset navigation config: " + message },
      { status: 500 }
    );
  }
}
