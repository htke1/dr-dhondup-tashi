import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmationEmail, sendDoctorNotificationEmail } from "@/lib/email";

interface PatientRef {
  id: string;
  name: string;
  email: string;
  phone: string;
  age?: number;
}

interface AppointmentVerificationRecord {
  id: string;
  appointment_date: string;
  slot_time: string;
  status: string;
  consultation_fee: number;
  payment_status: string;
  reason_for_consultation?: string | null;
  preferred_language?: string | null;
  google_meet_link?: string | null;
  google_calendar_event_id?: string | null;
  booking_token_hash?: string | null;
  razorpay_signature?: string | null;
  patients: PatientRef | PatientRef[] | null;
}

// Simple in-memory rate-limiter for payment confirmation check requests (IP-based)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  if (entry.count >= 20) {
    return false;
  }
  entry.count += 1;
  return true;
}

/**
 * POST /api/payments/request-verification
 * Patient taps "I've completed payment".
 *
 * Direct Instant Confirmation:
 * 1. Validates appointmentId and matching bookingToken.
 * 2. Immediately sets status="confirmed" and payment_status="paid".
 * 3. Generates Google Meet consultation link & calendar invite.
 * 4. Dispatches confirmation email to patient with Meet link & receipt.
 * 5. Dispatches new appointment notification email to doctor.
 * 6. Returns confirmed appointment so patient is immediately shown StepConfirmed!
 */
export async function POST(request: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { appointmentId, bookingToken } = body;

    if (!appointmentId || typeof appointmentId !== "string") {
      return NextResponse.json(
        { error: "appointmentId is required." },
        { status: 400 }
      );
    }

    if (!bookingToken || typeof bookingToken !== "string") {
      return NextResponse.json(
        { error: "bookingToken is required to complete this consultation." },
        { status: 401 }
      );
    }

    // Hash provided token for comparison
    const providedTokenHash = crypto
      .createHash("sha256")
      .update(bookingToken)
      .digest("hex");

    let supabase;
    try {
      supabase = getAdminSupabase();
    } catch {
      // Development mock mode fallback when Supabase is offline
      const mockMeet = "https://meet.google.com/mock-clinic-call";
      const bookingRef = `DT-${appointmentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;
      return NextResponse.json({
        success: true,
        message: "Payment completed and booking confirmed!",
        appointment: {
          id: appointmentId,
          appointment_date: "2026-11-05",
          slot_time: "19:00",
          status: "confirmed",
          payment_status: "paid",
          google_meet_link: mockMeet,
          consultation_fee: 800,
          bookingRef,
        },
      });
    }

    // 2. Fetch appointment details with resilient schema fallback
    let appointment: AppointmentVerificationRecord | null = null;
    let aptError: Error | { message?: string; code?: string } | null = null;

    const firstTry = await supabase
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
        google_meet_link,
        google_calendar_event_id,
        booking_token_hash,
        razorpay_signature,
        patients (
          id,
          name,
          email,
          phone,
          age
        )
      `)
      .eq("id", appointmentId)
      .maybeSingle();

    if (
      firstTry.error &&
      (firstTry.error.message?.includes("booking_token_hash") ||
        firstTry.error.code === "PGRST204")
    ) {
      // Fallback query without new columns if migration 02 not yet applied on remote DB
      const secondTry = await supabase
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
          google_meet_link,
          google_calendar_event_id,
          razorpay_signature,
          patients (
            id,
            name,
            email,
            phone,
            age
          )
        `)
        .eq("id", appointmentId)
        .maybeSingle();

      appointment = secondTry.data as unknown as AppointmentVerificationRecord;
      aptError = secondTry.error;
    } else {
      appointment = firstTry.data as unknown as AppointmentVerificationRecord;
      aptError = firstTry.error;
    }

    if (aptError || !appointment) {
      return NextResponse.json(
        { error: "Booking reservation not found." },
        { status: 404 }
      );
    }

    // 3. Verify high-entropy booking token ownership
    const storedHash =
      appointment.booking_token_hash ||
      (appointment.razorpay_signature?.startsWith("BTH:")
        ? appointment.razorpay_signature.slice(4)
        : null);

    if (storedHash) {
      const isMatch =
        storedHash.length === providedTokenHash.length &&
        crypto.timingSafeEqual(
          Buffer.from(storedHash),
          Buffer.from(providedTokenHash)
        );

      if (!isMatch) {
        return NextResponse.json(
          { error: "Unauthorized booking token." },
          { status: 403 }
        );
      }
    }

    const patient = Array.isArray(appointment.patients)
      ? appointment.patients[0]
      : appointment.patients;
    const patientName = patient?.name || "Patient";
    const patientEmail = patient?.email || "";
    const patientPhone = patient?.phone || "";
    const patientAge = patient?.age;
    const language = appointment.preferred_language || "English";
    const reason = appointment.reason_for_consultation || "";
    const bookingRef = `DT-${appointment.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;

    // 4. Idempotency Check: Already confirmed
    if (appointment.status === "confirmed" && appointment.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Your appointment is already confirmed!",
        appointment: {
          ...appointment,
          bookingRef,
        },
      });
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "This reservation has expired or was cancelled. Please select an available slot to book." },
        { status: 400 }
      );
    }

    // 5. Check if another patient somehow booked this exact slot in parallel
    const { data: conflicting } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", appointment.appointment_date)
      .eq("slot_time", appointment.slot_time)
      .eq("status", "confirmed")
      .neq("id", appointmentId)
      .maybeSingle();

    if (conflicting) {
      return NextResponse.json(
        {
          error:
            "This consultation slot has just been confirmed for another patient. Please choose another open slot.",
        },
        { status: 409 }
      );
    }

    // 6. Generate Google Meet Link and Calendar Invitation
    let meetLink = appointment.google_meet_link || "https://meet.google.com";
    let calendarEventId: string | null = appointment.google_calendar_event_id || null;

    try {
      const calResult = await createGoogleCalendarEvent({
        appointmentId,
        patientName,
        patientEmail,
        patientPhone,
        patientAge,
        language,
        reason,
        date: appointment.appointment_date,
        slotTime: appointment.slot_time,
      });
      meetLink = calResult.meetLink;
      calendarEventId = calResult.eventId;
    } catch (calErr) {
      console.error("Google Calendar creation warning in instant confirm:", calErr);
    }

    // 7. Update appointment to confirmed and paid
    const { data: updatedApt, error: updateErr } = await supabase
      .from("appointments")
      .update({
        status: "confirmed",
        payment_status: "paid",
        hold_expires_at: null,
        cancellation_reason: null,
        google_meet_link: meetLink,
        google_calendar_event_id: calendarEventId,
      })
      .eq("id", appointmentId)
      .select(`
        id,
        appointment_date,
        slot_time,
        status,
        payment_status,
        consultation_fee,
        google_meet_link,
        google_calendar_event_id,
        preferred_language,
        reason_for_consultation,
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
      console.error("Error updating appointment to confirmed:", updateErr);
      return NextResponse.json(
        { error: "Could not confirm appointment: " + updateErr.message },
        { status: 500 }
      );
    }

    // 8. Send Confirmation Email to Patient
    if (patientEmail) {
      try {
        await sendBookingConfirmationEmail({
          appointmentId,
          patientName,
          patientEmail,
          patientPhone,
          appointmentDate: appointment.appointment_date,
          slotTime: appointment.slot_time,
          googleMeetLink: meetLink,
          preferredLanguage: language,
        });
      } catch (emailErr) {
        console.error("Error sending patient confirmation email:", emailErr);
      }
    }

    // 9. Send Notification Email to Doctor
    try {
      await sendDoctorNotificationEmail({
        appointmentId,
        patientName,
        patientEmail,
        patientPhone,
        patientAge,
        preferredLanguage: language,
        reason,
        appointmentDate: appointment.appointment_date,
        slotTime: appointment.slot_time,
        googleMeetLink: meetLink,
      });
    } catch (docEmailErr) {
      console.error("Error sending doctor notification email:", docEmailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Consultation booked and confirmed successfully!",
      appointment: {
        ...(updatedApt || appointment),
        bookingRef,
        google_meet_link: meetLink,
        status: "confirmed",
        payment_status: "paid",
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Unhandled error in payment completion:", errorMsg);
    return NextResponse.json(
      { error: "Internal server error completing booking." },
      { status: 500 }
    );
  }
}
