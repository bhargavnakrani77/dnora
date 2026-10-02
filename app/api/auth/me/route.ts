import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/user-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getUserSession();
    return NextResponse.json({
      isAuthenticated: !!session,
      user: session || null,
    });
  } catch (error) {
    console.error("Auth verification error in /api/auth/me:", error);
    return NextResponse.json({ isAuthenticated: false, user: null });
  }
}
