import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { sendPrescriptionNoteEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthed = await isAuthenticatedAdmin();
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: appointmentId } = await params;
  const { doctorNotes, prescriptionNotes, patientEmail, patientName } = await request.json();

  if (!doctorNotes?.trim()) {
    return NextResponse.json(
      { error: "Doctor notes cannot be empty before sending." },
      { status: 400 }
    );
  }

  try {
    let resolvedEmail = patientEmail;
    let resolvedName = patientName;
    let appointmentDate = new Date().toISOString().split("T")[0];
    let patientAge: string | number | undefined;
    let patientPhone: string | undefined;

    try {
      const supabase = getAdminSupabase();
      const { data: apt } = await supabase
        .from("appointments")
        .select(`
          appointment_date,
          patients (
            name,
            email,
            phone,
            age
          )
        `)
        .eq("id", appointmentId)
        .single();

      if (apt) {
        appointmentDate = apt.appointment_date || appointmentDate;
        const p = apt.patients as any;
        if (p) {
          resolvedEmail = resolvedEmail || p.email;
          resolvedName = resolvedName || p.name;
          patientPhone = p.phone;
          patientAge = p.age;
        }
      }
    } catch (dbErr) {
      console.warn("DB lookup warning during send-notes:", dbErr);
    }

    if (!resolvedEmail) {
      return NextResponse.json(
        { error: "Patient email address is missing or unavailable." },
        { status: 400 }
      );
    }

    // Send styled prescription note with doctor signature and KMC number
    const emailResult = await sendPrescriptionNoteEmail({
      appointmentId,
      patientName: resolvedName || "Patient",
      patientEmail: resolvedEmail,
      patientAge,
      patientPhone,
      appointmentDate,
      doctorNotes,
      prescriptionNotes,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Prescription note successfully sent to ${resolvedEmail}.`,
      sentTo: resolvedEmail,
    });
  } catch (error: any) {
    console.error("Error in send-notes endpoint:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred while sending note." },
      { status: 500 }
    );
  }
}

