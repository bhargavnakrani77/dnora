import { cookies } from "next/headers";
import crypto from "crypto";
import { createClient } from "../supabase/server";

export const ADMIN_COOKIE_NAME = "dnora_admin_session";
const DEMO_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dnora.luxury";

export interface AdminSession {
  email: string;
  role: "admin";
  isAuthenticated: boolean;
}

export function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dnora-luxury-secret-key-fallback-replace-in-prod-v1"
  );
}

export function signSessionToken(payload: Record<string, unknown>): string {
  const secret = getSessionSecret();
  const dataStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(dataStr).digest("hex");
  return `${dataStr}.${signature}`;
}

export function verifySessionToken<T>(token?: string | null): T | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [dataStr, signature] = parts;
  if (!dataStr || !signature) return null;

  try {
    const secret = getSessionSecret();
    const expectedSig = crypto.createHmac("sha256", secret).update(dataStr).digest("hex");
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSig, "hex");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(dataStr, "base64url").toString("utf-8"));
    if (decoded.expiresAt && decoded.expiresAt <= Date.now()) {
      return null;
    }

    return decoded as T;
  } catch {
    return null;
  }
}

/**
 * Validates server-side whether the current request is authenticated as an admin.
 * Checks Supabase Auth session first, then falls back to cryptographically signed admin session cookie.
 */
export async function verifyAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  // 1. First priority: Check cryptographically signed admin cookie (instant, zero network latency)
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (adminCookie?.value) {
    const session = verifySessionToken<{ email: string; role: string; expiresAt: number }>(
      adminCookie.value
    );
    if (session && session.role === "admin") {
      return {
        email: session.email,
        role: "admin",
        isAuthenticated: true,
      };
    }
  }

  // 2. Second priority: Try Supabase Auth ONLY if a Supabase session cookie is actually present
  const hasSupabaseCookie = cookieStore.getAll().some((c) => c.name.startsWith("sb-"));
  if (hasSupabaseCookie && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), 2500)
      );

      const { data } = await Promise.race([authPromise, timeoutPromise]);
      const user = data?.user;

      if (user) {
        // Check user metadata role or email
        if (user.user_metadata?.role === "admin" || user.email === DEMO_ADMIN_EMAIL) {
          return {
            email: user.email || DEMO_ADMIN_EMAIL,
            role: "admin",
            isAuthenticated: true,
          };
        }

        // Check user role in database with timeout
        const profilePromise = supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        const profileTimeoutPromise = new Promise<{ data: { role?: string } | null } | null>((resolve) =>
          setTimeout(() => resolve(null), 2000)
        );

        const profileRes = await Promise.race([profilePromise, profileTimeoutPromise]);
        if (profileRes && "data" in profileRes && profileRes.data?.role === "admin") {
          return {
            email: user.email || DEMO_ADMIN_EMAIL,
            role: "admin",
            isAuthenticated: true,
          };
        }
      }
    } catch {
      // Supabase auth check error (e.g. timeout or network error)
    }
  }

  // In development, only fallback to demo admin if explicit bypass is enabled in .env
  if (process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_ADMIN_AUTOLOGIN === "true") {
    return {
      email: DEMO_ADMIN_EMAIL,
      role: "admin",
      isAuthenticated: true,
    };
  }

  return null;
}

/**
 * Creates an authenticated admin session cookie with HMAC-SHA256 signature (HTTP-only)
 */
export async function createAdminSession(email: string): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionData = {
    email,
    role: "admin",
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const signedToken = signSessionToken(sessionData);

  cookieStore.set(ADMIN_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return true;
}

/**
 * Destroys the admin session cookie
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
