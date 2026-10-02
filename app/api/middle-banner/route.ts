import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banner = await store.getMiddleBanner();
    return NextResponse.json({ success: true, banner });
  } catch (error: unknown) {
    console.error("Error loading middle banner:", error);
    return NextResponse.json({ error: "Failed to load middle banner" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const banner = await store.updateMiddleBanner(body);
    return NextResponse.json({ success: true, banner });
  } catch (error: unknown) {
    console.error("Error saving middle banner:", error);
    const msg = error instanceof Error ? error.message : "Failed to save middle banner";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
