import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { store } from "@/lib/data/store";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 4) {
      return NextResponse.json(
        { error: "New password must be at least 4 characters long." },
        { status: 400 }
      );
    }

    const expectedPassword = await store.getAdminPassword();

    // If currentPassword was provided, verify it safely
    if (currentPassword !== undefined && currentPassword !== null) {
      const curBuf = Buffer.from(String(currentPassword));
      const expBuf = Buffer.from(String(expectedPassword));
      const isMatch = curBuf.length === expBuf.length && crypto.timingSafeEqual(curBuf, expBuf);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Incorrect current admin password." },
          { status: 400 }
        );
      }
    }

    const trimmedNew = newPassword.trim();

    // 1. Update in system_settings store
    const success = await store.setAdminPassword(trimmedNew);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to persist new admin credentials." },
        { status: 500 }
      );
    }

    // 2. Synchronize admin user in public.users if present
    try {
      const adminEmail = (process.env.ADMIN_EMAIL || "admin@dnora.luxury").toLowerCase().trim();
      const pwdHash = await hashPassword(trimmedNew);
      await db.query(
        `UPDATE public.users 
         SET password_hash = $1, raw_password = $2, updated_at = timezone('utc'::text, now()) 
         WHERE LOWER(email) = LOWER($3) OR role = 'admin'`,
        [pwdHash, trimmedNew, adminEmail]
      );
    } catch (dbErr) {
      console.warn("Notice: admin sync in public.users:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Admin master password has been successfully updated.",
    });
  } catch (err: unknown) {
    console.error("Admin change password error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: "Failed to change admin password: " + message },
      { status: 500 }
    );
  }
}
