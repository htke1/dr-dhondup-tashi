import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createBookingHoldSchema } from "@/lib/validations/booking";
import { validateBookingTiming } from "@/lib/schedule";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { APP_CONFIG } from "@/lib/config";
import { checkFirstConsultationEligibility } from "@/lib/patient-eligibility";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmationEmail, sendDoctorNotificationEmail } from "@/lib/email";

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
      couponCode,
    } = parseResult.data;

    const isCouponFree = couponCode?.trim().toUpperCase() === "FREECONSULTATIONFORPOOR";

    // 2. Server-side check for First Free Consultation
    const eligibility = await checkFirstConsultationEligibility(name, phone, email);
    const isFirstFree = eligibility.isFirstFree || isCouponFree;

    const consultationFee = isFirstFree
      ? 0
      : isFamilyHeadDiscount
        ? APP_CONFIG.familyHeadSubsidy.fee
        : APP_CONFIG.consultationFee;

    // 3. Server-side timing rules (6 PM cutoff, past date check, 14-day limit)
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
    } catch {
      // Supabase is not configured yet in local environment
      const mockToken = crypto.randomBytes(32).toString("hex");
      const mockId = "mock-apt-" + Date.now();
      const bookingRef = `DT-${mockId.slice(-6).toUpperCase()}`;

      if (isFirstFree) {
        const mockMeet = "https://meet.google.com/mock-clinic-call";
        return NextResponse.json(
          {
            developmentMock: true,
            isFirstFree: true,
            success: true,
            appointment: {
              id: mockId,
              appointment_date: appointmentDate,
              slot_time: slotTime,
              status: "confirmed",
              payment_status: "paid",
              consultation_fee: 0,
              google_meet_link: mockMeet,
              bookingRef,
              isFirstFree: true,
            },
            bookingRef,
            bookingToken: mockToken,
            message: "Complimentary 1st consultation confirmed (Development Mock Mode).",
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          developmentMock: true,
          message:
            "Supabase credentials not configured in .env.local. In production, this holds the slot in Postgres with a 5-minute expiration lock.",
          appointmentId: mockId,
          bookingRef,
          bookingToken: mockToken,
          appointmentDate,
          slotTime,
          consultationFee,
          isFamilyHeadDiscount: !!isFamilyHeadDiscount,
          isFirstFree: false,
        },
        { status: 200 }
      );
    }

    // 4. Check if date is blocked in schedule_overrides
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

    // 5. Smart Patient Upserting
    // Reuses patient record ONLY if Normalized Name matches AND (phone or email matches).
    // Otherwise creates a new patient record (e.g. child booking for parent).
    let patientId: string | null = null;
    if (eligibility.matchedPatientIds.length > 0) {
      patientId = eligibility.matchedPatientIds[0];
      const updateData: { email: string; age: number; phone?: string } = { email, age };
      if (phone && phone.trim()) {
        updateData.phone = phone.trim();
      }
      await supabase
        .from("patients")
        .update(updateData)
        .eq("id", patientId);
    } else {
      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert({
          name,
          email,
          phone: phone?.trim() || "",
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
    }

    // 6. Clean up any expired holds for this exact slot before checking
    const nowIso = new Date().toISOString();
    await supabase
      .from("appointments")
      .update({ status: "cancelled", cancellation_reason: "Hold expired" })
      .eq("appointment_date", appointmentDate)
      .eq("slot_time", slotTime)
      .eq("status", "pending_payment")
      .lt("hold_expires_at", nowIso);

    // 7. Check if another patient has already confirmed this slot
    const { data: conflicting } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", appointmentDate)
      .eq("slot_time", slotTime)
      .eq("status", "confirmed")
      .maybeSingle();

    if (conflicting) {
      return NextResponse.json(
        {
          error:
            "This appointment slot was just booked by another patient. Please choose a different slot.",
        },
        { status: 409 }
      );
    }

    // 8. Generate high-entropy booking token (256-bit) and SHA-256 hash for secure verification
    const bookingToken = crypto.randomBytes(32).toString("hex");
    const bookingTokenHash = crypto.createHash("sha256").update(bookingToken).digest("hex");

    // Pre-calculate appointment UUID upfront so Google Calendar invite has exact ID
    const appointmentUuid = crypto.randomUUID();
    const bookingRef = `DT-${appointmentUuid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;

    // =========================================================================
    // CASE A: 1ST FREE CONSULTATION (Immediate Confirmation - No Payment Needed)
    // =========================================================================
    if (isFirstFree) {
      let meetLink = "https://meet.google.com";
      let calendarEventId: string | null = null;

      try {
        const calResult = await createGoogleCalendarEvent({
          appointmentId: appointmentUuid,
          patientName: name,
          patientEmail: email,
          patientPhone: phone,
          patientAge: age,
          language: language || "English",
          reason: `[1st Free Consultation] ${reason || ""}`.trim(),
          date: appointmentDate,
          slotTime,
        });
        meetLink = calResult.meetLink;
        calendarEventId = calResult.eventId;
      } catch (calErr) {
        console.error("Google Calendar creation warning for free consultation:", calErr);
      }

      const couponTag = isCouponFree ? "[Coupon: FREECONSULTATIONFORPOOR (100% Free)] " : "";
      const reasonTag = isFamilyHeadDiscount
        ? `[Family Head / Father Initiative] ${couponTag}${reason || ""}`.trim()
        : `${couponTag}${isFirstFree && !isCouponFree ? "[1st Free Consultation] " : ""}${reason || ""}`.trim();

      const insertPayload: any = {
        id: appointmentUuid,
        patient_id: patientId,
        appointment_date: appointmentDate,
        slot_time: slotTime,
        status: "confirmed",
        consultation_fee: 0,
        payment_status: "paid",
        reason_for_consultation: reasonTag,
        preferred_language: language,
        hold_expires_at: null,
        google_meet_link: meetLink,
        google_calendar_event_id: calendarEventId,
        booking_token_hash: bookingTokenHash,
      };

      const { data: confirmedApt, error: insertErr } = await supabase
        .from("appointments")
        .insert(insertPayload)
        .select("id, appointment_date, slot_time, consultation_fee, status, google_meet_link")
        .single();

      if (insertErr) {
        if (insertErr.code === "23505" || insertErr.message?.includes("unique_active_appointment_slot")) {
          return NextResponse.json(
            { error: "This slot was just booked by another patient. Please choose a different slot." },
            { status: 409 }
          );
        }
        console.error("Error creating free appointment:", insertErr);
        return NextResponse.json(
          { error: "Could not confirm appointment. Please try again." },
          { status: 500 }
        );
      }

      // Dispatch confirmation email to patient & notification to doctor
      sendBookingConfirmationEmail({
        appointmentId: confirmedApt.id,
        patientName: name,
        patientEmail: email,
        patientPhone: phone,
        patientAge: age,
        preferredLanguage: language,
        reason: reasonTag,
        appointmentDate,
        slotTime,
        googleMeetLink: meetLink,
        googleCalendarEventId: calendarEventId,
        consultationFee: 0,
        isFirstFree: true,
      }).catch((e) => console.error("Email warning:", e));

      sendDoctorNotificationEmail({
        appointmentId: confirmedApt.id,
        patientName: name,
        patientEmail: email,
        patientPhone: phone,
        patientAge: age,
        preferredLanguage: language,
        reason: reasonTag,
        appointmentDate,
        slotTime,
        googleMeetLink: meetLink,
        googleCalendarEventId: calendarEventId,
        consultationFee: 0,
        isFirstFree: true,
      }).catch((e) => console.error("Doctor notification warning:", e));

      return NextResponse.json(
        {
          isFirstFree: true,
          success: true,
          appointment: {
            ...confirmedApt,
            bookingRef,
            isFirstFree: true,
          },
          bookingRef,
          message: "Complimentary 1st consultation confirmed successfully!",
        },
        { status: 200 }
      );
    }

    // =========================================================================
    // CASE B: STANDARD / RETURNING PATIENT (5-Minute Hold for UPI Payment)
    // =========================================================================
    const holdExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    let appointment: any = null;
    let aptError: any = null;

    const insertPayload: any = {
      id: appointmentUuid,
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

    return NextResponse.json(
      {
        isFirstFree: false,
        appointmentId: appointment.id,
        bookingRef,
        bookingToken,
        appointmentDate: appointment.appointment_date,
        slotTime: appointment.slot_time,
        consultationFee: appointment.consultation_fee,
        isFamilyHeadDiscount: !!isFamilyHeadDiscount,
        holdExpiresAt: appointment.hold_expires_at,
        message: "Slot held successfully for 5 minutes pending payment.",
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
