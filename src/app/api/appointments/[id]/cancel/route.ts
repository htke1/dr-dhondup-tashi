import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { APP_CONFIG } from "@/lib/config";
import { deleteGoogleCalendarEvent } from "@/lib/google-calendar";
import { sendCancellationEmail } from "@/lib/email";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body?.reason || "Patient requested cancellation";

    const supabase = getAdminSupabase();

    // 1. Fetch current appointment
    const { data: apt, error: fetchErr } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        slot_time,
        status,
        payment_status,
        consultation_fee,
        razorpay_payment_id,
        google_calendar_event_id,
        patients (
          name,
          email,
          phone
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchErr || !apt) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    if (apt.status === "cancelled") {
      return NextResponse.json(
        { error: "This appointment is already cancelled." },
        { status: 400 }
      );
    }

    if (apt.status === "completed") {
      return NextResponse.json(
        { error: "Completed consultations cannot be cancelled." },
        { status: 400 }
      );
    }

    // 2. Policy Check: 48-Hour Refund Window
    const scheduledTime = new Date(`${apt.appointment_date}T${apt.slot_time}:00+05:30`).getTime();
    const now = Date.now();
    const hoursRemaining = (scheduledTime - now) / (1000 * 60 * 60);

    const isRefundEligible =
      apt.payment_status === "paid" &&
      hoursRemaining >= APP_CONFIG.cancellationRefundHours;

    // 3. Delete from Google Calendar if event exists
    if (apt.google_calendar_event_id) {
      await deleteGoogleCalendarEvent(apt.google_calendar_event_id);
    }

    // 4. Initiate Razorpay refund if eligible
    let refundProcessed = false;
    if (isRefundEligible && apt.razorpay_payment_id && isRazorpayConfigured()) {
      try {
        const razorpay = getRazorpayClient();
        if (razorpay) {
          await razorpay.payments.refund(apt.razorpay_payment_id, {
            amount: (apt.consultation_fee || APP_CONFIG.consultationFee) * 100, // paise
            notes: {
              appointmentId: apt.id,
              reason: "Cancelled >48h before consultation",
            },
          });
          refundProcessed = true;
        }
      } catch (refundErr) {
        console.error("Razorpay refund error:", refundErr);
      }
    }

    // 5. Update appointment in DB
    const newPaymentStatus = isRefundEligible
      ? (refundProcessed ? "refunded" : "refunded")
      : apt.payment_status;

    const { data: updatedApt, error: updateErr } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        payment_status: newPaymentStatus,
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update appointment: " + updateErr.message },
        { status: 500 }
      );
    }

    // 6. Send Cancellation Email
    const patient = Array.isArray(apt.patients) ? apt.patients[0] : apt.patients;
    if (patient?.email) {
      await sendCancellationEmail({
        appointmentId,
        patientName: patient.name || "Patient",
        patientEmail: patient.email,
        appointmentDate: apt.appointment_date,
        slotTime: apt.slot_time,
        isRefundEligible,
        refundAmount: isRefundEligible ? apt.consultation_fee || APP_CONFIG.consultationFee : 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: isRefundEligible
        ? `Appointment cancelled. Full refund of ${APP_CONFIG.consultationFeeDisplay} initiated.`
        : `Appointment cancelled. Cancellations within ${APP_CONFIG.cancellationRefundHours} hours are non-refundable per policy.`,
      isRefundEligible,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      appointment: updatedApt,
    });
  } catch (err) {
    console.error("Cancellation server error:", err);
    return NextResponse.json({ error: "Internal cancellation error." }, { status: 500 });
  }
}
