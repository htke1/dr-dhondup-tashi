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
 * Format current time in IST to HH:mm string.
 */
export function getNowHHmmInIST(): string {
  const istNow = getNowInIST();
  const hours = String(istNow.getHours()).padStart(2, "0");
  const minutes = String(istNow.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Check if a slot time has already passed today in IST.
 */
export function isSlotInPastToday(slotTime: string): boolean {
  return getNowHHmmInIST() >= slotTime;
}

/**
 * Check if all daily slots have passed for today in IST.
 */
export function isSameDayCutoffPassed(): boolean {
  const lastSlot = DAILY_SLOTS[DAILY_SLOTS.length - 1].slotTime;
  return getNowHHmmInIST() >= lastSlot;
}

export interface SlotAvailability {
  slotTime: string;
  displayTime: string;
  available: boolean;
  reason?: string;
}

/**
 * Base slots available every day (6 daily slots from 6:30 PM to 8:30 PM IST).
 */
export const DAILY_SLOTS: {
  slotTime: "18:30" | "18:50" | "19:10" | "19:30" | "19:50" | "20:10";
  displayTime: string;
}[] = [
  { slotTime: "18:30", displayTime: "6:30 PM IST" },
  { slotTime: "18:50", displayTime: "6:50 PM IST" },
  { slotTime: "19:10", displayTime: "7:10 PM IST" },
  { slotTime: "19:30", displayTime: "7:30 PM IST" },
  { slotTime: "19:50", displayTime: "7:50 PM IST" },
  { slotTime: "20:10", displayTime: "8:10 PM IST" },
];

/**
 * Check if a given date string (YYYY-MM-DD) is Monday in IST (Doctor's weekly off day).
 */
export function isMondayInIST(dateStr: string): boolean {
  const date = new Date(`${dateStr}T12:00:00+05:30`);
  return date.getDay() === 1; // 1 = Monday
}

/**
 * Validates whether a booking request for a given date and slot complies with business timing rules.
 */
export function validateBookingTiming(dateStr: string, slotTime: string): { valid: boolean; error?: string } {
  const istNow = getNowInIST();
  const todayStr = formatDateToISTString(new Date());

  // 1. Check if date is Monday (weekly off day)
  if (isMondayInIST(dateStr)) {
    return { valid: false, error: "Mondays are the doctor's weekly off day. Please select another day." };
  }

  // 2. Check if date is in the past
  if (dateStr < todayStr) {
    return { valid: false, error: "Cannot book appointments for past dates." };
  }

  // 3. Check 14-day advance limit
  const maxDate = new Date(istNow);
  maxDate.setDate(maxDate.getDate() + APP_CONFIG.maxBookingAdvanceDays);
  const maxDateStr = formatDateToISTString(maxDate);
  if (dateStr > maxDateStr) {
    return { valid: false, error: `Appointments can only be booked up to ${APP_CONFIG.maxBookingAdvanceDays} days in advance.` };
  }

  // 4. Same-day booking check: allowed as long as current time is earlier than the slot start time
  if (dateStr === todayStr && isSlotInPastToday(slotTime)) {
    return {
      valid: false,
      error: "This slot time has already passed today. Please select an upcoming slot.",
    };
  }

  // 5. Validate slot time format
  const validSlot = DAILY_SLOTS.some((s) => s.slotTime === slotTime);
  if (!validSlot) {
    return { valid: false, error: "Invalid slot time selected." };
  }

  return { valid: true };
}
