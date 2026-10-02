import { NextRequest, NextResponse } from "next/server";
import { createNewOrder } from "@/lib/data/orders";
import { getUserSession } from "@/lib/auth/user-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formData, items } = body;

    if (!formData || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid order payload. Missing customer information or items." },
        { status: 400 }
      );
    }

    // Check if user is logged in
    const session = await getUserSession();

    const createdOrder = await createNewOrder({
      userId: session?.id || null,
      customerName: `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Guest Customer",
      customerEmail: formData.email?.toLowerCase().trim() || "",
      customerPhone: formData.phone || undefined,
      shippingAddress: {
        fullName: `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Valued Customer",
        phone: formData.phone || "",
        addressLine1: formData.address || "",
        city: formData.city || "",
        state: formData.state || "Gujarat",
        postalCode: formData.postalCode || "",
        country: "India",
      },
      items: items.map((it: {
        productId?: string;
        product?: { id?: string; name: string; slug?: string; price: number; images?: { secure_url?: string }[] };
        productName?: string;
        productSlug?: string;
        price?: number;
        quantity: number;
        imageUrl?: string;
        selectedVariant?: { name?: string; color_hex?: string };
      }) => ({
        productId: it.product?.id || it.productId,
        productName: it.product?.name || it.productName || "DNORA Luxury Handbag",
        productSlug: it.product?.slug || it.productSlug,
        price: Number(it.product?.price || it.price || 0),
        quantity: Number(it.quantity || 1),
        imageUrl: it.product?.images?.[0]?.secure_url || it.imageUrl,
        attributes: it.selectedVariant ? { variant: it.selectedVariant.name } : undefined,
      })),
      paymentMethod: formData.paymentMethod || "card",
      paymentStatus: formData.paymentMethod === "cod" ? "pending" : "paid",
      notes: formData.specialInstructions || (formData.giftWrap ? "Complimentary luxury gift wrapping requested." : undefined),
    });

    return NextResponse.json({
      success: true,
      order: createdOrder,
      orderNumber: createdOrder.order_number,
    });
  } catch (err: unknown) {
    console.error("Error creating storefront order:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

