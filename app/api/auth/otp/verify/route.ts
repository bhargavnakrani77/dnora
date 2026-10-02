import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { createUserSession } from "@/lib/auth/user-session";
import { sendWelcomeEmail } from "@/lib/email";

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
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email address and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // 1. Fetch pending verification record
    const verRes = await db.query(
      `SELECT * FROM public.email_verifications WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (verRes.rows.length === 0) {
      return NextResponse.json(
        { error: "No pending verification found. Please restart the registration process." },
        { status: 404 }
      );
    }

    const pending = verRes.rows[0];

    // 2. Check expiration
    if (new Date(pending.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // 3. Verify OTP
    const submittedHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
    if (submittedHash !== pending.otp_hash) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check your email and try again." },
        { status: 400 }
      );
    }

    // 4. Double check duplicate user
    const existing = await db.query(
      `SELECT id FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    // 5. Finalize user creation in public.users
    const userId = crypto.randomUUID();
    const insertRes = await db.query(
      `INSERT INTO public.users (id, email, full_name, phone, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'customer', timezone('utc'::text, now()), timezone('utc'::text, now()))
       RETURNING *;`,
      [
        userId,
        normalizedEmail,
        pending.full_name || null,
        pending.phone || null,
        pending.password_hash,
      ]
    );

    const newUser = insertRes.rows[0];

    // 6. Clean up verification record
    await db.query(`DELETE FROM public.email_verifications WHERE LOWER(email) = LOWER($1)`, [
      normalizedEmail,
    ]);

    // 7. Send luxury Welcome / Registration Confirmation Email
    try {
      await sendWelcomeEmail({
        email: newUser.email,
        name: newUser.full_name,
      });
    } catch (welcomeErr) {
      console.error("Failed to send welcome email:", welcomeErr);
    }

    // 8. Create secure HTTP-only user session
    await createUserSession({
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name || newUser.email.split("@")[0],
      phone: newUser.phone,
      role: "customer",
    });

    return NextResponse.json({
      success: true,
      message: "Account verified and created successfully.",
      redirectTo: "/account",
    });
  } catch (err: unknown) {
    console.error("Error verifying OTP:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: "Verification failed: " + message },
      { status: 500 }
    );
  }
}
