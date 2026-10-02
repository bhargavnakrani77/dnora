import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/user-session";
import { getUserOrders } from "@/lib/data/account";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getUserOrders(session.id, session.email);
  return NextResponse.json({ orders });
}
