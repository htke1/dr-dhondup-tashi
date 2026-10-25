import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { APP_CONFIG } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
};

export default function CancellationPolicyPage() {
  return (
    <>
      <SiteNav />
      <main style={{ paddingBlock: "var(--space-4xl)", minHeight: "60vh" }}>
        <div className="container" style={{ maxWidth: "720px" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>Cancellation &amp; Refund Policy</h1>
          <p style={{ color: "var(--color-charcoal-muted)", marginBottom: "2.5rem", fontSize: "0.875rem" }}>
            Effective date: [To be set before launch]. Please review before completing your booking.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Patient cancellations</h2>
              <p>
                You are eligible for a <strong>full refund</strong> if you cancel your appointment at
                least <strong>{APP_CONFIG.cancellationRefundHours} hours</strong> before the
                scheduled start time.
              </p>
              <p style={{ marginTop: "0.5rem" }}>
                If you cancel with fewer than {APP_CONFIG.cancellationRefundHours} hours remaining,
                the consultation fee is <strong>non-refundable</strong>.
              </p>
              <p style={{ marginTop: "0.5rem" }}>
                Cancellation deadlines are calculated using the original appointment time in
                Asia/Kolkata (IST) and enforced by the server.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Doctor cancellations</h2>
              <p>
                If the doctor cancels your appointment, you will be offered either a <strong>full refund</strong> or
                the option to <strong>reschedule without additional charge</strong>.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>How to cancel</h2>
              <p>
                Use the secure booking-management link included in your confirmation email to cancel
                your appointment. Refunds are initiated to the original payment method and typically
                take 5–10 business days to appear, subject to your bank&apos;s processing times.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Refund status</h2>
              <p>
                Refunds are processed through Razorpay and tracked in our system. A refund is
                marked as completed only after it is confirmed by the payment provider — not
                merely after the request is submitted.
              </p>
            </section>

            <p style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-muted)", borderTop: "1px solid var(--color-border-soft)", paddingTop: "1rem" }}>
              This policy is subject to review for applicable legal and consumer-protection requirements
              before the service launches. For queries, contact: {APP_CONFIG.contact.email}
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
