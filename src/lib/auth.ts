import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "drdhondup_admin_session";
const DEFAULT_SECRET = process.env.ADMIN_AUTH_SECRET || "dr-dhondup-secure-admin-secret-key-2026";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "drdhondup.tashi@gmail.com";

// Cryptographic Salt & PBKDF2 SHA-512 Hash for Production Admin Password
const ADMIN_PASSWORD_SALT = process.env.ADMIN_PASSWORD_SALT || "drdhondup_clinic_2026_salt";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "dc1c64f0720ce8171ab9c7a63d52ec0032d361afb2ebe02f2191b7e28c42a18ea14cafa29d14fa69e2375beef15e7cd5cba19265d6852fa3de44c03028574dd2";

/**
 * Checks if the provided identifier matches authorized physician/admin usernames or emails.
 */
export function isAllowedAdminIdentifier(identifier: string): boolean {
  if (!identifier) return false;
  const normalized = identifier.trim().toLowerCase();
  const allowed = [
    "doctortashi",
    "doctortashi@drdhondup.com",
    ADMIN_EMAIL.toLowerCase(),
    (process.env.DOCTOR_EMAIL || "dhontash@gmail.com").toLowerCase(),
    (process.env.DOCTOR_NOTIFICATION_EMAIL || "dhontash@gmail.com").toLowerCase(),
    (process.env.ADMIN_NOTIFICATION_EMAIL || "sheraptenzin98@gmail.com").toLowerCase(),
    "dhontash@gmail.com",
    "sheraptenzin98@gmail.com",
  ];
  return allowed.includes(normalized);
}

// Backward-compatible alias
export const isAllowedAdminEmail = isAllowedAdminIdentifier;

/**
 * Validates password against salted PBKDF2 hash using timing-safe comparison.
 */
export function verifyAdminPassword(password: string): boolean {
  if (!password) return false;
  try {
    const computedHash = crypto.pbkdf2Sync(password, ADMIN_PASSWORD_SALT, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(ADMIN_PASSWORD_HASH, "hex"));
  } catch {
    return false;
  }
}

/**
 * Creates a signed session token.
 */
export function createSessionToken(email: string): string {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days persistent login
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

export { SESSION_COOKIE_NAME, ADMIN_EMAIL };
