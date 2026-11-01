import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { sendPaymentVerificationReminderEmail } from "@/lib/email";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { fallbackReminders } from "@/lib/reminder-queue";
import { APP_CONFIG } from "@/lib/config";

interface DueAppointment {
  id: string;
  appointment_date: string;
  slot_time: string;
  status: string;
  consultation_fee: number;
  payment_status: string;
  patients:
    | { name: string; email: string; phone: string }
    | { name: string; email: string; phone: string }[]
    | null;
}

interface DueReminderRecord {
  id: string;
  appointment_id: string;
  reminder_type: string;
  scheduled_for: string;
  delivery_status: "pending" | "processing" | "sent" | "failed";
  attempt_count: number;
  idempotency_key: string;
  appointments: DueAppointment | null;
}

/**
 * Validates request authorization:
 * 1. Bearer token matching CRON_SECRET or
 * 2. Header x-cron-secret matching CRON_SECRET or
 * 3. Logged-in admin session (for manual trigger from dashboard)
 */
async function isAuthorizedCronRequest(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const xCronSecret = request.headers.get("x-cron-secret");

  if (cronSecret) {
    if (authHeader && authHeader === `Bearer ${cronSecret}`) {
      return true;
    }
    if (xCronSecret && xCronSecret === cronSecret) {
      return true;
    }
  }

  // Also allow authenticated admin
  const isAuthedAdmin = await isAuthenticatedAdmin();
  if (isAuthedAdmin) {
    return true;
  }

  return false;
}

/**
 * Worker handler to process due payment verification reminders.
 * Can be called via GET (Vercel Cron) or POST (internal worker/timer/admin).
 */
async function processRemindersHandler(request: NextRequest) {
  const authorized = await isAuthorizedCronRequest(request);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Supabase client not initialized.", details: errorMsg },
      { status: 500 }
    );
  }

  const nowIso = new Date().toISOString();
  const nowEpoch = Date.now();

  const results = {
    totalDue: 0,
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // 1. Try to fetch due reminders from database table
  let dueReminders: DueReminderRecord[] = [];
  try {
    const { data, error: fetchErr } = await supabase
      .from("payment_verification_reminders")
      .select(`
        id,
        appointment_id,
        reminder_type,
        scheduled_for,
        delivery_status,
        attempt_count,
        idempotency_key,
        appointments (
          id,
          appointment_date,
          slot_time,
          status,
          consultation_fee,
          payment_status,
          patients (
            id,
            name,
            email,
            phone
          )
        )
      `)
      .lte("scheduled_for", nowIso)
      .in("delivery_status", ["pending", "failed"])
      .lt("attempt_count", 3)
      .order("scheduled_for", { ascending: true })
      .limit(25);

    if (!fetchErr && data) {
      dueReminders = data as unknown as DueReminderRecord[];
    }
  } catch {
    // Database table not yet available
  }

  // 2. Also process due reminders from in-memory fallback queue
  const dueFallback = fallbackReminders.filter(
    (r) =>
      new Date(r.scheduled_for).getTime() <= nowEpoch &&
      (r.delivery_status === "pending" || r.delivery_status === "failed") &&
      r.attempt_count < 3
  );

  results.totalDue = dueReminders.length + dueFallback.length;

  if (results.totalDue === 0) {
    return NextResponse.json({
      success: true,
      message: "No due reminders to process at this time.",
      results,
    });
  }

  // 3. Process DB reminders
  for (const reminder of dueReminders) {
    results.processed += 1;
    const nextAttemptCount = (reminder.attempt_count || 0) + 1;

    const { data: lockedRecord, error: lockErr } = await supabase
      .from("payment_verification_reminders")
      .update({
        delivery_status: "processing",
        attempt_count: nextAttemptCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reminder.id)
      .eq("delivery_status", reminder.delivery_status)
      .select()
      .maybeSingle();

    if (lockErr || !lockedRecord) {
      results.skipped += 1;
      continue;
    }

    const apt = reminder.appointments;
    if (!apt) {
      await supabase
        .from("payment_verification_reminders")
        .update({
          delivery_status: "failed",
          last_error: "Associated appointment record not found.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reminder.id);
      results.failed += 1;
      continue;
    }

    if (apt.status === "confirmed" && apt.payment_status === "paid") {
      await supabase
        .from("payment_verification_reminders")
        .update({
          delivery_status: "sent",
          sent_at: new Date().toISOString(),
          last_error: "Appointment already confirmed prior to reminder delivery.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reminder.id);
      results.skipped += 1;
      continue;
    }

    const patient = Array.isArray(apt.patients) ? apt.patients[0] : apt.patients;
    const patientName = patient?.name || "Patient";
    const bookingRef = `DT-${apt.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;

    try {
      const emailResult = await sendPaymentVerificationReminderEmail({
        appointmentId: apt.id,
        bookingRef,
        patientName,
        appointmentDate: apt.appointment_date,
        slotTime: apt.slot_time,
        consultationFee: apt.consultation_fee,
      });

      if (emailResult.success) {
        await supabase
          .from("payment_verification_reminders")
          .update({
            delivery_status: "sent",
            sent_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        results.sent += 1;
      } else {
        const errorMsg = String(emailResult.error || "Failed to dispatch email");
        const finalStatus = nextAttemptCount >= 3 ? "failed" : "pending";

        await supabase
          .from("payment_verification_reminders")
          .update({
            delivery_status: finalStatus,
            last_error: errorMsg.slice(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        results.failed += 1;
        results.errors.push(`Reminder ${reminder.id}: ${errorMsg}`);
      }
    } catch (sendErr: unknown) {
      const errorMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
      const finalStatus = nextAttemptCount >= 3 ? "failed" : "pending";

      await supabase
        .from("payment_verification_reminders")
        .update({
          delivery_status: finalStatus,
          last_error: errorMsg.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq("id", reminder.id);

      results.failed += 1;
      results.errors.push(`Reminder ${reminder.id}: ${errorMsg}`);
    }
  }

  // 4. Process fallback queue reminders
  for (const reminder of dueFallback) {
    results.processed += 1;
    reminder.delivery_status = "processing";
    reminder.attempt_count += 1;
    reminder.updated_at = new Date().toISOString();

    // Fetch appointment
    const { data: apt } = await supabase
      .from("appointments")
      .select("id, appointment_date, slot_time, status, consultation_fee, payment_status, patients(name)")
      .eq("id", reminder.appointment_id)
      .maybeSingle();

    if (apt?.status === "confirmed" && apt?.payment_status === "paid") {
      reminder.delivery_status = "sent";
      reminder.sent_at = new Date().toISOString();
      results.skipped += 1;
      continue;
    }

    const patient = Array.isArray(apt?.patients) ? apt?.patients[0] : apt?.patients;
    const patientName = patient?.name || "Patient";
    const bookingRef = `DT-${reminder.appointment_id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;

    try {
      const emailResult = await sendPaymentVerificationReminderEmail({
        appointmentId: reminder.appointment_id,
        bookingRef,
        patientName,
        appointmentDate: apt?.appointment_date || new Date().toISOString().split("T")[0],
        slotTime: apt?.slot_time || "19:00",
        consultationFee: apt?.consultation_fee || APP_CONFIG.consultationFee,
      });

      if (emailResult.success) {
        reminder.delivery_status = "sent";
        reminder.sent_at = new Date().toISOString();
        reminder.last_error = null;
        results.sent += 1;
      } else {
        reminder.delivery_status = reminder.attempt_count >= 3 ? "failed" : "pending";
        reminder.last_error = String(emailResult.error);
        results.failed += 1;
      }
    } catch (err: unknown) {
      reminder.delivery_status = reminder.attempt_count >= 3 ? "failed" : "pending";
      reminder.last_error = err instanceof Error ? err.message : String(err);
      results.failed += 1;
    }
  }

  return NextResponse.json({
    success: true,
    message: `Processed ${results.processed} reminders: ${results.sent} sent, ${results.failed} failed, ${results.skipped} skipped.`,
    results,
  });
}

export async function GET(request: NextRequest) {
  return processRemindersHandler(request);
}

export async function POST(request: NextRequest) {
  return processRemindersHandler(request);
}
