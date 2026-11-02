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
  const [sendingNotes, setSendingNotes] = useState(false);
  const [notesSuccessNotice, setNotesSuccessNotice] = useState(false);
  const [notesSentNotice, setNotesSentNotice] = useState<string | null>(null);

  // Admin Reschedule Modal State
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<AppointmentRecord | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("18:30");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockingDate, setBlockingDate] = useState(false);
  const [todayStr, setTodayStr] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // PWA & Mobile Web App State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");
  const [syncingNow, setSyncingNow] = useState(false);

  // Fetch all appointments for instant client-side tab switching
  const loadAppointments = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/appointments?status=all`);
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
  }, [router]);

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

  // Master refresh function
  const refreshAll = useCallback(
    async (silent = false) => {
      if (!silent) setSyncingNow(true);
      try {
        await Promise.all([loadAppointments(), loadOverrides()]);
        const now = new Date();
        setLastSyncedAt(
          now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        );
      } finally {
        if (!silent) setSyncingNow(false);
      }
    },
    [loadAppointments, loadOverrides]
  );

  // PWA Service Worker Registration & Installation Prompt Handler
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        reg.update();
      }).catch((err) => {
        console.warn("SW registration note:", err);
      });
    }

    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIos(isAppleDevice);

    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem("pwa_dismissed")) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);

    if (isAppleDevice && !isStandaloneMode && !sessionStorage.getItem("pwa_dismissed")) {
      setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, []);

  // Background Live Sync (every 25 seconds + on window focus)
  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
    refreshAll(false);

    const interval = setInterval(() => {
      refreshAll(true);
    }, 25000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshAll(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [refreshAll]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallBanner(false);
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      alert(
        "To install on your iPhone / iPad:\n\n1. Tap the Share button at the bottom of Safari (square with arrow ⎋).\n2. Scroll down and tap 'Add to Home Screen' (⊕).\n3. Tap 'Add' in the top-right."
      );
    } else {
      alert(
        "To install on this device: Open your browser settings menu (⋮ or ⋯) and click 'Install app' or 'Add to Home screen'."
      );
    }
  };

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

  const handleSendNotesToPatient = async () => {
    if (!selectedAppointmentForNotes) return;
    if (!doctorNotesInput?.trim()) {
      alert("Please write clinical diagnosis/observations before sending.");
      return;
    }

    setSendingNotes(true);
    setNotesSentNotice(null);
    try {
      // 1. Save notes first
      await fetch(`/api/admin/appointments/${selectedAppointmentForNotes.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorNotes: doctorNotesInput,
          prescriptionNotes: prescriptionInput,
        }),
      });

      // 2. Dispatch email with styled note and digital signature
      const res = await fetch(`/api/admin/appointments/${selectedAppointmentForNotes.id}/send-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorNotes: doctorNotesInput,
          prescriptionNotes: prescriptionInput,
          patientEmail: selectedAppointmentForNotes.patients?.email,
          patientName: selectedAppointmentForNotes.patients?.name,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotesSentNotice(data.message || "Prescription note sent to patient successfully!");
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
        }, 1800);
      } else {
        alert(data.error || "Failed to send prescription note.");
      }
    } catch (err) {
      console.error("Error sending notes:", err);
      alert("Network error sending prescription note.");
    } finally {
      setSendingNotes(false);
    }
  };

  const openRescheduleModal = (apt: AppointmentRecord) => {
    setSelectedAppointmentForReschedule(apt);
    setRescheduleDate(apt.appointment_date);
    setRescheduleSlot(apt.slot_time || "19:00");
    setRescheduleReason("");
    setRescheduleError(null);
  };

  const handleConfirmAdminReschedule = async () => {
    if (!selectedAppointmentForReschedule || !rescheduleDate || !rescheduleSlot) return;
    setRescheduling(true);
    setRescheduleError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${selectedAppointmentForReschedule.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newDate: rescheduleDate,
          newSlotTime: rescheduleSlot,
          reason: rescheduleReason.trim() || "Doctor administrative schedule change",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRescheduleError(data.error || "Failed to reschedule appointment.");
        return;
      }

      setActionSuccessNotice(
        `✓ Consultation rescheduled to ${rescheduleDate} at ${rescheduleSlot} IST. Updated notification email sent to ${selectedAppointmentForReschedule.patients?.name || "patient"}.`
      );
      setTimeout(() => setActionSuccessNotice(null), 6000);

      setSelectedAppointmentForReschedule(null);
      loadAppointments();
    } catch {
      setRescheduleError("Network error while rescheduling.");
    } finally {
      setRescheduling(false);
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

  const todayCount = appointments.filter((a) => a.appointment_date === todayStr && a.status !== "cancelled").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const allActiveCount = appointments.filter((a) => a.status !== "cancelled").length;

  // Instant in-memory filter: Only confirmed and completed consultations are shown
  const displayedAppointments = appointments.filter((apt) => {
    if (apt.status === "cancelled") return false;
    if (statusFilter === "today") return apt.appointment_date === todayStr;
    if (statusFilter === "confirmed") return apt.status === "confirmed";
    if (statusFilter === "completed") return apt.status === "completed";
    return true;
  });

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
            {/* Live Sync Status indicator */}
            <button
              onClick={() => refreshAll(false)}
              disabled={syncingNow}
              className="btn btn-secondary btn-sm"
              style={{ gap: "0.35rem", fontSize: "0.8rem" }}
              title="Click to force sync live appointments"
              id="admin-live-sync-btn"
            >
              <span className="live-sync-pulse" aria-hidden="true" />
              <span>{syncingNow ? "Syncing..." : lastSyncedAt ? `Live (${lastSyncedAt})` : "Live Sync"}</span>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{
                  transform: syncingNow ? "rotate(360deg)" : "none",
                  transition: "transform 0.6s linear",
                }}
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>

            {/* PWA App Install Action */}
            {!isStandalone ? (
              <button
                onClick={handleInstallClick}
                className="btn btn-secondary btn-sm"
                style={{ gap: "0.35rem", color: "var(--color-maroon)", fontWeight: 600, borderColor: "rgba(123,45,62,0.3)" }}
                title="Install Dr. Tashi Portal as Mobile Web App"
                id="header-install-pwa-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="5" y="2" width="14" height="20" rx="3" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                Install App
              </button>
            ) : (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(46,125,50,0.1)",
                  color: "#2E7D32",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                📱 App Mode
              </span>
            )}

            <button
              onClick={handleProcessReminders}
              disabled={processingReminders}
              className="btn btn-secondary btn-sm"
              style={{ gap: "0.375rem" }}
              title="Process and send any due 1-minute payment reminders"
              id="admin-sync-reminders-btn"
            >
              {processingReminders ? "Checking..." : "⚡ Reminders"}
            </button>
            <Link href="/" target="_blank" className="btn btn-ghost btn-sm" style={{ gap: "0.375rem" }}>
              Patient Site
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" id="admin-logout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container admin-main-mobile-padding" style={{ paddingBlock: "1.5rem" }}>
        {/* PWA Mobile Web App Install Banner */}
        {showInstallBanner && !isStandalone && (
          <div className="admin-pwa-banner" role="region" aria-label="Install Physician Web App">
            <div className="admin-pwa-banner-content">
              <div className="admin-pwa-banner-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="5" y="2" width="14" height="20" rx="3" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <div>
                <h3 className="admin-pwa-banner-title">
                  {isIos ? "Add Dr. Tashi Portal to Home Screen" : "Install Dr. Tashi Physician Web App"}
                </h3>
                <p className="admin-pwa-banner-subtitle">
                  {isIos
                    ? "Install on your iPhone: Tap the Share button (⎋), then select 'Add to Home Screen' for 1-tap clinic access."
                    : "Install on your phone or computer for 1-tap clinic access, full-screen view, and instant schedule updates."}
                </p>
              </div>
            </div>
            <div className="admin-pwa-banner-actions">
              <button
                onClick={handleInstallClick}
                className="admin-pwa-install-btn"
                id="install-pwa-banner-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isIos ? "How to Install" : "Install App"}
              </button>
              <button
                onClick={() => {
                  setShowInstallBanner(false);
                  sessionStorage.setItem("pwa_dismissed", "true");
                }}
                className="admin-pwa-dismiss-btn"
                title="Dismiss"
                aria-label="Dismiss install banner"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Action / Reschedule Success Notice */}
        {actionSuccessNotice && (
          <div
            style={{
              background: "#E8F5E9",
              border: "1px solid #A5D6A7",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1.25rem",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
              color: "#2E7D32",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            role="status"
          >
            <span>{actionSuccessNotice}</span>
            <button
              onClick={() => setActionSuccessNotice(null)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
            >
              ✕
            </button>
          </div>
        )}

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
          <div
            onClick={() => {
              setActiveTab("consultations");
              setStatusFilter("today");
            }}
            className="card card-padded"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              cursor: "pointer",
              border: statusFilter === "today" && activeTab === "consultations" ? "2px solid var(--color-maroon)" : "1px solid var(--color-border-soft)",
              transition: "all 0.2s ease",
            }}
            role="button"
            tabIndex={0}
            title="Click to view Today's Consultations"
          >
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-charcoal-muted)", fontWeight: 600 }}>
              Today&apos;s Clinic (Click to View)
            </span>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--color-maroon)", fontWeight: 600 }}>
              {todayCount}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-soft)" }}>Slots: 7:00, 7:20, 7:40 PM IST</span>
          </div>

          <div
            onClick={() => {
              setActiveTab("consultations");
              setStatusFilter("all");
            }}
            className="card card-padded"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              cursor: "pointer",
              border: statusFilter === "all" && activeTab === "consultations" ? "2px solid var(--color-maroon)" : "1px solid var(--color-border-soft)",
              transition: "all 0.2s ease",
            }}
            role="button"
            tabIndex={0}
            title="Click to view All Consultations"
          >
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-charcoal-muted)", fontWeight: 600 }}>
              All Active Bookings
            </span>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--color-charcoal)", fontWeight: 600 }}>
              {allActiveCount}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#2E7D32" }}>Confirmed & Completed</span>
          </div>

          <div
            onClick={() => setActiveTab("schedule")}
            className="card card-padded"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              cursor: "pointer",
              border: activeTab === "schedule" ? "2px solid var(--color-maroon)" : "1px solid var(--color-border-soft)",
              transition: "all 0.2s ease",
            }}
            role="button"
            tabIndex={0}
            title="Click to manage blocked dates"
          >
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
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", margin: 0 }}>
                  {statusFilter === "today"
                    ? `Today's Consultations (${todayCount})`
                    : statusFilter === "confirmed"
                    ? `Confirmed Upcoming (${confirmedCount})`
                    : statusFilter === "completed"
                    ? `Completed Consultations (${completedCount})`
                    : `All Consultations (${allActiveCount})`}
                </h2>
                <div className="admin-filter-buttons">
                  {[
                    { id: "today", label: `📅 Today's Clinic (${todayCount})` },
                    { id: "all", label: `All (${allActiveCount})` },
                    { id: "confirmed", label: `Upcoming (${confirmedCount})` },
                    { id: "completed", label: `Completed (${completedCount})` },
                  ].map((tabItem) => (
                    <button
                      key={tabItem.id}
                      onClick={() => setStatusFilter(tabItem.id)}
                      className={cn(
                        "btn btn-sm",
                        statusFilter === tabItem.id ? "btn-primary" : "btn-secondary"
                      )}
                      style={{
                        position: "relative",
                        fontWeight: statusFilter === tabItem.id ? 600 : 400,
                      }}
                    >
                      {tabItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="card card-padded" style={{ textAlign: "center", color: "var(--color-charcoal-soft)" }}>
                  Loading consultation records...
                </div>
              ) : displayedAppointments.length === 0 ? (
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
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--color-charcoal)" }}>
                    {statusFilter === "today"
                      ? "No consultations scheduled for today"
                      : statusFilter === "pending_payment"
                      ? "No pending payment verifications"
                      : "No consultations found"}
                  </h3>
                  <p style={{ maxWidth: "460px", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>
                    {statusFilter === "today"
                      ? "There are currently no patients booked for today's evening clinic slots."
                      : "Your Supabase database is connected and listening for live bookings. New appointments appear here automatically."}
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {statusFilter !== "all" && (
                      <button onClick={() => setStatusFilter("all")} className="btn btn-secondary btn-sm">
                        View All Appointments
                      </button>
                    )}
                    <Link href="/book" target="_blank" className="btn btn-primary btn-sm">
                      Open Patient Booking Page
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {displayedAppointments.map((apt) => {
                    const hasNotes = !!apt.consultation_notes?.doctor_notes;
                    const isConfirmed = apt.status === "confirmed";

                  return (
                    <div
                      key={apt.id}
                      className="card card-padded"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        borderLeft: isConfirmed ? "4px solid #2E7D32" : "4px solid var(--color-saffron)",
                      }}
                    >
                      <div className="admin-card-header" style={{ width: "100%", gap: "0.375rem" }}>
                        <div className="admin-card-patient-info" style={{ width: "100%", flex: "none", margin: 0, padding: 0 }}>
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
                            {(apt.consultation_fee === 0 || apt.reason_for_consultation?.includes("[1st Free Consultation]")) && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  padding: "0.15rem 0.55rem",
                                  borderRadius: "var(--radius-full)",
                                  background: "#ECFDF5",
                                  color: "#065F46",
                                  border: "1px solid #A7F3D0",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span>🎁 1st Free Consultation (₹0)</span>
                              </span>
                            )}
                            {(apt.consultation_fee === 400 || apt.consultation_fee === 500 || apt.reason_for_consultation?.includes("[Family Head / Father Initiative]")) && (
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
                                <span>Family Head Subsidy (₹{apt.consultation_fee || 500})</span>
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: "0.85rem", color: "var(--color-charcoal-soft)", wordBreak: "break-word", lineHeight: 1.5, margin: 0 }}>
                            Age: {apt.patients?.age} · Phone: {apt.patients?.phone} · Email: {apt.patients?.email}
                          </p>

                          {/* 1-Tap Mobile Patient Quick Actions: Call, WhatsApp, Email */}
                          {apt.patients?.phone && (() => {
                            const cleanPhone = apt.patients.phone.replace(/[^0-9]/g, "");
                            const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                            const waMsg = encodeURIComponent(
                              `Tashi Delek / Hello ${apt.patients.name || ""}, this is Dr. Dhondup Tashi regarding your consultation scheduled for ${apt.appointment_date} at ${apt.slot_time} IST.`
                            );
                            return (
                              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.35rem", marginBottom: "0.15rem", flexWrap: "wrap", alignItems: "center" }}>
                                <a
                                  href={`tel:${apt.patients.phone}`}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: "0.22rem 0.55rem", fontSize: "0.75rem", gap: "0.3rem" }}
                                  title="Call patient phone"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                  </svg>
                                  Call
                                </a>
                                <a
                                  href={`https://wa.me/${waPhone}?text=${waMsg}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: "0.22rem 0.55rem", fontSize: "0.75rem", gap: "0.3rem", color: "#2E7D32", borderColor: "rgba(46,125,50,0.3)" }}
                                  title="Chat with patient on WhatsApp"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                  </svg>
                                  WhatsApp
                                </a>
                                <a
                                  href={`mailto:${apt.patients.email}`}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: "0.22rem 0.55rem", fontSize: "0.75rem", gap: "0.3rem" }}
                                  title="Send email to patient"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                  </svg>
                                  Email
                                </a>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Slot badge */}
                        <div className="admin-card-slot-badge" style={{ marginTop: 0 }}>
                          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", fontWeight: 600, color: "var(--color-maroon)", margin: 0 }}>
                            {apt.appointment_date} · {apt.slot_time} IST
                          </p>
                          <p style={{ fontSize: "0.75rem", color: apt.consultation_fee === 0 ? "#065F46" : "var(--color-charcoal-muted)", fontWeight: apt.consultation_fee === 0 ? 600 : 400, margin: 0 }}>
                            {apt.consultation_fee === 0
                              ? "Fee: FREE (₹0 · 1st Free)"
                              : `Fee: ₹${apt.consultation_fee} (${apt.payment_status})`}
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

                      {/* Teleconsultation & Google Meet Room Section */}
                      {apt.google_meet_link ? (
                        <div className="admin-meet-active-box">
                          <div className="admin-meet-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
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
                              🗓️ Doctor: Dhontash@gmail.com
                            </span>
                          </div>

                          <div className="admin-meet-link-row">
                            <code style={{ fontSize: "0.82rem", color: "#1B5E20", fontWeight: 600, wordBreak: "break-all", flex: 1, minWidth: 0 }}>
                              {apt.google_meet_link}
                            </code>
                            <button
                              onClick={() => handleCopyMeetLink(apt.id, apt.google_meet_link!)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", gap: "0.25rem", flexShrink: 0 }}
                              title="Copy Google Meet link"
                            >
                              {copiedMeetId === apt.id ? "✓ Copied!" : "📋 Copy"}
                            </button>
                          </div>

                          <div className="admin-meet-actions">
                            <a
                              href={apt.google_meet_link}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-primary btn-sm admin-meet-action-btn"
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
                              className="btn btn-secondary btn-sm admin-meet-action-btn"
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
                              className="btn btn-ghost btn-sm admin-meet-action-btn"
                              style={{ fontSize: "0.78rem", color: "var(--color-charcoal-soft)", gap: "0.25rem" }}
                              title="Re-send Google Calendar invite to Dhontash@gmail.com"
                            >
                              {syncingCalendarId === apt.id ? "Syncing..." : "🔄 Re-sync Calendar to Dhontash@gmail.com"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="admin-meet-pending-box" style={{ width: "100%", boxSizing: "border-box" }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: "0.85rem", color: "var(--color-charcoal)", fontWeight: 600, display: "block" }}>
                              📹 Google Meet Consultation Room
                            </span>
                            <span style={{ fontSize: "0.78rem", color: "var(--color-charcoal-muted)", display: "block", marginTop: "0.15rem" }}>
                              Google Meet room & Calendar invite will be automatically dispatched to Dhontash@gmail.com upon payment verification.
                            </span>
                          </div>
                          <button
                            onClick={() => handleSyncCalendar(apt.id)}
                            disabled={syncingCalendarId === apt.id}
                            className="btn btn-secondary btn-sm admin-meet-pending-btn"
                            style={{ maxWidth: "100%", whiteSpace: "normal", wordBreak: "break-word", textAlign: "center" }}
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
                            <>
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

                              <button
                                onClick={() => openRescheduleModal(apt)}
                                className="btn btn-secondary btn-sm"
                                style={{ gap: "0.375rem", color: "var(--color-maroon)", fontWeight: 600 }}
                                title="Reschedule this consultation to another date and slot"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                📅 Reschedule
                              </button>
                            </>
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

              {notesSentNotice && (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid #10B981",
                    color: "#065F46",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8125rem",
                    marginTop: "0.5rem",
                  }}
                >
                  ✓ {notesSentNotice}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => setSelectedAppointmentForNotes(null)}
                  className="btn btn-secondary"
                  disabled={savingNotes || sendingNotes}
                >
                  Cancel
                </button>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={handleSaveNotes}
                    className="btn btn-secondary"
                    disabled={savingNotes || sendingNotes}
                    title="Save notes internally without sending email"
                  >
                    {savingNotes ? "Saving..." : "Save Only"}
                  </button>
                  <button
                    onClick={handleSendNotesToPatient}
                    className="btn btn-primary"
                    disabled={savingNotes || sendingNotes}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: "var(--color-maroon)" }}
                    title="Save notes and send formatted prescription note with signature to patient"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span>{sendingNotes ? "Sending..." : "Send to Patient"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN RESCHEDULE MODAL */}
      {selectedAppointmentForReschedule && (
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
          aria-labelledby="reschedule-title"
        >
          <div
            className="card card-padded"
            style={{
              width: "100%",
              maxWidth: "520px",
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
                <h3 id="reschedule-title" style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", margin: 0 }}>
                  Reschedule Consultation
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-soft)", margin: "0.25rem 0 0" }}>
                  Patient: {selectedAppointmentForReschedule.patients?.name || "Patient"} · Current: {selectedAppointmentForReschedule.appointment_date} ({selectedAppointmentForReschedule.slot_time} IST)
                </p>
              </div>
              <button
                onClick={() => setSelectedAppointmentForReschedule(null)}
                className="btn btn-ghost btn-sm"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {rescheduleError && (
              <div
                style={{
                  background: "#FFEBEE",
                  color: "#C62828",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8125rem",
                  marginBottom: "1rem",
                  border: "1px solid #FFCDD2",
                }}
              >
                ⚠️ {rescheduleError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  htmlFor="reschedule-date"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}
                >
                  Select New Date
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  min={todayStr || new Date().toISOString().split("T")[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="input"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="reschedule-slot"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}
                >
                  Select New Consultation Slot (IST)
                </label>
                <select
                  id="reschedule-slot"
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                  className="input"
                  style={{ width: "100%", background: "#FFFFFF" }}
                >
                  <option value="18:30">6:30 PM – 6:50 PM IST</option>
                  <option value="18:50">6:50 PM – 7:10 PM IST</option>
                  <option value="19:10">7:10 PM – 7:30 PM IST</option>
                  <option value="19:30">7:30 PM – 7:50 PM IST</option>
                  <option value="19:50">7:50 PM – 8:10 PM IST</option>
                  <option value="20:10">8:10 PM – 8:30 PM IST</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="reschedule-reason"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}
                >
                  Reason / Administrative Note (Optional)
                </label>
                <input
                  id="reschedule-reason"
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Doctor schedule shift, patient requested timing change"
                  className="input"
                  style={{ width: "100%" }}
                />
              </div>

              <div
                style={{
                  background: "#E8F5E9",
                  border: "1px solid #A5D6A7",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.625rem 0.875rem",
                  fontSize: "0.78rem",
                  color: "#2E7D32",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>ℹ️ An updated confirmation email with the Google Meet link will be automatically dispatched to the patient ({selectedAppointmentForReschedule.patients?.email || "patient"}).</span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedAppointmentForReschedule(null)}
                  className="btn btn-secondary"
                  disabled={rescheduling}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdminReschedule}
                  className="btn btn-primary"
                  disabled={rescheduling}
                >
                  {rescheduling ? "Rescheduling..." : "Confirm Reschedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile PWA Bottom Navigation Bar */}
      <nav className="admin-mobile-bottom-nav" aria-label="Doctor Mobile Navigation">
        <button
          onClick={() => {
            setActiveTab("consultations");
            setStatusFilter("today");
          }}
          className={cn("admin-mobile-nav-item", activeTab === "consultations" && statusFilter === "today" && "active")}
          aria-label="Today's consultations"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Today</span>
          {todayCount > 0 && (
            <span className="admin-mobile-nav-badge">{todayCount}</span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("consultations");
            setStatusFilter("all");
          }}
          className={cn("admin-mobile-nav-item", activeTab === "consultations" && statusFilter === "all" && "active")}
          aria-label="All consultations"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>All ({allActiveCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={cn("admin-mobile-nav-item", activeTab === "schedule" && "active")}
          aria-label="Schedule and leaves"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Leaves</span>
          {overrides.length > 0 && (
            <span className="admin-mobile-nav-badge">{overrides.length}</span>
          )}
        </button>
      </nav>
    </div>
  );
}
