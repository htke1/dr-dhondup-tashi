-- =============================================================================
-- DR. DHONDUP TASHI - ONLINE MEDICAL CONSULTATIONS
-- DATABASE SCHEMA MIGRATION: 02_payment_verification_reminders.sql
-- Adds automated 1-minute UPI payment verification reminder queue
-- and booking token security to appointments.
-- =============================================================================

-- 1. Extend appointments table with high-entropy token hash and check request timestamp
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS booking_token_hash TEXT,
ADD COLUMN IF NOT EXISTS payment_check_requested_at TIMESTAMPTZ;

-- 2. Create durable payment_verification_reminders queue table
CREATE TABLE IF NOT EXISTS payment_verification_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL DEFAULT 'doctor_manual_upi_check',
    scheduled_for TIMESTAMPTZ NOT NULL,
    delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'processing', 'sent', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for efficient worker queue querying and idempotency enforcement
CREATE INDEX IF NOT EXISTS idx_pvr_appointment_id ON payment_verification_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_pvr_due_reminders ON payment_verification_reminders(scheduled_for, delivery_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pvr_appointment_type_unique ON payment_verification_reminders(appointment_id, reminder_type);

-- 4. Row Level Security: strictly locked to service-role / authenticated admin
ALTER TABLE payment_verification_reminders ENABLE ROW LEVEL SECURITY;

-- No public select/insert/update. Mediated exclusively through protected server APIs.
DROP POLICY IF EXISTS "Deny public access to payment reminders" ON payment_verification_reminders;
CREATE POLICY "Deny public access to payment reminders"
    ON payment_verification_reminders
    FOR ALL
    USING (false);

-- 5. Trigger for updated_at tracking
DROP TRIGGER IF EXISTS trigger_pvr_updated_at ON payment_verification_reminders;
CREATE TRIGGER trigger_pvr_updated_at
    BEFORE UPDATE ON payment_verification_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
