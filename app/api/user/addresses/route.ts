import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/user-session";
import { getUserAddresses, createUserAddress } from "@/lib/data/account";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, addresses: [] });
    }

    const addresses = await getUserAddresses(session.id);
    return NextResponse.json({ authenticated: true, user: session, addresses });
  } catch (error) {
    console.error("Addresses GET error:", error);
    return NextResponse.json({ authenticated: false, addresses: [] });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const address = await createUserAddress(session.id, {
      full_name: body.fullName,
      phone: body.phone,
      address_line1: body.addressLine1,
      address_line2: body.addressLine2,
      city: body.city,
      state: body.state,
      postal_code: body.postalCode,
      country: body.country || "India",
      is_default: Boolean(body.isDefault),
    });

    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error("Address POST error:", error);
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}
