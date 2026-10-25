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
    title: "MBBS, M.Med (Family Medicine)",
    role: "General Physician | Clinical Sonologist | Chief Medical Officer | Community Health Advocate",
    experience: "21+ Years Clinical Experience",
    hospital: "Gaden Jangtse Hospital, Mundgod, Karnataka, India",
    photoUrl: "/images/HomePagePicture.jpeg",
    aboutPhotoUrl: "/images/AboutPicture.jpeg",
  },

  /** Clinical consultation expertise */
  consultationServices: [
    {
      title: "Full Body Check-ups & Preventive Healthcare",
      description: "Comprehensive health evaluations, routine risk screening, and proactive wellness guidance.",
      category: "Preventive Care",
    },
    {
      title: "Liver Diseases & Disorders",
      description: "Diagnosis and management of Fatty Liver, Chronic Hepatitis B, jaundice, and hepatic conditions.",
      category: "Hepatology",
    },
    {
      title: "Diabetes, Hypertension & Lifestyle Diseases",
      description: "Individualized management plans for Type 2 Diabetes, blood pressure, cholesterol, and metabolic health.",
      category: "Metabolic Health",
    },
    {
      title: "Gastrointestinal & Digestive Problems",
      description: "Clinical evaluation of acid reflux, IBS, stomach disorders, gastritis, and chronic indigestion.",
      category: "Gastroenterology",
    },
    {
      title: "Kidney Diseases & Kidney Stone Prevention",
      description: "Renal health assessments, chronic kidney disease monitoring, and stone recurrence prevention.",
      category: "Nephrology",
    },
    {
      title: "Minor Surgical Conditions",
      description: "Surgical second opinions, post-operative recovery, wound care advice, and minor surgical evaluations.",
      category: "Minor Surgery",
    },
    {
      title: "General Medical & Chronic Disease Management",
      description: "Evidence-based clinical care for multi-system conditions, elderly care, and persistent symptoms.",
      category: "Primary Care",
    },
    {
      title: "Ultrasound (USG) Report Interpretation",
      description: "Expert secondary analysis of abdominal, pelvic, and general sonography scans by a certified sonologist.",
      category: "Sonology",
    },
    {
      title: "Echocardiography (ECHO) Report Interpretation",
      description: "Detailed clinical interpretation of cardiac ultrasound / echocardiogram reports and heart health context.",
      category: "Echocardiography",
    },
  ],

  /** Application branding */
  site: {
    name: "Dr. Dhondup Tashi | Online Medical Consultations",
    tagline: "Thoughtful, evidence-based medical care — wherever you are.",
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
