import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// PATCH /api/admin/coupons/[id] — toggle active status or update fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json({ error: "is_active (boolean) is required." }, { status: 400 });
    }

    const { rows } = await db.query(
      `UPDATE public.coupons SET is_active = $2, updated_at = timezone('utc'::text, now()) WHERE id = $1 RETURNING *`,
      [id, is_active]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon: rows[0] });
  } catch (err) {
    console.error("Update coupon error:", err);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

// DELETE /api/admin/coupons/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { rowCount } = await db.query(
      `DELETE FROM public.coupons WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete coupon error:", err);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
