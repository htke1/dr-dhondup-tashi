"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";
import FamilyHeadIcon from "@/components/FamilyHeadIcon";

interface PatientInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
}

interface ClinicalNote {
  id?: string;
  doctor_notes: string;
  prescription_notes?: string | null;
  updated_at?: string;
}

interface PaymentReminderInfo {
  id: string;
  reminder_type: string;
  scheduled_for: string;
  delivery_status: "pending" | "processing" | "sent" | "failed";
  attempt_count: number;
  last_error: string | null;
  sent_at: string | null;
}

interface AppointmentRecord {
  id: string;
  appointment_date: string;
  slot_time: string;
  status: string;
  consultation_fee: number;
  payment_status: string;
  payment_check_requested_at?: string | null;
  hold_expires_at?: string | null;
  payment_verification_reminder?: PaymentReminderInfo | null;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  google_meet_link: string | null;
  google_calendar_event_id?: string | null;
  reason_for_consultation: string | null;
  preferred_language: string | null;
  patients: PatientInfo | null;
  consultation_notes: ClinicalNote | null;
}

function formatDateTimeIST(isoStr?: string | null): string {
  if (!isoStr) return "—";
  try {
    return (
      new Date(isoStr).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " IST"
    );
  } catch {
    return isoStr;
  }
}

interface ScheduleOverride {
  id: string;
  override_date: string;
  is_available: boolean;
  reason: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"consultations" | "schedule">("consultations");
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDevMock, setIsDevMock] = useState(false);

  // Clinical Notes Modal State
  const [selectedAppointmentForNotes, setSelectedAppointmentForNotes] = useState<AppointmentRecord | null>(null);
  const [doctorNotesInput, setDoctorNotesInput] = useState("");
  const [prescriptionInput, setPrescriptionInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSuccessNotice, setNotesSuccessNotice] = useState(false);

  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockingDate, setBlockingDate] = useState(false);
  const [todayStr, setTodayStr] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Fetch appointments
  const loadAppointments = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/appointments?status=${statusFilter}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
        setIsDevMock(!!data.isDevelopmentMock);
      }
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, router]);

  // Fetch schedule overrides
  const loadOverrides = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/schedule-overrides");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.overrides) {
        setOverrides(data.overrides);
      }
    } catch (err) {
      console.error("Failed to load overrides:", err);
    }
  }, [router]);

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
    loadAppointments();
    loadOverrides();
  }, [loadAppointments, loadOverrides]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const openNotesModal = (apt: AppointmentRecord) => {
    setSelectedAppointmentForNotes(apt);
    setDoctorNotesInput(apt.consultation_notes?.doctor_notes || "");
    setPrescriptionInput(apt.consultation_notes?.prescription_notes || "");
    setNotesSuccessNotice(false);
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointmentForNotes) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/appointments/${selectedAppointmentForNotes.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorNotes: doctorNotesInput,
          prescriptionNotes: prescriptionInput,
        }),
      });

      if (res.ok) {
        setNotesSuccessNotice(true);
        // Refresh local appointments state
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === selectedAppointmentForNotes.id
              ? {
                  ...apt,
                  consultation_notes: {
                    doctor_notes: doctorNotesInput,
                    prescription_notes: prescriptionInput,
                    updated_at: new Date().toISOString(),
                  },
                }
              : apt
          )
        );
        setTimeout(() => {
          setSelectedAppointmentForNotes(null);
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleUpdateStatus = async (aptId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/appointments/${aptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === aptId ? { ...a, status: newStatus } : a))
        );
      }
    } catch (err) {
      console.error("Failed to update appointment status:", err);
    }
  };

  const handleConfirmUpiAppointment = async (aptId: string) => {
    setConfirmingId(aptId);
    try {
      const res = await fetch(`/api/admin/appointments/${aptId}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === aptId
              ? {
                  ...a,
                  status: "confirmed",
                  payment_status: "paid",
                  google_meet_link: data.meetLink || a.google_meet_link,
                }
              : a
          )
        );
      } else {
        alert(data.error || "Failed to confirm appointment");
      }
    } catch (err) {
      console.error("Failed to confirm UPI appointment:", err);
    } finally {
      setConfirmingId(null);
    }
  };

  const [syncingCalendarId, setSyncingCalendarId] = useState<string | null>(null);
  const [copiedMeetId, setCopiedMeetId] = useState<string | null>(null);

  const handleCopyMeetLink = (aptId: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedMeetId(aptId);
    setTimeout(() => setCopiedMeetId(null), 2500);
  };

  const handleSyncCalendar = async (aptId: string) => {
    setSyncingCalendarId(aptId);
    try {
      const res = await fetch(`/api/admin/appointments/${aptId}/sync-calendar`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === aptId
              ? {
                  ...a,
                  google_meet_link: data.meetLink || a.google_meet_link,
                  google_calendar_event_id: data.calendarEventId || a.google_calendar_event_id,
                }
              : a
          )
        );
        alert("Google Meet link created and Google Calendar invite sent to Dhontash@gmail.com!");
      } else {
        alert(data.error || "Failed to sync calendar");
      }
    } catch (err) {
      console.error("Sync calendar error:", err);
      alert("Error synchronizing with Google Calendar.");
    } finally {
      setSyncingCalendarId(null);
    }
  };

  const [processingReminders, setProcessingReminders] = useState(false);
  const [remindersNotice, setRemindersNotice] = useState<string | null>(null);

  const handleProcessReminders = async () => {
    setProcessingReminders(true);
    setRemindersNotice(null);
    try {
      const res = await fetch("/api/cron/process-payment-reminders", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setRemindersNotice(data.message || "Processed due payment reminders.");
        loadAppointments();
      } else {
        setRemindersNotice(data.error || "Failed to trigger reminder worker.");
      }
    } catch {
      setRemindersNotice("Network error processing reminders.");
    } finally {
      setProcessingReminders(false);
    }
  };

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) return;
    setBlockingDate(true);
    try {
      const res = await fetch("/api/admin/schedule-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: blockDate,
          reason: blockReason || "Doctor unavailable",
          isAvailable: false,
        }),
      });
      if (res.ok) {
        setBlockDate("");
        setBlockReason("");
        loadOverrides();
      }
    } catch (err) {
      console.error("Error blocking date:", err);
    } finally {
      setBlockingDate(false);
    }
  };

  const handleUnblockDate = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/admin/schedule-overrides?date=${dateStr}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadOverrides();
      }
    } catch (err) {
      console.error("Error unblocking date:", err);
    }
  };

  const todayCount = appointments.filter((a) => a.appointment_date === todayStr).length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-ivory)" }}>
      {/* Top Navbar */}
      <header
        style={{
          background: "var(--color-cream)",
          borderBottom: "1px solid var(--color-border-soft)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <div className="container admin-header-inner">
          <div className="admin-header-brand">
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.25rem",
                color: "var(--color-maroon)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {APP_CONFIG.doctor.name}
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "var(--color-maroon-muted)",
                  color: "var(--color-maroon)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "var(--radius-sm)",
                  whiteSpace: "nowrap",
                }}
              >
                Portal
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.2rem 0.55rem",
                  borderRadius: "var(--radius-full)",
                  background: isDevMock ? "var(--color-saffron-pale)" : "#E8F5E9",
                  color: isDevMock ? "var(--color-saffron)" : "#2E7D32",
                  border: isDevMock ? "1px solid rgba(196,127,58,0.3)" : "1px solid #A5D6A7",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: isDevMock ? "var(--color-saffron)" : "#2E7D32",
                  }}
                />
                {isDevMock ? "Mock" : "Connected"}
              </span>
            </div>
          </div>

          <div className="admin-header-actions">
            <button
              onClick={handleProcessReminders}
              disabled={processingReminders}
              className="btn btn-secondary btn-sm"
              style={{ gap: "0.375rem" }}
              title="Process and send any due 1-minute payment reminders"
              id="admin-sync-reminders-btn"
            >
              {processingReminders ? "Checking Queue..." : "⚡ Sync Payment Reminders"}
            </button>
            <Link href="/" target="_blank" className="btn btn-ghost btn-sm" style={{ gap: "0.375rem" }}>
              View Patient Site
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" id="admin-logout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ paddingBlock: "1.5rem" }}>
        {remindersNotice && (
          <div
            style={{
              background: "#E8F5E9",
              border: "1px solid #A5D6A7",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1.25rem",
              marginBottom: "1.5rem",
              fontSize: "0.85rem",
              color: "#2E7D32",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            role="status"
          >
            <span>⚡ {remindersNotice}</span>
            <button
              onClick={() => setRemindersNotice(null)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
            >
              ✕
            </button>
          </div>
        )}

        {isDevMock && (
          <div
            style={{
              background: "var(--color-saffron-pale)",
              border: "1px solid rgba(196,127,58,0.25)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1.25rem",
              marginBottom: "1.5rem",
              fontSize: "0.8125rem",
              color: "var(--color-charcoal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <span>
              <strong>Development Mode:</strong> Displaying mock consultation records. Connect Supabase in `.env.local` for production database storage.
            </span>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="admin-kpi-grid">
          <div className="card card-padded" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-charcoal-muted)", fontWeight: 600 }}>
              Today&apos;s Appointments
            </span>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--color-maroon)", fontWeight: 600 }}>
              {todayCount}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-soft)" }}>Slots: 7:00, 7:20, 7:40 PM IST</span>
          </div>

          <div className="card card-padded" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-charcoal-muted)", fontWeight: 600 }}>
              Confirmed Consultations
            </span>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--color-charcoal)", fontWeight: 600 }}>
              {confirmedCount}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#2E7D32" }}>Verified payment received</span>
          </div>

          <div className="card card-padded" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-charcoal-muted)", fontWeight: 600 }}>
              Blocked Dates
            </span>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--color-saffron)", fontWeight: 600 }}>
              {overrides.length}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-soft)" }}>Vacations / hospital duty</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tab-bar" role="tablist">
          <button
            onClick={() => setActiveTab("consultations")}
            className={cn("btn btn-ghost admin-tab-btn", activeTab === "consultations" && "selected")}
            style={{
              borderRadius: "var(--radius-md) var(--radius-md) 0 0",
              borderBottom: activeTab === "consultations" ? "2px solid var(--color-maroon)" : "2px solid transparent",
              fontWeight: activeTab === "consultations" ? 600 : 400,
              color: activeTab === "consultations" ? "var(--color-maroon)" : "var(--color-charcoal-soft)",
            }}
            role="tab"
            aria-selected={activeTab === "consultations"}
          >
            Consultation Schedule
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={cn("btn btn-ghost admin-tab-btn", activeTab === "schedule" && "selected")}
            style={{
              borderRadius: "var(--radius-md) var(--radius-md) 0 0",
              borderBottom: activeTab === "schedule" ? "2px solid var(--color-maroon)" : "2px solid transparent",
              fontWeight: activeTab === "schedule" ? 600 : 400,
              color: activeTab === "schedule" ? "var(--color-maroon)" : "var(--color-charcoal-soft)",
            }}
            role="tab"
            aria-selected={activeTab === "schedule"}
          >
            Blocked Dates & Availability
          </button>
        </div>

        {/* TAB 1: CONSULTATIONS */}
        {activeTab === "consultations" && (
          <div>
            {/* Filter bar */}
            <div className="admin-filter-bar">
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", margin: 0 }}>Upcoming Patients</h2>
              <div className="admin-filter-buttons">
                {["all", "confirmed", "pending_payment"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "btn btn-sm",
                      statusFilter === status ? "btn-primary" : "btn-secondary"
                    )}
                    style={{ textTransform: "capitalize" }}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="card card-padded" style={{ textAlign: "center", color: "var(--color-charcoal-soft)" }}>
                Loading consultation records...
              </div>
            ) : appointments.length === 0 ? (
              <div
                className="card card-padded"
                style={{
                  textAlign: "center",
                  padding: "3rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "var(--color-charcoal-soft)",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--color-cream-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-maroon)",
                    marginBottom: "0.25rem",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--color-charcoal)" }}>
                  No consultations booked yet
                </h3>
                <p style={{ maxWidth: "460px", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>
                  Your Supabase PostgreSQL database is connected and listening for live bookings. Once a patient completes checkout, their record, clinical intake, and Google Meet room will appear here automatically.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <Link href="/book" target="_blank" className="btn btn-primary btn-sm">
                    Open Patient Booking Page
                  </Link>
                  <button onClick={() => setActiveTab("schedule")} className="btn btn-secondary btn-sm">
                    Test Blocked Dates
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {appointments.map((apt) => {
                  const hasNotes = !!apt.consultation_notes?.doctor_notes;
                  const isConfirmed = apt.status === "confirmed";

                  return (
                    <div
                      key={apt.id}
                      className="card card-padded"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        borderLeft: isConfirmed ? "4px solid #2E7D32" : "4px solid var(--color-saffron)",
                      }}
                    >
                      <div className="admin-card-header">
                        <div className="admin-card-patient-info">
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                            <h3 style={{ fontSize: "1.15rem", fontWeight: 600, margin: 0 }}>
                              {apt.patients?.name || "Patient Record"}
                            </h3>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                padding: "0.15rem 0.5rem",
                                borderRadius: "var(--radius-full)",
                                background: isConfirmed ? "#E8F5E9" : "var(--color-saffron-pale)",
                                color: isConfirmed ? "#2E7D32" : "var(--color-saffron)",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {apt.status.replace("_", " ")}
                            </span>
                            {apt.preferred_language && (
                              <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-muted)", whiteSpace: "nowrap" }}>
                                🌐 {apt.preferred_language}
                              </span>
                            )}
                            {(apt.consultation_fee === 500 || apt.reason_for_consultation?.includes("[Family Head / Father Initiative]")) && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  padding: "0.15rem 0.55rem",
                                  borderRadius: "var(--radius-full)",
                                  background: "var(--color-maroon-muted)",
                                  color: "var(--color-maroon)",
                                  border: "1px solid rgba(123,45,62,0.25)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <FamilyHeadIcon size={14} />
                                <span>Family Head Subsidy (₹500)</span>
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: "0.85rem", color: "var(--color-charcoal-soft)", wordBreak: "break-word", lineHeight: 1.5, margin: 0 }}>
                            Age: {apt.patients?.age} · Phone: {apt.patients?.phone} · Email: {apt.patients?.email}
                          </p>
                        </div>

                        {/* Slot badge */}
                        <div className="admin-card-slot-badge">
                          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", fontWeight: 600, color: "var(--color-maroon)", margin: 0 }}>
                            {apt.appointment_date} · {apt.slot_time} IST
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-charcoal-muted)", margin: 0 }}>
                            Fee: ₹{apt.consultation_fee} ({apt.payment_status})
                          </p>
                        </div>
                      </div>

                      {/* Reason */}
                      {apt.reason_for_consultation && (
                        <div
                          style={{
                            background: "var(--color-cream-soft)",
                            padding: "0.625rem 0.875rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--color-border-soft)",
                            fontSize: "0.875rem",
                          }}
                        >
                          <strong style={{ color: "var(--color-charcoal)" }}>Chief complaint / reason:</strong>{" "}
                          <span style={{ color: "var(--color-charcoal-mid)" }}>{apt.reason_for_consultation}</span>
                        </div>
                      )}

                      {/* Manual UPI Payment Verification Notice & Action */}
                      {(apt.payment_check_requested_at ||
                        apt.payment_verification_reminder ||
                        apt.status === "pending_payment" ||
                        (apt.status === "cancelled" && (apt.payment_check_requested_at || apt.payment_verification_reminder))) &&
                        apt.status !== "completed" && (() => {
                          const isExpiredHold =
                            (apt.status === "cancelled" ||
                              (apt.hold_expires_at && new Date(apt.hold_expires_at) < new Date())) &&
                            apt.status !== "confirmed";
                          const bookingRef = apt.razorpay_order_id?.startsWith("UPI-REF:")
                            ? apt.razorpay_order_id.slice(8)
                            : `DT-${apt.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;
                          const reminder = apt.payment_verification_reminder;

                          return (
                            <div
                              className="admin-upi-box"
                              style={{
                                background: isExpiredHold ? "#FFF8E1" : undefined,
                                borderColor: isExpiredHold ? "#FFE082" : undefined,
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: "1.1rem" }}>{isConfirmed ? "🟢" : isExpiredHold ? "⚠️" : "🟡"}</span>
                                  <strong style={{ color: isConfirmed ? "#2E7D32" : "#B78103", fontSize: "0.925rem" }}>
                                    {isConfirmed
                                      ? "Payment Verified & Appointment Confirmed"
                                      : isExpiredHold
                                      ? "Expired Reservation — Reconciliation Available"
                                      : "Payment Verification Required"}
                                  </strong>
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      padding: "0.15rem 0.5rem",
                                      borderRadius: "4px",
                                      background: isConfirmed ? "#E8F5E9" : "rgba(196,127,58,0.15)",
                                      color: isConfirmed ? "#2E7D32" : "var(--color-maroon)",
                                    }}
                                  >
                                    {isConfirmed ? "Paid" : "Awaiting manual verification"}
                                  </span>
                                </div>

                                {/* Summary Grid */}
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                    gap: "0.5rem 1rem",
                                    fontSize: "0.8125rem",
                                    color: "var(--color-charcoal)",
                                    margin: "0.5rem 0",
                                    background: "#FFFFFF",
                                    padding: "0.65rem 0.85rem",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--color-border-soft)",
                                  }}
                                >
                                  <div>
                                    <span style={{ color: "var(--color-charcoal-muted)", display: "block", fontSize: "0.75rem" }}>
                                      Patient Name
                                    </span>
                                    <strong>{apt.patients?.name || "Patient"}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: "var(--color-charcoal-muted)", display: "block", fontSize: "0.75rem" }}>
                                      Booking Reference
                                    </span>
                                    <code style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-maroon)" }}>
                                      {bookingRef}
                                    </code>
                                  </div>
                                  <div>
                                    <span style={{ color: "var(--color-charcoal-muted)", display: "block", fontSize: "0.75rem" }}>
                                      Appointment
                                    </span>
                                    <span>{apt.appointment_date} · {apt.slot_time} IST</span>
                                  </div>
                                  <div>
                                    <span style={{ color: "var(--color-charcoal-muted)", display: "block", fontSize: "0.75rem" }}>
                                      Expected Fee
                                    </span>
                                    <strong style={{ color: "var(--color-maroon)" }}>
                                      ₹{apt.consultation_fee}
                                    </strong>
                                  </div>
                                  <div>
                                    <span style={{ color: "var(--color-charcoal-muted)", display: "block", fontSize: "0.75rem" }}>
                                      Reminder Scheduled Time
                                    </span>
                                    <span>
                                      {reminder?.scheduled_for
                                        ? formatDateTimeIST(reminder.scheduled_for)
                                        : apt.payment_check_requested_at
                                        ? "1 min after tap"
                                        : "Not scheduled"}
                                    </span>
                                  </div>
                                  <div>
                                    <span style={{ color: "var(--color-charcoal-muted)", display: "block", fontSize: "0.75rem" }}>
                                      Reminder Delivery Status
                                    </span>
                                    <span
                                      style={{
                                        display: "inline-block",
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        padding: "0.1rem 0.45rem",
                                        borderRadius: "3px",
                                        background:
                                          reminder?.delivery_status === "sent"
                                            ? "#E8F5E9"
                                            : reminder?.delivery_status === "failed"
                                            ? "#FFEBEE"
                                            : reminder?.delivery_status === "processing"
                                            ? "#E3F2FD"
                                            : "#FFF8E1",
                                        color:
                                          reminder?.delivery_status === "sent"
                                            ? "#2E7D32"
                                            : reminder?.delivery_status === "failed"
                                            ? "#C62828"
                                            : reminder?.delivery_status === "processing"
                                            ? "#1565C0"
                                            : "#E65100",
                                      }}
                                    >
                                      {reminder?.delivery_status || (apt.payment_check_requested_at ? "pending" : "none")}
                                    </span>
                                  </div>
                                </div>

                                <p style={{ margin: "0.35rem 0 0", fontSize: "0.78rem", color: "var(--color-charcoal-soft)" }}>
                                  {isConfirmed
                                    ? "Payment verified against bank account. Google Meet link dispatched to patient."
                                    : "Check your UPI app (dhontash@okicici) or bank statement before confirming. The patient's button tap is a reminder only and does not prove payment."}
                                </p>
                              </div>

                              {!isConfirmed && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                                  <button
                                    onClick={() => handleConfirmUpiAppointment(apt.id)}
                                    disabled={confirmingId === apt.id}
                                    className="btn btn-primary btn-sm admin-upi-action-btn"
                                    id={`confirm-btn-${apt.id}`}
                                  >
                                    {confirmingId === apt.id
                                      ? "Verifying & Generating Meet..."
                                      : isExpiredHold
                                      ? "⚖️ Reconcile & Confirm Payment"
                                      : "✓ Mark Verified & Confirm Appointment"}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      {/* Teleconsultation & Google Meet Room Section */}
                      {apt.google_meet_link ? (
                        <div
                          style={{
                            background: "#F4FBF7",
                            border: "1.5px solid #A5D6A7",
                            borderRadius: "var(--radius-sm)",
                            padding: "0.875rem 1rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.625rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontSize: "1.2rem" }}>📹</span>
                              <strong style={{ color: "#1B5E20", fontSize: "0.95rem" }}>
                                Google Meet Video Consultation
                              </strong>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "4px",
                                  background: "#E8F5E9",
                                  color: "#2E7D32",
                                }}
                              >
                                Active Room
                              </span>
                            </div>
                            <span style={{ fontSize: "0.78rem", color: "#2E7D32", fontWeight: 600 }}>
                              🗓️ Doctor Account: Dhontash@gmail.com
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              flexWrap: "wrap",
                              background: "#FFFFFF",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "6px",
                              border: "1px solid #C8E6C9",
                            }}
                          >
                            <code style={{ fontSize: "0.85rem", color: "#1B5E20", fontWeight: 600, wordBreak: "break-all", flex: 1 }}>
                              {apt.google_meet_link}
                            </code>
                            <button
                              onClick={() => handleCopyMeetLink(apt.id, apt.google_meet_link!)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", gap: "0.25rem" }}
                              title="Copy Google Meet link"
                            >
                              {copiedMeetId === apt.id ? "✓ Copied!" : "📋 Copy"}
                            </button>
                          </div>

                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                            <a
                              href={apt.google_meet_link}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-primary btn-sm"
                              style={{ background: "#2E7D32", borderColor: "#2E7D32", gap: "0.375rem" }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                              </svg>
                              Join Video Consultation
                            </a>

                            <a
                              href="https://calendar.google.com/calendar"
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ gap: "0.375rem" }}
                              title="Open Google Calendar"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              Open Google Calendar
                            </a>

                            <button
                              onClick={() => handleSyncCalendar(apt.id)}
                              disabled={syncingCalendarId === apt.id}
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: "0.78rem", color: "var(--color-charcoal-soft)", gap: "0.25rem" }}
                              title="Re-send Google Calendar invite to Dhontash@gmail.com"
                            >
                              {syncingCalendarId === apt.id ? "Syncing..." : "🔄 Re-sync Calendar to Dhontash@gmail.com"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            background: "var(--color-cream-soft)",
                            border: "1px dashed var(--color-border-soft)",
                            borderRadius: "var(--radius-sm)",
                            padding: "0.75rem 1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "0.85rem", color: "var(--color-charcoal)", fontWeight: 600, display: "block" }}>
                              📹 Google Meet Consultation Room
                            </span>
                            <span style={{ fontSize: "0.78rem", color: "var(--color-charcoal-muted)" }}>
                              Google Meet room & Calendar invite will be automatically dispatched to Dhontash@gmail.com upon payment verification.
                            </span>
                          </div>
                          <button
                            onClick={() => handleSyncCalendar(apt.id)}
                            disabled={syncingCalendarId === apt.id}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: "0.375rem" }}
                          >
                            {syncingCalendarId === apt.id ? "Setting up..." : "⚡ Set Up Google Meet & Calendar Now"}
                          </button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="admin-card-actions">
                        <div>
                          {apt.google_meet_link && (
                            <span style={{ fontSize: "0.8125rem", color: "#2E7D32", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2E7D32", display: "inline-block" }}></span>
                              Google Meet Room Ready
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {apt.status === "confirmed" && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, "completed")}
                              className="btn btn-secondary btn-sm"
                              style={{ gap: "0.375rem", color: "#1B5E20" }}
                              title="Mark consultation as completed"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Mark Completed
                            </button>
                          )}
                          <button
                            onClick={() => openNotesModal(apt)}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: "0.375rem" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9"/>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            {hasNotes ? "Edit Clinical Notes" : "+ Add Private Notes"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCHEDULE OVERRIDES / BLOCK DATES */}
        {activeTab === "schedule" && (
          <div className="admin-schedule-grid">
            {/* Form to block date */}
            <div className="card card-padded">
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "0.5rem" }}>
                Block an Unavailable Date
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)", marginBottom: "1.5rem" }}>
                Block specific calendar dates when you will be in rural surgery, medical camps, or traveling. Blocked dates will immediately appear unavailable to patients.
              </p>

              <form onSubmit={handleBlockDate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label
                    htmlFor="block-date"
                    style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.375rem" }}
                  >
                    Select Date
                  </label>
                  <input
                    id="block-date"
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    required
                    className="input"
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="block-reason"
                    style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.375rem" }}
                  >
                    Reason / Description (optional)
                  </label>
                  <input
                    id="block-reason"
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="e.g. Gaden Jangtse Hospital Camp, Travel"
                    className="input"
                    style={{ width: "100%" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={blockingDate}
                  className="btn btn-primary"
                  style={{ justifyContent: "center" }}
                >
                  {blockingDate ? "Saving..." : "Block Date for Consultations"}
                </button>
              </form>
            </div>

            {/* List of blocked dates */}
            <div className="card card-padded">
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "0.5rem" }}>
                Currently Blocked Dates
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)", marginBottom: "1.5rem" }}>
                Patients cannot select any slots on these dates.
              </p>

              {overrides.length === 0 ? (
                <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-muted)" }}>
                  No dates are currently blocked. Your default schedule (daily 7:00 – 8:00 PM IST) is active.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {overrides.map((ovr) => (
                    <div
                      key={ovr.override_date}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-cream-soft)",
                        border: "1px solid var(--color-border-soft)",
                      }}
                    >
                      <div>
                        <strong style={{ display: "block", fontSize: "0.95rem" }}>{ovr.override_date}</strong>
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-soft)" }}>
                          {ovr.reason || "Doctor unavailable"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUnblockDate(ovr.override_date)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: "var(--color-maroon)" }}
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* CLINICAL NOTES MODAL */}
      {selectedAppointmentForNotes && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
          role="dialog"
          aria-labelledby="notes-title"
        >
          <div
            className="card card-padded"
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "var(--color-cream)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h3 id="notes-title" style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem" }}>
                  Private Clinical Notes
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-soft)" }}>
                  Patient: {selectedAppointmentForNotes.patients?.name} · Slot: {selectedAppointmentForNotes.appointment_date} (
                  {selectedAppointmentForNotes.slot_time} IST)
                </p>
              </div>
              <button
                onClick={() => setSelectedAppointmentForNotes(null)}
                className="btn btn-ghost btn-sm"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Privacy reminder */}
            <div
              style={{
                background: "var(--color-maroon-muted)",
                border: "1px solid rgba(123,45,62,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "0.5rem 0.75rem",
                fontSize: "0.75rem",
                color: "var(--color-maroon)",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>
                <strong>Confidential:</strong> These notes are stored under strict database RLS and are never shared with the patient or third parties.
              </span>
            </div>

            {notesSuccessNotice && (
              <div
                style={{
                  background: "#E8F5E9",
                  color: "#2E7D32",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8125rem",
                  marginBottom: "1rem",
                }}
              >
                ✓ Clinical notes saved securely!
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  htmlFor="doctor-notes"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}
                >
                  Doctor Clinical Observations / Diagnosis
                </label>
                <textarea
                  id="doctor-notes"
                  rows={5}
                  value={doctorNotesInput}
                  onChange={(e) => setDoctorNotesInput(e.target.value)}
                  placeholder="Record symptoms, clinical diagnosis, follow-up advice..."
                  className="input"
                  style={{ width: "100%", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}
                />
              </div>

              <div>
                <label
                  htmlFor="prescription-notes"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}
                >
                  Prescriptions / Medication Plan
                </label>
                <textarea
                  id="prescription-notes"
                  rows={3}
                  value={prescriptionInput}
                  onChange={(e) => setPrescriptionInput(e.target.value)}
                  placeholder="Medications, dosage, duration (e.g. Tab Metformin 500mg 1-0-1 for 30 days)..."
                  className="input"
                  style={{ width: "100%", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => setSelectedAppointmentForNotes(null)}
                  className="btn btn-secondary"
                  disabled={savingNotes}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="btn btn-primary"
                  disabled={savingNotes}
                >
                  {savingNotes ? "Saving..." : "Save Clinical Notes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
