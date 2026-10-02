import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { full_name, email, phone, role, address } = body;

    // 1. Update user record
    const updateFields: string[] = [];
    const updateValues: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramIndex++}`);
      updateValues.push(full_name || null);
    }
    if (email !== undefined && email.trim()) {
      updateFields.push(`email = $${paramIndex++}`);
      updateValues.push(email.toLowerCase().trim());
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      updateValues.push(phone || null);
    }
    if (role !== undefined && (role === "admin" || role === "customer")) {
      updateFields.push(`role = $${paramIndex++}`);
      updateValues.push(role);
    }

    updateFields.push(`updated_at = timezone('utc'::text, now())`);

    if (updateFields.length > 1) {
      updateValues.push(id);
      const updateUserQuery = `
        UPDATE public.users 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *;
      `;
      await db.query(updateUserQuery, updateValues);
    }

    // 2. Update or insert primary address
    if (address && (address.address_line1 || address.city)) {
      // Check if address exists for user
      const existingAddressRes = await db.query(
        `SELECT id FROM public.user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC LIMIT 1`,
        [id]
      );

      if (existingAddressRes.rows.length > 0) {
        const addressId = existingAddressRes.rows[0].id;
        await db.query(
          `UPDATE public.user_addresses 
           SET address_line1 = $1, address_line2 = $2, city = $3, state = $4, postal_code = $5, country = $6, phone = $7, full_name = $8
           WHERE id = $9`,
          [
            address.address_line1 || "",
            address.address_line2 || null,
            address.city || "",
            address.state || "",
            address.postal_code || "",
            address.country || "India",
            phone || address.phone || "",
            full_name || address.full_name || "Customer",
            addressId,
          ]
        );
      } else {
        const newAddressId = crypto.randomUUID();
        await db.query(
          `INSERT INTO public.user_addresses (
            id, user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, timezone('utc'::text, now()))`,
          [
            newAddressId,
            id,
            full_name || address.full_name || "Customer",
            phone || address.phone || "",
            address.address_line1 || "",
            address.address_line2 || null,
            address.city || "",
            address.state || "",
            address.postal_code || "",
            address.country || "India",
          ]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Failed to update customer:", err);
    const dbErr = err as { code?: string; message?: string };
    if (dbErr.code === "23505") {
      return NextResponse.json(
        { error: "Another user already uses this email address." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: "Failed to update customer: " + message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Delete user from public.users
    const result = await db.query(
      `DELETE FROM public.users WHERE id = $1 RETURNING id, email`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully.",
      deleted: result.rows[0],
    });
  } catch (err: unknown) {
    console.error("Failed to delete customer:", err);
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      { error: "Failed to delete customer: " + message },
      { status: 500 }
    );
  }
}
