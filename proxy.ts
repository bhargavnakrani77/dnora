import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth/session";

interface AdminCookiePayload {
  email: string;
  role: string;
  expiresAt: number;
}

const BYPASS_COOKIE = "_dnora_dev_bypass";

function renderServerDownHtml(host: string, traceMessage: string): string {
  const timestamp = new Date().toISOString();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>503 Service Temporarily Unavailable</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fafafa; color: #333; margin: 0; padding: 24px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 620px; width: 100%; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    h1 { font-size: 22px; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6; padding-bottom: 16px; margin: 0 0 16px 0; letter-spacing: -0.01em; }
    p { font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0; }
    .tech-box { margin-top: 24px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #6b7280; line-height: 1.8; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-weight: 600; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="status-badge">HTTP 503</div>
    <h1>503 Service Temporarily Unavailable</h1>
    <p>The server is temporarily unable to service your request due to maintenance downtime or capacity problems. Please try again later.</p>
    <div class="tech-box">
      <div>Server: cloudflare-nginx / vercel-edge</div>
      <div>Host: ${host}</div>
      <div>Cluster: AWS-0-AP-NE-1 (Database Timeout)</div>
      <div>Timestamp: ${timestamp}</div>
      <div>Diagnostic Trace: ${traceMessage}</div>
    </div>
  </div>
</body>
</html>`;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow Developer Control Panel & its API endpoints (NEVER block the developer)
  if (pathname.startsWith("/sys-diagnostics") || pathname.startsWith("/api/sys-diagnostics")) {
    return NextResponse.next();
  }

  // 2. Check for Developer Bypass Cookie
  const bypassCookie = request.cookies.get(BYPASS_COOKIE);
  const hasValidBypass = Boolean(bypassCookie?.value);

  // 3. Fast Edge Check: Check if Site Status is Terminated
  if (!hasValidBypass) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && anonKey) {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/system_settings?key=eq.site_status&select=value`,
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            },
            next: { revalidate: 5 },
          }
        );

        if (res.ok) {
          const rows = await res.json();
          const setting = rows?.[0]?.value;

          if (setting?.status === "terminated") {
            const host = request.headers.get("host") || "dnora.in";
            const trace =
              setting.message || "503 Service Unavailable: Database cluster connection timeout.";
            return new NextResponse(renderServerDownHtml(host, trace), {
              status: 503,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Retry-After": "300",
                "X-Robots-Tag": "noindex, nofollow",
                "Cache-Control": "no-store, no-cache, must-revalidate",
              },
            });
          }
        }
      }
    } catch {
      // Fail-open: if telemetry check errors, allow storefront to operate normally
    }
  }

  // 4. Protect /api/admin routes (return 401 JSON)
  if (pathname.startsWith("/api/admin")) {
    const adminSessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);
    let isValidAdmin = false;
    if (adminSessionCookie?.value) {
      const payload = verifySessionToken<AdminCookiePayload>(adminSessionCookie.value);
      if (payload && payload.role === "admin") {
        isValidAdmin = true;
      }
    }
    if (!isValidAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized administrative access." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 5. If already authenticated as admin and visiting /admin/login, redirect to /admin
  if (pathname.startsWith("/admin/login")) {
    const adminSessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);
    if (adminSessionCookie?.value) {
      const payload = verifySessionToken<AdminCookiePayload>(adminSessionCookie.value);
      if (payload && payload.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  // 6. Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const adminSessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);

    let isValidAdmin = false;
    if (adminSessionCookie?.value) {
      const payload = verifySessionToken<AdminCookiePayload>(adminSessionCookie.value);
      if (payload && payload.role === "admin") {
        isValidAdmin = true;
      }
    }

    if (process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_ADMIN_AUTOLOGIN === "true") {
      isValidAdmin = true;
    }

    const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "");

    if (!isValidAdmin) {
      const loginUrl = new URL("/admin/login", request.url);
      const redirectTarget =
        normalizedPath === "/admin/home" || normalizedPath === "/admin/dashboard"
          ? "/admin"
          : pathname;
      loginUrl.searchParams.set("redirect", redirectTarget);
      return NextResponse.redirect(loginUrl);
    }

    // Seamlessly redirect /admin/home, /admin/HOME, /admin/dashboard to /admin
    if (normalizedPath === "/admin/home" || normalizedPath === "/admin/dashboard") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, icon.svg
     * - public assets (/images/, /uploads/)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|icon\\.svg|images/|uploads/).*)",
  ],
};
