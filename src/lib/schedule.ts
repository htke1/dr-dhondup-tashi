import { APP_CONFIG } from "./config";

/**
 * Get current Indian Standard Time (IST, UTC+5:30) as a Date object.
 */
export function getNowInIST(): Date {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(istString);
}

/**
 * Format a Date object to YYYY-MM-DD string in IST.
 */
export function formatDateToISTString(date: Date): string {
  const istString = date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a given date string (YYYY-MM-DD) is today in IST.
 */
export function isTodayInIST(dateStr: string): boolean {
  const todayStr = formatDateToISTString(new Date());
  return dateStr === todayStr;
}

/**
 * Check if same-day booking cutoff (6:00 PM IST) has passed for today.
 */
export function isSameDayCutoffPassed(): boolean {
  const istNow = getNowInIST();
  const hours = istNow.getHours();
  const minutes = istNow.getMinutes();
  return hours > APP_CONFIG.sameDayCutoffHour || (hours === APP_CONFIG.sameDayCutoffHour && minutes >= 0);
}

export interface SlotAvailability {
  slotTime: string;
  displayTime: string;
  available: boolean;
  reason?: string;
}

/**
 * Base slots available every day.
 */
export const DAILY_SLOTS: { slotTime: "19:00" | "19:20" | "19:40"; displayTime: string }[] = [
  { slotTime: "19:00", displayTime: "7:00 PM IST" },
  { slotTime: "19:20", displayTime: "7:20 PM IST" },
  { slotTime: "19:40", displayTime: "7:40 PM IST" },
];

/**
 * Validates whether a booking request for a given date and slot complies with business timing rules.
 */
export function validateBookingTiming(dateStr: string, slotTime: string): { valid: boolean; error?: string } {
  const istNow = getNowInIST();
  const todayStr = formatDateToISTString(new Date());

  // 1. Check if date is in the past
  if (dateStr < todayStr) {
    return { valid: false, error: "Cannot book appointments for past dates." };
  }

  // 2. Check 14-day advance limit
  const maxDate = new Date(istNow);
  maxDate.setDate(maxDate.getDate() + APP_CONFIG.maxBookingAdvanceDays);
  const maxDateStr = formatDateToISTString(maxDate);
  if (dateStr > maxDateStr) {
    return { valid: false, error: `Appointments can only be booked up to ${APP_CONFIG.maxBookingAdvanceDays} days in advance.` };
  }

  // 3. Check 6:00 PM IST same-day cutoff
  if (dateStr === todayStr && isSameDayCutoffPassed()) {
    return {
      valid: false,
      error: "Bookings for today closed at 6:00 PM IST. Please select a future date.",
    };
  }

  // 4. Validate slot time format
  const validSlot = DAILY_SLOTS.some((s) => s.slotTime === slotTime);
  if (!validSlot) {
    return { valid: false, error: "Invalid slot time selected." };
  }

  return { valid: true };
}
