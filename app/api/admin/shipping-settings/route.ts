import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { store } from "@/lib/data/store";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await store.getShippingConfig();
    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Admin shipping settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updated = await store.updateShippingConfig(body);

    try {
      revalidatePath("/checkout");
      revalidatePath("/shipping");
      revalidatePath("/admin/shipping");
    } catch (e) {
      console.warn("Revalidation warning:", e);
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Admin shipping settings PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update shipping settings" },
      { status: 500 }
    );
  }
}
