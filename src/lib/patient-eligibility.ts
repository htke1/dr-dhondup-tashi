import { getAdminSupabase } from "@/lib/supabase/admin";
import { APP_CONFIG } from "@/lib/config";

/**
 * Normalizes patient name for smart duplicate / return-patient checking.
 * - Lowercases and trims leading/trailing spaces.
 * - Strips special punctuation (e.g. dots, commas, hyphens).
 * - Collapses consecutive whitespace into single space.
 * Example: "  Dolma   Tsering.  " -> "dolma tsering"
 */
export function normalizePatientName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Cleans phone number by extracting digits and keeping the last 10 digits
 * to reliably match domestic Indian and international prefixes (+91, 0, etc.).
 * Example: "+91 98765-43210" -> "9876543210"
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Cleans email address by lowercasing and trimming.
 */
export function cleanEmailAddress(email: string): string {
  if (!email) return "";
  return email.toLowerCase().trim();
}

export interface EligibilityResult {
  isFirstFree: boolean;
  applicableFee: number;
  reason?: string;
  matchedPatientIds: string[];
}

/**
 * Checks whether a patient is eligible for the First Free Consultation (₹0).
 *
 * Smart Composite Matching Logic:
 * A prior consultation exists if:
 * 1. Normalized Patient Name matches, AND
 * 2. EITHER Clean Phone matches OR Clean Email matches, AND
 * 3. The patient has at least one appointment with status IN ('confirmed', 'completed').
 *
 * This allows family members (e.g. adult children booking for mother Dolma and father Passang)
 * to use the same contact phone or email, while ensuring each distinct family member
 * receives their legitimate first consultation free of charge!
 */
export async function checkFirstConsultationEligibility(
  name: string,
  phone: string,
  email: string
): Promise<EligibilityResult> {
  // If first free consultation feature is disabled in config
  if (!APP_CONFIG.firstConsultationFree.enabled) {
    return {
      isFirstFree: false,
      applicableFee: APP_CONFIG.consultationFee,
      reason: "Introductory free consultation offer is currently not active.",
      matchedPatientIds: [],
    };
  }

  const normName = normalizePatientName(name);
  const cleanPhone = cleanPhoneNumber(phone);
  const cleanEmail = cleanEmailAddress(email);

  if (!normName || (!cleanPhone && !cleanEmail)) {
    return {
      isFirstFree: false,
      applicableFee: APP_CONFIG.consultationFee,
      reason: "Patient name and contact information are required.",
      matchedPatientIds: [],
    };
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch {
    // If Supabase is offline / development mock mode
    return {
      isFirstFree: true,
      applicableFee: 0,
      matchedPatientIds: [],
    };
  }

  try {
    // 1. Fetch potential candidate patient records matching email or phone
    const orFilters: string[] = [];
    if (cleanEmail) {
      orFilters.push(`email.ilike.%${cleanEmail}%`);
    }
    if (cleanPhone) {
      orFilters.push(`phone.ilike.%${cleanPhone}%`);
    }

    let candidatePatients: Array<{ id: string; name: string; email: string; phone: string }> = [];

    if (orFilters.length > 0) {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, email, phone")
        .or(orFilters.join(","));

      if (!error && data) {
        candidatePatients = data;
      }
    }

    // 2. Filter candidates where Normalized Name matches AND (phone or email matches)
    const matchedPatientIds: string[] = [];
    for (const candidate of candidatePatients) {
      const candNormName = normalizePatientName(candidate.name);
      const candPhone = cleanPhoneNumber(candidate.phone);
      const candEmail = cleanEmailAddress(candidate.email);

      const isNameMatch = candNormName === normName;
      const isContactMatch =
        (cleanPhone && candPhone && candPhone === cleanPhone) ||
        (cleanEmail && candEmail && candEmail === cleanEmail);

      if (isNameMatch && isContactMatch) {
        matchedPatientIds.push(candidate.id);
      }
    }

    // If no existing patient record matches this name + contact combination,
    // this is a brand new patient!
    if (matchedPatientIds.length === 0) {
      return {
        isFirstFree: true,
        applicableFee: 0,
        matchedPatientIds: [],
      };
    }

    // 3. Check if any matched patient has a confirmed or completed appointment
    const { count, error: countError } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("patient_id", matchedPatientIds)
      .in("status", ["confirmed", "completed"]);

    if (countError) {
      console.warn("Eligibility check query warning:", countError);
      return {
        isFirstFree: true,
        applicableFee: 0,
        matchedPatientIds,
      };
    }

    if (count && count > 0) {
      // Prior consultation found for this exact patient
      return {
        isFirstFree: false,
        applicableFee: APP_CONFIG.consultationFee,
        reason: "Prior consultation found for this patient.",
        matchedPatientIds,
      };
    }

    // Existing patient record without any confirmed/completed visits (e.g. previous cancelled attempt)
    return {
      isFirstFree: true,
      applicableFee: 0,
      matchedPatientIds,
    };
  } catch (err) {
    console.error("Eligibility check unexpected error:", err);
    return {
      isFirstFree: true,
      applicableFee: 0,
      matchedPatientIds: [],
    };
  }
}
