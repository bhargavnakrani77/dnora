import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reviews = await store.getReviews(false);
    return NextResponse.json({ success: true, reviews });
  } catch (error: unknown) {
    console.error("Error loading reviews:", error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.customer_name || !body.review) {
      return NextResponse.json(
        { error: "customer_name and review are required" },
        { status: 400 }
      );
    }

    const review = await store.createReview({
      customer_name: body.customer_name,
      rating: Number(body.rating) || 5,
      review: body.review,
      image_url: body.image_url || null,
      verified_purchase: body.verified_purchase ?? true,
      product_name: body.product_name || null,
      status: body.status || "active",
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating review:", error);
    const msg = error instanceof Error ? error.message : "Failed to create review";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Review id is required" }, { status: 400 });
    }

    const updated = await store.updateReview(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (error: unknown) {
    console.error("Error updating review:", error);
    const msg = error instanceof Error ? error.message : "Failed to update review";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Review id is required" }, { status: 400 });
    }

    const ok = await store.deleteReview(id);
    return NextResponse.json({ success: ok });
  } catch (error: unknown) {
    console.error("Error deleting review:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete review";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
