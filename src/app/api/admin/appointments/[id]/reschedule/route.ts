import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { updateGoogleCalendarEventTime } from "@/lib/google-calendar";
import { sendRescheduleConfirmationEmail } from "@/lib/email";

/**
 * POST /api/admin/appointments/[id]/reschedule
 * Doctor/Admin direct reschedule of an appointment.
 * Bypasses patient 6-hour and 1-time policy limits.
 * Updates Google Calendar and dispatches updated email to patient.
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
  const body = await request.json().catch(() => ({}));
  const { newDate, newSlotTime, reason } = body;

  if (!newDate || !newSlotTime) {
    return NextResponse.json(
      { error: "newDate and newSlotTime are required." },
      { status: 400 }
    );
  }

  // Handle mock appointments in dev
  if (appointmentId.startsWith("demo-") || appointmentId.startsWith("mock-")) {
    return NextResponse.json({
      success: true,
      message: "Appointment rescheduled successfully (Dev Mode).",
      appointment: {
        id: appointmentId,
        appointment_date: newDate,
        slot_time: newSlotTime,
      },
    });
  }

  try {
    const supabase = getAdminSupabase();

    // 1. Fetch current appointment
    const { data: apt, error: fetchErr } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        slot_time,
        status,
        reschedule_count,
        google_calendar_event_id,
        google_meet_link,
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

    // 2. Check if the target date is blocked
    const { data: override } = await supabase
      .from("schedule_overrides")
      .select("is_available, reason")
      .eq("override_date", newDate)
      .maybeSingle();

    if (override && !override.is_available) {
      return NextResponse.json(
        { error: `Cannot reschedule to ${newDate}: ${override.reason || "Doctor unavailable"}` },
        { status: 400 }
      );
    }

    // 3. Check for conflict in target slot
    const { data: conflicting } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", newDate)
      .eq("slot_time", newSlotTime)
      .in("status", ["confirmed", "pending_payment"])
      .neq("id", appointmentId)
      .maybeSingle();

    if (conflicting) {
      return NextResponse.json(
        { error: "The selected slot is already booked by another patient. Please choose a different slot." },
        { status: 409 }
      );
    }

    // 4. Update Google Calendar event time if present
    if (apt.google_calendar_event_id) {
      try {
        await updateGoogleCalendarEventTime(
          apt.google_calendar_event_id,
          newDate,
          newSlotTime
        );
      } catch (calErr) {
        console.error("Warning updating Google Calendar time:", calErr);
      }
    }

    // 5. Update appointment in DB
    const { data: updatedApt, error: updateErr } = await supabase
      .from("appointments")
      .update({
        appointment_date: newDate,
        slot_time: newSlotTime,
        reschedule_count: (apt.reschedule_count || 0) + 1,
      })
      .eq("id", appointmentId)
      .select(`
        id,
        appointment_date,
        slot_time,
        status,
        consultation_fee,
        payment_status,
        google_meet_link,
        patients (
          id,
          name,
          email,
          phone,
          age
        )
      `)
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update appointment: " + updateErr.message },
        { status: 500 }
      );
    }

    // 6. Record in audit table
    try {
      await supabase.from("appointment_reschedules").insert({
        appointment_id: appointmentId,
        previous_date: apt.appointment_date,
        previous_slot: apt.slot_time,
        new_date: newDate,
        new_slot: newSlotTime,
        reason: reason || "Doctor administrative reschedule",
      });
    } catch {
      // Non-fatal if table doesn't exist
    }

    // 7. Dispatch Reschedule Confirmation Email to Patient
    const patient = Array.isArray(apt.patients) ? apt.patients[0] : apt.patients;
    if (patient?.email) {
      try {
        await sendRescheduleConfirmationEmail({
          appointmentId,
          patientName: patient.name || "Patient",
          patientEmail: patient.email,
          previousDate: apt.appointment_date,
          previousSlot: apt.slot_time,
          newDate,
          newSlotTime,
          googleMeetLink: apt.google_meet_link || "https://meet.google.com",
        });
      } catch (emailErr) {
        console.error("Warning sending reschedule email to patient:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Appointment successfully rescheduled.",
      appointment: updatedApt,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Admin reschedule error:", errorMsg);
    return NextResponse.json({ error: "Internal reschedule error." }, { status: 500 });
  }
}
