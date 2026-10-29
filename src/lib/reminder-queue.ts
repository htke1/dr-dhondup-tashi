export interface FallbackReminder {
  id: string;
  appointment_id: string;
  reminder_type: string;
  scheduled_for: string;
  delivery_status: "pending" | "processing" | "sent" | "failed";
  attempt_count: number;
  last_error: string | null;
  sent_at: string | null;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

// Global in-memory fallback queue for environments where Supabase migration 02 is not yet executed
declare global {
  var __drdhondup_fallback_reminders: FallbackReminder[] | undefined;
}

if (!globalThis.__drdhondup_fallback_reminders) {
  globalThis.__drdhondup_fallback_reminders = [];
}

export const fallbackReminders = globalThis.__drdhondup_fallback_reminders;
