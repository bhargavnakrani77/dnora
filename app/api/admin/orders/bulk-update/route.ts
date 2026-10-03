import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// POST /api/admin/orders/bulk-update
// Body: { order_ids: string[], status: OrderStatus }
export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { order_ids, status } = body as { order_ids: string[]; status: string };

    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json({ error: "order_ids array is required." }, { status: 400 });
    }

    const validStatuses = ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    // Parameterized bulk update using ANY($1::uuid[])
    const result = await db.query(
      `UPDATE public.orders
       SET status = $2, updated_at = timezone('utc'::text, now())
       WHERE id = ANY($1::uuid[])
       RETURNING id, order_number, status`,
      [order_ids, status]
    );

    return NextResponse.json({
      success: true,
      updated: result.rows.length,
      orders: result.rows,
    });
  } catch (err) {
    console.error("Bulk update error:", err);
    return NextResponse.json({ error: "Failed to bulk update orders" }, { status: 500 });
  }
}
