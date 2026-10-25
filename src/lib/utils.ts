import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date as a display string in Asia/Kolkata.
 */
export function formatIST(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    ...options,
  }).format(date);
}

/**
 * Format a date as "dd MMM yyyy" in IST.
 */
export function formatDateIST(date: Date): string {
  return formatIST(date, { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Format a time as "h:mm aa" in IST.
 */
export function formatTimeIST(date: Date): string {
  return formatIST(date, { hour: "numeric", minute: "2-digit", hour12: true });
}
