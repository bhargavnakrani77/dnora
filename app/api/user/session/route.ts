import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/user-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getUserSession();
    return NextResponse.json({
      authenticated: Boolean(session),
      user: session ? {
        id: session.id,
        email: session.email,
        full_name: session.full_name,
        phone: session.phone,
        role: session.role,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
