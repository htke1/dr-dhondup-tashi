import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "drdhondup_admin_session";
const DEFAULT_SECRET = process.env.ADMIN_AUTH_SECRET || "dr-dhondup-secure-admin-secret-key-2026";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "drdhondup.tashi@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tashi2026"; // Default dev password

/**
 * Checks if the provided email matches any authorized administrative or physician email.
 */
export function isAllowedAdminEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const allowed = [
    ADMIN_EMAIL.toLowerCase(),
    (process.env.DOCTOR_EMAIL || "dhontash@gmail.com").toLowerCase(),
    (process.env.DOCTOR_NOTIFICATION_EMAIL || "dhontash@gmail.com").toLowerCase(),
    (process.env.ADMIN_NOTIFICATION_EMAIL || "sheraptenzin98@gmail.com").toLowerCase(),
    "dhontash@gmail.com",
    "sheraptenzin98@gmail.com",
  ];
  return allowed.includes(normalized);
}

/**
 * Creates a signed session token.
 */
export function createSessionToken(email: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = JSON.stringify({ email, expiresAt });
  const hmac = crypto.createHmac("sha256", DEFAULT_SECRET).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, hmac })).toString("base64");
}

/**
 * Verifies a signed session token.
 */
export function verifySessionToken(token: string): { valid: boolean; email?: string } {
  try {
    const raw = Buffer.from(token, "base64").toString("utf-8");
    const { payload, hmac } = JSON.parse(raw);
    const expectedHmac = crypto.createHmac("sha256", DEFAULT_SECRET).update(payload).digest("hex");

    if (hmac !== expectedHmac) {
      return { valid: false };
    }

    const { email, expiresAt } = JSON.parse(payload);
    if (Date.now() > expiresAt) {
      return { valid: false };
    }

    return { valid: true, email };
  } catch {
    return { valid: false };
  }
}

/**
 * Server check to determine if the current request is from an authenticated admin.
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const { valid } = verifySessionToken(token);
  return valid;
}

export { SESSION_COOKIE_NAME, ADMIN_EMAIL, ADMIN_PASSWORD };
