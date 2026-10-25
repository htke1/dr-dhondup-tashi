import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { send24HourReminderEmail } from "@/lib/email";
import { getNowInIST } from "@/lib/schedule";

export async function GET(request: NextRequest) {
  return handleReminders(request);
}

export async function POST(request: NextRequest) {
  return handleReminders(request);
}

async function handleReminders(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const searchParams = request.nextUrl.searchParams;
    const querySecret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    // Validate cron secret if configured
    if (cronSecret) {
      const token = authHeader?.replace(/^Bearer\s+/i, "") || querySecret;
      if (token !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
      }
    }

    // Determine target reminder date in IST (Tomorrow)
    const nowIst = getNowInIST();
    const tomorrowIst = new Date(nowIst.getTime() + 24 * 60 * 60 * 1000);
    const targetDateStr = tomorrowIst.toISOString().split("T")[0];

    let supabase;
    try {
      supabase = getAdminSupabase();
    } catch {
      return NextResponse.json({
        success: true,
        isDevelopmentMock: true,
        targetDate: targetDateStr,
        processedCount: 0,
        message: "Supabase credentials not configured in environment. In live production with credentials, queries upcoming appointments for tomorrow and dispatches 24h reminder emails.",
      });
    }

    // Query confirmed appointments for tomorrow where reminder has not been sent yet
    const { data: appointments, error: queryError } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        slot_time,
        status,
        google_meet_link,
        patients (
          name,
          email,
          phone
        )
      `)
      .eq("status", "confirmed")
      .eq("appointment_date", targetDateStr)
      .eq("reminder_sent", false);

    if (queryError) {
      console.error("[Cron Reminders] Query error:", queryError);
      return NextResponse.json(
        { error: "Database query error while checking reminders.", details: queryError.message },
        { status: 500 }
      );
    }

    const eligibleAppointments = appointments || [];
    const results: { appointmentId: string; email: string; success: boolean }[] = [];

    for (const apt of eligibleAppointments) {
      const patient = Array.isArray(apt.patients) ? apt.patients[0] : apt.patients;
      if (!patient?.email) continue;

      const emailResult = await send24HourReminderEmail({
        appointmentId: apt.id,
        patientName: patient.name || "Patient",
        patientEmail: patient.email,
        patientPhone: patient.phone || "",
        appointmentDate: apt.appointment_date,
        slotTime: apt.slot_time,
        googleMeetLink:
          apt.google_meet_link ||
          `https://meet.google.com/drt-consult-${apt.id.slice(0, 8)}`,
      });

      if (emailResult.success) {
        // Mark as sent in DB
        await supabase
          .from("appointments")
          .update({
            reminder_sent: true,
            reminder_sent_at: new Date().toISOString(),
          })
          .eq("id", apt.id);

        results.push({
          appointmentId: apt.id,
          email: patient.email,
          success: true,
        });
      } else {
        results.push({
          appointmentId: apt.id,
          email: patient.email,
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      targetDate: targetDateStr,
      processedCount: results.length,
      successfulCount: results.filter((r) => r.success).length,
      results,
    });
  } catch (error) {
    console.error("[Cron Reminders] Server error:", error);
    return NextResponse.json(
      { error: "Internal reminder processing error." },
      { status: 500 }
    );
  }
}
