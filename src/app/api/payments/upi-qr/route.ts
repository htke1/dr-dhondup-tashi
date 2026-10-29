import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { APP_CONFIG } from "@/lib/config";
import { createVerifiedUpiPayment, isValidVpa, isValidRecipientName } from "@/lib/upi";

/**
 * POST /api/payments/upi-qr
 * Generates verified UPI QR code and payment URI for a held appointment.
 * Amount is determined strictly from trusted server database record.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { appointmentId } = body;

    if (!appointmentId || typeof appointmentId !== "string") {
      return NextResponse.json(
        { error: "appointmentId is required to generate UPI payment details." },
        { status: 400 }
      );
    }

    // 1. Verify UPI configuration on server
    const vpa = APP_CONFIG.payment.upi.vpa;
    const recipientName = APP_CONFIG.payment.upi.recipientName;

    if (!isValidVpa(vpa)) {
      console.error("[UPI Config Error] Invalid UPI ID / VPA:", vpa);
      return NextResponse.json(
        {
          error: "UPI payment gateway configuration error. UPI ID is invalid.",
          code: "INVALID_UPI_CONFIG",
        },
        { status: 500 }
      );
    }

    if (!isValidRecipientName(recipientName)) {
      console.error("[UPI Config Error] Invalid or unverified recipient name:", recipientName);
      return NextResponse.json(
        {
          error: "UPI payment gateway configuration error. Recipient name is unverified.",
          code: "UNVERIFIED_RECIPIENT_NAME",
        },
        { status: 500 }
      );
    }

    // 2. Fetch appointment from database to get trusted fee
    let consultationFee = APP_CONFIG.consultationFee;

    try {
      const supabase = getAdminSupabase();
      const { data: appointment, error: aptError } = await supabase
        .from("appointments")
        .select("id, consultation_fee, status, payment_status")
        .eq("id", appointmentId)
        .single();

      if (aptError || !appointment) {
        return NextResponse.json(
          { error: "Appointment record not found or hold expired." },
          { status: 404 }
        );
      }

      if (appointment.status === "confirmed" && appointment.payment_status === "paid") {
        return NextResponse.json(
          { error: "This appointment has already been confirmed and paid." },
          { status: 400 }
        );
      }

      // Secure: derived strictly from database record
      consultationFee = appointment.consultation_fee;
    } catch (dbErr) {
      console.warn("[Database fetch notice in upi-qr]: Using default server fee if DB offline", dbErr);
    }

    // 3. Generate verified payment details & QR code
    const upiDetails = await createVerifiedUpiPayment(consultationFee, appointmentId);

    return NextResponse.json({
      success: true,
      ...upiDetails,
      instructions:
        "Please open any UPI app (Google Pay, PhonePe, Paytm, BHIM, or your bank app) and scan this QR code. Verify the recipient name shows 'Dhondup Tashi' and the amount matches before authorizing.",
    });
  } catch (error: any) {
    console.error("[UPI QR Generation Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate UPI payment QR code." },
      { status: 500 }
    );
  }
}
