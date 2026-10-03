import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/session";
import { ensureAccountTables } from "@/lib/data/account";

export const dynamic = "force-dynamic";

// GET /api/admin/coupons — list all coupons
export async function GET() {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureAccountTables();
    const { rows } = await db.query(`
      SELECT * FROM public.coupons ORDER BY created_at DESC
    `);
    return NextResponse.json({ coupons: rows });
  } catch (err) {
    console.error("Get coupons error:", err);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

// POST /api/admin/coupons — create a new coupon
export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureAccountTables();
    const body = await req.json();
    const {
      code,
      description,
      discount_type,
      discount_value,
      minimum_order_amount,
      maximum_discount_amount,
      usage_limit,
      is_active,
      valid_from,
      valid_until,
    } = body;

    if (!code || !discount_type || discount_value == null) {
      return NextResponse.json({ error: "code, discount_type, and discount_value are required." }, { status: 400 });
    }

    const { rows } = await db.query(
      `INSERT INTO public.coupons
        (code, description, discount_type, discount_value, minimum_order_amount,
         maximum_discount_amount, usage_limit, is_active, valid_from, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        code.toUpperCase().trim(),
        description || null,
        discount_type,
        discount_value,
        minimum_order_amount || 0,
        maximum_discount_amount || null,
        usage_limit || null,
        is_active !== false,
        valid_from || new Date().toISOString(),
        valid_until || null,
      ]
    );

    return NextResponse.json({ success: true, coupon: rows[0] });
  } catch (err: unknown) {
    const dbErr = err as { code?: string };
    if (dbErr.code === "23505") {
      return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
    }
    console.error("Create coupon error:", err);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
