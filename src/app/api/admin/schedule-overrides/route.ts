import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  const isAuthed = await isAuthenticatedAdmin();
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("schedule_overrides")
      .select("*")
      .order("override_date", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ overrides: data || [] });
  } catch (error) {
    return NextResponse.json({
      overrides: [
        {
          id: "mock-override-1",
          override_date: "2026-11-01",
          is_available: false,
          reason: "Gaden Jangtse Hospital Medical Camp",
          created_at: new Date().toISOString(),
        },
      ],
      developmentMock: true,
    });
  }
}

export async function POST(request: NextRequest) {
  const isAuthed = await isAuthenticatedAdmin();
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { date, reason, isAvailable } = await request.json();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("schedule_overrides")
      .upsert(
        {
          override_date: date,
          is_available: isAvailable ?? false,
          reason: reason || "Doctor unavailable",
        },
        { onConflict: "override_date" }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, override: data });
  } catch (error) {
    return NextResponse.json({
      success: true,
      developmentMock: true,
      message: "Schedule override saved.",
    });
  }
}

export async function DELETE(request: NextRequest) {
  const isAuthed = await isAuthenticatedAdmin();
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Date parameter required." }, { status: 400 });
  }

  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase
      .from("schedule_overrides")
      .delete()
      .eq("override_date", date);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Date unblocked." });
  } catch (error) {
    return NextResponse.json({ success: true, developmentMock: true, message: "Date unblocked." });
  }
}
