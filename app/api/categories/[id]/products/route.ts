import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const [catRes, assignedRes, catalogRes] = await Promise.all([
      db.query(
        `SELECT id, name, slug, image_url, is_in_nav FROM public.product_categories WHERE id = $1 LIMIT 1`,
        [id]
      ),
      db.query(
        `SELECT p.id, p.name, p.slug, p.sku, p.price, p.stock, p.status,
           (SELECT pi.secure_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) as image_url
         FROM public.products p
         JOIN public.product_category_relations pcr ON pcr.product_id = p.id
         WHERE pcr.category_id = $1
         ORDER BY p.name ASC`,
        [id]
      ),
      db.query(
        `SELECT p.id, p.name, p.slug, p.sku, p.price, p.stock, p.status,
           (SELECT pi.secure_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) as image_url,
           COALESCE(
             (
               SELECT json_agg(json_build_object('id', c.id, 'name', c.name))
               FROM public.product_category_relations pcr2
               JOIN public.product_categories c ON c.id = pcr2.category_id
               WHERE pcr2.product_id = p.id
             ), '[]'::json
           ) as categories
         FROM public.products p
         ORDER BY p.name ASC`
      ),
    ]);

    if (catRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      category: catRes.rows[0],
      products: assignedRes.rows.map((p: any) => ({
        ...p,
        price: Number(p.price),
        stock: Number(p.stock),
      })),
      allProducts: catalogRes.rows.map((p: any) => ({
        ...p,
        price: Number(p.price),
        stock: Number(p.stock),
      })),
    });
  } catch (error: unknown) {
    console.error("Error fetching category products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch category products" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const category = await store.getCategoryById(id);
    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const body = await req.json();
    const productIds: string[] = Array.isArray(body.product_ids)
      ? body.product_ids
      : body.product_id
      ? [body.product_id]
      : [];

    if (productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No products provided to add" },
        { status: 400 }
      );
    }

    let addedCount = 0;
    for (const prodId of productIds) {
      const ok = await store.addProductToCategory(id, prodId);
      if (ok) addedCount++;
    }

    try {
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath(`/category/${category.slug}`);
      revalidatePath("/admin/categories");
    } catch {
      // non-blocking
    }

    const updatedCategory = await store.getCategoryById(id);
    const updatedProducts = await store.getCategoryProducts(id);

    return NextResponse.json({
      success: true,
      addedCount,
      category: updatedCategory,
      products: updatedProducts,
    });
  } catch (error: unknown) {
    console.error("Error adding product to category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add products to category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const category = await store.getCategoryById(id);
    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    let productId = searchParams.get("product_id");

    if (!productId) {
      const body = await req.json().catch(() => ({}));
      productId = body.product_id;
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const ok = await store.removeProductFromCategory(id, productId);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Failed to remove product from category" },
        { status: 500 }
      );
    }

    try {
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath(`/category/${category.slug}`);
      revalidatePath("/admin/categories");
    } catch {
      // non-blocking
    }

    const updatedCategory = await store.getCategoryById(id);
    const updatedProducts = await store.getCategoryProducts(id);

    return NextResponse.json({
      success: true,
      message: "Product removed from category successfully",
      category: updatedCategory,
      products: updatedProducts,
    });
  } catch (error: unknown) {
    console.error("Error removing product from category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove product from category" },
      { status: 500 }
    );
  }
}
