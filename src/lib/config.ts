/**
 * Central application configuration.
 * All business-critical settings live here so they are never scattered
 * across components.  Database-backed settings will supersede these
 * defaults in later phases.
 */

export const APP_CONFIG = {
  /** Doctor information */
  doctor: {
    name: "Dr. Dhondup Tashi",
    shortName: "Dr. Dhondup Tashi",
    title: "MBBS",
    role: "Chief Medical Officer & Primary Care Physician",
    hospital: "Gaden Jangtse Charitable Hospital, Mundgod, Karnataka",
    /** Replace with actual path once photo is provided */
    photoUrl: "/images/doctor-placeholder.jpg",
  },

  /** Application branding */
  site: {
    name: "Dr. Dhondup Tashi | Online Consultations",
    tagline: "Thoughtful medical care, wherever you are.",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },

  /** Timezone used for ALL scheduling decisions */
  timezone: "Asia/Kolkata" as const,

  /** Consultation fee in INR */
  consultationFee: 1000,
  consultationFeeINR: 1000,
  /** Human-readable fee string */
  consultationFeeDisplay: "₹1,000",

  /** Daily appointment slots (times in HH:mm, 24-hour, Asia/Kolkata) */
  slots: [
    { id: "19:00", startHHmm: "19:00", endHHmm: "19:20", label: "7:00 PM – 7:20 PM" },
    { id: "19:20", startHHmm: "19:20", endHHmm: "19:40", label: "7:20 PM – 7:40 PM" },
    { id: "19:40", startHHmm: "19:40", endHHmm: "20:00", label: "7:40 PM – 8:00 PM" },
  ],

  /** Same-day booking cutoff (HH:mm, 24-hour, Asia/Kolkata) */
  sameDayCutoffHHmm: "18:00",
  sameDayCutoffHour: 18,

  /** Maximum advance days a patient can book */
  maxBookingAdvanceDays: 14,

  /** Duration of each appointment in minutes */
  appointmentDurationMinutes: 20,

  /**
   * How long (in minutes) a temporary slot reservation is held
   * while the patient completes payment.
   */
  reservationExpiryMinutes: 15,

  /** Refund eligibility: patient must cancel at least this many hours before appointment */
  cancellationRefundHours: 48,

  /** Self-service rescheduling: patient must reschedule at least this many hours before original appointment */
  rescheduleWindowHours: 6,

  /** Maximum number of self-service reschedules per booking */
  maxReschedulesPerBooking: 1,

  /** Reminder email: sent approximately this many hours before appointment */
  reminderHoursBefore: 24,

  /** Contact information placeholders — replace before production */
  contact: {
    email: "contact@placeholder.example",
    phone: "+91 XXXXX XXXXX",
  },
} as const;

export type SlotConfig = (typeof APP_CONFIG.slots)[number];
