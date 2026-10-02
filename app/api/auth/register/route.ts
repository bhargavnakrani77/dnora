import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createUserSession } from "@/lib/auth/user-session";
import { sendWelcomeEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Please provide your full name, email address, and password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 1. Check for duplicate registered email
    const existing = await db.query(
      `SELECT id FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "This email address is already registered. Please sign in." },
        { status: 409 }
      );
    }

    // 2. Hash password with secure scrypt
    const pwdHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    // 3. Insert customer into public.users
    const insertRes = await db.query(
      `INSERT INTO public.users (id, email, full_name, phone, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'customer', timezone('utc'::text, now()), timezone('utc'::text, now()))
       RETURNING *;`,
      [
        userId,
        normalizedEmail,
        name.trim(),
        phone?.trim() || null,
        pwdHash,
      ]
    );

    const newUser = insertRes.rows[0];

    // 4. Supabase Auth sync (optional / non-blocking)
    if (process.env.ENABLE_EMAIL_DISPATCH === "true") {
      try {
        const supabase = await createClient();
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: name.trim(),
              phone: phone?.trim() || null,
            },
          },
        });
      } catch (supaErr) {
        console.warn("Supabase auth signup notice (non-blocking):", supaErr);
      }
    }

    // 5. Send luxury Welcome Email (non-blocking)
    try {
      await sendWelcomeEmail({
        email: newUser.email,
        name: newUser.full_name,
      });
    } catch (welcomeErr) {
      console.warn("Welcome email notice (non-blocking):", welcomeErr);
    }

    // 6. Create secure HTTP-only user session cookie
    await createUserSession({
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name || newUser.email.split("@")[0],
      phone: newUser.phone,
      role: "customer",
    });

    // 7. Return success with account credentials so user can see them
    return NextResponse.json({
      success: true,
      message: "Account created and signed in successfully.",
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
      },
      credentials: {
        email: normalizedEmail,
        password: password,
      },
      redirectTo: "/account",
    });
  } catch (err: unknown) {
    console.error("Direct registration error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: "Registration failed: " + message },
      { status: 500 }
    );
  }
}
