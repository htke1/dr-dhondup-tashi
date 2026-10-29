"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { APP_CONFIG } from "@/lib/config";

export default function SiteFooter() {
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer
      style={{
        background: "var(--color-charcoal)",
        color: "rgba(255,255,255,0.75)",
        paddingBlock: "var(--space-4xl)",
        paddingBottom: "var(--space-2xl)",
      }}
      role="contentinfo"
    >
      {/* Tibetan border at top */}
      <div
        style={{
          height: "3px",
          background: "linear-gradient(90deg, var(--color-maroon), var(--color-saffron), var(--color-maroon))",
          marginBottom: "var(--space-4xl)",
        }}
        aria-hidden="true"
      />

      <div className="container">
        {/* Top row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2.5rem",
            marginBottom: "var(--space-3xl)",
          }}
        >
          {/* Brand column */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.25rem",
                fontWeight: 500,
                color: "#fff",
                marginBottom: "0.5rem",
              }}
            >
              {APP_CONFIG.doctor.name}
            </p>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.65, marginBottom: "0.75rem" }}>
              Senior General Physician &amp; Clinical Sonologist.
              Chief Medical Officer at Gaden Jangtse Hospital, Mundgod, Karnataka.
            </p>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", marginBottom: "1.25rem" }}>
              Accessible, evidence-based online consultations via Google Meet.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-saffron)",
                marginBottom: "1rem",
              }}
            >
              Navigation
            </h3>
            <nav aria-label="Footer navigation">
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { label: "Consult For (Clinical Focus)", href: "/#consult-for" },
                  { label: "About Dr. Dhondup Tashi", href: "/#about" },
                  { label: "How It Works", href: "/#how-it-works" },
                  { label: "Consultation Details & Fees", href: "/#consultations" },
                  { label: "Book an Appointment", href: "/book" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      style={{
                        fontSize: "0.9rem",
                        color: "rgba(255,255,255,0.7)",
                        textDecoration: "none",
                        transition: "color var(--transition-fast)",
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Policies */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-saffron)",
                marginBottom: "1rem",
              }}
            >
              Policies
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Cancellation & Refund Policy", href: "/cancellation-policy" },
                { label: "Rescheduling Policy", href: "/rescheduling-policy" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,0.65)",
                      textDecoration: "none",
                      transition: "color var(--transition-fast)",
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Consultation info */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-saffron)",
                marginBottom: "1rem",
              }}
            >
              Consultation Hours
            </h3>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.75 }}>
              Daily consultations via Google Meet
              <br />
              7:00 PM – 8:00 PM IST
              <br />
              {APP_CONFIG.consultationFeeDisplay} per session
            </p>
            <Link
              href="/book"
              className="btn btn-secondary btn-sm"
              style={{
                marginTop: "1.25rem",
                borderColor: "rgba(255,255,255,0.3)",
                color: "#fff",
              }}
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.1)",
            marginBottom: "1.5rem",
          }}
          aria-hidden="true"
        />

        {/* Medical disclaimer */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
          }}
          role="note"
          aria-label="Medical disclaimer"
        >
          <p
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.65,
            }}
          >
            <strong style={{ color: "rgba(255,255,255,0.65)" }}>Medical Disclaimer:</strong>{" "}
            The information on this website is for general informational purposes only and does not
            constitute medical advice. Online consultations are not a substitute for in-person
            emergency care. In case of a medical emergency, please contact your local emergency
            services immediately. Confirmation of your appointment is subject to successful payment
            verification.
          </p>
        </div>

        {/* Copyright & Doctor portal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)" }}>
            © {currentYear} {APP_CONFIG.doctor.name}. All rights reserved.
          </p>
          <Link
            href="/admin"
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            Physician Portal →
          </Link>
        </div>
      </div>
    </footer>
  );
}
