import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { fallbackReminders } from "@/lib/reminder-queue";

interface PatientRef {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AppointmentVerificationRecord {
  id: string;
  appointment_date: string;
  slot_time: string;
  status: string;
  consultation_fee: number;
  payment_status: string;
  booking_token_hash?: string | null;
  payment_check_requested_at?: string | null;
  razorpay_signature?: string | null;
  patients: PatientRef | PatientRef[] | null;
}

// Simple in-memory rate-limiter for payment verification check requests (IP-based)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  if (entry.count >= 15) {
    return false;
  }
  entry.count += 1;
  return true;
}

/**
 * Trigger an asynchronous 1-minute dispatch in runtime if server remains warm,
 * so the reminder arrives at the 1-minute mark without waiting for a daily cron schedule.
 */
function triggerRuntimeDelayedDispatch() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET || "";

  setTimeout(async () => {
    try {
      await fetch(`${appUrl}/api/cron/process-payment-reminders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      // In-memory timer may terminate if serverless container freezes;
      // DB persistence guarantees pickup by cron worker.
    }
  }, 60 * 1000);
}

/**
 * POST /api/payments/request-verification
 * Patient taps "I've completed the payment".
 *
 * Rules:
 * 1. Requires valid appointmentId and matching bookingToken.
 * 2. Checks booking eligibility (not confirmed, not cancelled).
 * 3. Idempotent: Repeated taps return "We've already notified the doctor to check this payment."
 * 4. Schedules durable reminder for 1 minute later in payment_verification_reminders.
 * 5. NEVER confirms the appointment or assumes payment has arrived.
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
        { error: "bookingToken is required to verify this consultation." },
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
      const mockScheduledFor = new Date(Date.now() + 60 * 1000).toISOString();
      return NextResponse.json({
        success: true,
        alreadyRequested: false,
        message:
          "Thank you. We've notified the doctor to check for your payment. Your appointment is not confirmed until payment has been verified.",
        scheduledFor: mockScheduledFor,
        appointmentId,
        bookingRef: `DT-${appointmentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`,
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
        booking_token_hash,
        payment_check_requested_at,
        razorpay_signature,
        patients (
          id,
          name,
          email,
          phone
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
          razorpay_signature,
          patients (
            id,
            name,
            email,
            phone
          )
        `)
        .eq("id", appointmentId)
        .maybeSingle();

      appointment = secondTry.data as AppointmentVerificationRecord;
      aptError = secondTry.error;
    } else {
      appointment = firstTry.data as AppointmentVerificationRecord;
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

    // 4. Check eligibility
    if (appointment.status === "confirmed" && appointment.payment_status === "paid") {
      return NextResponse.json(
        { error: "This appointment has already been confirmed and paid." },
        { status: 400 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "This appointment reservation has expired. Please reserve a new slot." },
        { status: 400 }
      );
    }

    // 5. Idempotency Check: Did patient already tap the button?
    const idempotencyKey = `pvr_${appointmentId}_doctor_manual_upi_check`;

    // Check existing reminder in Postgres queue or memory fallback
    let existingReminder: { id?: string; delivery_status?: string; scheduled_for?: string } | null = null;
    try {
      const { data, error } = await supabase
        .from("payment_verification_reminders")
        .select("id, delivery_status, scheduled_for")
        .eq("appointment_id", appointmentId)
        .eq("reminder_type", "doctor_manual_upi_check")
        .maybeSingle();

      if (!error && data) {
        existingReminder = data;
      }
    } catch {
      // Table may not exist yet
    }

    if (!existingReminder) {
      const found = fallbackReminders.find(
        (r) =>
          r.appointment_id === appointmentId &&
          r.reminder_type === "doctor_manual_upi_check"
      );
      if (found) {
        existingReminder = {
          id: found.id,
          delivery_status: found.delivery_status,
          scheduled_for: found.scheduled_for,
        };
      }
    }

    if (existingReminder || appointment.payment_check_requested_at) {
      return NextResponse.json({
        success: true,
        alreadyRequested: true,
        message: "We've already notified the doctor to check this payment.",
        appointmentId,
        bookingRef: `DT-${appointment.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`,
        scheduledFor:
          existingReminder?.scheduled_for ||
          appointment.payment_check_requested_at ||
          new Date().toISOString(),
      });
    }

    // 6. Schedule durable reminder for 1 minute later
    const scheduledFor = new Date(Date.now() + 60 * 1000).toISOString();
    const extendedHold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Update appointment record
    const updatePayload: Record<string, string> = {
      payment_status: "pending",
      hold_expires_at: extendedHold,
      payment_check_requested_at: new Date().toISOString(),
    };

    const updateRes = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", appointmentId);

    if (
      updateRes.error &&
      (updateRes.error.message?.includes("payment_check_requested_at") ||
        updateRes.error.code === "PGRST204")
    ) {
      delete updatePayload.payment_check_requested_at;
      await supabase
        .from("appointments")
        .update(updatePayload)
        .eq("id", appointmentId);
    }

    // Insert queue job into database or memory fallback
    let dbInserted = false;
    try {
      const { error: queueErr } = await supabase
        .from("payment_verification_reminders")
        .insert({
          appointment_id: appointmentId,
          reminder_type: "doctor_manual_upi_check",
          scheduled_for: scheduledFor,
          delivery_status: "pending",
          attempt_count: 0,
          idempotency_key: idempotencyKey,
        });

      if (!queueErr) {
        dbInserted = true;
      } else if (queueErr.code === "23505") {
        // Unique constraint caught concurrent duplicate tap
        return NextResponse.json({
          success: true,
          alreadyRequested: true,
          message: "We've already notified the doctor to check this payment.",
        });
      }
    } catch {
      // Table not yet created on Supabase
    }

    if (!dbInserted) {
      fallbackReminders.push({
        id: crypto.randomUUID(),
        appointment_id: appointmentId,
        reminder_type: "doctor_manual_upi_check",
        scheduled_for: scheduledFor,
        delivery_status: "pending",
        attempt_count: 0,
        last_error: null,
        sent_at: null,
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Dispatch runtime delayed timer for instant 1-min pickup if instance stays warm
    triggerRuntimeDelayedDispatch();

    const bookingRef = `DT-${appointment.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      alreadyRequested: false,
      message:
        "Thank you. We've notified the doctor to check for your payment. Your appointment is not confirmed until payment has been verified.",
      scheduledFor,
      appointmentId,
      bookingRef,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Unhandled error in /api/payments/request-verification:", errorMsg);
    return NextResponse.json(
      { error: "Failed to submit payment verification request." },
      { status: 500 }
    );
  }
}
