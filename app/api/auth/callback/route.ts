import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUserSession } from "@/lib/auth/user-session";
import { getRequestOrigin } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawState = requestUrl.searchParams.get("state");
  const origin = getRequestOrigin(request);

  let next = "/account";
  let isDirectGoogle = false;

  if (rawState) {
    try {
      const decodedState = JSON.parse(Buffer.from(rawState, "base64url").toString("utf8"));
      if (decodedState?.next && decodedState.next.startsWith("/")) {
        next = decodedState.next;
      }
      if (decodedState?.mode === "google_direct") {
        isDirectGoogle = true;
      }
    } catch {
      // not JSON state
    }
  }

  const rawNext = requestUrl.searchParams.get("next");
  if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) {
    next = rawNext;
  }

  const googleClientId =
    process.env.GOOGLE_CLIENT_ID ||
    "544674955938-42an9v4bvr9k5vas4hrovbtls8knnrdo.apps.googleusercontent.com";
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (code) {
    // 1. DIRECT GOOGLE OAUTH CODE EXCHANGE (When GOOGLE_CLIENT_SECRET is provided)
    if (isDirectGoogle || (googleClientSecret && !requestUrl.searchParams.get("supabase"))) {
      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: googleClientId,
            client_secret: googleClientSecret || "",
            redirect_uri: `${origin}/api/auth/callback`,
            grant_type: "authorization_code",
          }),
        });

        const tokenData = await tokenRes.json();

        if (tokenData.access_token) {
          const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });

          const googleUser = await userRes.json();

          if (googleUser && googleUser.email) {
            const email = googleUser.email.toLowerCase().trim();
            const fullName = googleUser.name || email.split("@")[0];
            const avatarUrl = googleUser.picture || null;
            const userId = googleUser.sub || crypto.randomUUID();

            try {
              const { db } = await import("@/lib/db");
              const { ensureAccountTables } = await import("@/lib/data/account");
              await ensureAccountTables();

              await db.query(
                `INSERT INTO public.users (id, email, full_name, avatar_url, role)
                 VALUES ($1, $2, $3, $4, 'customer')
                 ON CONFLICT (email) DO UPDATE 
                 SET full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
                     avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url)`,
                [userId, email, fullName, avatarUrl]
              );
            } catch (dbErr) {
              console.error("Direct Google DB sync error:", dbErr);
            }

            await createUserSession({
              id: userId,
              email,
              full_name: fullName,
              avatar_url: avatarUrl || undefined,
              role: "customer",
            });

            return NextResponse.redirect(new URL(next, origin));
          }
        }
      } catch (directErr) {
        console.error("Direct Google OAuth error:", directErr);
      }
    }

    // 2. SUPABASE CODE EXCHANGE FALLBACK
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        const email = (data.user.email || "").toLowerCase().trim();
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          email.split("@")[0];
        const avatarUrl =
          data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture ||
          null;

        try {
          const { db } = await import("@/lib/db");
          const { ensureAccountTables } = await import("@/lib/data/account");
          await ensureAccountTables();

          await db.query(
            `INSERT INTO public.users (id, email, full_name, avatar_url, role)
             VALUES ($1, $2, $3, $4, 'customer')
             ON CONFLICT (email) DO UPDATE 
             SET full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
                 avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url)`,
            [data.user.id, email, fullName, avatarUrl]
          );
        } catch (dbErr) {
          console.error("Error syncing Google user to database:", dbErr);
        }

        await createUserSession({
          id: data.user.id,
          email,
          full_name: fullName,
          avatar_url: avatarUrl || undefined,
          role: "customer",
        });
      }
    } catch (e) {
      console.error("Auth callback error:", e);
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
