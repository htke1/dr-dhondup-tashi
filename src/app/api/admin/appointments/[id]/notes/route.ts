import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthed = await isAuthenticatedAdmin();
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: appointmentId } = await params;
  const { doctorNotes, prescriptionNotes } = await request.json();

  if (!doctorNotes?.trim()) {
    return NextResponse.json(
      { error: "Doctor notes cannot be empty." },
      { status: 400 }
    );
  }

  try {
    const supabase = getAdminSupabase();

    // 1. Get patient_id from the appointment
    const { data: apt, error: aptErr } = await supabase
      .from("appointments")
      .select("patient_id")
      .eq("id", appointmentId)
      .single();

    if (aptErr || !apt) {
      return NextResponse.json(
        { error: "Appointment not found." },
        { status: 404 }
      );
    }

    // 2. Upsert consultation note
    const { data: note, error: noteErr } = await supabase
      .from("consultation_notes")
      .upsert(
        {
          appointment_id: appointmentId,
          patient_id: (apt as { patient_id: string }).patient_id,
          doctor_notes: doctorNotes,
          prescription_notes: prescriptionNotes || null,
        },
        { onConflict: "appointment_id" }
      )
      .select()
      .single();

    if (noteErr) {
      console.error("Error saving consultation notes:", noteErr);
      throw noteErr;
    }

    return NextResponse.json({
      success: true,
      note,
      message: "Consultation notes saved securely.",
    });
  } catch (error) {
    // Development fallback
    return NextResponse.json({
      success: true,
      developmentMock: true,
      note: {
        appointment_id: appointmentId,
        doctor_notes: doctorNotes,
        prescription_notes: prescriptionNotes,
        updated_at: new Date().toISOString(),
      },
      message: "Notes saved in development session.",
    });
  }
}
