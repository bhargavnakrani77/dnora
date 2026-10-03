import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// PATCH /api/admin/customers/[id]/block
// Body: { action: "block" | "unblock", reason?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { action, reason } = body as { action: "block" | "unblock"; reason?: string };

    if (!action || !["block", "unblock"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'block' or 'unblock'." }, { status: 400 });
    }

    // Safety: prevent blocking admin accounts
    const userCheck = await db.query(
      `SELECT id, role, email FROM public.users WHERE id = $1`,
      [id]
    );
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }
    if (userCheck.rows[0].role === "admin") {
      return NextResponse.json({ error: "Admin accounts cannot be blocked." }, { status: 403 });
    }

    if (action === "block") {
      await db.query(
        `UPDATE public.users
         SET is_blocked = true,
             blocked_reason = $2,
             blocked_at = timezone('utc'::text, now()),
             updated_at = timezone('utc'::text, now())
         WHERE id = $1`,
        [id, reason || null]
      );
    } else {
      await db.query(
        `UPDATE public.users
         SET is_blocked = false,
             blocked_reason = NULL,
             blocked_at = NULL,
             updated_at = timezone('utc'::text, now())
         WHERE id = $1`,
        [id]
      );
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    console.error("Block/unblock error:", err);
    return NextResponse.json({ error: "Failed to update customer status." }, { status: 500 });
  }
}
