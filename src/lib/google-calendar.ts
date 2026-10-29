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
  calendarUrl?: string | null;
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
 * Automatically invites Dr. Dhondup Tashi (dhontash@gmail.com) and the patient,
 * updating both calendars via Google Calendar notifications.
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
      calendarUrl: null,
      isMock: true,
    };
  }

  try {
    const auth = getOAuthClient();
    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const doctorEmail =
      process.env.DOCTOR_EMAIL ||
      process.env.DOCTOR_NOTIFICATION_EMAIL ||
      "dhontash@gmail.com";

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
      `Doctor Account: ${doctorEmail}`,
      `Patient Instructions: Please join 5 minutes early with any recent lab reports or medical history.`,
    ]
      .filter(Boolean)
      .join("\n");

    // Construct attendee list ensuring Dr. Dhondup (dhontash@gmail.com) has direct calendar & Meet access
    const attendees: Array<{ email: string; displayName?: string }> = [
      {
        email: doctorEmail,
        displayName: `${APP_CONFIG.doctor.name} (Physician)`,
      },
    ];

    if (params.patientEmail) {
      attendees.push({
        email: params.patientEmail,
        displayName: params.patientName,
      });
    }

    if (
      process.env.ADMIN_NOTIFICATION_EMAIL &&
      process.env.ADMIN_NOTIFICATION_EMAIL.toLowerCase() !== doctorEmail.toLowerCase()
    ) {
      attendees.push({
        email: process.env.ADMIN_NOTIFICATION_EMAIL,
        displayName: "Consultation Admin",
      });
    }

    const res = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      sendUpdates: "all", // Dispatches calendar invite directly to dhontash@gmail.com and adds to their Google Calendar
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
        attendees,
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
      calendarUrl: event.htmlLink || null,
      isMock: false,
    };
  } catch (err) {
    console.error("[Google Calendar] Failed to create Google Calendar event:", err);
    // Return graceful fallback so user flow is uninterrupted
    return {
      eventId: null,
      meetLink: fallbackMeetLink,
      calendarUrl: null,
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
      sendUpdates: "all",
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
      sendUpdates: "all",
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
