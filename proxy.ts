import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth/session";

interface AdminCookiePayload {
  email: string;
  role: string;
  expiresAt: number;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /api/admin routes (return 401 JSON)
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

  // If already authenticated as admin and visiting /admin/login, redirect to /admin
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

  // Protect /admin routes
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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
