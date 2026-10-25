import { google } from "googleapis";
import { APP_CONFIG } from "./config";

interface CalendarEventParams {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge?: number | string;
  language?: string;
  reason?: string;
  date: string;       // YYYY-MM-DD
  slotTime: string;   // HH:mm (e.g. "19:00")
}

interface CalendarEventResult {
  eventId: string | null;
  meetLink: string;
  isMock: boolean;
}

/**
 * Checks if Google Cloud OAuth credentials are fully provided.
 */
export function isGoogleCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
}

/**
 * Creates an authorized Google OAuth2 client.
 */
function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

/**
 * Generates an ISO start and end timestamp for an appointment slot in IST (+05:30).
 */
function getSlotTimestamps(date: string, slotTime: string) {
  // IST offset is +05:30
  const startIso = `${date}T${slotTime}:00+05:30`;
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + APP_CONFIG.appointmentDurationMinutes * 60 * 1000);

  // Convert to formatted string with +05:30 offset
  const endIso = endDate.toISOString();

  return {
    startDateTime: startIso,
    endDateTime: endIso,
  };
}

/**
 * Creates an event in Google Calendar with a real Google Meet video conference link.
 * Falls back to a deterministic Google Meet link if credentials are not configured.
 */
export async function createGoogleCalendarEvent(
  params: CalendarEventParams
): Promise<CalendarEventResult> {
  const fallbackMeetLink = `https://meet.google.com/drt-consult-${params.appointmentId.slice(0, 8)}`;

  if (!isGoogleCalendarConfigured()) {
    console.warn(
      "[Google Calendar] OAuth credentials not configured in environment. Using fallback Google Meet link."
    );
    return {
      eventId: null,
      meetLink: fallbackMeetLink,
      isMock: true,
    };
  }

  try {
    const auth = getOAuthClient();
    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const { startDateTime, endDateTime } = getSlotTimestamps(params.date, params.slotTime);

    const description = [
      `ONLINE MEDICAL CONSULTATION`,
      `Physician: ${APP_CONFIG.doctor.name} (${APP_CONFIG.doctor.title})`,
      `Hospital: ${APP_CONFIG.doctor.hospital}`,
      `----------------------------------------`,
      `Patient Name: ${params.patientName}`,
      `Email: ${params.patientEmail}`,
      `Phone: ${params.patientPhone}`,
      params.patientAge ? `Age: ${params.patientAge}` : "",
      params.language ? `Preferred Language: ${params.language}` : "",
      params.reason ? `Chief Complaint: ${params.reason}` : "",
      `----------------------------------------`,
      `Booking ID: ${params.appointmentId}`,
      `Consultation Duration: ${APP_CONFIG.appointmentDurationMinutes} minutes`,
      `Patient Instructions: Please join 5 minutes early with any recent lab reports or medical history.`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: `Online Consultation: ${params.patientName} — Dr. Dhondup Tashi`,
        description,
        start: {
          dateTime: startDateTime,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endDateTime,
          timeZone: "Asia/Kolkata",
        },
        attendees: [
          { email: params.patientEmail, displayName: params.patientName },
          ...(process.env.ADMIN_NOTIFICATION_EMAIL
            ? [{ email: process.env.ADMIN_NOTIFICATION_EMAIL, displayName: APP_CONFIG.doctor.name }]
            : []),
        ],
        conferenceData: {
          createRequest: {
            requestId: params.appointmentId,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 24 hours before
            { method: "popup", minutes: 15 },      // 15 mins before
          ],
        },
      },
    });

    const event = res.data;
    const meetEntryPoint = event.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    );
    const liveMeetLink = meetEntryPoint?.uri || event.hangoutLink || fallbackMeetLink;

    return {
      eventId: event.id || null,
      meetLink: liveMeetLink,
      isMock: false,
    };
  } catch (err) {
    console.error("[Google Calendar] Failed to create Google Calendar event:", err);
    // Return graceful fallback so user flow is uninterrupted
    return {
      eventId: null,
      meetLink: fallbackMeetLink,
      isMock: true,
    };
  }
}

/**
 * Cancels / deletes an event from Google Calendar.
 */
export async function deleteGoogleCalendarEvent(eventId: string): Promise<boolean> {
  if (!isGoogleCalendarConfigured() || !eventId) return false;

  try {
    const auth = getOAuthClient();
    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    await calendar.events.delete({
      calendarId,
      eventId,
    });
    return true;
  } catch (err) {
    console.error("[Google Calendar] Failed to delete event:", err);
    return false;
  }
}

/**
 * Updates event start/end times in Google Calendar for a rescheduled consultation.
 */
export async function updateGoogleCalendarEventTime(
  eventId: string,
  newDate: string,
  newSlotTime: string
): Promise<boolean> {
  if (!isGoogleCalendarConfigured() || !eventId) return false;

  try {
    const auth = getOAuthClient();
    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const { startDateTime, endDateTime } = getSlotTimestamps(newDate, newSlotTime);

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        start: {
          dateTime: startDateTime,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endDateTime,
          timeZone: "Asia/Kolkata",
        },
      },
    });
    return true;
  } catch (err) {
    console.error("[Google Calendar] Failed to patch event:", err);
    return false;
  }
}
