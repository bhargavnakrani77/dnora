import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body provided." },
        { status: 400 }
      );
    }

    const rawAmount = body.amount;
    const currency = body.currency || "INR";
    const receipt = body.receipt || `rcpt_${Date.now()}`;
    const notes = body.notes || {};

    // Validate amount
    const amount = Number(rawAmount);
    if (isNaN(amount) || !Number.isFinite(amount)) {
      return NextResponse.json(
        { error: "Valid amount in paise is required." },
        { status: 400 }
      );
    }

    // Minimum amount: 100 paise (₹1)
    if (amount < 100) {
      return NextResponse.json(
        { error: "Minimum order amount is 100 paise (₹1)." },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();

    const orderOptions = {
      amount: Math.round(amount),
      currency,
      receipt: String(receipt).slice(0, 40),
      notes,
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
    });
  } catch (error: unknown) {
    console.error("Razorpay Create Order Error:", error);

    const err = error as {
      statusCode?: number;
      status?: number;
      message?: string;
      error?: { code?: string; description?: string };
    };

    // Auth failure check
    if (
      err?.statusCode === 401 ||
      err?.status === 401 ||
      (err?.error?.code === "BAD_REQUEST_ERROR" &&
        typeof err?.error?.description === "string" &&
        err?.error?.description?.toLowerCase().includes("authenticate"))
    ) {
      return NextResponse.json(
        { error: "Razorpay authentication failed. Please verify API keys." },
        { status: 401 }
      );
    }

    const message =
      err?.error?.description ||
      err?.message ||
      "Failed to create Razorpay order.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }

}
