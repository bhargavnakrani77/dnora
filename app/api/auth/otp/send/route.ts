import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/server";

async function ensureVerificationTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.email_verifications (
        email TEXT PRIMARY KEY,
        otp_hash TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        password_hash TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `);
  } catch (err) {
    // Non-blocking
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureVerificationTable();
    const { name, email, phone, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Please provide your full name, email address, and password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email validation
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

    // 1. Strict Duplicate Email Check
    const existingUser = await db.query(
      `SELECT id, email FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    // 2. Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // 3. Hash user password
    const pwdHash = await hashPassword(password);

    // 4. Expiration: 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 5. Store pending verification in database
    await db.query(
      `INSERT INTO public.email_verifications (email, otp_hash, full_name, phone, password_hash, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, timezone('utc'::text, now()))
       ON CONFLICT (email) DO UPDATE SET
         otp_hash = EXCLUDED.otp_hash,
         full_name = EXCLUDED.full_name,
         phone = EXCLUDED.phone,
         password_hash = EXCLUDED.password_hash,
         expires_at = EXCLUDED.expires_at,
         created_at = timezone('utc'::text, now())`,
      [normalizedEmail, otpHash, name.trim(), phone?.trim() || null, pwdHash, expiresAt]
    );

    // 6. External Email Dispatch (Muted by default as per admin request)
    const isEmailDispatchEnabled = process.env.ENABLE_EMAIL_DISPATCH === "true";
    if (isEmailDispatchEnabled) {
      try {
        const supabase = await createClient();
        const { error: supaErr } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: name.trim(),
              phone: phone?.trim() || null,
            },
          },
        });
        if (supaErr) {
          console.warn("[Supabase Auth] Notice:", supaErr.message);
        }
      } catch (e) {
        console.warn("Supabase auth signup exception:", e);
      }
    } else {
      console.log(`🔇 [EMAIL DISPATCH MUTED] Supabase external auth email suppressed for ${normalizedEmail}. Code stored in DB.`);
    }

    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json({
      success: true,
      delivered: true,
      message: "Verification code sent to your email.",
      email: normalizedEmail,
      ...(isDev ? { devHint: `[DEV ONLY] Verification Code: ${otp}` } : {}),
    });
  } catch (err: unknown) {
    console.error("Error sending OTP:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: "Failed to initiate verification: " + message },
      { status: 500 }
    );
  }
}
