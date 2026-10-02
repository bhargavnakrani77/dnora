import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";
import { productSchema, productUpdateSchema } from "@/lib/validation/product";
import { revalidatePath } from "next/cache";
import { ProductImage } from "@/types";
import { ZodError } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let product = await store.getProductById(id);
  if (!product) {
    product = await store.getProductBySlug(id);
  }
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = productUpdateSchema.parse(body);

    let categories = undefined;
    if (validated.category_id) {
      const allCats = await store.getCategories();
      const matched = allCats.find((c) => c.id === validated.category_id);
      if (matched) categories = [matched];
    }

    const updated = await store.updateProduct(id, {
      ...validated,
      images: validated.images as ProductImage[] | undefined,
      color_variants: validated.color_variants,
      categories: categories || undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/product/${updated.slug}`);

    return NextResponse.json({ success: true, product: updated });
  } catch (error: unknown) {
    console.error("PUT /api/products/[id] error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const success = await store.deleteProduct(id);

  if (!success) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath("/shop");

  return NextResponse.json({ success: true });
}
