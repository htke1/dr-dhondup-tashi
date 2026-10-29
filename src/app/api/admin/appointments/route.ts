import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const isAuthed = await isAuthenticatedAdmin();
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const dateFilter = searchParams.get("date");

  try {
    const supabase = getAdminSupabase();

    let query = supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        slot_time,
        status,
        consultation_fee,
        payment_status,
        payment_check_requested_at,
        hold_expires_at,
        razorpay_payment_id,
        razorpay_order_id,
        google_meet_link,
        reason_for_consultation,
        preferred_language,
        created_at,
        patients (
          id,
          name,
          email,
          phone,
          age
        ),
        consultation_notes (
          id,
          doctor_notes,
          prescription_notes,
          updated_at
        )
      `)
      .order("appointment_date", { ascending: true })
      .order("slot_time", { ascending: true });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (dateFilter) {
      query = query.eq("appointment_date", dateFilter);
    }

    const { data: appointments, error } = await query;
    if (error) {
      console.error("Failed to query appointments:", error);
      throw error;
    }

    let appointmentsWithReminders = appointments || [];
    if (appointmentsWithReminders.length > 0) {
      try {
        const aptIds = appointmentsWithReminders.map((a: any) => a.id);
        const { data: reminders } = await supabase
          .from("payment_verification_reminders")
          .select("id, appointment_id, reminder_type, scheduled_for, delivery_status, attempt_count, last_error, sent_at")
          .in("appointment_id", aptIds);

        if (reminders && reminders.length > 0) {
          const reminderMap = new Map();
          for (const r of reminders) {
            reminderMap.set(r.appointment_id, r);
          }
          appointmentsWithReminders = appointmentsWithReminders.map((apt: any) => ({
            ...apt,
            payment_verification_reminder: reminderMap.get(apt.id) || null,
          }));
        }
      } catch (reminderFetchErr) {
        console.warn("Could not fetch payment verification reminders:", reminderFetchErr);
      }
    }

    return NextResponse.json({ appointments: appointmentsWithReminders });
  } catch (error) {
    // Development fallback mock data for testing before Supabase connection
    const mockAppointments = [
      {
        id: "demo-apt-1",
        appointment_date: "2026-10-25",
        slot_time: "19:00",
        status: "confirmed",
        consultation_fee: 1000,
        payment_status: "paid",
        google_meet_link: "https://meet.google.com/abc-defg-hij",
        reason_for_consultation: "Persistent tension headache and cervical stiffness for 2 weeks",
        preferred_language: "English",
        created_at: new Date().toISOString(),
        patients: {
          id: "demo-patient-1",
          name: "Tenzin Wangdu",
          email: "tenzin.w@example.com",
          phone: "+91 98451 23456",
          age: 42,
        },
        consultation_notes: null,
      },
      {
        id: "demo-apt-2",
        appointment_date: "2026-10-25",
        slot_time: "19:20",
        status: "confirmed",
        consultation_fee: 1000,
        payment_status: "paid",
        google_meet_link: "https://meet.google.com/xyz-uvwx-rst",
        reason_for_consultation: "Type 2 diabetes quarterly review, fasting blood sugar 142",
        preferred_language: "Tibetan",
        created_at: new Date().toISOString(),
        patients: {
          id: "demo-patient-2",
          name: "Dolma Tsering",
          email: "dolma.t@example.com",
          phone: "+91 94802 78901",
          age: 58,
        },
        consultation_notes: {
          id: "demo-note-1",
          doctor_notes: "Patient well-controlled on Metformin 500mg BD. Advised lipid panel and HbA1c test next week.",
          prescription_notes: "Tab Metformin 500mg 1-0-1 after food for 90 days.",
          updated_at: new Date().toISOString(),
        },
      },
      {
        id: "demo-apt-3",
        appointment_date: "2026-10-26",
        slot_time: "19:00",
        status: "pending_payment",
        consultation_fee: 1000,
        payment_status: "pending",
        google_meet_link: null,
        reason_for_consultation: "Follow up on seasonal allergic rhinitis",
        preferred_language: "English",
        created_at: new Date().toISOString(),
        patients: {
          id: "demo-patient-3",
          name: "Karma Lodoe",
          email: "karma.l@example.com",
          phone: "+91 98863 45678",
          age: 29,
        },
        consultation_notes: null,
      },
    ];

    return NextResponse.json({
      appointments: mockAppointments,
      isDevelopmentMock: true,
      note: "Displaying demonstration appointments until live Supabase credentials are configured.",
    });
  }
}
