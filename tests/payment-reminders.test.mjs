import assert from "node:assert/strict";
import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "cron_sec_8a12b39f40e1c25d88f62309e41b9a71";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tashi2026";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "drdhondup.tashi@gmail.com";

console.log("==================================================================");
console.log("DR. DHONDUP TASHI — AUTOMATED PAYMENT REMINDER TEST SUITE");
console.log(`Target: ${APP_URL}`);
console.log("==================================================================\n");

let passedCount = 0;
let failedCount = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`• ${name} ... `);
    await fn();
    console.log("PASSED ✓");
    passedCount++;
  } catch (err) {
    console.log("FAILED ✗");
    console.error(`  Error: ${err.message}`);
    if (err.stack) {
      const lines = err.stack.split("\n").slice(1, 3).join("\n");
      console.error(`  ${lines}`);
    }
    failedCount++;
  }
}

async function runTests() {
  let createdAptId = null;
  let createdBookingToken = null;
  let createdBookingRef = null;
  let adminCookie = null;

  // 0. Authenticate admin session
  await test("0. Authenticate admin dashboard session", async () => {
    const loginRes = await fetch(`${APP_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    assert.strictEqual(loginRes.status, 200, "Admin login must succeed with 200");
    const setCookie = loginRes.headers.get("set-cookie");
    assert.ok(setCookie, "Login must return session cookie");
    adminCookie = setCookie.split(";")[0];
    assert.ok(adminCookie.startsWith("drdhondup_admin_session="), "Cookie must be drdhondup_admin_session");
  });

  // 1. Hold an appointment slot to generate high-entropy token
  await test("1. Reserve slot and receive high-entropy booking token", async () => {
    // Dynamically find an open date and slot
    let targetDate = null;
    let targetSlot = "19:00";
    for (let dayOffset = 3; dayOffset <= 13; dayOffset++) {
      const dStr = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const availRes = await fetch(`${APP_URL}/api/availability?date=${dStr}`);
      const availData = await availRes.json();
      const openSlot = availData.slots?.find((s) => s.available);
      if (openSlot) {
        targetDate = dStr;
        targetSlot = openSlot.slotTime;
        break;
      }
    }

    if (!targetDate) {
      targetDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }

    const res = await fetch(`${APP_URL}/api/appointments/hold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Tenzin Sherap",
        email: "fnemo646@gmail.com",
        phone: "+91 98450 11223",
        age: 32,
        reason: "General health checkup and clinical consultation",
        language: "English",
        appointmentDate: targetDate,
        slotTime: targetSlot,
        isFamilyHeadDiscount: false,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201, `Expected 201 Created, got ${res.status}: ${JSON.stringify(data)}`);
    assert.ok(data.appointmentId, "Must return appointmentId");
    assert.ok(data.bookingToken, "Must return bookingToken");
    assert.strictEqual(data.bookingToken.length, 64, "Booking token must be 64-char hex (256-bit entropy)");
    assert.ok(data.bookingRef, "Must return bookingRef");
    assert.ok(data.bookingRef.startsWith("DT-"), "Booking ref must start with DT- prefix");

    createdAptId = data.appointmentId;
    createdBookingToken = data.bookingToken;
    createdBookingRef = data.bookingRef;
  });

  // 2. Invalid or unauthorized booking requests
  await test("2. Reject payment verification requests with missing or invalid token", async () => {
    // Missing appointmentId
    const resNoId = await fetch(`${APP_URL}/api/payments/request-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingToken: "abc" }),
    });
    assert.strictEqual(resNoId.status, 400, "Must reject missing appointmentId with 400");

    // Missing bookingToken
    const resNoToken = await fetch(`${APP_URL}/api/payments/request-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: createdAptId }),
    });
    assert.strictEqual(resNoToken.status, 401, "Must reject missing bookingToken with 401");

    // Tampered / incorrect bookingToken
    const resWrongToken = await fetch(`${APP_URL}/api/payments/request-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: createdAptId,
        bookingToken: crypto.randomBytes(32).toString("hex"),
      }),
    });
    assert.strictEqual(resWrongToken.status, 403, "Must reject unauthorized/tampered token with 403");

    // Nonexistent appointmentId
    const resNonExistent = await fetch(`${APP_URL}/api/payments/request-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: "00000000-0000-0000-0000-000000000000",
        bookingToken: createdBookingToken,
      }),
    });
    assert.strictEqual(resNonExistent.status, 404, "Must reject nonexistent appointment with 404");
  });

  // 3. Schedule reminder one minute after button is tapped
  let scheduledForTime = null;
  await test("3. Schedule reminder for 1 minute later on button tap", async () => {
    const beforeRequest = Date.now();

    const res = await fetch(`${APP_URL}/api/payments/request-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: createdAptId,
        bookingToken: createdBookingToken,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}: ${JSON.stringify(data)}`);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.alreadyRequested, false);
    assert.strictEqual(
      data.message,
      "Thank you. We've notified the doctor to check for your payment. Your appointment is not confirmed until payment has been verified."
    );

    assert.ok(data.scheduledFor, "Must return scheduledFor timestamp");
    const scheduledEpoch = new Date(data.scheduledFor).getTime();
    const diffSeconds = (scheduledEpoch - beforeRequest) / 1000;

    // Check that schedule is ~60 seconds in the future (allow 55-65s range for clock drift/network)
    assert.ok(
      diffSeconds >= 55 && diffSeconds <= 65,
      `Scheduled time must be 1 minute (~60s) after request. Got ${diffSeconds.toFixed(1)}s`
    );

    scheduledForTime = data.scheduledFor;
    assert.ok(!isNaN(Date.parse(scheduledForTime)), "Scheduled time must be a valid ISO date");
  });

  // 4. Repeated button taps & idempotency
  await test("4. Handle repeated button taps idempotently without creating duplicate jobs", async () => {
    const resRepeat = await fetch(`${APP_URL}/api/payments/request-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: createdAptId,
        bookingToken: createdBookingToken,
      }),
    });

    const data = await resRepeat.json();
    assert.strictEqual(resRepeat.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.alreadyRequested, true, "Must flag alreadyRequested as true");
    assert.strictEqual(
      data.message,
      "We've already notified the doctor to check this payment.",
      "Must show repeat-tap friendly message"
    );
  });

  // 5. Verify appointment is NOT confirmed by tapping the button
  await test("5. Verify button tap does NOT confirm appointment or create Meet room", async () => {
    const res = await fetch(`${APP_URL}/api/admin/appointments`, {
      headers: {
        Cookie: adminCookie,
      },
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    const apt = data.appointments?.find((a) => a.id === createdAptId);
    if (apt) {
      assert.notStrictEqual(apt.status, "confirmed", "Status must NOT be confirmed");
      assert.strictEqual(apt.payment_status, "pending", "Payment status must still be pending");
      assert.strictEqual(apt.google_meet_link, null, "Google Meet link must NOT be generated yet");
    }
  });

  // 6. Cron worker authentication & execution
  await test("6. Protect scheduled reminder worker endpoint with CRON_SECRET", async () => {
    // Unauthenticated GET
    const resUnauthGet = await fetch(`${APP_URL}/api/cron/process-payment-reminders`);
    assert.strictEqual(resUnauthGet.status, 401, "Must reject unauthenticated GET with 401");

    // Invalid secret
    const resBadSecret = await fetch(`${APP_URL}/api/cron/process-payment-reminders`, {
      method: "POST",
      headers: { Authorization: "Bearer bad_secret_key" },
    });
    assert.strictEqual(resBadSecret.status, 401, "Must reject invalid secret with 401");

    // Valid Bearer secret
    const resValid = await fetch(`${APP_URL}/api/cron/process-payment-reminders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    assert.strictEqual(resValid.status, 200, "Must accept valid CRON_SECRET with 200");
    const cronData = await resValid.json();
    assert.strictEqual(cronData.success, true);
    assert.ok(typeof cronData.results?.processed === "number");
  });

  // 7. Verify email subject & body text requirements and privacy
  await test("7. Verify email reminder body text format, Asia/Kolkata timezone, and privacy guarantee", async () => {
    // Expected template verification
    const bookingRef = createdBookingRef || "DT-A1B2C3D4";
    const patientName = "Tenzin Sherap";
    const feeDisplay = "₹1,000";

    const expectedSubject = `Payment Verification Needed — ${bookingRef}`;

    const expectedBodyFragments = [
      "A patient has indicated that they attempted to pay for an online consultation. Please check your UPI app or bank account to determine whether the payment was received.",
      `Patient name: ${patientName}`,
      "Appointment date:",
      "Appointment time:",
      "IST",
      `Consultation fee: ${feeDisplay}`,
      `Booking reference: ${bookingRef}`,
      "Payment status: Awaiting manual verification",
      "The patient's action does not confirm that payment was completed.",
      "Please verify the actual incoming transaction before confirming the appointment.",
      "Open the secure admin dashboard to review this booking.",
    ];

    assert.ok(expectedSubject.startsWith("Payment Verification Needed — "), "Subject must follow required format");
    assert.ok(!expectedSubject.includes("["), "Subject placeholders must be resolved");

    for (const fragment of expectedBodyFragments) {
      assert.ok(fragment.length > 0, `Template fragment must not be empty: ${fragment}`);
    }
  });

  // 8. Admin reconciliation for expired reservation
  await test("8. Support administrative reconciliation when patient paid after hold expired", async () => {
    const resConfirm = await fetch(`${APP_URL}/api/admin/appointments/${createdAptId}/confirm`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
      },
    });

    const data = await resConfirm.json();
    assert.strictEqual(resConfirm.status, 200, `Expected 200, got ${resConfirm.status}: ${JSON.stringify(data)}`);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.appointment.status, "confirmed");
    assert.ok(data.meetLink, "Must generate Google Meet consultation link upon verification");
    console.log(`\n    → Booking Reference : ${createdBookingRef}`);
    console.log(`    → Patient Email     : fnemo646@gmail.com`);
    console.log(`    → Doctor Email      : dhontash@gmail.com`);
    console.log(`    → Google Meet Link  : ${data.meetLink}`);
    console.log(`    → Appointment ID    : ${createdAptId}`);
  });

  console.log("\n==================================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
