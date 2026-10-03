import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Latest 3 orders
    const ordersRes = await db.query(`
      SELECT o.id, o.order_number, o.customer_name, o.total_amount, o.created_at,
             (SELECT oi.product_name FROM public.order_items oi WHERE oi.order_id = o.id LIMIT 1) as first_product
      FROM public.orders o
      ORDER BY o.created_at DESC
      LIMIT 3
    `);

    // 2. Low stock products (<= 5)
    const lowStockRes = await db.query(`
      SELECT id, name, sku, stock
      FROM public.products
      WHERE stock <= 5 AND status = 'active'
      ORDER BY stock ASC
      LIMIT 3
    `);

    // 3. New customers in last 24h
    const newCustomersRes = await db.query(`
      SELECT id, full_name, email, created_at
      FROM public.users
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND role = 'customer'
      ORDER BY created_at DESC
      LIMIT 2
    `);

    // 4. Expiring coupons (within 48h) — silently skip if table not yet created
    let expiringCoupons: { id: string; code: string; valid_until: string }[] = [];
    try {
      const couponRes = await db.query(`
        SELECT id, code, valid_until FROM public.coupons
        WHERE is_active = true
          AND valid_until IS NOT NULL
          AND valid_until BETWEEN NOW() AND NOW() + INTERVAL '48 hours'
        ORDER BY valid_until ASC
        LIMIT 2
      `);
      expiringCoupons = couponRes.rows;
    } catch {
      // table may not exist yet
    }

    const notifications: {
      id: string;
      type: "order" | "low_stock" | "new_customer" | "coupon_expiry";
      title: string;
      description: string;
      timeAgo: string;
      link: string;
    }[] = [];

    ordersRes.rows.forEach((o) => {
      const orderNum = o.order_number || `#${o.id.slice(0, 8)}`;
      const prodName = o.first_product || "DNORA Luxury Item";
      const date = new Date(o.created_at);
      const timeStr = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      notifications.push({
        id: `ord-${o.id}`,
        type: "order",
        title: `Order ${orderNum}`,
        description: `${o.customer_name || "Client"} ordered ${prodName} (₹${parseFloat(o.total_amount).toLocaleString("en-IN")})`,
        timeAgo: timeStr,
        link: "/admin/orders",
      });
    });

    lowStockRes.rows.forEach((p) => {
      notifications.push({
        id: `stock-${p.id}`,
        type: "low_stock",
        title: `Low Stock Alert`,
        description: `${p.name} has only ${p.stock} unit${p.stock === 1 ? "" : "s"} remaining`,
        timeAgo: "Stock Alert",
        link: "/admin/stock",
      });
    });

    newCustomersRes.rows.forEach((c) => {
      const date = new Date(c.created_at);
      const timeStr = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      notifications.push({
        id: `cust-${c.id}`,
        type: "new_customer",
        title: `New Customer`,
        description: `${c.full_name || c.email} just registered`,
        timeAgo: timeStr,
        link: "/admin/customers",
      });
    });

    expiringCoupons.forEach((coupon) => {
      const expiresIn = Math.round(
        (new Date(coupon.valid_until).getTime() - Date.now()) / (1000 * 60 * 60)
      );
      notifications.push({
        id: `coupon-${coupon.id}`,
        type: "coupon_expiry",
        title: `Coupon Expiring`,
        description: `Code "${coupon.code}" expires in ~${expiresIn}h`,
        timeAgo: "Coupon Alert",
        link: "/admin/coupons",
      });
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
