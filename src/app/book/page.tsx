"use client";

import { useState, useCallback, useEffect, Fragment } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { APP_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";

/* =========================================================
   TYPES
   ========================================================= */
type Step = 1 | 2 | 3 | 4 | 5;

interface PatientFormData {
  fullName: string;
  mobileNumber: string;
  emailAddress: string;
  age: string;
  reasonForConsultation: string;
  preferredLanguage: "english" | "tibetan" | "";
}

interface SelectedSlot {
  date: string;       // YYYY-MM-DD
  slotId: string;
  slotLabel: string;
}

const STEPS = [
  { label: "Date", step: 1 as Step },
  { label: "Time", step: 2 as Step },
  { label: "Details", step: 3 as Step },
  { label: "Review", step: 4 as Step },
  { label: "Confirmed", step: 5 as Step },
];

/* =========================================================
   BOOKING PAGE
   ========================================================= */
export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);
  const [patientData, setPatientData] = useState<PatientFormData>({
    fullName: "",
    mobileNumber: "",
    emailAddress: "",
    age: "",
    reasonForConsultation: "",
    preferredLanguage: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlReason = params.get("reason");
      if (urlReason) {
        setPatientData((prev) => ({ ...prev, reasonForConsultation: urlReason }));
      }
    }
  }, []);

  const goToStep = useCallback((step: Step) => setCurrentStep(step), []);

  return (
    <>
      <SiteNav />
      <main
        id="booking-main"
        style={{
          minHeight: "calc(100dvh - 60px)",
          background: "var(--color-ivory)",
          paddingBottom: "var(--space-4xl)",
        }}
      >
        {/* Page header */}
        <div
          style={{
            background: "var(--color-cream)",
            borderBottom: "1px solid var(--color-border-soft)",
            paddingBlock: "1.75rem",
          }}
        >
          <div className="container">
            <nav aria-label="Breadcrumb">
              <ol
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  listStyle: "none",
                  fontSize: "0.8125rem",
                  color: "var(--color-charcoal-muted)",
                  marginBottom: "0.75rem",
                }}
              >
                <li>
                  <Link href="/" style={{ color: "var(--color-charcoal-soft)", textDecoration: "none" }}>
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page">Book Appointment</li>
              </ol>
            </nav>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                color: "var(--color-charcoal)",
                marginBottom: "0.25rem",
              }}
            >
              Book a Consultation
            </h1>
            <p style={{ color: "var(--color-charcoal-soft)", fontSize: "0.9rem" }}>
              {APP_CONFIG.doctor.name} · {APP_CONFIG.consultationFeeDisplay} · {APP_CONFIG.appointmentDurationMinutes} minutes via Google Meet
            </p>
          </div>
        </div>

        <div className="container" style={{ paddingTop: "2rem" }}>
          {/* Progress stepper */}
          <div aria-label="Booking progress" style={{ marginBottom: "2.5rem" }}>
            <div className="stepper" role="list">
              {STEPS.map((s, i) => (
                <Fragment key={s.step}>
                  <div
                    className={cn(
                      "stepper-step",
                      currentStep === s.step && "active",
                      currentStep > s.step && "done"
                    )}
                    role="listitem"
                    aria-current={currentStep === s.step ? "step" : undefined}
                  >
                    <div className="stepper-circle" aria-hidden="true">
                      {currentStep > s.step ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        s.step
                      )}
                    </div>
                    <span className="stepper-label">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn("stepper-line", currentStep > s.step && "done")}
                      aria-hidden="true"
                    />
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Step panels */}
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            {currentStep === 1 && (
              <StepDateSelect
                selectedDate={selectedDate}
                onDateSelect={(d) => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
                onNext={() => goToStep(2)}
              />
            )}
            {currentStep === 2 && (
              <StepSlotSelect
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
                onBack={() => goToStep(1)}
                onNext={() => goToStep(3)}
              />
            )}
            {currentStep === 3 && (
              <StepPatientDetails
                data={patientData}
                onDataChange={setPatientData}
                onBack={() => goToStep(2)}
                onNext={() => goToStep(4)}
              />
            )}
            {currentStep === 4 && (
              <StepReview
                slot={selectedSlot!}
                patient={patientData}
                onBack={() => goToStep(3)}
                onConfirmed={(apt) => {
                  setConfirmedAppointment(apt);
                  setCurrentStep(5);
                }}
              />
            )}
            {currentStep === 5 && confirmedAppointment && (
              <StepConfirmed
                appointment={confirmedAppointment}
                slot={selectedSlot!}
                patient={patientData}
              />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

/* =========================================================
   STEP 1: DATE SELECT
   ========================================================= */
function StepDateSelect({
  selectedDate,
  onDateSelect,
  onNext,
}: {
  selectedDate: string;
  onDateSelect: (d: string) => void;
  onNext: () => void;
}) {
  const [days, setDays] = useState<{ dateStr: string; label: string; subLabel: string; disabled: boolean }[]>([]);

  useEffect(() => {
    // Generate next 14 days (excluding today if past 6 PM IST)
    const today = new Date();
    const istNow = new Date(
      today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const istHour = istNow.getHours();
    const istMinute = istNow.getMinutes();
    const pastCutoff = istHour > 18 || (istHour === 18 && istMinute >= 0);

    const generatedDays: { dateStr: string; label: string; subLabel: string; disabled: boolean }[] = [];

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const isToday = i === 0;
      const disabled = isToday && pastCutoff;
      const label = isToday ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" });
      const subLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      generatedDays.push({ dateStr, label, subLabel, disabled });
    }
    setDays(generatedDays);
  }, []);

  return (
    <div className="card card-padded">
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "1.4rem",
          marginBottom: "0.375rem",
        }}
      >
        Select a date
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)", marginBottom: "1.5rem" }}>
        Same-day bookings close at 6:00 PM IST.
      </p>

      <div
        role="group"
        aria-label="Select appointment date"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: "0.5rem",
          marginBottom: "1.75rem",
        }}
      >
        {days.map(({ dateStr, label, subLabel, disabled }) => (
          <button
            key={dateStr}
            onClick={() => !disabled && onDateSelect(dateStr)}
            disabled={disabled}
            aria-pressed={selectedDate === dateStr}
            aria-label={`${label} ${subLabel}`}
            style={{
              padding: "0.75rem 0.5rem",
              border: "1.5px solid",
              borderColor:
                selectedDate === dateStr
                  ? "var(--color-maroon)"
                  : "var(--color-border)",
              borderRadius: "var(--radius-md)",
              background:
                selectedDate === dateStr
                  ? "var(--color-maroon-muted)"
                  : "var(--color-cream)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.4 : 1,
              textAlign: "center",
              transition: "all var(--transition-fast)",
              minHeight: "64px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.125rem",
            }}
          >
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color:
                  selectedDate === dateStr
                    ? "var(--color-maroon)"
                    : "var(--color-charcoal-soft)",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color:
                  selectedDate === dateStr
                    ? "var(--color-maroon)"
                    : "var(--color-charcoal)",
              }}
            >
              {subLabel}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!selectedDate}
          id="step1-next"
        >
          Continue to time selection
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   STEP 2: SLOT SELECT
   ========================================================= */
function StepSlotSelect({
  selectedDate,
  selectedSlot,
  onSlotSelect,
  onBack,
  onNext,
}: {
  selectedDate: string;
  selectedSlot: SelectedSlot | null;
  onSlotSelect: (s: SelectedSlot) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [slotData, setSlotData] = useState<{
    slotTime: string;
    displayTime: string;
    available: boolean;
    reason?: string;
  }[]>([]);
  const [dayNotice, setDayNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDayNotice(null);

    fetch(`/api/availability?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.slots) {
          setSlotData(data.slots);
        }
        if (data.reason) {
          setDayNotice(data.reason);
        }
      })
      .catch((err) => {
        console.error("Availability fetch failed:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDate]);

  const displayDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const slots = APP_CONFIG.slots;

  return (
    <div className="card card-padded">
      <button
        onClick={onBack}
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: "1.25rem", padding: "0.375rem 0", gap: "0.375rem" }}
        aria-label="Go back to date selection"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "0.375rem" }}>
        Select a time
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)", marginBottom: "1.5rem" }}>
        {displayDate} · All times in IST (Asia/Kolkata)
      </p>

      {dayNotice && (
        <div
          style={{
            background: "var(--color-maroon-muted)",
            border: "1px solid rgba(123,45,62,0.2)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            fontSize: "0.8125rem",
            color: "var(--color-maroon)",
          }}
          role="alert"
        >
          {dayNotice}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--color-charcoal-soft)", fontSize: "0.875rem" }}>
          Checking live slot availability...
        </div>
      ) : (
        <div role="group" aria-label="Available time slots" style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.75rem" }}>
          {slots.map((slot) => {
            const isSelected = selectedSlot?.slotId === slot.id;
            const backendInfo = slotData.find((s) => s.slotTime === slot.id);
            const isAvailable = backendInfo ? backendInfo.available : true;
            const unavailableReason = backendInfo?.reason || "Slot unavailable";

            return (
              <button
                key={slot.id}
                className={cn("slot-btn", isSelected && "selected")}
                disabled={!isAvailable}
                style={{
                  opacity: isAvailable ? 1 : 0.5,
                  cursor: isAvailable ? "pointer" : "not-allowed",
                  borderColor: !isAvailable ? "var(--color-border-soft)" : undefined,
                }}
                onClick={() =>
                  isAvailable &&
                  onSlotSelect({
                    date: selectedDate,
                    slotId: slot.id,
                    slotLabel: slot.label,
                  })
                }
                aria-pressed={isSelected}
                aria-disabled={!isAvailable}
                id={`slot-${slot.id}`}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.1rem",
                      color: !isAvailable
                        ? "var(--color-charcoal-muted)"
                        : isSelected
                        ? "var(--color-maroon)"
                        : "var(--color-charcoal)",
                      fontWeight: 500,
                      marginBottom: "0.125rem",
                    }}
                  >
                    {slot.label} {!isAvailable && `(${unavailableReason})`}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-muted)" }}>
                    {APP_CONFIG.appointmentDurationMinutes}-minute consultation · IST
                  </p>
                </div>
                {isSelected && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-maroon)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {!isSelected && isAvailable && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!selectedSlot}
          id="step2-next"
        >
          Continue to your details
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   STEP 3: PATIENT DETAILS FORM
   ========================================================= */
function StepPatientDetails({
  data,
  onDataChange,
  onBack,
  onNext,
}: {
  data: PatientFormData;
  onDataChange: (d: PatientFormData) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({});

  const update = (field: keyof PatientFormData, value: string) => {
    onDataChange({ ...data, [field]: value });
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!data.fullName.trim() || data.fullName.trim().length < 2)
      newErrors.fullName = "Please enter your full name (at least 2 characters).";
    if (!/^\+?[0-9\s\-]{7,15}$/.test(data.mobileNumber.replace(/\s/g, "")))
      newErrors.mobileNumber = "Please enter a valid mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailAddress))
      newErrors.emailAddress = "Please enter a valid email address.";
    const age = parseInt(data.age, 10);
    if (isNaN(age) || age < 1 || age > 120)
      newErrors.age = "Please enter a valid age (1–120).";
    if (data.reasonForConsultation.length > 500)
      newErrors.reasonForConsultation = "Reason must be 500 characters or fewer.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="card card-padded">
      <button
        onClick={onBack}
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: "1.25rem", padding: "0.375rem 0", gap: "0.375rem" }}
        aria-label="Go back to time selection"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "0.375rem" }}>
        Your details
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)", marginBottom: "1.75rem" }}>
        Fields marked <span style={{ color: "var(--color-maroon)" }}>*</span> are required.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Full name */}
          <div className="form-group">
            <label htmlFor="fullName" className="form-label form-label-required">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              className={cn("form-input", errors.fullName && "form-input-error")}
              placeholder="e.g. Tenzin Norbu"
              value={data.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              maxLength={100}
              aria-required="true"
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
            />
            {errors.fullName && (
              <span id="fullName-error" className="form-error" role="alert">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Mobile number */}
          <div className="form-group">
            <label htmlFor="mobileNumber" className="form-label form-label-required">
              Mobile number
            </label>
            <input
              id="mobileNumber"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              className={cn("form-input", errors.mobileNumber && "form-input-error")}
              placeholder="+91 98765 43210"
              value={data.mobileNumber}
              onChange={(e) => update("mobileNumber", e.target.value)}
              maxLength={20}
              aria-required="true"
              aria-describedby={errors.mobileNumber ? "mobileNumber-error" : undefined}
            />
            {errors.mobileNumber && (
              <span id="mobileNumber-error" className="form-error" role="alert">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errors.mobileNumber}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="emailAddress" className="form-label form-label-required">
              Email address
            </label>
            <input
              id="emailAddress"
              type="email"
              autoComplete="email"
              inputMode="email"
              className={cn("form-input", errors.emailAddress && "form-input-error")}
              placeholder="you@example.com"
              value={data.emailAddress}
              onChange={(e) => update("emailAddress", e.target.value)}
              maxLength={200}
              aria-required="true"
              aria-describedby="emailAddress-hint"
            />
            <span id="emailAddress-hint" className="form-hint">
              Your confirmation and Google Meet link will be sent here.
            </span>
            {errors.emailAddress && (
              <span className="form-error" role="alert">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errors.emailAddress}
              </span>
            )}
          </div>

          {/* Age */}
          <div className="form-group">
            <label htmlFor="age" className="form-label form-label-required">
              Age
            </label>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              className={cn("form-input", errors.age && "form-input-error")}
              placeholder="e.g. 34"
              value={data.age}
              onChange={(e) => update("age", e.target.value)}
              min={1}
              max={120}
              aria-required="true"
              style={{ maxWidth: "120px" }}
            />
            {errors.age && (
              <span className="form-error" role="alert">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errors.age}
              </span>
            )}
          </div>

          {/* Reason */}
          <div className="form-group">
            <label htmlFor="reasonForConsultation" className="form-label" style={{ marginBottom: "0.35rem" }}>
              Reason for consultation <span style={{ color: "var(--color-charcoal-muted)", fontWeight: 400 }}>(optional)</span>
            </label>

            {/* Quick Topic Chips from Clinical Expertise */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.625rem" }}>
              {[
                "Full Body Check-up",
                "Liver / Hepatitis B",
                "Diabetes & BP",
                "Gastrointestinal / Digestion",
                "Kidney Health",
                "Minor Surgical Opinion",
                "General Medical Care",
                "USG Report Review",
                "ECHO Report Review",
              ].map((topic) => {
                const isSelected = data.reasonForConsultation.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        const cleaned = data.reasonForConsultation
                          .replace(topic, "")
                          .replace(/,\s*,/g, ",")
                          .replace(/^,\s*|,\s*$/g, "")
                          .trim();
                        update("reasonForConsultation", cleaned);
                      } else {
                        update(
                          "reasonForConsultation",
                          data.reasonForConsultation ? `${data.reasonForConsultation}, ${topic}` : topic
                        );
                      }
                    }}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "var(--radius-full)",
                      border: isSelected ? "1px solid var(--color-maroon)" : "1px solid var(--color-border-soft)",
                      background: isSelected ? "var(--color-maroon-muted)" : "var(--color-cream)",
                      color: isSelected ? "var(--color-maroon)" : "var(--color-charcoal-mid)",
                      cursor: "pointer",
                      fontWeight: isSelected ? 600 : 500,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {topic}
                  </button>
                );
              })}
            </div>

            <textarea
              id="reasonForConsultation"
              className="form-input"
              placeholder="Click topics above or describe your symptoms / reports..."
              value={data.reasonForConsultation}
              onChange={(e) => update("reasonForConsultation", e.target.value)}
              maxLength={500}
              rows={3}
              style={{ resize: "vertical", minHeight: "80px" }}
              aria-describedby="reason-hint"
            />
            <span id="reason-hint" className="form-hint" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Helps the doctor prepare for your session.</span>
              <span aria-live="polite">{data.reasonForConsultation.length}/500</span>
            </span>
            {errors.reasonForConsultation && (
              <span className="form-error" role="alert">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errors.reasonForConsultation}
              </span>
            )}
          </div>

          {/* Language preference */}
          <div className="form-group">
            <label htmlFor="preferredLanguage" className="form-label">
              Preferred consultation language <span style={{ color: "var(--color-charcoal-muted)", fontWeight: 400 }}>(optional)</span>
            </label>
            <select
              id="preferredLanguage"
              className="form-input"
              value={data.preferredLanguage}
              onChange={(e) => update("preferredLanguage", e.target.value as PatientFormData["preferredLanguage"])}
              aria-describedby="language-hint"
            >
              <option value="">No preference</option>
              <option value="english">English</option>
              <option value="tibetan">Tibetan</option>
            </select>
            <span id="language-hint" className="form-hint">
              This helps the doctor prepare. The website interface is English-only.
            </span>
          </div>
        </div>

        {/* Privacy notice */}
        <div
          style={{
            marginTop: "1.75rem",
            background: "var(--color-ivory-dark)",
            border: "1px solid var(--color-border-soft)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.125rem",
            fontSize: "0.8125rem",
            color: "var(--color-charcoal-soft)",
            lineHeight: 1.65,
          }}
          role="note"
        >
          <strong style={{ color: "var(--color-charcoal)", display: "block", marginBottom: "0.375rem" }}>
            Privacy notice
          </strong>
          Your personal details are used only to process your appointment and deliver your consultation.
          We do not share your information with third parties except as required to operate this service.
          By proceeding, you consent to your details being used for this purpose.{" "}
          <Link href="/privacy" style={{ color: "var(--color-maroon)" }}>
            Read our Privacy Policy
          </Link>
          .
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button type="submit" className="btn btn-primary" id="step3-next">
            Review appointment
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   STEP 4: REVIEW & PAY
   ========================================================= */
function StepReview({
  slot,
  patient,
  onBack,
  onConfirmed,
}: {
  slot: SelectedSlot;
  patient: PatientFormData;
  onBack: () => void;
  onConfirmed: (appointment: any) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProceedToPayment = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // 1. Hold slot
      const holdRes = await fetch("/api/appointments/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patient.fullName,
          email: patient.emailAddress,
          phone: patient.mobileNumber,
          age: parseInt(patient.age, 10),
          reason: patient.reasonForConsultation || "",
          language: patient.preferredLanguage === "tibetan" ? "Tibetan" : "English",
          appointmentDate: slot.date,
          slotTime: slot.slotId,
        }),
      });

      const holdData = await holdRes.json();
      if (!holdRes.ok) {
        setErrorMsg(holdData.error || "Failed to reserve slot. Please choose another time.");
        return;
      }

      const appointmentId = holdData.appointmentId;

      // 2. Create Razorpay order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setErrorMsg(orderData.error || "Could not initialize payment order.");
        return;
      }

      // 3. Handle Development Mock Mode (instant simulation if live keys are not configured yet)
      if (orderData.developmentMock) {
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            razorpayOrderId: orderData.orderId,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: "mock_signature",
            appointmentDate: slot.date,
            slotTime: slot.slotId,
            patientName: patient.fullName,
            patientEmail: patient.emailAddress,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          onConfirmed(verifyData.appointment);
        } else {
          setErrorMsg(verifyData.error || "Payment verification failed.");
        }
        return;
      }

      // 4. Load official Razorpay Checkout SDK
      const scriptLoaded = await new Promise<boolean>((resolve) => {
        if (typeof window === "undefined") return resolve(false);
        if ((window as any).Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) {
        setErrorMsg("Failed to load Razorpay payment gateway. Please check your network connection.");
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: APP_CONFIG.doctor.name,
        description: `Online Medical Consultation (${APP_CONFIG.appointmentDurationMinutes} mins)`,
        order_id: orderData.orderId,
        prefill: {
          name: patient.fullName,
          email: patient.emailAddress,
          contact: patient.mobileNumber,
        },
        theme: {
          color: "#7B2D3E",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appointmentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                appointmentDate: slot.date,
                slotTime: slot.slotId,
                patientName: patient.fullName,
                patientEmail: patient.emailAddress,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              onConfirmed(verifyData.appointment);
            } else {
              setErrorMsg(verifyData.error || "Payment signature verification failed.");
            }
          } catch {
            setErrorMsg("Payment verification error. Please contact clinic support with your transaction reference.");
          }
        },
        modal: {
          ondismiss: function () {
            setErrorMsg("Payment cancelled. You can retry payment or choose another appointment time.");
          },
        },
      });

      rzp.on("payment.failed", function (response: any) {
        const errorDesc = response.error?.description || response.error?.reason || "Transaction was declined.";
        setErrorMsg(`Payment failed: ${errorDesc} (Reason: ${response.error?.code || "FAILED"})`);
      });

      rzp.open();
    } catch (err) {
      setErrorMsg("Network connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayDate = new Date(slot.date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const reviewRows = [
    { label: "Date", value: displayDate },
    { label: "Time", value: `${slot.slotLabel} IST` },
    { label: "Duration", value: `${APP_CONFIG.appointmentDurationMinutes} minutes` },
    { label: "Format", value: "Online via Google Meet" },
    { label: "Consultation fee", value: APP_CONFIG.consultationFeeDisplay },
    { label: "Patient name", value: patient.fullName },
    { label: "Mobile", value: patient.mobileNumber },
    { label: "Email", value: patient.emailAddress },
    { label: "Age", value: patient.age },
    ...(patient.preferredLanguage
      ? [{ label: "Preferred language", value: patient.preferredLanguage === "tibetan" ? "Tibetan" : "English" }]
      : []),
    ...(patient.reasonForConsultation
      ? [{ label: "Reason", value: patient.reasonForConsultation }]
      : []),
  ];

  return (
    <div>
      <div className="card card-padded" style={{ marginBottom: "1.25rem" }}>
        <button
          onClick={onBack}
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: "1.25rem", padding: "0.375rem 0", gap: "0.375rem" }}
          aria-label="Go back to patient details"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>

        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "0.375rem" }}>
          Review your appointment
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)", marginBottom: "1.75rem" }}>
          Please verify all details before proceeding to payment.
        </p>

        <dl style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {reviewRows.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
                paddingBlock: "0.75rem",
                borderBottom: i < reviewRows.length - 1 ? "1px solid var(--color-border-soft)" : "none",
              }}
            >
              <dt
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-charcoal-muted)",
                  fontWeight: 500,
                  minWidth: "130px",
                  flexShrink: 0,
                }}
              >
                {row.label}
              </dt>
              <dd
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-charcoal)",
                  textAlign: "right",
                  wordBreak: "break-word",
                }}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Policy summary */}
      <div
        className="card"
        style={{
          padding: "1.25rem",
          marginBottom: "1.25rem",
          fontSize: "0.8125rem",
          color: "var(--color-charcoal-soft)",
          lineHeight: 1.7,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-charcoal)",
            marginBottom: "0.75rem",
          }}
        >
          Applicable policies
        </h3>
        <ul style={{ display: "flex", flexDirection: "column", gap: "0.375rem", paddingLeft: "1rem" }}>
          <li>
            <strong>Cancellation:</strong> Full refund if cancelled at least{" "}
            {APP_CONFIG.cancellationRefundHours} hours before the appointment.
            Non-refundable if cancelled within {APP_CONFIG.cancellationRefundHours} hours.
          </li>
          <li>
            <strong>Rescheduling:</strong> One free reschedule allowed if requested at least{" "}
            {APP_CONFIG.rescheduleWindowHours} hours before the original appointment.
          </li>
          <li>
            <strong>Confirmation:</strong> Your slot is confirmed only after payment is verified.
          </li>
          <li>
            <strong>Reminder:</strong> An email reminder will be sent approximately 24 hours before your appointment.
          </li>
        </ul>
        <p style={{ marginTop: "0.75rem" }}>
          By proceeding to payment you agree to our{" "}
          <Link href="/terms" style={{ color: "var(--color-maroon)" }}>Terms of Service</Link>,{" "}
          <Link href="/cancellation-policy" style={{ color: "var(--color-maroon)" }}>
            Cancellation Policy
          </Link>
          , and{" "}
          <Link href="/privacy" style={{ color: "var(--color-maroon)" }}>
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            background: "var(--color-maroon-muted)",
            border: "1px solid rgba(123,45,62,0.3)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
            color: "var(--color-maroon)",
            fontSize: "0.875rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
          role="alert"
        >
          <strong>Reservation conflict:</strong>
          <span>{errorMsg}</span>
          <button
            onClick={onBack}
            className="btn btn-secondary btn-sm"
            style={{ alignSelf: "flex-start", marginTop: "0.25rem" }}
          >
            Choose a different time
          </button>
        </div>
      )}

      <button
        className="btn btn-primary btn-lg"
        style={{ width: "100%", justifyContent: "center" }}
        onClick={handleProceedToPayment}
        disabled={submitting}
        id="pay-btn"
      >
        {submitting ? "Processing payment..." : `Proceed to Payment — ${APP_CONFIG.consultationFeeDisplay}`}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </button>
      <p
        style={{
          textAlign: "center",
          fontSize: "0.75rem",
          color: "var(--color-charcoal-muted)",
          marginTop: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.375rem",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Secure payment via Razorpay · Instant confirmation with Google Meet link
      </p>
    </div>
  );
}

/* =========================================================
   STEP 5: CONFIRMED
   ========================================================= */
function StepConfirmed({
  appointment,
  slot,
  patient,
}: {
  appointment: any;
  slot: SelectedSlot;
  patient: PatientFormData;
}) {
  const [copied, setCopied] = useState(false);

  const displayDate = new Date(slot.date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const meetLink = appointment.google_meet_link || `https://meet.google.com/drt-consult-${appointment.id?.slice(0, 8)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Construct Google Calendar Link
  const appointmentStart = new Date(`${slot.date}T${slot.slotId}:00+05:30`);
  const appointmentEnd = new Date(appointmentStart.getTime() + 20 * 60 * 1000);
  const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const gcalDates = `${formatGCal(appointmentStart)}/${formatGCal(appointmentEnd)}`;
  const gcalTitle = encodeURIComponent(`Dr. Dhondup Tashi — Medical Consultation (${patient.fullName})`);
  const gcalDetails = encodeURIComponent(
    `Online medical consultation with Dr. Dhondup Tashi, CMO Gaden Jangtse Hospital.\n\n` +
    `Patient: ${patient.fullName}\n` +
    `Booking ID: ${appointment.id}\n` +
    `Google Meet: ${meetLink}\n\n` +
    `Please be ready 5 minutes before scheduled time with any previous reports or prescriptions.`
  );
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalDates}&details=${gcalDetails}&location=${encodeURIComponent(meetLink)}`;

  return (
    <div className="card card-padded" style={{ textAlign: "left" }} id="booking-confirmation-card">
      {/* Success Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid var(--color-border-soft)",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#E8F5E9",
            border: "2px solid #81C784",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "#2E7D32",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#2E7D32",
            }}
          >
            Payment Verified & Confirmed
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.6rem",
              color: "var(--color-charcoal)",
              margin: 0,
            }}
          >
            Consultation Confirmed
          </h2>
        </div>
      </div>

      {/* Booking Identifier Badge */}
      <div
        style={{
          background: "var(--color-cream)",
          borderRadius: "var(--radius-md)",
          padding: "0.875rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          border: "1px solid var(--color-border-soft)",
        }}
      >
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
            Booking Reference ID
          </span>
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-charcoal)" }}>
            {appointment.id}
          </span>
        </div>
        <div>
          <span
            style={{
              display: "inline-block",
              background: "#E8F5E9",
              color: "#1B5E20",
              fontWeight: 600,
              fontSize: "0.75rem",
              padding: "0.25rem 0.625rem",
              borderRadius: "999px",
            }}
          >
            Paid: {APP_CONFIG.consultationFeeDisplay}
          </span>
        </div>
      </div>

      {/* Google Meet Call Card */}
      <div
        style={{
          background: "var(--color-ivory)",
          border: "1.5px solid var(--color-gold)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          marginBottom: "1.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(196,127,58,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-maroon)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", margin: 0, color: "var(--color-charcoal)", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              Google Meet Video Room
            </h3>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-charcoal-soft)" }}>
              Your private teleconsultation room with {APP_CONFIG.doctor.name}
            </p>
          </div>
        </div>

        <div
          style={{
            background: "var(--color-cream)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginBottom: "1rem",
            wordBreak: "break-all",
          }}
        >
          <code style={{ fontSize: "0.8125rem", color: "var(--color-maroon)", fontWeight: 600 }}>
            {meetLink}
          </code>
          <button
            onClick={handleCopyLink}
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0, fontSize: "0.75rem", padding: "0.375rem 0.625rem" }}
          >
            {copied ? "Copied! ✓" : "Copy"}
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ flex: 1, minWidth: "200px", justifyContent: "center" }}
            id="join-meet-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            Join Google Meet Call
          </a>

          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ flex: 1, minWidth: "180px", justifyContent: "center" }}
            id="add-gcal-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Add to Google Calendar
          </a>
        </div>
      </div>

      {/* Appointment Summary Details */}
      <h3
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--color-charcoal-soft)",
          marginBottom: "0.75rem",
        }}
      >
        Appointment Details
      </h3>

      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
          background: "var(--color-cream)",
          padding: "1.25rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border-soft)",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <dt style={{ fontSize: "0.75rem", color: "var(--color-charcoal-muted)" }}>Date & Time</dt>
          <dd style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-charcoal)", margin: "0.25rem 0 0" }}>
            {displayDate}
          </dd>
          <dd style={{ fontSize: "0.8125rem", color: "var(--color-maroon)", margin: "0.125rem 0 0", fontWeight: 500 }}>
            {slot.slotLabel} IST (20 minutes)
          </dd>
        </div>

        <div>
          <dt style={{ fontSize: "0.75rem", color: "var(--color-charcoal-muted)" }}>Patient</dt>
          <dd style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-charcoal)", margin: "0.25rem 0 0" }}>
            {patient.fullName} (Age: {patient.age})
          </dd>
          <dd style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-soft)", margin: "0.125rem 0 0" }}>
            {patient.emailAddress} · {patient.mobileNumber}
          </dd>
        </div>

        <div>
          <dt style={{ fontSize: "0.75rem", color: "var(--color-charcoal-muted)" }}>Attending Physician</dt>
          <dd style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-charcoal)", margin: "0.25rem 0 0" }}>
            {APP_CONFIG.doctor.name}
          </dd>
          <dd style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-soft)", margin: "0.125rem 0 0" }}>
            {APP_CONFIG.doctor.title}
          </dd>
        </div>

        <div>
          <dt style={{ fontSize: "0.75rem", color: "var(--color-charcoal-muted)" }}>Payment Reference</dt>
          <dd style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-charcoal)", margin: "0.25rem 0 0", fontFamily: "monospace" }}>
            {appointment.razorpay_payment_id || "Verified"}
          </dd>
          <dd style={{ fontSize: "0.8125rem", color: "#2E7D32", margin: "0.125rem 0 0" }}>
            Status: Confirmed & Paid
          </dd>
        </div>
      </dl>

      {/* Patient Preparation Instructions */}
      <div
        style={{
          background: "var(--color-ivory)",
          border: "1px solid var(--color-border-soft)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem",
          marginBottom: "1.75rem",
          lineHeight: 1.6,
          fontSize: "0.8125rem",
          color: "var(--color-charcoal-soft)",
        }}
      >
        <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-charcoal)", margin: "0 0 0.5rem" }}>
          How to prepare for your consultation:
        </h4>
        <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <li>
            Please join the Google Meet room <strong>3 to 5 minutes before</strong> your scheduled time ({slot.slotLabel} IST).
          </li>
          <li>
            Keep recent medical records, lab test reports, scans, and past prescription slips handy.
          </li>
          <li>
            Ensure you are in a quiet room with sufficient lighting and a reliable internet connection.
          </li>
          <li>
            Confirmation and instructions have also been sent to <strong>{patient.emailAddress}</strong>.
          </li>
          <li>
            Need to reschedule? You can reschedule once at least {APP_CONFIG.rescheduleWindowHours} hours before the appointment.
          </li>
        </ul>
      </div>

      {/* Action Footer */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary btn-sm"
          style={{ gap: "0.375rem" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print / Save Receipt
        </button>

        <Link href="/" className="btn btn-ghost btn-sm">
          Return to Home Page →
        </Link>
      </div>
    </div>
  );
}
