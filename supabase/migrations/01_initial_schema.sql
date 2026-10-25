-- =============================================================================
-- DR. DHONDUP TASHI - ONLINE MEDICAL CONSULTATIONS
-- DATABASE SCHEMA MIGRATION: 01_initial_schema.sql
-- Compatible with PostgreSQL 14+ / Supabase
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
        'pending_payment',
        'confirmed',
        'cancelled',
        'completed',
        'rescheduled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',
        'paid',
        'failed',
        'refunded',
        'partially_refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. PATIENTS TABLE
-- Stores patient contact & demographic information.
-- =============================================================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age <= 130),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

DROP TRIGGER IF EXISTS trigger_patients_updated_at ON patients;
CREATE TRIGGER trigger_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. SCHEDULE OVERRIDES TABLE
-- Allows the doctor to block specific dates (e.g. travel, holidays, hospital duties)
-- =============================================================================
CREATE TABLE IF NOT EXISTS schedule_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    override_date DATE NOT NULL UNIQUE,
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_overrides_date ON schedule_overrides(override_date);

DROP TRIGGER IF EXISTS trigger_schedule_overrides_updated_at ON schedule_overrides;
CREATE TRIGGER trigger_schedule_overrides_updated_at
    BEFORE UPDATE ON schedule_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. APPOINTMENTS TABLE
-- Stores booking details, slot allocation, payments, and calendar links.
-- =============================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    slot_time TEXT NOT NULL, -- e.g. "19:00", "19:20", "19:40"
    status appointment_status NOT NULL DEFAULT 'pending_payment',
    consultation_fee INTEGER NOT NULL DEFAULT 1000, -- Amount in INR
    payment_status payment_status NOT NULL DEFAULT 'pending',
    
    -- Razorpay Integration
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    
    -- Google Integration
    google_meet_link TEXT,
    google_calendar_event_id TEXT,
    
    -- Clinical intake fields (optional from patient)
    reason_for_consultation TEXT,
    preferred_language TEXT DEFAULT 'English',
    
    -- Rescheduling & Cancellation rules
    reschedule_count INTEGER NOT NULL DEFAULT 0 CHECK (reschedule_count <= 1),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    
    -- Reminders
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent_at TIMESTAMPTZ,
    
    -- Hold expiration timestamp for pending_payment status (default: 15 minutes)
    hold_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRITICAL DATABASE CONSTRAINT: DOUBLE-BOOKING PREVENTION
-- Partial unique index ensuring that for any given date and slot time,
-- there can never be more than one active (pending_payment or confirmed) appointment.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_appointment_slot
    ON appointments (appointment_date, slot_time)
    WHERE status IN ('pending_payment', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_order ON appointments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. CONSULTATION NOTES TABLE (STRICTLY CONFIDENTIAL)
-- Only accessible by the doctor / admin. Never sent to patient or client.
-- =============================================================================
CREATE TABLE IF NOT EXISTS consultation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_notes TEXT NOT NULL,
    prescription_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultation_notes_appointment ON consultation_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_patient ON consultation_notes(patient_id);

DROP TRIGGER IF EXISTS trigger_consultation_notes_updated_at ON consultation_notes;
CREATE TRIGGER trigger_consultation_notes_updated_at
    BEFORE UPDATE ON consultation_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. APPOINTMENT RESCHEDULES AUDIT LOG
-- Maintains an immutable trail of every reschedule event.
-- =============================================================================
CREATE TABLE IF NOT EXISTS appointment_reschedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    previous_date DATE NOT NULL,
    previous_slot TEXT NOT NULL,
    new_date DATE NOT NULL,
    new_slot TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reschedules_appointment ON appointment_reschedules(appointment_id);

-- =============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reschedules ENABLE ROW LEVEL SECURITY;

-- Schedule overrides: Public can read to see unavailable dates
CREATE POLICY "Public can view schedule overrides"
    ON schedule_overrides
    FOR SELECT
    USING (true);

-- Appointments: Public can check if a slot is taken without seeing patient PII
-- (A dedicated public view or safe select policy for availability queries)
CREATE OR REPLACE VIEW public_slot_availability AS
    SELECT 
        appointment_date,
        slot_time,
        status
    FROM appointments
    WHERE status IN ('pending_payment', 'confirmed')
      AND (status != 'pending_payment' OR hold_expires_at > NOW());

-- Service role bypasses RLS for all tables (used in Next.js Server Actions / API routes)
-- Note: Supabase service_role key automatically bypasses RLS by default.
-- We explicitly define NO public select/insert/update on consultation_notes, ensuring zero data leak.
