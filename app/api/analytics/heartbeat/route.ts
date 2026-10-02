import { NextRequest, NextResponse } from "next/server";
import { recordVisitorHeartbeat, removeVisitor } from "@/lib/realtime/active-visitors";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    let body: { visitorId?: string; path?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Beacon may send form-encoded or empty text
    }

    const visitorId = body.visitorId || searchParams.get("visitorId");
    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json({ error: "Missing visitorId" }, { status: 400 });
    }

    // If client is unloading / leaving
    if (action === "leave") {
      await removeVisitor(visitorId);
      return NextResponse.json({ success: true, status: "removed" });
    }

    const path = body.path || "/";
    const userAgent = req.headers.get("user-agent") || undefined;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;

    const count = await recordVisitorHeartbeat(visitorId, path, userAgent, ip);

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Heartbeat API error:", error);
    return NextResponse.json({ error: "Failed to record heartbeat" }, { status: 500 });
  }
}
