import { NextResponse } from "next/server";
import { getActiveVisitorCount } from "@/lib/realtime/active-visitors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await getActiveVisitorCount();
    return NextResponse.json(
      {
        success: true,
        count,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
        },
      }
    );
  } catch (error) {
    console.error("Live visitors GET error:", error);
    return NextResponse.json({ error: "Failed to fetch live visitor count" }, { status: 500 });
  }
}
