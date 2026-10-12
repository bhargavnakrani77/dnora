import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: "Razorpay secret key is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body provided." },
        { status: 400 }
      );
    }

    const orderId = body.razorpay_order_id || body.order_id;
    const paymentId = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    // Validate missing fields
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields. order_id, payment_id, and signature are required.",
        },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature(orderId, paymentId, signature);

    if (!isValid) {
      // Signature mismatch: return 400, do NOT mark as paid
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed: signature mismatch.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (error: unknown) {
    console.error("Razorpay Verify Payment Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error while verifying payment.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }

}
