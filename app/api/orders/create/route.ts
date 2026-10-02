import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserSession } from "@/lib/auth/user-session";
import { createNewOrder } from "@/lib/data/orders";
import { createUserAddress } from "@/lib/data/account";
import { db } from "@/lib/db";
import { SEED_PRODUCTS } from "@/lib/data/seed-data";
import { sendOrderConfirmationEmail } from "@/lib/email";

const orderItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().optional(),
  productSlug: z.string().optional(),
  price: z.number().optional(),
  quantity: z.number().int().min(1).max(50),
  imageUrl: z.string().optional(),
  selectedColor: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  product: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      slug: z.string().optional(),
      price: z.number().optional(),
      images: z
        .array(
          z.object({
            secure_url: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

const createOrderSchema = z.object({
  customerName: z.string().min(1, "Recipient name is required").max(120),
  customerEmail: z.string().email("A valid email address is required"),
  customerPhone: z.string().min(10, "A valid 10-digit phone number is required").max(15).optional().or(z.literal("")),
  shippingAddress: z.object({
    fullName: z.string().min(1, "Full name is required").max(120),
    phone: z.string().min(10, "Phone number is required").max(15),
    addressLine1: z.string().min(1, "Address is required").max(255),
    addressLine2: z.string().max(255).optional().default(""),
    city: z.string().min(1, "City is required").max(100),
    state: z.string().min(1, "State is required").max(100),
    postalCode: z.string().min(5, "Valid postal code is required").max(10),
    country: z.string().max(100).optional().default("India"),
  }),
  items: z.array(orderItemSchema).min(1, "Your cart is empty. Please add items before checking out."),
  paymentMethod: z.enum(["upi", "card", "netbanking", "cod"]).default("card"),
  shippingCost: z.number().min(0).max(1000).optional().default(0),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const parseResult = createOrderSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Validation failed on order payload.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      paymentMethod,
      shippingCost,
      notes,
    } = parseResult.data;

    // 1. Gather all product identifiers to verify prices server-side
    const productIds: string[] = [];
    const productSlugs: string[] = [];

    for (const it of items) {
      const pId = it.productId || it.product?.id;
      const pSlug = it.productSlug || it.product?.slug;
      if (pId) productIds.push(pId);
      if (pSlug) productSlugs.push(pSlug);
    }

    // 2. Fetch official product details from DB
    const dbProductsMap = new Map<string, { id: string; name: string; slug: string; price: number; image?: string }>();

    if (productIds.length > 0 || productSlugs.length > 0) {
      try {
        const dbRes = await db.query(
          `SELECT p.id, p.name, p.slug, p.price,
             COALESCE(
               (SELECT secure_url FROM public.product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1),
               NULL
             ) as primary_image
           FROM public.products p
           WHERE p.id::text = ANY($1) OR p.slug = ANY($2)`,
          [productIds, productSlugs]
        );

        for (const row of dbRes.rows) {
          const itemData = {
            id: row.id,
            name: row.name,
            slug: row.slug,
            price: Number(row.price),
            image: row.primary_image || undefined,
          };
          dbProductsMap.set(row.id, itemData);
          dbProductsMap.set(row.slug, itemData);
        }
      } catch (err) {
        console.warn("Notice querying DB products for price verification:", err);
      }
    }

    // Fallback lookup from SEED_PRODUCTS if not found in database table
    for (const seed of SEED_PRODUCTS) {
      if (!dbProductsMap.has(seed.id)) {
        const itemData = {
          id: seed.id,
          name: seed.name,
          slug: seed.slug,
          price: Number(seed.price),
          image: seed.images?.[0]?.secure_url || undefined,
        };
        dbProductsMap.set(seed.id, itemData);
        dbProductsMap.set(seed.slug, itemData);
      }
    }

    // 3. Construct strictly verified items and calculate financial totals server-side
    const verifiedItems = items.map((it) => {
      const pId = it.productId || it.product?.id || "";
      const pSlug = it.productSlug || it.product?.slug || "";
      const verified = dbProductsMap.get(pId) || dbProductsMap.get(pSlug);

      // Server enforces the price from DB; if product is catalog verified, use DB price.
      // If completely uncataloged, fallback to sanitized item price with strict floor of ₹1.
      const price = verified ? verified.price : Math.max(1, Number(it.product?.price ?? it.price ?? 1));
      const name = verified?.name || it.productName || it.product?.name || "DNORA Luxury Silhouette";
      const slug = verified?.slug || it.productSlug || it.product?.slug;
      const imageUrl =
        verified?.image ||
        it.imageUrl ||
        it.product?.images?.[0]?.secure_url ||
        "";

      return {
        productId: verified?.id || (pId || undefined),
        productName: name,
        productSlug: slug,
        price,
        quantity: it.quantity,
        imageUrl,
        selectedColor: it.selectedColor || (it as { color?: string }).color,
        attributes: it.attributes,
      };
    });

    // 4. Validate shipping cost server-side (Complimentary = 0, VIP = 150)
    const officialShippingCost = shippingCost === 150 ? 150 : 0;

    const email = (session?.email || customerEmail || shippingAddress.fullName).toLowerCase().trim();

    // 5. Create atomic order
    const order = await createNewOrder({
      userId: session?.id || null,
      customerName: customerName || session?.full_name || shippingAddress.fullName,
      customerEmail: email,
      customerPhone: customerPhone || session?.phone || shippingAddress.phone,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || "",
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || "India",
      },
      items: verifiedItems,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      shippingCost: officialShippingCost,
      notes: notes || undefined,
    });

    // 6. Automatically persist address to user profile for future checkouts
    if (session?.id) {
      createUserAddress(session.id, {
        full_name: shippingAddress.fullName,
        phone: shippingAddress.phone,
        address_line1: shippingAddress.addressLine1,
        address_line2: shippingAddress.addressLine2 || null,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postal_code: shippingAddress.postalCode,
        country: shippingAddress.country || "India",
        is_default: true,
      }).catch(() => {});
    }

    // 7. Non-blocking asynchronous order confirmation email
    sendOrderConfirmationEmail({
      orderNumber: order.order_number,
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        addressLine1: shippingAddress.addressLine1,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
      },
      items: verifiedItems.map((v) => ({
        productName: v.productName,
        price: v.price,
        quantity: v.quantity,
        selectedColor: v.selectedColor,
      })),
    }).catch((err) => {
      console.warn("Non-blocking order email notice:", err);
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Order creation API error:", error);
    return NextResponse.json(
      { error: "Failed to place your order. Please try again." },
      { status: 500 }
    );
  }
}

