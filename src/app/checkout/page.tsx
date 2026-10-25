"use client";

import { useState } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { APP_CONFIG } from "@/lib/config";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function StandardCheckoutPage() {
  const [amountInRupees, setAmountInRupees] = useState<number>(1000);
  const [customerName, setCustomerName] = useState<string>("Tenzin Norbu");
  const [customerEmail, setCustomerEmail] = useState<string>("patient@example.com");
  const [customerPhone, setCustomerPhone] = useState<string>("9845012345");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    paymentId: string;
    orderId: string;
    amount: number;
    verified: boolean;
  } | null>(null);

  const activeKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

  /**
   * Dynamically loads Razorpay checkout.js script if not present
   */
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Razorpay) return resolve(true);

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existingScript) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /**
   * STEP 2: FRONTEND - Trigger Razorpay Standard Checkout
   */
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setPaymentSuccess(null);

    try {
      const amountInPaise = Math.round(amountInRupees * 100);

      if (amountInPaise < 100) {
        setErrorMessage("Amount must be at least ₹1 (100 paise).");
        setLoading(false);
        return;
      }

      // 1. Ensure Razorpay checkout script is loaded
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        setErrorMessage(
          "Failed to load Razorpay checkout gateway. Please check your internet connection."
        );
        setLoading(false);
        return;
      }

      // 2. STEP 1: Call Backend to create order
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: {
            customerName,
            customerEmail,
            purpose: "Dr. Dhondup Tashi Online Consultation",
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        setErrorMessage(orderData.error || "Failed to create payment order.");
        setLoading(false);
        return;
      }

      const { order_id, orderId, amount, currency, keyId } = orderData;
      const effectiveOrderId = order_id || orderId;
      const razorpayKey = keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_Ts0rHJnCiFLX2P";

      // 3. Configure Razorpay Standard Checkout Modal
      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency || "INR",
        name: APP_CONFIG.doctor.name,
        description: `Online Medical Consultation (${APP_CONFIG.appointmentDurationMinutes} mins)`,
        image: "/images/favicon.ico",
        order_id: effectiveOrderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: "#7B2D3E", // Tibetan Maroon
        },
        // STEP 2 & 3: Handler callback upon successful checkout
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Send payment details to verification endpoint
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setPaymentSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: amountInRupees,
                verified: true,
              });
            } else {
              setErrorMessage(
                verifyData.error ||
                  "Payment signature verification failed. Untrusted payment result."
              );
            }
          } catch {
            setErrorMessage(
              "Network error verifying payment signature with server."
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setErrorMessage("Payment checkout window was closed by the user.");
            setLoading(false);
          },
        },
      };

      // 4. Initialize and Open Razorpay Checkout Modal
      const rzpInstance = new window.Razorpay(options);

      // Handle payment failure event
      rzpInstance.on("payment.failed", function (response: any) {
        const desc =
          response.error?.description ||
          response.error?.reason ||
          "Payment processing failed.";
        setErrorMessage(`Payment declined: ${desc} (Code: ${response.error?.code || "FAILED"})`);
        setLoading(false);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      setErrorMessage("Could not initiate checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <SiteNav />
      <main
        style={{
          minHeight: "calc(100dvh - 70px)",
          background: "var(--color-ivory)",
          paddingBlock: "var(--space-3xl)",
        }}
      >
        <div className="container" style={{ maxWidth: "680px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-gold)",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Razorpay Standard Checkout
            </span>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.75rem, 3vw, 2.3rem)",
                color: "var(--color-charcoal)",
                margin: "0 0 0.5rem",
              }}
            >
              Secure Online Payment
            </h1>
            <p style={{ color: "var(--color-charcoal-soft)", fontSize: "0.9375rem" }}>
              Pay for medical consultation with Dr. Dhondup Tashi via Cards, UPI, Netbanking, or Wallets.
            </p>
          </div>

          {/* Mode Notification */}
          {activeKeyId.startsWith("rzp_live_") ? (
            <div
              style={{
                background: "#E8F5E9",
                border: "1px solid #A5D6A7",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1.25rem",
                marginBottom: "1.5rem",
                fontSize: "0.8125rem",
                color: "#1B5E20",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, color: "#2E7D32" }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <strong>Active Gateway: Razorpay Live Production Mode</strong> (<code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 4px", borderRadius: "4px" }}>{activeKeyId}</code>). Real transactions via UPI, Credit/Debit Cards, Netbanking, or Wallets will be charged and credited directly to Dr. Dhondup Tashi&apos;s verified merchant account.
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "#FFF8E1",
                border: "1px solid #FFE082",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1.25rem",
                marginBottom: "1.5rem",
                fontSize: "0.8125rem",
                color: "#6D4C41",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "#F57F17" }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong>Active Gateway: Razorpay Test Mode</strong> (<code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 4px", borderRadius: "4px" }}>{activeKeyId || "rzp_test_..."}</code>). You can use test cards or UPI to simulate transactions.
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div
              style={{
                background: "var(--color-maroon-muted)",
                border: "1px solid rgba(123,45,62,0.3)",
                borderRadius: "var(--radius-md)",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
                color: "var(--color-maroon)",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
              role="alert"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "2px" }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <div>
                <strong>Transaction Notice:</strong>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem" }}>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Card */}
          {paymentSuccess ? (
            <div
              className="card card-padded"
              style={{
                border: "2px solid #81C784",
                background: "#FFFFFF",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#E8F5E9",
                  color: "#2E7D32",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.5rem",
                  color: "#1B5E20",
                  margin: "0 0 0.5rem",
                }}
              >
                Payment Verified Successfully!
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)", marginBottom: "1.5rem" }}>
                HMAC-SHA256 signature verification succeeded. Your transaction is verified.
              </p>

              <div
                style={{
                  background: "var(--color-cream)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.25rem",
                  textAlign: "left",
                  fontSize: "0.8125rem",
                  marginBottom: "1.5rem",
                  border: "1px solid var(--color-border-soft)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-charcoal-muted)" }}>Amount Paid:</span>
                  <strong style={{ color: "var(--color-charcoal)", fontSize: "0.9375rem" }}>
                    ₹{paymentSuccess.amount.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-charcoal-muted)" }}>Payment ID:</span>
                  <code style={{ color: "var(--color-maroon)", fontWeight: 600 }}>{paymentSuccess.paymentId}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-charcoal-muted)" }}>Order ID:</span>
                  <code style={{ color: "var(--color-charcoal)", fontWeight: 600 }}>{paymentSuccess.orderId}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-charcoal-muted)" }}>Signature Verification:</span>
                  <span style={{ color: "#2E7D32", fontWeight: 600 }}>HMAC-SHA256 Match (Valid ✓)</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button
                  onClick={() => setPaymentSuccess(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Make Another Payment
                </button>
                <Link href="/book" className="btn btn-primary btn-sm">
                  Go to Appointment Booking
                </Link>
              </div>
            </div>
          ) : (
            /* Checkout Form Card */
            <div className="card card-padded">
              <form onSubmit={handlePayment} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label
                    htmlFor="checkout-amount"
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-charcoal)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Consultation Fee (INR)
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <span
                        style={{
                          position: "absolute",
                          left: "0.875rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--color-charcoal-muted)",
                          fontWeight: 600,
                        }}
                      >
                        ₹
                      </span>
                      <input
                        id="checkout-amount"
                        type="number"
                        min="1"
                        step="1"
                        value={amountInRupees}
                        onChange={(e) => setAmountInRupees(Number(e.target.value))}
                        className="input"
                        style={{ paddingLeft: "2rem", width: "100%", fontWeight: 600 }}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAmountInRupees(1000)}
                      className="btn btn-secondary btn-sm"
                    >
                      Reset ₹1,000
                    </button>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-muted)", marginTop: "0.25rem", display: "block" }}>
                    Equals {Math.round(amountInRupees * 100)} paise. Minimum amount is 100 paise (₹1).
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      htmlFor="customer-name"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--color-charcoal)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Patient / Payer Name
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="input"
                      style={{ width: "100%" }}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customer-phone"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--color-charcoal)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Mobile Contact
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="input"
                      style={{ width: "100%" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="customer-email"
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-charcoal)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Email Address for Receipt
                  </label>
                  <input
                    id="customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="input"
                    style={{ width: "100%" }}
                    required
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                  id="razorpay-checkout-btn"
                  style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
                >
                  {loading ? "Initializing Gateway..." : `Pay ₹${amountInRupees.toLocaleString("en-IN")} via Razorpay`}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                    color: "var(--color-charcoal-muted)",
                    textAlign: "center",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  256-bit SSL encrypted · Razorpay Standard Web Checkout
                </div>
              </form>
            </div>
          )}

          {/* Quick Links */}
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <Link
              href="/book"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-maroon)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              ← Back to Complete Consultation Booking Flow
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
