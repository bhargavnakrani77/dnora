import { NextResponse } from "next/server";
import { destroyUserSession } from "@/lib/auth/user-session";

export const dynamic = "force-dynamic";

export async function POST() {
  // Completely isolated member storefront session logout - never touches admin session
  await destroyUserSession();
  return NextResponse.json({ success: true });
}
