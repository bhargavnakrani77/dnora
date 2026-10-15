import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { store } from "@/lib/data/store";
import { checkCloudinaryHealth } from "@/lib/cloudinary";
import { createAdminSession } from "@/lib/auth/session";
import {
  AUTH_COOKIE,
  BYPASS_COOKIE,
  createSignedToken,
  isCallerAuthorized,
  jsonWithCors,
  optionsCorsResponse,
  verifyMasterPasscode,
} from "@/lib/auth/sys-auth";

export const dynamic = "force-dynamic";

/**
 * Handle CORS Preflight for external website calls
 */
export async function OPTIONS() {
  return optionsCorsResponse();
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE);
    const isAuthenticated = isCallerAuthorized(req, null, authCookie?.value);

    // Fetch site status
    const currentSiteStatus = await store.getSiteStatus().catch(() => ({
      status: "online" as const,
      mode: "503_error",
      message: "Storefront operational",
      updated_at: new Date().toISOString(),
    }));

    // If caller is NOT authenticated, return basic server status without sensitive credentials
    if (!isAuthenticated) {
      return jsonWithCors({
        authenticated: false,
        serverDown: currentSiteStatus.status === "terminated",
        siteStatus: currentSiteStatus,
      });
    }

    // Authenticated caller: fetch full diagnostics and credentials
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
        securityStatus: "Cryptographic SHA-256 Digest Active",
      },
    };

    return jsonWithCors({
      authenticated: true,
      serverDown: currentSiteStatus.status === "terminated",
      diagnostics: diagnostics || { siteStatus: currentSiteStatus },
      cloudinary: cloudinaryHealth,
      credentials: envCredentials,
      serverTime: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error: any) {
    return jsonWithCors(
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

    // 1. AUTHENTICATION LOGIN FOR DEVELOPER PORTAL
    if (action === "login") {
      const providedKey = String(body.masterKey || body.apiKey || "").trim();
      const isValid = verifyMasterPasscode(providedKey);

      if (!isValid) {
        return jsonWithCors(
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

      return jsonWithCors({
        success: true,
        message: "Developer Control Terminal Unlocked.",
      });
    }

    // Verify Authorization: via cookie, x-api-key, Bearer token, query param, or body key
    const authCookie = cookieStore.get(AUTH_COOKIE);
    const isAuthorized = isCallerAuthorized(req, body, authCookie?.value);

    if (!isAuthorized) {
      return jsonWithCors(
        {
          success: false,
          error:
            "Unauthorized administrative operation. Provide API key via x-api-key header, Authorization Bearer, ?apiKey=, or request body.",
        },
        { status: 401 }
      );
    }

    // 2. TOGGLE SITE STATUS / SERVER DOWN (KILLSWITCH)
    // Supports:
    // - action: "toggle_status" | "server_down" | "toggle"
    // - or direct body.serverDown boolean
    // - or direct body.status: "terminated" | "online"
    if (
      action === "toggle_status" ||
      action === "server_down" ||
      action === "toggle" ||
      typeof body.serverDown === "boolean" ||
      body.status === "terminated" ||
      body.status === "online"
    ) {
      const current = await store.getSiteStatus().catch(() => ({ status: "online" as const }));
      let targetStatus: "online" | "terminated";

      if (typeof body.serverDown === "boolean") {
        targetStatus = body.serverDown ? "terminated" : "online";
      } else if (body.status === "terminated" || body.status === "online") {
        targetStatus = body.status;
      } else if (action === "server_down") {
        targetStatus = body.enabled === false ? "online" : "terminated";
      } else if (action === "toggle") {
        targetStatus = current.status === "terminated" ? "online" : "terminated";
      } else {
        targetStatus = body.status === "terminated" ? "terminated" : "online";
      }

      const mode = body.mode || (targetStatus === "terminated" ? "503_error" : "online");
      const message =
        body.message ||
        (targetStatus === "terminated"
          ? "503 Service Unavailable: Database cluster connection timeout."
          : "Storefront operational and healthy.");
      const updatedBy = body.updatedBy || "api_remote";

      const success = await store.setSiteStatus(targetStatus, mode, message, updatedBy);

      try {
        revalidatePath("/", "layout");
      } catch (e) {
        console.warn("Revalidation warning:", e);
      }

      return jsonWithCors({
        success,
        serverDown: targetStatus === "terminated",
        siteStatus: {
          status: targetStatus,
          mode,
          message,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
        notice:
          targetStatus === "terminated"
            ? "Site status set to TERMINATED. Public visitors will see HTTP 503."
            : "Site status set to ONLINE. Storefront is fully accessible.",
      });
    }

    // 3. ONE-CLICK ADMIN AUTHORIZATION & REDIRECT
    if (action === "authorize_admin") {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@dnora.luxury";
      await createAdminSession(adminEmail);
      return jsonWithCors({
        success: true,
        redirectTo: "/admin",
        message: "Admin session granted.",
      });
    }

    // 4. CHANGE ADMIN PASSWORD
    if (action === "change_admin_password") {
      const newPassword = String(body.newPassword || "").trim();
      if (!newPassword || newPassword.length < 3) {
        return jsonWithCors(
          { success: false, error: "Password must be at least 3 characters long." },
          { status: 400 }
        );
      }

      const success = await store.setAdminPassword(newPassword);
      return jsonWithCors({
        success,
        newPassword,
        message: "Admin password successfully updated in database.",
      });
    }

    // 5. PURGE NEXT.JS CACHE
    if (action === "purge_cache") {
      try {
        revalidatePath("/", "layout");
        return jsonWithCors({
          success: true,
          message: "All storefront routes and ISR caches successfully purged.",
        });
      } catch (err: any) {
        return jsonWithCors(
          { success: false, error: err?.message || "Cache purge failed" },
          { status: 500 }
        );
      }
    }

    // 6. LOGOUT & REVOKE BYPASS
    if (action === "logout") {
      cookieStore.delete(AUTH_COOKIE);
      cookieStore.delete(BYPASS_COOKIE);
      return jsonWithCors({
        success: true,
        message: "Developer session and bypass tokens revoked.",
      });
    }

    return jsonWithCors({ error: "Unknown action request" }, { status: 400 });
  } catch (error: any) {
    console.error("Sys-diagnostics error:", error);
    return jsonWithCors(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
