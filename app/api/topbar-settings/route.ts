import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TopBarConfig, DEFAULT_TOPBAR_CONFIG } from "@/lib/topbar-constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await db.query(
      `SELECT config FROM public.homepage_config WHERE id = 'topbar' LIMIT 1`
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ ...DEFAULT_TOPBAR_CONFIG });
    }

    const raw = res.rows[0].config;
    const config = typeof raw === "string" ? JSON.parse(raw) : raw;
    return NextResponse.json({
      ...DEFAULT_TOPBAR_CONFIG,
      ...config,
    });
  } catch (error) {
    console.error("Error fetching topbar-settings config:", error);
    return NextResponse.json({ ...DEFAULT_TOPBAR_CONFIG });
  }
}
