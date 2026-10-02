import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const origin = getRequestOrigin(req);
  const next = req.nextUrl.searchParams.get("next") || "/account";

  const googleClientId =
    process.env.GOOGLE_CLIENT_ID ||
    "544674955938-42an9v4bvr9k5vas4hrovbtls8knnrdo.apps.googleusercontent.com";
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // 1. Direct Google OAuth (Displays only localhost:3000 or dnora.onrender.com to the user, NO Supabase URL)
  if (googleClientId && googleClientSecret) {
    const redirectUri = `${origin}/api/auth/callback`;
    const stateObj = { next, mode: "google_direct" };
    const state = Buffer.from(JSON.stringify(stateObj)).toString("base64url");

    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state,
    });

    return NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
  }

  // 2. Fallback to Supabase Google OAuth if client secret is not yet configured in env
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Supabase Google OAuth error:", error.message);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(
            "Google OAuth initialization error: " + error.message
          )}`,
          req.url
        )
      );
    }

    if (data?.url) {
      return NextResponse.redirect(data.url);
    }
  } catch (e: unknown) {
    console.error("Google OAuth error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Failed to connect with Google OAuth: " + message
        )}`,
        req.url
      )
    );
  }

  return NextResponse.redirect(new URL("/login?error=oauth_unavailable", req.url));
}
