import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { flag } = await req.json();

  if (flag !== "is_best_seller" && flag !== "is_new_arrival") {
    return NextResponse.json({ error: "Invalid flag name" }, { status: 400 });
  }

  const updated = await store.toggleProductFlag(id, flag);
  if (!updated) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath("/shop");

  return NextResponse.json({
    success: true,
    product: updated,
    message: `Updated ${flag} for ${updated.name}`,
  });
}
