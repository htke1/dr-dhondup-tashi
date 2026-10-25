import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header." },
        { status: 400 }
      );
    }

    // Verify cryptographic webhook signature
    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.warn("Invalid Razorpay webhook signature detected.");
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    try {
      const supabase = getAdminSupabase();

      if (eventType === "payment.captured") {
        await supabase
          .from("appointments")
          .update({
            status: "confirmed",
            payment_status: "paid",
            razorpay_payment_id: paymentId,
          })
          .eq("razorpay_order_id", orderId);
      } else if (eventType === "payment.failed") {
        await supabase
          .from("appointments")
          .update({
            payment_status: "failed",
          })
          .eq("razorpay_order_id", orderId);
      } else if (eventType === "refund.processed") {
        await supabase
          .from("appointments")
          .update({
            payment_status: "refunded",
            status: "cancelled",
            cancellation_reason: "Payment refunded via Razorpay",
          })
          .eq("razorpay_order_id", orderId);
      }
    } catch (dbError) {
      console.error("Database update error during webhook handling:", dbError);
    }

    return NextResponse.json({ received: true, status: "processed" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }
}
