export type AppointmentStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "rescheduled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  created_at: string;
  updated_at: string;
}

export interface PatientInsert {
  id?: string;
  name: string;
  email: string;
  phone: string;
  age: number;
}

export interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string; // YYYY-MM-DD
  slot_time: string; // e.g. "19:00", "19:20", "19:40"
  status: AppointmentStatus;
  consultation_fee: number;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  google_meet_link: string | null;
  google_calendar_event_id: string | null;
  reason_for_consultation: string | null;
  preferred_language: string | null;
  reschedule_count: number;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  hold_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentInsert {
  id?: string;
  patient_id: string;
  appointment_date: string;
  slot_time: string;
  status?: AppointmentStatus;
  consultation_fee?: number;
  payment_status?: PaymentStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  google_meet_link?: string | null;
  google_calendar_event_id?: string | null;
  reason_for_consultation?: string | null;
  preferred_language?: string | null;
  reschedule_count?: number;
  hold_expires_at?: string;
}

export interface ConsultationNote {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_notes: string;
  prescription_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleOverride {
  id: string;
  override_date: string;
  is_available: boolean;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentReschedule {
  id: string;
  appointment_id: string;
  previous_date: string;
  previous_slot: string;
  new_date: string;
  new_slot: string;
  reason: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      patients: {
        Row: Patient;
        Insert: PatientInsert;
        Update: Partial<PatientInsert>;
        Relationships: [];
      };
      appointments: {
        Row: Appointment;
        Insert: AppointmentInsert;
        Update: Partial<AppointmentInsert>;
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          }
        ];
      };
      consultation_notes: {
        Row: ConsultationNote;
        Insert: Omit<ConsultationNote, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ConsultationNote, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      schedule_overrides: {
        Row: ScheduleOverride;
        Insert: Omit<ScheduleOverride, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ScheduleOverride, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      appointment_reschedules: {
        Row: AppointmentReschedule;
        Insert: Omit<AppointmentReschedule, "id" | "created_at">;
        Update: Partial<Omit<AppointmentReschedule, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: {
      public_slot_availability: {
        Row: {
          appointment_date: string;
          slot_time: string;
          status: AppointmentStatus;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      appointment_status: AppointmentStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
