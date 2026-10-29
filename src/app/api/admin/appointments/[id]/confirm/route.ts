import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmationEmail, sendDoctorNotificationEmail } from "@/lib/email";

/**
 * POST /api/admin/appointments/[id]/confirm
 * Doctor/Admin manual confirmation of a verified UPI consultation payment.
 * Generates Google Meet link and dispatches patient confirmation email.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthed = await isAuthenticatedAdmin();
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: appointmentId } = await params;

  try {
    const supabase = getAdminSupabase();

    const { data: apt, error: fetchErr } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        slot_time,
        status,
        consultation_fee,
        payment_status,
        reason_for_consultation,
        preferred_language,
        razorpay_payment_id,
        patients (
          id,
          name,
          email,
          phone,
          age
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchErr || !apt) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    const patient = Array.isArray(apt.patients) ? apt.patients[0] : apt.patients;
    const patientName = patient?.name || "Patient";
    const patientEmail = patient?.email || "";
    const patientPhone = patient?.phone || "";
    const patientAge = patient?.age;
    const language = apt.preferred_language || "English";
    const reason = apt.reason_for_consultation || "";
    const appointmentDate = apt.appointment_date;
    const slotTime = apt.slot_time;

    // 1. Check for slot conflict if reconciling an expired or cancelled reservation
    const { data: conflicting } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", appointmentDate)
      .eq("slot_time", slotTime)
      .eq("status", "confirmed")
      .neq("id", appointmentId)
      .maybeSingle();

    if (conflicting) {
      return NextResponse.json(
        {
          error:
            "Another consultation is already confirmed for this exact slot. Please coordinate with the patient to reschedule to an open slot before reconciling payment.",
        },
        { status: 409 }
      );
    }

    // 2. Create Google Meet room and calendar invite
    let meetLink = "https://meet.google.com";
    let calendarEventId: string | null = null;

    try {
      const calResult = await createGoogleCalendarEvent({
        appointmentId,
        patientName,
        patientEmail,
        patientPhone,
        patientAge,
        language,
        reason,
        date: appointmentDate,
        slotTime,
      });
      meetLink = calResult.meetLink;
      calendarEventId = calResult.eventId;
    } catch (calErr) {
      console.error("Google Calendar creation warning:", calErr);
    }

    // 3. Mark appointment as confirmed and paid (reconciling if reservation had expired)
    const { data: updatedApt, error: updateErr } = await supabase
      .from("appointments")
      .update({
        status: "confirmed",
        payment_status: "paid",
        cancellation_reason: null,
        google_meet_link: meetLink,
        google_calendar_event_id: calendarEventId,
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 3. Send confirmation email with Google Meet link to patient
    if (patientEmail) {
      try {
        await sendBookingConfirmationEmail({
          appointmentId,
          patientName,
          patientEmail,
          patientPhone: patientPhone || "",
          appointmentDate,
          slotTime,
          googleMeetLink: meetLink,
          preferredLanguage: language,
        });
      } catch (emailErr) {
        console.error("Error sending patient confirmation email:", emailErr);
      }
    }

    // 4. Notify doctor
    try {
      await sendDoctorNotificationEmail({
        appointmentId,
        patientName,
        patientEmail,
        patientPhone: patientPhone || "",
        appointmentDate,
        slotTime,
        googleMeetLink: meetLink,
        reason,
      });
    } catch (docEmailErr) {
      console.warn("Error sending doctor notification email:", docEmailErr);
    }

    return NextResponse.json({
      success: true,
      appointment: updatedApt,
      meetLink,
      message: "Consultation confirmed successfully. Google Meet link dispatched to patient.",
    });
  } catch (err: any) {
    console.error("Admin confirm error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to confirm appointment." },
      { status: 500 }
    );
  }
}
