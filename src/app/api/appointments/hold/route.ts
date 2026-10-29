import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createBookingHoldSchema } from "@/lib/validations/booking";
import { validateBookingTiming } from "@/lib/schedule";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { APP_CONFIG } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Zod input validation
    const parseResult = createBookingHoldSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      age,
      reason,
      language,
      isFamilyHeadDiscount,
      appointmentDate,
      slotTime,
    } = parseResult.data;

    const consultationFee = isFamilyHeadDiscount
      ? APP_CONFIG.familyHeadSubsidy.fee
      : APP_CONFIG.consultationFee;

    // 2. Server-side timing rules (6 PM cutoff, past date check, 14-day limit)
    const timingCheck = validateBookingTiming(appointmentDate, slotTime);
    if (!timingCheck.valid) {
      return NextResponse.json(
        { error: timingCheck.error || "Selected slot is not valid." },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = getAdminSupabase();
    } catch (e) {
      // Supabase is not configured yet in local environment
      const mockToken = crypto.randomBytes(32).toString("hex");
      const mockId = "mock-apt-" + Date.now();
      return NextResponse.json(
        {
          developmentMock: true,
          message:
            "Supabase credentials not configured in .env.local. In production, this holds the slot in Postgres with a 15-minute expiration lock.",
          appointmentId: mockId,
          bookingRef: `DT-${mockId.slice(-6).toUpperCase()}`,
          bookingToken: mockToken,
          appointmentDate,
          slotTime,
          consultationFee,
          isFamilyHeadDiscount: !!isFamilyHeadDiscount,
        },
        { status: 200 }
      );
    }

    // 3. Check if date is blocked in schedule_overrides
    const { data: override } = await supabase
      .from("schedule_overrides")
      .select("is_available, reason")
      .eq("override_date", appointmentDate)
      .maybeSingle();

    if (override && !override.is_available) {
      return NextResponse.json(
        { error: override.reason || "The doctor is unavailable on this date." },
        { status: 400 }
      );
    }

    // 4. Upsert patient record
    // Look up by email first
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let patientId = existingPatient?.id;

    if (!patientId) {
      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert({
          name,
          email,
          phone,
          age,
        })
        .select("id")
        .single();

      if (patientError || !newPatient) {
        console.error("Error creating patient:", patientError);
        return NextResponse.json(
          { error: "Failed to record patient information." },
          { status: 500 }
        );
      }
      patientId = newPatient.id;
    } else {
      // Update phone, name, age if changed
      await supabase
        .from("patients")
        .update({ name, phone, age })
        .eq("id", patientId);
    }

    // 5. Clean up any expired holds for this exact slot before checking
    const nowIso = new Date().toISOString();
    await supabase
      .from("appointments")
      .update({ status: "cancelled", cancellation_reason: "Hold expired" })
      .eq("appointment_date", appointmentDate)
      .eq("slot_time", slotTime)
      .eq("status", "pending_payment")
      .lt("hold_expires_at", nowIso);

    // 6. Generate high-entropy booking token (256-bit) and SHA-256 hash for secure verification
    const bookingToken = crypto.randomBytes(32).toString("hex");
    const bookingTokenHash = crypto.createHash("sha256").update(bookingToken).digest("hex");

    // 15-minute hold for user to complete payment
    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    let appointment: any = null;
    let aptError: any = null;

    // Attempt insert with booking_token_hash first
    const insertPayload: any = {
      patient_id: patientId,
      appointment_date: appointmentDate,
      slot_time: slotTime,
      status: "pending_payment",
      consultation_fee: consultationFee,
      payment_status: "pending",
      reason_for_consultation: isFamilyHeadDiscount
        ? `[Family Head / Father Initiative] ${reason || ""}`.trim()
        : (reason || null),
      preferred_language: language,
      hold_expires_at: holdExpiresAt,
      booking_token_hash: bookingTokenHash,
    };

    const firstTry = await supabase
      .from("appointments")
      .insert(insertPayload)
      .select("id, appointment_date, slot_time, consultation_fee, status, hold_expires_at")
      .single();

    if (firstTry.error && (firstTry.error.message?.includes("booking_token_hash") || firstTry.error.code === "PGRST204")) {
      // Graceful fallback if database migration 02 hasn't been executed on remote Supabase yet
      delete insertPayload.booking_token_hash;
      insertPayload.razorpay_signature = `BTH:${bookingTokenHash}`;
      const secondTry = await supabase
        .from("appointments")
        .insert(insertPayload)
        .select("id, appointment_date, slot_time, consultation_fee, status, hold_expires_at")
        .single();
      appointment = secondTry.data;
      aptError = secondTry.error;
    } else {
      appointment = firstTry.data;
      aptError = firstTry.error;
    }

    if (aptError) {
      // Postgres error code 23505 indicates unique constraint violation (slot already booked/held)
      if (aptError.code === "23505" || aptError.message?.includes("unique_active_appointment_slot")) {
        return NextResponse.json(
          {
            error:
              "This appointment slot was just reserved or booked by another patient. Please choose a different slot.",
          },
          { status: 409 }
        );
      }

      console.error("Error inserting appointment:", aptError);
      return NextResponse.json(
        { error: "Could not reserve slot. Please try again." },
        { status: 500 }
      );
    }

    const bookingRef = `DT-${appointment.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;

    return NextResponse.json(
      {
        appointmentId: appointment.id,
        bookingRef,
        bookingToken,
        appointmentDate: appointment.appointment_date,
        slotTime: appointment.slot_time,
        consultationFee: appointment.consultation_fee,
        isFamilyHeadDiscount: !!isFamilyHeadDiscount,
        holdExpiresAt: appointment.hold_expires_at,
        message: "Slot held successfully for 15 minutes pending payment.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unhandled error in /api/appointments/hold:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
