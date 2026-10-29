import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";

/**
 * POST /api/admin/appointments/[id]/sync-calendar
 * Generates or synchronizes a Google Meet link and Google Calendar invitation
 * for Dr. Dhondup Tashi (dhontash@gmail.com) and the patient.
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
        reason_for_consultation,
        preferred_language,
        google_meet_link,
        google_calendar_event_id,
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

    const calResult = await createGoogleCalendarEvent({
      appointmentId,
      patientName,
      patientEmail,
      patientPhone,
      patientAge,
      language,
      reason,
      date: apt.appointment_date,
      slotTime: apt.slot_time,
    });

    // Update appointment record with Google Meet link and Google Calendar event ID
    const { error: updateErr } = await supabase
      .from("appointments")
      .update({
        google_meet_link: calResult.meetLink,
        google_calendar_event_id: calResult.eventId,
      })
      .eq("id", appointmentId);

    if (updateErr) {
      console.warn("Could not save calendar event details to DB:", updateErr.message);
    }

    return NextResponse.json({
      success: true,
      meetLink: calResult.meetLink,
      calendarEventId: calResult.eventId,
      calendarUrl: calResult.calendarUrl,
      isMock: calResult.isMock,
      message: "Google Meet session generated and Google Calendar invitation dispatched to dhontash@gmail.com",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Sync calendar endpoint error:", errorMsg);
    return NextResponse.json(
      { error: errorMsg || "Failed to sync Google Calendar event." },
      { status: 500 }
    );
  }
}
