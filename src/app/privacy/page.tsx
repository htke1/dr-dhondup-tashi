import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { APP_CONFIG } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main style={{ paddingBlock: "var(--space-4xl)", minHeight: "60vh" }}>
        <div className="container" style={{ maxWidth: "720px" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>Privacy Policy</h1>
          <p style={{ color: "var(--color-charcoal-muted)", marginBottom: "2.5rem", fontSize: "0.875rem" }}>
            Effective date: [To be set before launch]. This policy will be reviewed for compliance with
            applicable Indian data-protection requirements before production launch.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Information we collect</h2>
              <p>When you book a consultation, we collect:</p>
              <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <li>Full name</li>
                <li>Mobile number</li>
                <li>Email address</li>
                <li>Age</li>
                <li>Reason for consultation (optional)</li>
                <li>Preferred consultation language (optional)</li>
                <li>Payment confirmation (we do not store card details)</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>How we use your information</h2>
              <p>Your information is used to:</p>
              <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <li>Process and confirm your appointment</li>
                <li>Send confirmation and reminder emails</li>
                <li>Generate your Google Meet link</li>
                <li>Enable the doctor to prepare for your consultation</li>
                <li>Process refunds when eligible</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Consultation notes</h2>
              <p>
                Private consultation notes created by the doctor are stored securely and are accessible
                only to authorised administrators. Notes are never included in emails, shared with
                third parties, or exposed through patient-facing interfaces.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Data sharing</h2>
              <p>
                We share your data only with service providers required to operate this service:
                Supabase (database), Razorpay (payments), Google (Calendar and Meet), and our
                transactional email provider. We do not sell your personal data.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Data retention</h2>
              <p>
                Appointment and patient records are retained as required for medical and legal
                obligations. Specific retention periods will be documented before launch, subject
                to review of applicable Indian data-protection requirements.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Your rights</h2>
              <p>
                You may contact us at{" "}
                <a href={`mailto:${APP_CONFIG.contact.email}`} style={{ color: "var(--color-maroon)" }}>
                  {APP_CONFIG.contact.email}
                </a>{" "}
                to request access to, correction of, or deletion of your personal data.
              </p>
            </section>

            <p style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-muted)", borderTop: "1px solid var(--color-border-soft)", paddingTop: "1rem" }}>
              This policy is a working draft and will be reviewed by a legal professional before
              production launch. Do not rely on it as legal advice.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
