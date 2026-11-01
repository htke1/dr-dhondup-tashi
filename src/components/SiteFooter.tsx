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
              Family Physician &amp; Clinical Sonologist.
              Chief Medical Officer at Gaden Jangtse Hospital, Mundgod, Karnataka.
            </p>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", marginBottom: "1.25rem" }}>
              Accessible, evidence-based online consultations via Google Meet.
            </p>
            {/* Instagram link */}
            <a
              href="https://www.instagram.com/dr_dhun_tashi/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.75)",
                textDecoration: "none",
                marginBottom: "1rem",
              }}
              aria-label="Follow Dr. Dhun Tash on Instagram"
            >
              {/* Instagram icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="ig-footer-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433" />
                    <stop offset="50%" stopColor="#dc2743" />
                    <stop offset="100%" stopColor="#bc1888" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig-footer-grad)" strokeWidth="1.75" />
                <circle cx="12" cy="12" r="4.5" stroke="url(#ig-footer-grad)" strokeWidth="1.75" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig-footer-grad)" />
              </svg>
              @dr_dhun_tashi
            </a>
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
              6:30 PM – 8:30 PM IST
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
