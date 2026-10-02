import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search") || "";

    const conditions: string[] = ["p.status != 'archived'"];
    const params: unknown[] = [];
    let idx = 1;

    if (search.trim()) {
      conditions.push(`(LOWER(p.name) LIKE $${idx} OR LOWER(p.sku) LIKE $${idx})`);
      params.push(`%${search.trim().toLowerCase()}%`);
      idx++;
    }

    if (filter === "low-stock") {
      conditions.push(`p.stock > 0 AND p.stock <= 5`);
    } else if (filter === "out-of-stock") {
      conditions.push(`p.stock = 0`);
    } else if (filter === "in-stock") {
      conditions.push(`p.stock > 5`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT NULL;`).catch(() => {});

    const query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.stock,
        p.price,
        p.cost_price,
        p.status,
        p.updated_at,
        (
          SELECT secure_url 
          FROM public.product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.sort_order ASC 
          LIMIT 1
        ) as image_url,
        (
          SELECT c.name 
          FROM public.product_category_relations pcr
          JOIN public.product_categories c ON c.id = pcr.category_id
          WHERE pcr.product_id = p.id
          LIMIT 1
        ) as category_name
      FROM public.products p
      ${whereClause}
      ORDER BY p.stock ASC, p.name ASC
    `;

    const res = await db.query(query, params);

    // Calculate Summary Counts & Financial Valuations (Cost vs Retail Track)
    const countsRes = await db.query(`
      SELECT 
        COUNT(*) as total_skus,
        COALESCE(SUM(stock), 0) as total_units,
        COALESCE(SUM(stock * COALESCE(cost_price, 0)), 0) as total_cost_value,
        COALESCE(SUM(stock * price), 0) as total_retail_value,
        COALESCE(SUM(stock * (price - COALESCE(cost_price, 0))), 0) as total_profit_potential,
        COUNT(*) FILTER (WHERE stock > 5) as in_stock,
        COUNT(*) FILTER (WHERE stock > 0 AND stock <= 5) as low_stock,
        COUNT(*) FILTER (WHERE stock = 0) as out_of_stock
      FROM public.products
      WHERE status != 'archived'
    `);

    const summaryRow = countsRes.rows[0] || {};
    const summary = {
      totalSkus: parseInt(summaryRow.total_skus || "0", 10),
      totalUnits: parseInt(summaryRow.total_units || "0", 10),
      totalCostValue: parseFloat(summaryRow.total_cost_value || "0"),
      totalRetailValue: parseFloat(summaryRow.total_retail_value || "0"),
      totalProfitPotential: parseFloat(summaryRow.total_profit_potential || "0"),
      inStock: parseInt(summaryRow.in_stock || "0", 10),
      lowStock: parseInt(summaryRow.low_stock || "0", 10),
      outOfStock: parseInt(summaryRow.out_of_stock || "0", 10),
    };

    return NextResponse.json({
      success: true,
      products: res.rows.map((r) => ({
        ...r,
        stock: parseInt(r.stock, 10),
        price: parseFloat(r.price),
        cost_price: r.cost_price !== null && r.cost_price !== undefined ? parseFloat(r.cost_price) : null,
      })),
      summary,
    });
  } catch (error) {
    console.error("Error fetching stock inventory:", error);
    return NextResponse.json({ error: "Failed to fetch stock inventory" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT NULL;`).catch(() => {});

    const body = await req.json();

    // Support bulk batch update for all products at once
    if (Array.isArray(body.items)) {
      const items = body.items;
      let updatedCount = 0;

      for (const item of items) {
        if (!item.productId) continue;
        const updates: string[] = [];
        const values: (string | number | null)[] = [];
        let idx = 1;

        if (item.newStock !== undefined) {
          updates.push(`stock = $${idx++}`);
          values.push(Math.max(0, parseInt(item.newStock, 10) || 0));
        }

        const resolvedCost = item.costPrice !== undefined ? item.costPrice : item.cost_price;
        if (resolvedCost !== undefined) {
          updates.push(`cost_price = $${idx++}`);
          values.push(resolvedCost === null || resolvedCost === "" ? null : Math.max(0, parseFloat(resolvedCost)));
        }

        if (item.price !== undefined) {
          const numP = parseFloat(item.price);
          if (!isNaN(numP) && numP > 0) {
            updates.push(`price = $${idx++}`);
            values.push(numP);
          }
        }

        if (updates.length > 0) {
          updates.push("updated_at = NOW()");
          values.push(item.productId);
          await db.query(
            `UPDATE public.products SET ${updates.join(", ")} WHERE id = $${idx}`,
            values
          );
          updatedCount++;
        }
      }

      return NextResponse.json({ success: true, updatedCount });
    }

    const { productId, newStock, adjustment, costPrice, cost_price, price } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let idx = 1;

    // Handle stock update (exact or incremental)
    if (adjustment !== undefined) {
      updates.push(`stock = GREATEST(0, stock + $${idx++})`);
      values.push(Number(adjustment));
    } else if (newStock !== undefined) {
      updates.push(`stock = $${idx++}`);
      values.push(Math.max(0, parseInt(newStock, 10) || 0));
    }

    // Handle cost_price update
    const resolvedCost = costPrice !== undefined ? costPrice : cost_price;
    if (resolvedCost !== undefined) {
      updates.push(`cost_price = $${idx++}`);
      values.push(resolvedCost === null || resolvedCost === "" ? null : Math.max(0, parseFloat(resolvedCost)));
    }

    // Handle selling price update
    if (price !== undefined) {
      const numP = parseFloat(price);
      if (!isNaN(numP) && numP > 0) {
        updates.push(`price = $${idx++}`);
        values.push(numP);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    updates.push("updated_at = NOW()");
    values.push(productId);

    const updateQuery = `
      UPDATE public.products 
      SET ${updates.join(", ")} 
      WHERE id = $${idx} 
      RETURNING id, name, sku, stock, price, cost_price
    `;

    const res = await db.query(updateQuery, values);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updatedRow = res.rows[0];
    return NextResponse.json({
      success: true,
      productId,
      stock: parseInt(updatedRow.stock, 10),
      price: parseFloat(updatedRow.price),
      cost_price: updatedRow.cost_price !== null ? parseFloat(updatedRow.cost_price) : null,
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}
