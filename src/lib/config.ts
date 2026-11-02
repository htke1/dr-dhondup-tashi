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
    heroName: "Dr. Dhun Tashi",
    shortName: "Dr. Dhun Tashi",
    title: "MBBS, M.Med (Family Medicine)",
    kmcRegistration: "1,05,969",
    signatureUrl: "/images/doctor-signature.jpg",
    role: "Family Physician | Clinical Sonologist | Chief Medical Officer | Community Health Advocate",
    experience: "Years of Clinical Practice",
    hospital: "Gaden Jangtse Hospital, Mundgod, Karnataka, India",
    email: "dhontash@gmail.com",
    photoUrl: "/images/HomePagePicture.jpeg",
    aboutPhotoUrl: "/images/AboutPicture.jpeg",
  },

  /** Clinical consultation expertise */
  consultationServices: [
    {
      title: "General Medical & Chronic Disease Management",
      description: "Evidence-based clinical care for multi-system conditions, elderly care, and persistent symptoms.",
      category: "Primary Care",
    },
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
    tagline: "Dedicated online consultation for Tibetan, Ladakhi, Lahaul-Spiti and Monpa communities.",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },

  /** Timezone used for ALL scheduling decisions */
  timezone: "Asia/Kolkata" as const,

  /** Consultation fee in INR */
  consultationFee: 650,
  consultationFeeINR: 650,
  /** Human-readable fee string */
  consultationFeeDisplay: "₹650",

  /** Payment Gateway & UPI Configuration */
  payment: {
    mode: (process.env.NEXT_PUBLIC_PAYMENT_MODE || "upi_qr") as "upi_qr" | "razorpay",
    upi: {
      vpa: process.env.UPI_ID || "dhontash@okicici",
      recipientName: process.env.UPI_RECIPIENT_NAME || "Dhondup Tashi",
      currency: "INR",
      manualVerification: true,
    },
  },

  /** Family Head & Father Health Initiative (Clinical Subsidy) */
  familyHeadSubsidy: {
    enabled: false,
    discountPercent: 41,
    fee: 500,
    feeDisplay: "₹500",
    name: "Family Head & Father Health Initiative",
    rationale:
      "Dr. Dhondup Tashi's clinical observation through years of practice: Fathers and family heads frequently delay medical attention until illnesses reach late stages. We offer this clinical subsidy to encourage early diagnosis and timely care.",
  },

  /** First Consultation Complimentary Initiative (100% Free / ₹0) */
  firstConsultationFree: {
    enabled: false,
    fee: 0,
    feeDisplay: "FREE (₹0)",
    badgeText: "1st Consultation Complimentary",
    name: "Introductory Consultation Offer",
    description: "Dr. Dhondup Tashi is pleased to offer your first introductory consultation free of charge.",
    termsNote: "Valid once per patient. Verified seamlessly against patient name and contact details.",
  },

  /** Daily appointment slots (times in HH:mm, 24-hour, Asia/Kolkata) - 6 slots from 6:30 PM to 8:30 PM */
  slots: [
    { id: "18:30", startHHmm: "18:30", endHHmm: "18:50", label: "6:30 PM – 6:50 PM" },
    { id: "18:50", startHHmm: "18:50", endHHmm: "19:10", label: "6:50 PM – 7:10 PM" },
    { id: "19:10", startHHmm: "19:10", endHHmm: "19:30", label: "7:10 PM – 7:30 PM" },
    { id: "19:30", startHHmm: "19:30", endHHmm: "19:50", label: "7:30 PM – 7:50 PM" },
    { id: "19:50", startHHmm: "19:50", endHHmm: "20:10", label: "7:50 PM – 8:10 PM" },
    { id: "20:10", startHHmm: "20:10", endHHmm: "20:30", label: "8:10 PM – 8:30 PM" },
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
