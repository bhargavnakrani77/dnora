import { cookies } from "next/headers";
import { createClient } from "../supabase/server";
import { signSessionToken, verifySessionToken } from "./session";

const USER_COOKIE_NAME = "dnora_user_session";

export interface UserSession {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: "customer" | "admin";
  isAuthenticated: boolean;
}

interface UserCookiePayload {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role?: "customer" | "admin";
  expiresAt: number;
}

/**
 * Validates server-side whether the current request has an authenticated user session.
 * Checks Supabase Auth session first, then falls back to secure HTTP-only signed session cookie.
 */
export async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();

  // 1. Check cryptographically signed HTTP-only user cookie (instant, zero network latency)
  const userCookie = cookieStore.get(USER_COOKIE_NAME);
  if (userCookie?.value) {
    const decoded = verifySessionToken<UserCookiePayload>(userCookie.value);
    if (decoded && decoded.id) {
      return {
        id: decoded.id,
        email: decoded.email,
        full_name: decoded.full_name,
        phone: decoded.phone,
        avatar_url: decoded.avatar_url,
        role: decoded.role || "customer",
        isAuthenticated: true,
      };
    }
  }

  // 2. Try Supabase Auth ONLY if a Supabase cookie is actually present
  const hasSupabaseCookie = cookieStore.getAll().some((c) => c.name.startsWith("sb-"));
  if (hasSupabaseCookie && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      // Guard with a 2.5-second timeout so external network latency never hangs page rendering
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), 2500)
      );

      const { data } = await Promise.race([authPromise, timeoutPromise]);
      const user = data?.user;

      if (user) {
        return {
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
          phone: user.user_metadata?.phone || user.phone,
          role: user.user_metadata?.role === "admin" ? "admin" : "customer",
          isAuthenticated: true,
        };
      }
    } catch {
      // Supabase auth check error
    }
  }

  return null;
}

/**
 * Sets a cryptographically signed, HTTP-only session cookie for the authenticated user.
 */
export async function createUserSession(user: {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role?: "customer" | "admin";
}): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionData: UserCookiePayload = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone,
    avatar_url: user.avatar_url,
    role: user.role || "customer",
    expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
  };

  const signedToken = signSessionToken(sessionData as unknown as Record<string, unknown>);

  cookieStore.set(USER_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60,
  });

  return true;
}

/**
 * Destroys user session cookie and Supabase session if any.
 */
export async function destroyUserSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}
