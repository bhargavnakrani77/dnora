import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AdminCustomer, CustomerAddress } from "@/types";
import { verifyAdminSession } from "@/lib/auth/session";
import { ensureAccountTables } from "@/lib/data/account";

export const dynamic = "force-dynamic";

interface CustomerDbRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "admin" | "customer";
  created_at: string;
  updated_at: string | null;
  total_orders: number;
  total_spent: number;
  primary_address: CustomerAddress | null;
  addresses: CustomerAddress[];
}

export async function GET() {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureAccountTables();
    const query = `
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.avatar_url,
        u.role,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT o.id)::int AS total_orders,
        COALESCE(SUM(o.total_amount), 0)::numeric(10,2) AS total_spent,
        (
          SELECT json_build_object(
            'id', a.id,
            'address_line1', a.address_line1,
            'address_line2', a.address_line2,
            'city', a.city,
            'state', a.state,
            'postal_code', a.postal_code,
            'country', a.country,
            'phone', a.phone,
            'is_default', a.is_default
          )
          FROM public.user_addresses a
          WHERE a.user_id = u.id
          ORDER BY a.is_default DESC, a.created_at DESC
          LIMIT 1
        ) AS primary_address,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'address_line1', a.address_line1,
                'address_line2', a.address_line2,
                'city', a.city,
                'state', a.state,
                'postal_code', a.postal_code,
                'country', a.country,
                'phone', a.phone,
                'is_default', a.is_default
              ) ORDER BY a.is_default DESC, a.created_at DESC
            )
            FROM public.user_addresses a
            WHERE a.user_id = u.id
          ),
          '[]'::json
        ) AS addresses
      FROM public.users u
      LEFT JOIN public.orders o ON (o.user_id = u.id OR LOWER(o.customer_email) = LOWER(u.email))
      GROUP BY u.id
      ORDER BY u.created_at DESC;
    `;

    const { rows } = await db.query(query);

    const customers: AdminCustomer[] = rows.map((r: CustomerDbRow) => ({
      id: r.id,
      email: r.email,
      full_name: r.full_name,
      phone: r.phone,
      avatar_url: r.avatar_url,
      role: r.role,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
      total_orders: Number(r.total_orders) || 0,
      total_spent: Number(r.total_spent) || 0,
      primary_address: r.primary_address || null,
      addresses: r.addresses || [],
    }));

    return NextResponse.json({ customers });
  } catch (err: unknown) {
    console.error("Failed to fetch customers:", err);
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      { error: "Failed to fetch customers: " + message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { full_name, email, phone, role, address } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userId = crypto.randomUUID();
    const userRole = role === "admin" ? "admin" : "customer";

    // 1. Insert into users table
    const insertUserQuery = `
      INSERT INTO public.users (id, email, full_name, phone, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, timezone('utc'::text, now()), timezone('utc'::text, now()))
      RETURNING *;
    `;
    const userResult = await db.query(insertUserQuery, [
      userId,
      normalizedEmail,
      full_name || null,
      phone || null,
      userRole,
    ]);

    const createdUser = userResult.rows[0];

    // 2. Insert primary address if provided
    let createdAddress = null;
    if (address && (address.address_line1 || address.city)) {
      const addressId = crypto.randomUUID();
      const insertAddressQuery = `
        INSERT INTO public.user_addresses 
          (id, user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        RETURNING *;
      `;
      const addressResult = await db.query(insertAddressQuery, [
        addressId,
        userId,
        address.full_name || full_name || "Valued Client",
        address.phone || phone || "",
        address.address_line1 || "",
        address.address_line2 || null,
        address.city || "",
        address.state || "",
        address.postal_code || "",
        address.country || "India",
      ]);
      createdAddress = addressResult.rows[0];
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: createdUser.id,
        email: createdUser.email,
        full_name: createdUser.full_name,
        phone: createdUser.phone,
        avatar_url: createdUser.avatar_url,
        role: createdUser.role,
        created_at: createdUser.created_at,
        total_orders: 0,
        total_spent: 0,
        primary_address: createdAddress,
        addresses: createdAddress ? [createdAddress] : [],
      },
    });
  } catch (err: unknown) {
    console.error("Failed to create customer:", err);
    const dbErr = err as { code?: string; message?: string };
    if (dbErr.code === "23505") {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: "Failed to create customer: " + message },
      { status: 500 }
    );
  }
}
