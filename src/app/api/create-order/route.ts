import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient, getRazorpayKeyId, isRazorpayConfigured } from "@/lib/razorpay";
import { APP_CONFIG } from "@/lib/config";

/**
 * Standard Razorpay Order Creation Endpoint
 * POST /api/create-order
 * Request body: { amount?: number (in paise), currency?: string, receipt?: string, notes?: Record<string, any> }
 * Response: { order_id, amount, currency, keyId }
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is allowed, defaults to consultation fee
    }

    // Default amount to 1000 INR (100,000 paise) if not passed
    const rawAmount = body.amount !== undefined ? Number(body.amount) : APP_CONFIG.consultationFeeINR * 100;
    const currency = body.currency || "INR";
    const receipt = body.receipt || `rcpt_${Date.now()}`;
    const notes = body.notes || {};

    // Validate minimum amount (must be >= 100 paise)
    if (isNaN(rawAmount) || rawAmount < 100) {
      return NextResponse.json(
        { error: "Invalid amount. Minimum amount is 100 paise (1 INR)." },
        { status: 400 }
      );
    }

    const amount = Math.round(rawAmount);

    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        {
          error: "Razorpay credentials not configured. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.",
        },
        { status: 401 }
      );
    }

    const razorpay = getRazorpayClient();

    try {
      const order = await razorpay.orders.create({
        amount,
        currency,
        receipt,
        notes,
      });

      return NextResponse.json({
        order_id: order.id,
        orderId: order.id, // Support both naming styles
        amount: order.amount,
        currency: order.currency,
        keyId: getRazorpayKeyId(),
      });
    } catch (apiError: any) {
      console.error("[Razorpay API error creating order]:", apiError);

      const statusCode = apiError.statusCode || apiError.status || 500;
      if (statusCode === 401) {
        return NextResponse.json(
          { error: "Razorpay authentication failed. Please verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: apiError.error?.description || apiError.message || "Failed to create Razorpay order.",
        },
        { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
      );
    }
  } catch (error: any) {
    console.error("[Internal error in /api/create-order]:", error);
    return NextResponse.json(
      { error: "Internal server error creating payment order." },
      { status: 500 }
    );
  }
}
