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

    // 1. Fetch latest 3 orders
    const ordersRes = await db.query(`
      SELECT o.id, o.order_number, o.customer_name, o.total_amount, o.created_at,
             (SELECT oi.product_name FROM public.order_items oi WHERE oi.order_id = o.id LIMIT 1) as first_product
      FROM public.orders o
      ORDER BY o.created_at DESC
      LIMIT 3
    `);

    // 2. Fetch products with low stock (<= 5)
    const lowStockRes = await db.query(`
      SELECT id, name, sku, stock
      FROM public.products
      WHERE stock <= 5 AND status = 'active'
      ORDER BY stock ASC
      LIMIT 3
    `);

    const notifications: {
      id: string;
      type: "order" | "low_stock";
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
        description: `${p.name} has only ${p.stock} units remaining`,
        timeAgo: "Stock Alert",
        link: "/admin/stock",
      });
    });

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
