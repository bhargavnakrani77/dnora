import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth/session";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = body?.password || "";

    const expectedPassword = process.env.ADMIN_PASSWORD || "admin";

    const pwdBuf = Buffer.from(String(password));
    const expBuf = Buffer.from(String(expectedPassword));
    const isMatch = pwdBuf.length === expBuf.length && crypto.timingSafeEqual(pwdBuf, expBuf);

    if (isMatch) {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@dnora.luxury";
      // Completely isolated admin session cookie (never touches customer cart/session)
      await createAdminSession(adminEmail);

      return NextResponse.json({
        success: true,
        redirectTo: "/admin",
      });
    }

    return NextResponse.json(
      { error: "Incorrect admin password." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
