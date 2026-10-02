import { db } from "@/lib/db";
import { Order, OrderItem } from "@/types";
import { ensureAccountTables } from "./account";

export interface CreateOrderInput {
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  items: {
    productId?: string;
    productName: string;
    productSlug?: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    selectedColor?: string;
    attributes?: Record<string, unknown>;
  }[];
  paymentMethod: string;
  paymentStatus?: string;
  notes?: string;
  shippingCost?: number;
}

const isValidUUID = (str?: string | null): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

export async function createNewOrder(input: CreateOrderInput): Promise<Order> {
  await ensureAccountTables();

  const orderNumber = `DNR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const validUserId = isValidUUID(input.userId) ? input.userId : null;

  const itemsTotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = itemsTotal + (input.shippingCost || 0);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const orderRes = await client.query(
      `INSERT INTO public.orders 
        (order_number, user_id, customer_email, customer_name, customer_phone, total_amount, status, payment_status, payment_method, shipping_address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        orderNumber,
        validUserId,
        input.customerEmail.toLowerCase().trim(),
        input.customerName.trim(),
        input.customerPhone || null,
        totalAmount,
        "pending",
        input.paymentStatus || "paid",
        input.paymentMethod || "card",
        JSON.stringify(input.shippingAddress),
        input.notes || null,
      ]
    );

    const orderRow = orderRes.rows[0];
    const createdItems: OrderItem[] = [];

    for (const item of input.items) {
      const validProductId = isValidUUID(item.productId) ? item.productId : null;
      const itemRes = await client.query(
        `INSERT INTO public.order_items 
          (order_id, product_id, product_name, product_slug, price, quantity, image_url, attributes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          orderRow.id,
          validProductId,
          item.productName,
          item.productSlug || null,
          item.price,
          item.quantity,
          item.imageUrl || null,
          JSON.stringify({
            selectedColor: item.selectedColor,
            ...(item.attributes || {}),
          }),
        ]
      );

      const inserted = itemRes.rows[0];
      createdItems.push({
        ...inserted,
        price: Number(inserted.price),
      });

      // Automatically deduct product stock when order is placed
      if (validProductId) {
        await client.query(
          `UPDATE public.products 
           SET stock = GREATEST(0, stock - $1), updated_at = NOW() 
           WHERE id = $2`,
          [item.quantity, validProductId]
        );
      } else if (item.productSlug) {
        await client.query(
          `UPDATE public.products 
           SET stock = GREATEST(0, stock - $1), updated_at = NOW() 
           WHERE slug = $2`,
          [item.quantity, item.productSlug]
        );
      }
    }

    await client.query("COMMIT");

    return {
      ...orderRow,
      total_amount: Number(orderRow.total_amount),
      items: createdItems,
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export interface OrdersPaymentStats {
  totalPaid: number;
  codPaid: number;
  gatewayPaid: number;
  gatewayPending: number;
  codPending: number;
}

export async function getAllOrdersAdmin(filters?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ orders: Order[]; total: number; paymentStats: OrdersPaymentStats }> {
  await ensureAccountTables();

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.status && filters.status !== "all") {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters?.search && filters.search.trim()) {
    const s = `%${filters.search.trim().toLowerCase()}%`;
    conditions.push(
      `(LOWER(order_number) LIKE $${paramIndex} OR LOWER(customer_email) LIKE $${paramIndex} OR LOWER(customer_name) LIKE $${paramIndex} OR customer_phone LIKE $${paramIndex})`
    );
    params.push(s);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count total
  const countRes = await db.query(
    `SELECT COUNT(*) as count FROM public.orders ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0]?.count || "0", 10);

  // Lifetime Payment Stats across all valid orders
  const statsRes = await db.query(`
    SELECT
      COALESCE(SUM(CASE WHEN status != 'cancelled' AND (payment_status = 'paid' OR (payment_method = 'cod' AND status = 'delivered')) THEN total_amount ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN payment_method = 'cod' AND status != 'cancelled' AND (payment_status = 'paid' OR status = 'delivered') THEN total_amount ELSE 0 END), 0) as cod_paid,
      COALESCE(SUM(CASE WHEN payment_method != 'cod' AND status != 'cancelled' AND payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as gateway_paid,
      COALESCE(SUM(CASE WHEN payment_method != 'cod' AND status != 'cancelled' AND payment_status != 'paid' THEN total_amount ELSE 0 END), 0) as gateway_pending,
      COALESCE(SUM(CASE WHEN payment_method = 'cod' AND status != 'cancelled' AND status != 'delivered' AND payment_status != 'paid' THEN total_amount ELSE 0 END), 0) as cod_pending
    FROM public.orders
  `);

  const sRow = statsRes.rows[0] || {};
  const paymentStats: OrdersPaymentStats = {
    totalPaid: Number(sRow.total_paid || 0),
    codPaid: Number(sRow.cod_paid || 0),
    gatewayPaid: Number(sRow.gateway_paid || 0),
    gatewayPending: Number(sRow.gateway_pending || 0),
    codPending: Number(sRow.cod_pending || 0),
  };

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const ordersRes = await db.query(
    `SELECT * FROM public.orders ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  if (ordersRes.rows.length === 0) {
    return { orders: [], total, paymentStats };
  }

  const orderIds = ordersRes.rows.map((r: { id: string }) => r.id);
  const itemsRes = await db.query(
    `SELECT * FROM public.order_items WHERE order_id = ANY($1) ORDER BY created_at ASC`,
    [orderIds]
  );

  const itemsMap = new Map<string, OrderItem[]>();
  for (const it of itemsRes.rows) {
    const list = itemsMap.get(it.order_id) || [];
    list.push({
      ...it,
      price: Number(it.price),
    });
    itemsMap.set(it.order_id, list);
  }

  const orders: Order[] = ordersRes.rows.map((row) => ({
    ...row,
    total_amount: Number(row.total_amount),
    items: itemsMap.get(row.id) || [],
  }));

  return { orders, total, paymentStats };
}

export async function updateOrderAdmin(
  orderId: string,
  updates: {
    status?: string;
    payment_status?: string;
    carrier?: string;
    tracking_number?: string;
    notes?: string;
  }
): Promise<boolean> {
  try {
    const hasValidUuid = isValidUUID(orderId);
    const setClauses: string[] = ["updated_at = timezone('utc'::text, now())"];
    const params: unknown[] = [];
    let idx = 1;

    if (updates.status !== undefined && updates.status.trim()) {
      setClauses.push(`status = $${idx++}`);
      params.push(updates.status.trim());
    }
    if (updates.payment_status !== undefined && updates.payment_status.trim()) {
      setClauses.push(`payment_status = $${idx++}`);
      params.push(updates.payment_status.trim());
    }
    if (updates.carrier !== undefined) {
      setClauses.push(`carrier = $${idx++}`);
      params.push(updates.carrier.trim() || null);
    }
    if (updates.tracking_number !== undefined) {
      setClauses.push(`tracking_number = $${idx++}`);
      params.push(updates.tracking_number.trim() || null);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${idx++}`);
      params.push(updates.notes.trim() || null);
    }

    const whereClause = hasValidUuid ? `id = $${idx}::uuid` : `order_number = $${idx}`;
    params.push(orderId);

    const query = `UPDATE public.orders SET ${setClauses.join(", ")} WHERE ${whereClause}`;
    const res = await db.query(query, params);

    // If order was marked cancelled, restore product stock
    if (updates.status === "cancelled" && (res.rowCount ?? 0) > 0) {
      try {
        const orderLookup = await db.query(
          hasValidUuid ? `SELECT id FROM public.orders WHERE id = $1::uuid` : `SELECT id FROM public.orders WHERE order_number = $1`,
          [orderId]
        );
        if (orderLookup.rows.length > 0) {
          const dbOrderId = orderLookup.rows[0].id;
          const itemsRes = await db.query(
            `SELECT product_id, product_slug, quantity FROM public.order_items WHERE order_id = $1`,
            [dbOrderId]
          );
          for (const item of itemsRes.rows) {
            if (item.product_id) {
              await db.query(
                `UPDATE public.products SET stock = stock + $1, updated_at = NOW() WHERE id = $2`,
                [item.quantity, item.product_id]
              );
            } else if (item.product_slug) {
              await db.query(
                `UPDATE public.products SET stock = stock + $1, updated_at = NOW() WHERE slug = $2`,
                [item.quantity, item.product_slug]
              );
            }
          }
        }
      } catch (stockErr) {
        console.error("Failed to restore stock on cancellation:", stockErr);
      }
    }

    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    console.error("Error in updateOrderAdmin DB query:", err);
    return false;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  notes?: string
): Promise<boolean> {
  return updateOrderAdmin(orderId, { status, notes });
}

export async function updateOrderTracking(
  orderId: string,
  carrier: string,
  trackingNumber: string
): Promise<boolean> {
  return updateOrderAdmin(orderId, { carrier, tracking_number: trackingNumber, status: "shipped" });
}

export async function deleteOrderAdmin(orderId: string): Promise<boolean> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const hasValidUuid = isValidUUID(orderId);
    let resolvedId = orderId;

    if (!hasValidUuid) {
      const lookup = await client.query(
        `SELECT id FROM public.orders WHERE order_number = $1 LIMIT 1`,
        [orderId]
      );
      if (lookup.rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }
      resolvedId = lookup.rows[0].id;
    }

    // 1. Delete order items
    await client.query(`DELETE FROM public.order_items WHERE order_id = $1`, [resolvedId]);

    // 2. Delete the order record
    const delRes = await client.query(`DELETE FROM public.orders WHERE id = $1`, [resolvedId]);

    await client.query("COMMIT");
    return (delRes.rowCount ?? 0) > 0;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error in deleteOrderAdmin:", err);
    throw err;
  } finally {
    client.release();
  }
}

