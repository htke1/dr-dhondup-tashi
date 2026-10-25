import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { APP_CONFIG } from "@/lib/config";
import { validateBookingTiming } from "@/lib/schedule";
import { updateGoogleCalendarEventTime } from "@/lib/google-calendar";
import { sendRescheduleConfirmationEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    const body = await request.json();
    const { newDate, newSlotTime, reason } = body;

    if (!newDate || !newSlotTime) {
      return NextResponse.json(
        { error: "newDate and newSlotTime are required." },
        { status: 400 }
      );
    }

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

    if (apt.status !== "confirmed") {
      return NextResponse.json(
        { error: `Cannot reschedule appointment with status '${apt.status}'. Only confirmed appointments can be rescheduled.` },
        { status: 400 }
      );
    }

    // 2. Policy Check: Maximum 1 reschedule
    if ((apt.reschedule_count || 0) >= APP_CONFIG.maxReschedulesPerBooking) {
      return NextResponse.json(
        { error: `This appointment has already been rescheduled once. Further reschedules are not permitted per clinic policy.` },
        { status: 400 }
      );
    }

    // 3. Policy Check: 6-Hour Reschedule Window
    const scheduledTime = new Date(`${apt.appointment_date}T${apt.slot_time}:00+05:30`).getTime();
    const now = Date.now();
    const hoursRemaining = (scheduledTime - now) / (1000 * 60 * 60);

    if (hoursRemaining < APP_CONFIG.rescheduleWindowHours) {
      return NextResponse.json(
        {
          error: `Rescheduling must be requested at least ${APP_CONFIG.rescheduleWindowHours} hours before the appointment. Time remaining: ${hoursRemaining.toFixed(1)} hours.`,
        },
        { status: 400 }
      );
    }

    // 4. Policy Check: Target slot timing validation
    const timingValidation = validateBookingTiming(newDate, newSlotTime);
    if (!timingValidation.valid) {
      return NextResponse.json(
        { error: timingValidation.error || "The selected new slot is not available." },
        { status: 400 }
      );
    }

    // 5. Check if new slot is blocked or already booked
    const { data: existingActive } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", newDate)
      .eq("slot_time", newSlotTime)
      .in("status", ["pending_payment", "confirmed"])
      .maybeSingle();

    if (existingActive) {
      return NextResponse.json(
        { error: "The requested new slot is already booked. Please choose a different time." },
        { status: 409 }
      );
    }

    // 6. Update Google Calendar Event if active
    if (apt.google_calendar_event_id) {
      await updateGoogleCalendarEventTime(
        apt.google_calendar_event_id,
        newDate,
        newSlotTime
      );
    }

    // 7. Update appointment in DB
    const { data: updatedApt, error: updateErr } = await supabase
      .from("appointments")
      .update({
        appointment_date: newDate,
        slot_time: newSlotTime,
        reschedule_count: (apt.reschedule_count || 0) + 1,
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

    // 8. Record in audit table
    await supabase.from("appointment_reschedules").insert({
      appointment_id: appointmentId,
      previous_date: apt.appointment_date,
      previous_slot: apt.slot_time,
      new_date: newDate,
      new_slot: newSlotTime,
      reason: reason || "Patient requested reschedule",
    });

    // 9. Send Reschedule Confirmation Email
    const patient = Array.isArray(apt.patients) ? apt.patients[0] : apt.patients;
    if (patient?.email) {
      await sendRescheduleConfirmationEmail({
        appointmentId,
        patientName: patient.name || "Patient",
        patientEmail: patient.email,
        previousDate: apt.appointment_date,
        previousSlot: apt.slot_time,
        newDate,
        newSlotTime,
        googleMeetLink: apt.google_meet_link || "",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Appointment successfully rescheduled.",
      appointment: updatedApt,
    });
  } catch (err) {
    console.error("Reschedule server error:", err);
    return NextResponse.json({ error: "Internal reschedule error." }, { status: 500 });
  }
}
