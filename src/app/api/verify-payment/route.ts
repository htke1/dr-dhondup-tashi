import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature, isRazorpayConfigured } from "@/lib/razorpay";

/**
 * Standard Razorpay Signature Verification Endpoint
 * POST /api/verify-payment
 * Request body: {
 *   razorpay_order_id: string,
 *   razorpay_payment_id: string,
 *   razorpay_signature: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    // Support both snake_case and camelCase
    const orderId = body.razorpay_order_id || body.razorpayOrderId || body.order_id;
    const paymentId = body.razorpay_payment_id || body.razorpayPaymentId || body.payment_id;
    const signature = body.razorpay_signature || body.razorpaySignature || body.signature;

    // Validate missing fields
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          error: "Missing required payment fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
          received: {
            order_id: Boolean(orderId),
            payment_id: Boolean(paymentId),
            signature: Boolean(signature),
          },
        },
        { status: 400 }
      );
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured on server." },
        { status: 500 }
      );
    }

    // Cryptographic verification: HMAC-SHA256(orderId + "|" + paymentId, KEY_SECRET)
    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      console.warn(`[Razorpay Signature Mismatch] Order: ${orderId}, Payment: ${paymentId}`);
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Payment verification failed: signature mismatch.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Payment signature verified successfully.",
      payment_id: paymentId,
      order_id: orderId,
    });
  } catch (error: any) {
    console.error("[Internal error in /api/verify-payment]:", error);
    return NextResponse.json(
      { error: "Internal server error verifying payment signature." },
      { status: 500 }
    );
  }
}
