import { db } from "@/lib/db";
import { UserAddress, Order, OrderItem } from "@/types";

const isValidUUID = (str?: string | null): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

let accountTablesEnsured = false;
export async function ensureAccountTables(): Promise<void> {
  if (accountTablesEnsured) return;
  try {
    await db.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        phone TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'customer',
        password_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );

      CREATE TABLE IF NOT EXISTS public.user_addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'India',
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );

      CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number TEXT NOT NULL UNIQUE,
        user_id UUID,
        customer_email TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'processing',
        payment_status TEXT NOT NULL DEFAULT 'paid',
        payment_method TEXT NOT NULL DEFAULT 'card',
        shipping_address JSONB,
        tracking_number TEXT,
        carrier TEXT,
        estimated_delivery TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );

      CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID,
        product_id UUID,
        product_name TEXT NOT NULL,
        product_slug TEXT,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        quantity INTEGER NOT NULL DEFAULT 1,
        image_url TEXT,
        attributes JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );

      -- High-Performance Lookup & Foreign Key Indexes
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(LOWER(customer_email));
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
    `);
    accountTablesEnsured = true;
  } catch {
    // Non-blocking warning
  }
}

interface DbOrderItemRow {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  product_slug?: string | null;
  price: string | number;
  quantity: number;
  image_url?: string | null;
  attributes?: Record<string, unknown>;
  created_at: string;
}

// USER ORDERS
export async function getUserOrders(userId: string, email?: string): Promise<Order[]> {
  try {
    await ensureAccountTables();
    const hasValidUuid = isValidUUID(userId);
    let query = "";
    let params: string[] = [];

    if (hasValidUuid && email) {
      query = `SELECT * FROM public.orders WHERE user_id = $1 OR customer_email = $2 ORDER BY created_at DESC`;
      params = [userId, email];
    } else if (hasValidUuid) {
      query = `SELECT * FROM public.orders WHERE user_id = $1 ORDER BY created_at DESC`;
      params = [userId];
    } else if (email) {
      query = `SELECT * FROM public.orders WHERE customer_email = $1 ORDER BY created_at DESC`;
      params = [email];
    } else {
      return [];
    }

    const res = await db.query(query, params);
    if (res.rows.length === 0) {
      return [];
    }

    // Batch query order items to eliminate N+1 problem
    const orderIds = res.rows.map((r: { id: string }) => r.id);
    const itemsRes = await db.query(
      `SELECT * FROM public.order_items WHERE order_id = ANY($1) ORDER BY created_at ASC`,
      [orderIds]
    );

    const itemsByOrderId = new Map<string, OrderItem[]>();
    for (const it of itemsRes.rows as DbOrderItemRow[]) {
      const list = itemsByOrderId.get(it.order_id) || [];
      list.push({
        ...it,
        price: Number(it.price),
      });
      itemsByOrderId.set(it.order_id, list);
    }

    return res.rows.map((row) => ({
      ...row,
      total_amount: Number(row.total_amount),
      items: itemsByOrderId.get(row.id) || [],
    }));
  } catch (err) {
    console.error("Error fetching user orders from DB:", err);
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const hasValidUuid = isValidUUID(orderId);
    const whereClause = hasValidUuid ? "id = $1::uuid" : "order_number = $1";
    const res = await db.query(
      `SELECT * FROM public.orders WHERE ${whereClause} LIMIT 1`,
      [orderId]
    );
    if (res.rows.length > 0) {
      const order = res.rows[0];
      const itemsRes = await db.query(
        `SELECT * FROM public.order_items WHERE order_id = $1 ORDER BY created_at ASC`,
        [order.id]
      );
      return {
        ...order,
        total_amount: Number(order.total_amount),
        items: (itemsRes.rows as DbOrderItemRow[]).map((it) => ({
          ...it,
          price: Number(it.price),
        })),
      };
    }
  } catch (err) {
    console.error("Error fetching order by ID from DB:", err);
  }

  return null;
}

// USER ADDRESSES
export async function getUserAddresses(userId: string): Promise<UserAddress[]> {
  try {
    await ensureAccountTables();
    if (!isValidUUID(userId)) return [];

    const res = await db.query(
      `SELECT * FROM public.user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return res.rows;
  } catch (err) {
    console.error("Error fetching addresses from DB:", err);
    return [];
  }
}

export async function createUserAddress(
  userId: string,
  data: Omit<UserAddress, "id" | "user_id" | "created_at">
): Promise<UserAddress> {
  await ensureAccountTables();
  const validUserId = isValidUUID(userId) ? userId : null;

  if (validUserId && data.is_default) {
    await db.query(
      `UPDATE public.user_addresses SET is_default = false WHERE user_id = $1`,
      [validUserId]
    );
  }

  const res = await db.query(
    `INSERT INTO public.user_addresses 
      (user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      validUserId,
      data.full_name,
      data.phone,
      data.address_line1,
      data.address_line2 || null,
      data.city,
      data.state,
      data.postal_code,
      data.country || "India",
      Boolean(data.is_default),
    ]
  );

  return res.rows[0];
}

export async function deleteUserAddress(
  addressId: string,
  userId: string
): Promise<boolean> {
  try {
    if (!isValidUUID(addressId) || !isValidUUID(userId)) return false;

    const res = await db.query(
      `DELETE FROM public.user_addresses WHERE id = $1 AND user_id = $2`,
      [addressId, userId]
    );
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    console.error("Error deleting address from DB:", err);
    return false;
  }
}

export async function setDefaultAddress(
  addressId: string,
  userId: string
): Promise<boolean> {
  try {
    if (!isValidUUID(addressId) || !isValidUUID(userId)) return false;

    await db.query(
      `UPDATE public.user_addresses SET is_default = false WHERE user_id = $1`,
      [userId]
    );
    const res = await db.query(
      `UPDATE public.user_addresses SET is_default = true WHERE id = $1 AND user_id = $2`,
      [addressId, userId]
    );
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    console.error("Error setting default address in DB:", err);
    return false;
  }
}

export async function updateUserAddress(
  addressId: string,
  userId: string,
  data: Partial<Omit<UserAddress, "id" | "user_id" | "created_at">>
): Promise<UserAddress | null> {
  try {
    if (!isValidUUID(addressId) || !isValidUUID(userId)) return null;

    if (data.is_default) {
      await db.query(
        `UPDATE public.user_addresses SET is_default = false WHERE user_id = $1`,
        [userId]
      );
    }

    const res = await db.query(
      `UPDATE public.user_addresses 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           address_line1 = COALESCE($3, address_line1),
           address_line2 = $4,
           city = COALESCE($5, city),
           state = COALESCE($6, state),
           postal_code = COALESCE($7, postal_code),
           country = COALESCE($8, country),
           is_default = COALESCE($9, is_default)
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        data.full_name || null,
        data.phone || null,
        data.address_line1 || null,
        data.address_line2 !== undefined ? data.address_line2 : null,
        data.city || null,
        data.state || null,
        data.postal_code || null,
        data.country || null,
        data.is_default !== undefined ? Boolean(data.is_default) : null,
        addressId,
        userId,
      ]
    );

    return res.rows[0] || null;
  } catch (err) {
    console.error("Error updating user address in DB:", err);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  data: { full_name?: string; phone?: string }
): Promise<boolean> {
  try {
    if (!isValidUUID(userId)) return false;

    const res = await db.query(
      `UPDATE public.users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone)
       WHERE id = $3`,
      [data.full_name || null, data.phone || null, userId]
    );

    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    console.error("Error updating user profile in DB:", err);
    return false;
  }
}

