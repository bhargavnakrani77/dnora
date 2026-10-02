import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth/session";
import { createUserSession } from "@/lib/auth/user-session";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, redirectTo: requestedRedirect } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please provide both email and password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@dnora.luxury").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    // 1. Dedicated Admin Master Login Check
    if (adminPassword && normalizedEmail === adminEmail) {
      if (password === adminPassword) {
        await createAdminSession(normalizedEmail);
        await createUserSession({
          id: "a0000000-0000-0000-0000-000000000001",
          email: normalizedEmail,
          full_name: "Administrator",
          role: "admin",
        });
        return NextResponse.json({
          success: true,
          role: "admin",
          redirectTo: "/admin",
        });
      }
    }

    // 2. Query user in PostgreSQL database
    let dbUser: {
      id: string;
      email: string;
      full_name?: string;
      phone?: string;
      role?: "customer" | "admin";
      password_hash?: string;
    } | null = null;
    try {
      const userRes = await db.query(
        `SELECT * FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [normalizedEmail]
      );
      if (userRes.rows.length > 0) {
        dbUser = userRes.rows[0];
      }
    } catch (dbErr) {
      console.error("Database user query error:", dbErr);
    }

    // 3. If user exists in DB, check authentication type
    if (dbUser) {
      // If user registered with Google OAuth and has no password hash
      if (!dbUser.password_hash) {
        return NextResponse.json(
          {
            error:
              "This account was created with Google Sign-In. Please use 'Sign in with Google' to access your account.",
          },
          { status: 400 }
        );
      }

      // Verify the password hash securely
      const isValid = await verifyPassword(password, dbUser.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }

      // Password matches! Create authenticated customer session
      await createUserSession({
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name || dbUser.email.split("@")[0],
        phone: dbUser.phone,
        role: dbUser.role || "customer",
      });

      return NextResponse.json({
        success: true,
        role: dbUser.role || "customer",
        redirectTo: dbUser.role === "admin" ? "/admin" : (requestedRedirect || "/account"),
      });
    }

    // 4. Try Supabase Auth as secondary check
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (data?.user && !error) {
        await createUserSession({
          id: data.user.id,
          email: data.user.email || normalizedEmail,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
          role: "customer",
        });
        return NextResponse.json({
          success: true,
          role: "customer",
          redirectTo: requestedRedirect || "/account",
        });
      }
    } catch {
      // Supabase Auth not active or failed
    }

    // 5. Account not found or wrong credentials
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in." },
      { status: 500 }
    );
  }
}
