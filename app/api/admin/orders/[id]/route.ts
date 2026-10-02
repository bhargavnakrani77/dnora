import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { getOrderById } from "@/lib/data/account";
import { updateOrderAdmin } from "@/lib/data/orders";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Admin order GET by ID error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await updateOrderAdmin(id, {
      status: body.status,
      payment_status: body.paymentStatus,
      carrier: body.carrier,
      tracking_number: body.trackingNumber,
      notes: body.notes,
    });

    const updated = await getOrderById(id);
    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Admin order PATCH error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { deleteOrderAdmin } = await import("@/lib/data/orders");
    const { revalidatePath } = await import("next/cache");

    const success = await deleteOrderAdmin(id);
    if (!success) {
      return NextResponse.json({ error: "Order not found or already deleted" }, { status: 404 });
    }

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/orders");
      revalidatePath("/admin/sales-report");
      revalidatePath("/orders");
      revalidatePath("/account");
    } catch (e) {
      console.warn("Revalidation warning:", e);
    }

    return NextResponse.json({ success: true, message: "Order permanently deleted" });
  } catch (error) {
    console.error("Admin order DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}

