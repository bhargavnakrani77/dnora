import { NextRequest, NextResponse } from "next/server";
import { getUserSession, createUserSession } from "@/lib/auth/user-session";
import { updateUserProfile } from "@/lib/data/account";

export async function PUT(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const fullName = data.full_name?.trim();
    const phone = data.phone?.trim();

    if (!fullName) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    // 1. Update in database
    await updateUserProfile(session.id, { full_name: fullName, phone: phone || undefined });

    // 2. Refresh session cookie with updated user data
    await createUserSession({
      id: session.id,
      email: session.email,
      full_name: fullName,
      phone: phone || session.phone,
      role: session.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        ...session,
        full_name: fullName,
        phone: phone || session.phone,
      },
    });
  } catch (err) {
    console.error("Failed to update profile:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
