import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await store.getHomepageConfig();
    return NextResponse.json({ success: true, config });
  } catch (error: unknown) {
    console.error("Error fetching homepage config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch homepage configuration" },
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
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid configuration payload" },
        { status: 400 }
      );
    }

    const updated = await store.updateHomepageConfig(body.config || body);
    return NextResponse.json({ success: true, config: updated });
  } catch (error: unknown) {
    console.error("Error updating homepage config:", error);
    const msg = error instanceof Error ? error.message : "Failed to update configuration";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
