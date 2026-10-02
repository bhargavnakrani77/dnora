import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";
import { productSchema } from "@/lib/validation/product";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;
  const status = searchParams.get("status") || undefined;
  const isBestSeller = searchParams.has("best_seller")
    ? searchParams.get("best_seller") === "true"
    : undefined;
  const isNewArrival = searchParams.has("new_arrival")
    ? searchParams.get("new_arrival") === "true"
    : undefined;

  const products = await store.getProducts({
    search,
    category_slug: category,
    status,
    is_best_seller: isBestSeller,
    is_new_arrival: isNewArrival,
  });

  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = productSchema.parse(body);

    const categories = await store.getCategories();
    let matchedCategory = categories.find((c) => c.id === validated.category_id);
    if (!matchedCategory && categories.length > 0) {
      matchedCategory = categories[0];
    }

    const finalSku =
      validated.sku && validated.sku.trim()
        ? validated.sku.trim()
        : `DNR-${Date.now().toString(36).toUpperCase()}`;

    let finalImages = validated.images;
    if (!finalImages || finalImages.length === 0) {
      finalImages = [
        {
          secure_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
          cloudinary_public_id: "default_cover",
          alt_text: validated.name,
          sort_order: 1,
        },
      ];
    }

    const newProduct = await store.createProduct({
      ...validated,
      sku: finalSku,
      slug: validated.slug || slugify(validated.name),
      categories: matchedCategory ? [matchedCategory] : [],
      compare_at_price: validated.compare_at_price || null,
      images: finalImages,
      color_variants: validated.color_variants || [],
    });

    revalidatePath("/");
    revalidatePath("/shop");

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create product:", error);
    if (error instanceof ZodError) {
      const issueMsgs = error.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join(", ");
      return NextResponse.json(
        { error: `Validation error: ${issueMsgs}`, details: error.issues },
        { status: 400 }
      );
    }
    const errText = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errText }, { status: 500 });
  }
}
