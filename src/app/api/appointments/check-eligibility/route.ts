import { NextRequest, NextResponse } from "next/server";
import { checkFirstConsultationEligibility } from "@/lib/patient-eligibility";
import { APP_CONFIG } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, phone, email, isFamilyHeadDiscount } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Patient name is required." },
        { status: 400 }
      );
    }

    const eligibility = await checkFirstConsultationEligibility(
      name,
      phone || "",
      email || ""
    );

    const standardFee = isFamilyHeadDiscount
      ? APP_CONFIG.familyHeadSubsidy.fee
      : APP_CONFIG.consultationFee;
    const standardFeeDisplay = isFamilyHeadDiscount
      ? APP_CONFIG.familyHeadSubsidy.feeDisplay
      : APP_CONFIG.consultationFeeDisplay;

    if (eligibility.isFirstFree) {
      return NextResponse.json({
        isFirstFree: true,
        fee: 0,
        feeDisplay: "FREE (₹0)",
        originalFee: standardFee,
        originalFeeDisplay: standardFeeDisplay,
        badgeText: APP_CONFIG.firstConsultationFree.badgeText,
        description: APP_CONFIG.firstConsultationFree.description,
        message: "You are eligible for Dr. Dhondup Tashi's complimentary introductory consultation!",
      });
    }

    return NextResponse.json({
      isFirstFree: false,
      fee: standardFee,
      feeDisplay: standardFeeDisplay,
      originalFee: standardFee,
      originalFeeDisplay: standardFeeDisplay,
      reason: eligibility.reason || "Returning patient.",
    });
  } catch (err) {
    console.error("Error in /api/appointments/check-eligibility:", err);
    return NextResponse.json(
      { error: "Failed to verify eligibility." },
      { status: 500 }
    );
  }
}
