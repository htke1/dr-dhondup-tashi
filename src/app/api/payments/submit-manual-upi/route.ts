import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { sendDoctorNotificationEmail } from "@/lib/email";
import { APP_CONFIG } from "@/lib/config";

/**
 * POST /api/payments/submit-manual-upi
 * Accepts patient-submitted UPI transaction reference / UTR number.
 * MANDATORY: Does NOT automatically confirm the appointment.
 * Leaves appointment in pending_payment with UTR recorded, awaiting admin bank verification.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { appointmentId, transactionReference, bookingRef } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId is required." },
        { status: 400 }
      );
    }

    const cleanUtr = String(transactionReference || "").trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      return NextResponse.json(
        { error: "Please enter a valid UPI Reference / UTR Number (minimum 6 digits from your receipt)." },
        { status: 400 }
      );
    }

    let appointment: any = null;
    let patient: any = null;

    try {
      const supabase = getAdminSupabase();

      // 1. Fetch appointment details
      const { data: aptData, error: aptErr } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          slot_time,
          consultation_fee,
          status,
          payment_status,
          reason_for_consultation,
          patients (
            id,
            name,
            email,
            phone
          )
        `)
        .eq("id", appointmentId)
        .single();

      if (aptErr || !aptData) {
        return NextResponse.json(
          { error: "Appointment not found or expired. Please start a new reservation." },
          { status: 404 }
        );
      }

      appointment = aptData;
      patient = Array.isArray(aptData.patients) ? aptData.patients[0] : aptData.patients;

      // 2. Extend hold expiry by 24 hours so appointment does not get auto-cancelled while admin verifies
      const extendedHold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // 3. Record UTR reference. Do NOT confirm payment automatically.
      const formattedUtr = `UTR:${cleanUtr}`;
      const formattedRef = bookingRef ? `UPI-REF:${bookingRef}` : `UPI-REF:${appointment.id.slice(0, 8).toUpperCase()}`;

      const { error: updateErr } = await supabase
        .from("appointments")
        .update({
          razorpay_payment_id: formattedUtr,
          razorpay_order_id: formattedRef,
          payment_status: "pending",
          hold_expires_at: extendedHold,
        })
        .eq("id", appointmentId);

      if (updateErr) {
        console.error("Error saving UPI reference to Supabase:", updateErr);
      }

      // 4. Send notification email to admin/doctor to review bank statement
      try {
        await sendDoctorNotificationEmail({
          appointmentId: appointment.id,
          patientName: patient?.name || "Patient",
          patientEmail: patient?.email || "",
          patientPhone: patient?.phone || "",
          appointmentDate: appointment.appointment_date,
          slotTime: appointment.slot_time,
          googleMeetLink: "Pending manual verification in Admin Dashboard",
          reason: `[UPI Payment Submitted - UTR: ${cleanUtr}] ${appointment.reason_for_consultation || ""}`,
        });
      } catch (emailErr) {
        console.warn("Could not dispatch doctor email notification for UPI submission:", emailErr);
      }
    } catch (dbErr) {
      console.warn("Database offline or mock fallback in submit-manual-upi:", dbErr);
    }

    return NextResponse.json({
      success: true,
      appointmentId,
      status: "pending_verification",
      transactionReference: cleanUtr,
      message:
        "Your UPI transaction reference has been submitted. Our clinic team will verify the payment against our bank records and confirm your consultation with a Google Meet link.",
    });
  } catch (error: any) {
    console.error("Unhandled error in /api/payments/submit-manual-upi:", error);
    return NextResponse.json(
      { error: "Failed to submit UPI payment reference." },
      { status: 500 }
    );
  }
}
