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
  const { status } = await req.json();

  if (!["published", "draft", "archived"].includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  const updated = await store.setHeroPublishStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "Hero banner not found" }, { status: 404 });
  }

  // Instant revalidation of the storefront
  revalidatePath("/");

  return NextResponse.json({
    success: true,
    banner: updated,
    message: `Banner status updated to ${status}. Main website updated.`,
  });
}
