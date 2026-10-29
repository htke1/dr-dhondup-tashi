import { Resend } from "resend";
import { APP_CONFIG } from "./config";

interface BookingEmailData {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge?: number | string;
  preferredLanguage?: string;
  reason?: string;
  appointmentDate: string;  // YYYY-MM-DD
  slotTime: string;         // "19:00"
  googleMeetLink: string;
  googleCalendarEventId?: string | null;
}

interface RescheduleEmailData {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  previousDate: string;
  previousSlot: string;
  newDate: string;
  newSlotTime: string;
  googleMeetLink: string;
}

interface CancellationEmailData {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  appointmentDate: string;
  slotTime: string;
  isRefundEligible: boolean;
  refundAmount?: number;
}

export interface PaymentVerificationReminderData {
  appointmentId: string;
  bookingRef: string;
  patientName: string;
  appointmentDate: string;  // YYYY-MM-DD
  slotTime: string;         // "19:00"
  consultationFee?: number;
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM ||
    `"${APP_CONFIG.doctor.name}" <onboarding@resend.dev>`
  );
}

function formatDisplayDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatSlotDisplay(slotTime: string): string {
  const slot = APP_CONFIG.slots.find((s) => s.id === slotTime);
  return slot ? `${slot.label} IST` : `${slotTime} IST`;
}

/**
 * Base email layout wrapper with Tibetan color scheme (#FAF7F2, #7B2D3E, #C47F3A).
 */
function wrapEmailTemplate(contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_CONFIG.doctor.name} | Online Consultation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D2A26; line-height: 1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E6DED6; box-shadow: 0 4px 12px rgba(45, 42, 38, 0.05);">
          <!-- Top Accent Ribbon -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #7B2D3E 0%, #C47F3A 100%);"></td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px; background-color: #F3ECE2; border-bottom: 1px solid #E6DED6;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #7B2D3E; letter-spacing: -0.01em;">
                      ${APP_CONFIG.doctor.name}
                    </h1>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #6E685F;">
                      ${APP_CONFIG.doctor.title} · ${APP_CONFIG.doctor.hospital}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAF7F2; border-top: 1px solid #E6DED6; font-size: 12px; color: #8C8479; line-height: 1.6;">
              <p style="margin: 0 0 8px;">
                <strong>Medical Notice:</strong> Online consultations are suitable for general medical advice, ongoing care, and follow-ups. If you are experiencing a medical emergency (severe chest pain, breathing difficulty, acute trauma), please go to your nearest emergency department immediately.
              </p>
              <p style="margin: 0 0 8px;">
                <strong>Policies:</strong> Cancellations must be made at least ${APP_CONFIG.cancellationRefundHours} hours prior for a refund. One free reschedule is permitted at least ${APP_CONFIG.rescheduleWindowHours} hours before the appointment.
              </p>
              <p style="margin: 0; color: #A69E92;">
                © ${new Date().getFullYear()} Dr. Dhondup Tashi. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 1. Sends booking confirmation to the patient with Google Meet video room link.
 */
export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const resend = getResendClient();
  const dateStr = formatDisplayDate(data.appointmentDate);
  const timeStr = formatSlotDisplay(data.slotTime);

  const html = wrapEmailTemplate(`
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #E8F5E9; color: #2E7D32; font-size: 24px; font-weight: bold;">
        ✓
      </div>
      <h2 style="margin: 12px 0 4px; font-size: 22px; color: #2D2A26;">Consultation Confirmed</h2>
      <p style="margin: 0; font-size: 14px; color: #6E685F;">
        Your appointment with Dr. Dhondup Tashi has been scheduled and paid.
      </p>
    </div>

    <!-- Details Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; border-radius: 8px; border: 1px solid #E6DED6; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #E6DED6;">
          <span style="font-size: 11px; text-transform: uppercase; color: #8C8479; letter-spacing: 0.05em; display: block;">Booking ID</span>
          <span style="font-family: monospace; font-size: 13px; font-weight: 700; color: #2D2A26;">${data.appointmentId}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #E6DED6;">
          <span style="font-size: 11px; text-transform: uppercase; color: #8C8479; letter-spacing: 0.05em; display: block;">Date & Time</span>
          <strong style="font-size: 15px; color: #7B2D3E;">${dateStr} at ${timeStr}</strong>
          <span style="display: block; font-size: 12px; color: #6E685F; margin-top: 2px;">Duration: ${APP_CONFIG.appointmentDurationMinutes} minutes</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #E6DED6;">
          <span style="font-size: 11px; text-transform: uppercase; color: #8C8479; letter-spacing: 0.05em; display: block;">Patient</span>
          <span style="font-size: 14px; font-weight: 600; color: #2D2A26;">${data.patientName}</span>
          ${data.patientAge ? `<span style="font-size: 12px; color: #6E685F;"> (Age: ${data.patientAge})</span>` : ""}
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 20px;">
          <span style="font-size: 11px; text-transform: uppercase; color: #8C8479; letter-spacing: 0.05em; display: block;">Consultation Fee</span>
          <span style="font-size: 14px; font-weight: 600; color: #2E7D32;">${APP_CONFIG.consultationFeeDisplay} (Paid)</span>
        </td>
      </tr>
    </table>

    <!-- Google Meet Box -->
    <div style="background-color: #FFFFFF; border: 2px solid #C47F3A; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; color: #7B2D3E;">Your Google Meet Video Room</h3>
      <p style="margin: 0 0 16px; font-size: 13px; color: #6E685F;">
        Click the link below when it is time for your consultation. No special app is required.
      </p>
      <a href="${data.googleMeetLink}" target="_blank" style="display: inline-block; background-color: #7B2D3E; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 6px;">
        Join Google Meet Call
      </a>
      <p style="margin: 12px 0 0; font-size: 11px; color: #8C8479;">
        Or copy direct link: <a href="${data.googleMeetLink}" style="color: #7B2D3E;">${data.googleMeetLink}</a>
      </p>
    </div>

    <!-- Preparation Checklist -->
    <div style="font-size: 13px; color: #4A4640; line-height: 1.6; margin-bottom: 16px;">
      <h4 style="margin: 0 0 8px; font-size: 14px; color: #2D2A26;">How to Prepare:</h4>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Please join <strong>3 to 5 minutes before ${timeStr}</strong>.</li>
        <li>Have past prescriptions, lab tests, scans, or discharge summaries readily available.</li>
        <li>Ensure you are seated in a quiet room with sufficient lighting and stable internet.</li>
        <li>You will receive an automated reminder 24 hours prior to the consultation.</li>
      </ul>
    </div>
  `);

  if (!resend) {
    console.log(`[Email Mock] Booking confirmation to ${data.patientEmail} for ${dateStr} at ${timeStr}`);
    return { success: true, isMock: true };
  }

  try {
    const res = await resend.emails.send({
      from: getFromAddress(),
      to: [data.patientEmail],
      subject: `Confirmed: Consultation with Dr. Dhondup Tashi on ${dateStr}`,
      html,
    });
    return { success: true, id: res.data?.id };
  } catch (err) {
    console.error("[Email Error] Failed to send booking confirmation email:", err);
    return { success: false, error: err };
  }
}

/**
 * 2. Sends notification to Dr. Dhondup Tashi with patient clinical intake summary.
 */
export async function sendDoctorNotificationEmail(data: BookingEmailData) {
  const resend = getResendClient();
  const doctorEmail =
    process.env.DOCTOR_NOTIFICATION_EMAIL ||
    process.env.DOCTOR_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    "dhontash@gmail.com";
  const dateStr = formatDisplayDate(data.appointmentDate);
  const timeStr = formatSlotDisplay(data.slotTime);
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin`;

  const html = wrapEmailTemplate(`
    <h2 style="margin: 0 0 16px; font-size: 20px; color: #7B2D3E;">New Online Consultation Booked</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #4A4640;">
      A new patient has scheduled and paid for a teleconsultation.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; border-radius: 8px; border: 1px solid #E6DED6; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
          <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Scheduled Slot</strong>
          <span style="font-size: 15px; font-weight: 700; color: #7B2D3E;">${dateStr} · ${timeStr}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
          <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Patient Name</strong>
          <span style="font-size: 14px; font-weight: 600; color: #2D2A26;">${data.patientName}</span>
          ${data.patientAge ? `<span style="color: #6E685F;"> (Age: ${data.patientAge})</span>` : ""}
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
          <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Contact</strong>
          <span>${data.patientEmail} · ${data.patientPhone}</span>
        </td>
      </tr>
      ${
        data.preferredLanguage
          ? `<tr>
              <td style="padding: 14px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
                <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Language Preference</strong>
                <span>${data.preferredLanguage}</span>
              </td>
            </tr>`
          : ""
      }
      ${
        data.reason
          ? `<tr>
              <td style="padding: 14px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
                <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Chief Complaint / Reason</strong>
                <p style="margin: 4px 0 0; background-color: #FFFFFF; padding: 10px; border-radius: 6px; border: 1px solid #E6DED6;">
                  ${data.reason}
                </p>
              </td>
            </tr>`
          : ""
      }
      <tr>
        <td style="padding: 14px 18px; font-size: 13px;">
          <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Payment</strong>
          <span style="color: #2E7D32; font-weight: 600;">${APP_CONFIG.consultationFeeDisplay} (Verified)</span>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin-bottom: 16px;">
      <a href="${data.googleMeetLink}" target="_blank" style="display: inline-block; background-color: #7B2D3E; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 6px; margin-right: 8px;">
        Join Google Meet
      </a>
      <a href="${adminUrl}" target="_blank" style="display: inline-block; background-color: #F3ECE2; color: #7B2D3E; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 6px; border: 1px solid #C47F3A;">
        Open Physician Portal
      </a>
    </div>
  `);

  if (!resend) {
    console.log(`[Email Mock] Doctor notification sent to ${doctorEmail} for ${data.patientName}`);
    return { success: true, isMock: true };
  }

  try {
    const res = await resend.emails.send({
      from: getFromAddress(),
      to: [doctorEmail],
      subject: `New Patient: ${data.patientName} (${dateStr} at ${timeStr})`,
      html,
    });
    return { success: true, id: res.data?.id };
  } catch (err) {
    console.error("[Email Error] Failed to send doctor notification email:", err);
    return { success: false, error: err };
  }
}

/**
 * 3. 24-Hour Automated Reminder Email for the patient.
 */
export async function send24HourReminderEmail(data: BookingEmailData) {
  const resend = getResendClient();
  const dateStr = formatDisplayDate(data.appointmentDate);
  const timeStr = formatSlotDisplay(data.slotTime);

  const html = wrapEmailTemplate(`
    <h2 style="margin: 0 0 12px; font-size: 22px; color: #7B2D3E;">Consultation Reminder</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #4A4640;">
      Dear ${data.patientName}, this is a gentle reminder that your online consultation with <strong>Dr. Dhondup Tashi</strong> is scheduled for tomorrow.
    </p>

    <div style="background-color: #FAF7F2; border-left: 4px solid #C47F3A; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <span style="font-size: 11px; text-transform: uppercase; color: #8C8479; letter-spacing: 0.05em; display: block;">Appointment Time</span>
      <strong style="font-size: 16px; color: #2D2A26;">${dateStr} at ${timeStr}</strong>
      <span style="display: block; font-size: 12px; color: #6E685F; margin-top: 2px;">Duration: ${APP_CONFIG.appointmentDurationMinutes} minutes (IST)</span>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${data.googleMeetLink}" target="_blank" style="display: inline-block; background-color: #7B2D3E; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 14px; padding: 14px 32px; border-radius: 6px;">
        Join Video Consultation
      </a>
      <p style="margin: 10px 0 0; font-size: 12px; color: #8C8479;">
        Direct Link: <a href="${data.googleMeetLink}" style="color: #7B2D3E;">${data.googleMeetLink}</a>
      </p>
    </div>

    <div style="font-size: 13px; color: #4A4640; line-height: 1.6;">
      <strong>Checklist before joining:</strong>
      <ul style="margin: 6px 0 0; padding-left: 20px;">
        <li>Join from a quiet, well-lit room.</li>
        <li>Have past prescriptions and lab reports accessible.</li>
        <li>Check your camera and microphone ahead of time.</li>
      </ul>
    </div>
  `);

  if (!resend) {
    console.log(`[Email Mock] 24-hr reminder sent to ${data.patientEmail} for ${dateStr}`);
    return { success: true, isMock: true };
  }

  try {
    const res = await resend.emails.send({
      from: getFromAddress(),
      to: [data.patientEmail],
      subject: `Reminder: Consultation with Dr. Dhondup Tashi Tomorrow at ${timeStr}`,
      html,
    });
    return { success: true, id: res.data?.id };
  } catch (err) {
    console.error("[Email Error] Failed to send reminder email:", err);
    return { success: false, error: err };
  }
}

/**
 * 4. Reschedule Notification Email.
 */
export async function sendRescheduleConfirmationEmail(data: RescheduleEmailData) {
  const resend = getResendClient();
  const prevDateStr = formatDisplayDate(data.previousDate);
  const prevTimeStr = formatSlotDisplay(data.previousSlot);
  const newDateStr = formatDisplayDate(data.newDate);
  const newTimeStr = formatSlotDisplay(data.newSlotTime);

  const html = wrapEmailTemplate(`
    <h2 style="margin: 0 0 12px; font-size: 22px; color: #7B2D3E;">Consultation Rescheduled</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #4A4640;">
      Dear ${data.patientName}, your online consultation has been successfully rescheduled.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; border-radius: 8px; border: 1px solid #E6DED6; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
          <span style="color: #8C8479; display: block; font-size: 11px; text-transform: uppercase;">Previous Time</span>
          <span style="text-decoration: line-through; color: #8C8479;">${prevDateStr} at ${prevTimeStr}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; font-size: 13px;">
          <span style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">New Time</span>
          <strong style="font-size: 15px; color: #7B2D3E;">${newDateStr} at ${newTimeStr}</strong>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${data.googleMeetLink}" target="_blank" style="display: inline-block; background-color: #7B2D3E; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 6px;">
        Join Google Meet Call
      </a>
    </div>
  `);

  if (!resend) {
    console.log(`[Email Mock] Reschedule confirmation sent to ${data.patientEmail} for ${newDateStr}`);
    return { success: true, isMock: true };
  }

  try {
    const res = await resend.emails.send({
      from: getFromAddress(),
      to: [data.patientEmail],
      subject: `Rescheduled: Consultation with Dr. Dhondup Tashi on ${newDateStr}`,
      html,
    });
    return { success: true, id: res.data?.id };
  } catch (err) {
    console.error("[Email Error] Failed to send reschedule email:", err);
    return { success: false, error: err };
  }
}

/**
 * 5. Cancellation & Refund Notification Email.
 */
export async function sendCancellationEmail(data: CancellationEmailData) {
  const resend = getResendClient();
  const dateStr = formatDisplayDate(data.appointmentDate);
  const timeStr = formatSlotDisplay(data.slotTime);

  const html = wrapEmailTemplate(`
    <h2 style="margin: 0 0 12px; font-size: 22px; color: #7B2D3E;">Consultation Cancelled</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #4A4640;">
      Dear ${data.patientName}, your online consultation scheduled for <strong>${dateStr} at ${timeStr}</strong> has been cancelled.
    </p>

    <div style="background-color: #FAF7F2; padding: 16px 20px; border-radius: 8px; border: 1px solid #E6DED6; margin-bottom: 20px; font-size: 13px;">
      <span style="font-size: 11px; text-transform: uppercase; color: #8C8479; letter-spacing: 0.05em; display: block;">Refund Status</span>
      ${
        data.isRefundEligible
          ? `<strong style="color: #2E7D32; font-size: 14px;">Full Refund Initiated (${APP_CONFIG.consultationFeeDisplay})</strong>
             <p style="margin: 4px 0 0; color: #6E685F;">
               Your cancellation was received more than ${APP_CONFIG.cancellationRefundHours} hours before the appointment. A full refund will be credited back to your original payment method within 5–7 business days via Razorpay.
             </p>`
          : `<strong style="color: #C62828; font-size: 14px;">Non-Refundable</strong>
             <p style="margin: 4px 0 0; color: #6E685F;">
               Per clinic policy, cancellations made within ${APP_CONFIG.cancellationRefundHours} hours of the scheduled time are non-refundable.
             </p>`
      }
    </div>

    <p style="font-size: 13px; color: #6E685F;">
      If you wish to book a consultation at a later date, you may do so at any time on our website.
    </p>
  `);

  if (!resend) {
    console.log(`[Email Mock] Cancellation email sent to ${data.patientEmail}`);
    return { success: true, isMock: true };
  }

  try {
    const res = await resend.emails.send({
      from: getFromAddress(),
      to: [data.patientEmail],
      subject: `Cancelled: Consultation with Dr. Dhondup Tashi (${dateStr})`,
      html,
    });
    return { success: true, id: res.data?.id };
  } catch (err) {
    console.error("[Email Error] Failed to send cancellation email:", err);
    return { success: false, error: err };
  }
}

/**
 * 6. Automated Doctor Reminder for Manual UPI Payment Verification.
 * Sent 1 minute after patient taps "I've completed the payment".
 * Reminds doctor to inspect UPI app or bank account before confirming.
 * Strictly avoids patient diagnosis, medical notes, or unneeded sensitive data.
 */
export async function sendPaymentVerificationReminderEmail(
  data: PaymentVerificationReminderData
) {
  const resend = getResendClient();
  const doctorEmail =
    process.env.DOCTOR_NOTIFICATION_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    "drdhondup.tashi@gmail.com";

  const dateStr = formatDisplayDate(data.appointmentDate);
  const slotObj = APP_CONFIG.slots.find((s) => s.id === data.slotTime);
  const timeStr = slotObj ? slotObj.label : data.slotTime;
  const feeDisplay = data.consultationFee
    ? `₹${data.consultationFee.toLocaleString("en-IN")}`
    : "₹1,000";
  const bookingRef = data.bookingRef;
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin`;

  const subject = `Payment Verification Needed — ${bookingRef}`;

  const plainText = `A patient has indicated that they attempted to pay for an online consultation. Please check your UPI app or bank account to determine whether the payment was received.

Patient name: ${data.patientName}
Appointment date: ${dateStr}
Appointment time: ${timeStr} IST
Consultation fee: ${feeDisplay}
Booking reference: ${bookingRef}
Payment status: Awaiting manual verification

The patient's action does not confirm that payment was completed.

Please verify the actual incoming transaction before confirming the appointment.

Open the secure admin dashboard to review this booking:
${adminUrl}`;

  const htmlContent = `
    <div style="background-color: #FFF8E1; border: 1.5px solid #FFC107; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 18px;">🟡</span>
        <strong style="color: #B78103; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Payment Verification Needed</strong>
      </div>
      <p style="margin: 0; font-size: 14px; color: #5D4037; line-height: 1.5;">
        A patient has indicated that they attempted to pay for an online consultation. Please check your UPI app or bank account to determine whether the payment was received.
      </p>
    </div>

    <!-- Booking Summary Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; border-radius: 8px; border: 1px solid #E6DED6; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
          <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Patient Name</strong>
          <span style="font-size: 15px; font-weight: 700; color: #2D2A26;">${data.patientName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
          <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Appointment Date</strong>
          <span style="font-size: 14px; font-weight: 600; color: #7B2D3E;">${dateStr}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
          <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Appointment Time</strong>
          <span style="font-size: 14px; font-weight: 600; color: #2D2A26;">${timeStr} IST</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
          <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Consultation Fee</strong>
          <span style="font-size: 14px; font-weight: 600; color: #7B2D3E;">${feeDisplay}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #E6DED6; font-size: 13px;">
          <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Booking Reference</strong>
          <code style="font-family: monospace; font-size: 14px; font-weight: 700; color: #2D2A26;">${bookingRef}</code>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; font-size: 13px;">
          <strong style="color: #6E685F; display: block; font-size: 11px; text-transform: uppercase;">Payment Status</strong>
          <span style="display: inline-block; background-color: #FFF3E0; color: #E65100; font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 4px; border: 1px solid #FFE082;">
            Awaiting manual verification
          </span>
        </td>
      </tr>
    </table>

    <div style="background-color: #FFFFFF; border-left: 4px solid #7B2D3E; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; color: #4A4640; line-height: 1.6;">
      <p style="margin: 0 0 6px;">
        <strong>The patient's action does not confirm that payment was completed.</strong>
      </p>
      <p style="margin: 0;">
        Please verify the actual incoming transaction before confirming the appointment.
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 16px;">
      <a href="${adminUrl}" target="_blank" style="display: inline-block; background-color: #7B2D3E; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 6px; box-shadow: 0 2px 6px rgba(123,45,62,0.2);">
        Open Secure Admin Dashboard
      </a>
      <p style="margin: 8px 0 0; font-size: 11px; color: #8C8479;">
        Or go to: <a href="${adminUrl}" style="color: #7B2D3E;">${adminUrl}</a>
      </p>
    </div>
  `;

  const html = wrapEmailTemplate(htmlContent);

  if (!resend) {
    console.log(`[Email Mock] Payment verification reminder sent to ${doctorEmail} for ${bookingRef}`);
    return { success: true, isMock: true, subject, plainText };
  }

  try {
    const res = await resend.emails.send({
      from: getFromAddress(),
      to: [doctorEmail],
      subject,
      text: plainText,
      html,
    });
    return { success: true, id: res.data?.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Email Error] Failed to send payment verification reminder email:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

