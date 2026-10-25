import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Server-only Supabase client initialized with the SERVICE ROLE key.
 * This client bypasses Row Level Security (RLS) and must NEVER be used on the client-side.
 * Used for:
 * - Creating pending & confirmed appointments
 * - Verifying payments & marking appointments confirmed
 * - Admin dashboard operations & consultation notes
 * - Cron jobs (cleaning expired holds, sending reminders)
 */
export function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server credentials: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
