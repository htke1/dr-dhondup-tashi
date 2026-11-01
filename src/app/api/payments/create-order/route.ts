import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { APP_CONFIG } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId is required." },
        { status: 400 }
      );
    }

    let amountInPaise = APP_CONFIG.consultationFeeINR * 100; // default 80000 paise = ₹800 INR

    // Connect to Supabase to verify hold is still valid and fetch fee
    try {
      const supabase = getAdminSupabase();
      const { data: apt, error: aptError } = await supabase
        .from("appointments")
        .select("id, status, hold_expires_at, consultation_fee")
        .eq("id", appointmentId)
        .single();

      if (aptError || !apt) {
        return NextResponse.json(
          { error: "Appointment not found." },
          { status: 404 }
        );
      }

      const appointment = apt as { id: string; status: string; hold_expires_at: string; consultation_fee: number };

      if (appointment.status !== "pending_payment") {
        return NextResponse.json(
          { error: `Appointment is already in status '${appointment.status}'.` },
          { status: 400 }
        );
      }

      if (appointment.hold_expires_at && new Date(appointment.hold_expires_at) < new Date()) {
        return NextResponse.json(
          { error: "Reservation hold has expired. Please select your slot again." },
          { status: 410 }
        );
      }

      if (appointment.consultation_fee) {
        amountInPaise = Math.round(appointment.consultation_fee * 100);
      }
    } catch {
      // If Supabase is not reachable, proceed
    }

    if (!isRazorpayConfigured()) {
      const mockOrderId = `order_mock_${Date.now()}`;
      return NextResponse.json({
        developmentMock: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: "rzp_test_placeholder",
        consultationFeeDisplay: `₹${(amountInPaise / 100).toLocaleString("en-IN")}`,
        message: "Operating in development mock mode. Provide real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local for live test gateway.",
      });
    }

    // Create real order in Razorpay
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${appointmentId.slice(0, 20)}`,
      notes: {
        appointmentId,
        doctor: APP_CONFIG.doctor.name,
      },
    });

    // Save razorpay_order_id to database
    try {
      const supabase = getAdminSupabase();
      await supabase
        .from("appointments")
        .update({ razorpay_order_id: order.id })
        .eq("id", appointmentId);
    } catch {
      // Ignore in dev
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Could not initiate payment order." },
      { status: 500 }
    );
  }
}
