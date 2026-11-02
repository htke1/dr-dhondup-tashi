import { NextRequest, NextResponse } from "next/server";
import { DAILY_SLOTS, getNowInIST, formatDateToISTString, isSameDayCutoffPassed, isMondayInIST, isSlotInPastToday, validateBookingTiming } from "@/lib/schedule";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: "Query parameter 'date' is required in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  const isMonday = isMondayInIST(dateStr);
  const timingValidation = validateBookingTiming(dateStr, "18:30");
  const todayStr = formatDateToISTString(new Date());
  const isToday = dateStr === todayStr;
  const isPast = dateStr < todayStr;
  const isCutoff = isToday && isSameDayCutoffPassed();

  // If date is Monday (weekly off) - unblocked locally
  if (isMonday) {
    const slots = DAILY_SLOTS.map((s) => ({
      slotTime: s.slotTime,
      displayTime: s.displayTime,
      available: false,
      reason: "Mondays are the doctor's weekly off day",
    }));

    return NextResponse.json({
      date: dateStr,
      isAvailable: false,
      reason: "Doctor's weekly off day (Monday)",
      slots,
    });
  }

  // If date is completely invalid (past date or all slots for today have passed)
  if (isPast || isCutoff) {
    const slots = DAILY_SLOTS.map((s) => ({
      slotTime: s.slotTime,
      displayTime: s.displayTime,
      available: false,
      reason: isPast ? "Date is in the past" : "All slots for today have passed",
    }));

    return NextResponse.json({
      date: dateStr,
      isAvailable: false,
      reason: isPast ? "Past date" : "All slots for today have passed",
      slots,
    });
  }

  // Check Supabase for blocked dates and existing active appointments
  try {
    const supabase = getAdminSupabase();

    // 1. Check if date is blocked in schedule_overrides
    const { data: override, error: overrideError } = await supabase
      .from("schedule_overrides")
      .select("is_available, reason")
      .eq("override_date", dateStr)
      .maybeSingle();

    if (overrideError) {
      console.error("Error querying schedule_overrides:", overrideError);
    }

    if (override && !override.is_available) {
      const slots = DAILY_SLOTS.map((s) => ({
        slotTime: s.slotTime,
        displayTime: s.displayTime,
        available: false,
        reason: override.reason || "Doctor unavailable on this date",
      }));

      return NextResponse.json({
        date: dateStr,
        isAvailable: false,
        reason: override.reason || "Doctor unavailable",
        slots,
      });
    }

    // 2. Query booked or held slots
    const { data: bookedAppointments, error: aptError } = await supabase
      .from("appointments")
      .select("slot_time, status, hold_expires_at")
      .eq("appointment_date", dateStr)
      .in("status", ["confirmed", "pending_payment"]);

    if (aptError) {
      console.error("Error querying appointments:", aptError);
      throw aptError;
    }

    const now = new Date().toISOString();
    const takenSlots = new Set<string>();

    bookedAppointments?.forEach((apt) => {
      if (apt.status === "confirmed") {
        takenSlots.add(apt.slot_time);
      } else if (apt.status === "pending_payment" && apt.hold_expires_at && apt.hold_expires_at > now) {
        // Slot is temporarily held pending payment
        takenSlots.add(apt.slot_time);
      }
    });

    const slots = DAILY_SLOTS.map((s) => {
      const isTaken = takenSlots.has(s.slotTime);
      const isPassedToday = isToday && isSlotInPastToday(s.slotTime);
      const available = !isTaken && !isPassedToday;
      let reason: string | undefined = undefined;
      if (isPassedToday) {
        reason = "Time slot has passed";
      } else if (isTaken) {
        reason = "Slot already booked or reserved";
      }
      return {
        slotTime: s.slotTime,
        displayTime: s.displayTime,
        available,
        reason,
      };
    });

    return NextResponse.json({
      date: dateStr,
      isAvailable: slots.some((s) => s.available),
      slots,
    });
  } catch (error) {
    // If Supabase credentials are not yet configured in local environment,
    // log clearly and return timing-validated slots with a mock note.
    console.warn("Supabase not configured or unreachable. Operating in development fallback mode.");
    
    const slots = DAILY_SLOTS.map((s) => {
      const isPassedToday = isToday && isSlotInPastToday(s.slotTime);
      return {
        slotTime: s.slotTime,
        displayTime: s.displayTime,
        available: !isPassedToday,
        reason: isPassedToday ? "Time slot has passed" : undefined,
      };
    });

    return NextResponse.json({
      date: dateStr,
      isAvailable: slots.some((s) => s.available),
      developmentNote: "Database not connected; showing default open schedule.",
      slots,
    });
  }
}
