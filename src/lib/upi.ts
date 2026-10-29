import QRCode from "qrcode";
import { APP_CONFIG } from "@/lib/config";

/**
 * NPCI UPI Payment URI & QR Code Generation Module.
 * Fully encapsulated to keep payment generation separate from booking logic.
 */

export interface UpiPaymentConfig {
  vpa: string;
  recipientName: string;
  amount: number;
  currency?: string;
  bookingRef?: string;
}

export interface UpiPaymentDetails {
  vpa: string;
  recipientName: string;
  amount: number;
  amountFormatted: string;
  currency: string;
  bookingRef: string;
  upiUri: string;
  qrCodeDataUrl: string;
}

/**
 * Validates the UPI Virtual Payment Address (VPA / UPI ID).
 * E.g. dhontash@okicici
 */
export function isValidVpa(vpa: string): boolean {
  if (!vpa || typeof vpa !== "string") return false;
  const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return vpaRegex.test(vpa.trim());
}

/**
 * Validates the recipient account-holder name.
 */
export function isValidRecipientName(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Constructs a fully URL-encoded UPI payment URI.
 *
 * Requirements:
 * - pa: Payee VPA
 * - pn: Payee Name
 * - am: Amount (2 decimal places)
 * - cu: INR
 * - tn: Short, non-sensitive payment description (NO patient info, phone, or medical conditions)
 * - tr: Booking reference for transaction reconciliation
 */
export function buildUpiPaymentUri(config: UpiPaymentConfig): string {
  const vpa = config.vpa?.trim();
  const recipientName = config.recipientName?.trim();
  const amount = config.amount;
  const currency = (config.currency || "INR").trim();

  // Strict validation - Never fall back to fake values
  if (!isValidVpa(vpa)) {
    throw new Error(`Invalid UPI ID configuration: "${vpa}". Payment cannot be processed.`);
  }

  if (!isValidRecipientName(recipientName)) {
    throw new Error(`Invalid or unverified recipient name: "${recipientName}". Payment cannot be processed.`);
  }

  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid consultation fee amount: "${amount}". Amount must be a positive number.`);
  }

  const formattedAmount = amount.toFixed(2);
  
  // Clean, non-sensitive transaction note strictly containing only consultation reference
  const safeRef = config.bookingRef ? config.bookingRef.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 20) : "MED";
  const transactionNote = `Dr Tashi Consultation Ref ${safeRef}`;

  const queryParams = new URLSearchParams({
    pa: vpa,
    pn: recipientName,
    am: formattedAmount,
    cu: currency,
    tn: transactionNote,
    tr: safeRef,
  });

  return `upi://pay?${queryParams.toString()}`;
}

/**
 * Generates the QR code data URL from the validated UPI URI.
 */
export async function generateUpiQrCode(upiUri: string): Promise<string> {
  if (!upiUri || !upiUri.startsWith("upi://pay?")) {
    throw new Error("Invalid UPI URI provided for QR code generation.");
  }

  try {
    const dataUrl = await QRCode.toDataURL(upiUri, {
      errorCorrectionLevel: "M",
      type: "image/png",
      margin: 2,
      width: 320,
      color: {
        dark: "#1A1A1A",
        light: "#FFFFFF",
      },
    });
    return dataUrl;
  } catch (err: any) {
    throw new Error(`Failed to generate UPI QR code image: ${err?.message || "Unknown error"}`);
  }
}

/**
 * Server-side helper to create verified UPI payment details for an appointment.
 * Derives amount strictly from trusted server configuration / DB record.
 */
export async function createVerifiedUpiPayment(
  appointmentFee: number,
  appointmentId: string
): Promise<UpiPaymentDetails> {
  const vpa = APP_CONFIG.payment.upi.vpa;
  const recipientName = APP_CONFIG.payment.upi.recipientName;
  const currency = APP_CONFIG.payment.upi.currency;

  if (!vpa || !recipientName) {
    throw new Error("UPI payment gateway is not properly configured on the server.");
  }

  // Derive short, non-sensitive booking reference
  const bookingRef = appointmentId
    ? `DT-${appointmentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`
    : `DT-${Date.now().toString().slice(-6)}`;

  const upiUri = buildUpiPaymentUri({
    vpa,
    recipientName,
    amount: appointmentFee,
    currency,
    bookingRef,
  });

  const qrCodeDataUrl = await generateUpiQrCode(upiUri);

  return {
    vpa,
    recipientName,
    amount: appointmentFee,
    amountFormatted: `₹${appointmentFee.toLocaleString("en-IN")}`,
    currency,
    bookingRef,
    upiUri,
    qrCodeDataUrl,
  };
}
