import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/user-session";
import { getUserAddresses, createUserAddress } from "@/lib/data/account";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await getUserAddresses(session.id);
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    if (!data.full_name || !data.phone || !data.address_line1 || !data.city || !data.postal_code) {
      return NextResponse.json(
        { error: "Please fill in all required address fields." },
        { status: 400 }
      );
    }

    const newAddress = await createUserAddress(session.id, data);
    return NextResponse.json({ success: true, address: newAddress });
  } catch (err) {
    console.error("Create address error:", err);
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}
