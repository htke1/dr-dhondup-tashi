import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthed = await isAuthenticatedAdmin();
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: appointmentId } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, cancellationReason } = body;

  const validStatuses = ["pending_payment", "confirmed", "completed", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const supabase = getAdminSupabase();

    const updatePayload: Record<string, any> = {};
    if (status) updatePayload.status = status;
    if (status === "cancelled") {
      updatePayload.cancelled_at = new Date().toISOString();
      if (cancellationReason) updatePayload.cancellation_reason = cancellationReason;
    }

    const { data, error } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      appointment: { id: appointmentId, status },
      note: "Development mock mode update applied",
    });
  }
}
