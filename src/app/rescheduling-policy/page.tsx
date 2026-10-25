import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { APP_CONFIG } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rescheduling Policy",
};

export default function ReschedulingPolicyPage() {
  return (
    <>
      <SiteNav />
      <main style={{ paddingBlock: "var(--space-4xl)", minHeight: "60vh" }}>
        <div className="container" style={{ maxWidth: "720px" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>Rescheduling Policy</h1>
          <p style={{ color: "var(--color-charcoal-muted)", marginBottom: "2.5rem", fontSize: "0.875rem" }}>
            Please review before completing your booking.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>When can I reschedule?</h2>
              <p>
                You may reschedule your appointment <strong>once</strong> at no additional cost,
                provided that at least <strong>{APP_CONFIG.rescheduleWindowHours} hours</strong> remain
                before the <em>original</em> appointment&apos;s scheduled start time.
              </p>
              <p style={{ marginTop: "0.5rem" }}>
                Rescheduling is not available if fewer than {APP_CONFIG.rescheduleWindowHours} hours
                remain before the original appointment.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>How does it work?</h2>
              <ol style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>Open the secure booking-management link in your confirmation email.</li>
                <li>Select a new available date and time slot.</li>
                <li>Confirm the reschedule — no additional payment is required.</li>
                <li>You will receive an updated confirmation email with the new Google Meet link.</li>
              </ol>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Limits</h2>
              <p>
                Self-service rescheduling is limited to <strong>one change per booking</strong>. If
                you need to reschedule again after using this allowance, please contact the practice
                directly at{" "}
                <a href={`mailto:${APP_CONFIG.contact.email}`} style={{ color: "var(--color-maroon)" }}>
                  {APP_CONFIG.contact.email}
                </a>
                .
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>New slot requirements</h2>
              <p>
                The new slot must be available, must not conflict with any blocked dates, and must
                satisfy the same-day booking cutoff of 6:00 PM IST where applicable.
              </p>
            </section>

            <p style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-muted)", borderTop: "1px solid var(--color-border-soft)", paddingTop: "1rem" }}>
              For queries: {APP_CONFIG.contact.email}
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
