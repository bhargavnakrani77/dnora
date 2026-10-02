import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

import { TopBarConfig, DEFAULT_TOPBAR_CONFIG } from "@/lib/topbar-constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await db.query(
      `SELECT config FROM public.homepage_config WHERE id = 'topbar' LIMIT 1`
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ config: DEFAULT_TOPBAR_CONFIG });
    }

    const raw = res.rows[0].config;
    const config = typeof raw === "string" ? JSON.parse(raw) : raw;
    return NextResponse.json({
      config: { ...DEFAULT_TOPBAR_CONFIG, ...config },
    });
  } catch (error) {
    console.error("Error fetching topbar config:", error);
    return NextResponse.json({ config: DEFAULT_TOPBAR_CONFIG });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const configToSave: TopBarConfig = {
      ...DEFAULT_TOPBAR_CONFIG,
      ...(body.config || body),
    };

    await db.query(
      `INSERT INTO public.homepage_config (id, config, updated_at)
       VALUES ('topbar', $1, timezone('utc'::text, now()))
       ON CONFLICT (id) DO UPDATE SET
         config = EXCLUDED.config,
         updated_at = timezone('utc'::text, now())`,
      [JSON.stringify(configToSave)]
    );

    revalidatePath("/");
    return NextResponse.json({ success: true, config: configToSave });
  } catch (error) {
    console.error("Error updating topbar config:", error);
    return NextResponse.json(
      { error: "Failed to update topbar configuration" },
      { status: 500 }
    );
  }
}
