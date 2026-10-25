"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { APP_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "site-nav",
        scrolled && "shadow-sm"
      )}
      aria-label="Main navigation"
    >
      {/* Tibetan colour bar at very top */}
      <div className="tibetan-top-border" aria-hidden="true" />

      <div className="container">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBlock: "0.875rem",
            gap: "1rem",
          }}
        >
          {/* Wordmark */}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.125rem",
              fontWeight: 500,
              color: "var(--color-maroon)",
              textDecoration: "none",
              letterSpacing: "-0.01em",
              flexShrink: 0,
            }}
            aria-label={`${APP_CONFIG.doctor.name} — Home`}
          >
            {APP_CONFIG.doctor.name}
          </Link>

          {/* Desktop nav */}
          <div
            className="desktop-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2rem",
            }}
          >
            <NavLink href="/#about">About</NavLink>
            <NavLink href="/#how-it-works">How It Works</NavLink>
            <NavLink href="/#consultations">Consultations</NavLink>
            <Link href="/book" className="btn btn-primary btn-sm" id="nav-book-btn">
              Book Appointment
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              color: "var(--color-charcoal)",
            }}
            id="mobile-menu-btn"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="3" y1="3" x2="19" y2="19" />
                  <line x1="19" y1="3" x2="3" y2="19" />
                </>
              ) : (
                <>
                  <line x1="2" y1="6" x2="20" y2="6" />
                  <line x1="2" y1="11" x2="20" y2="11" />
                  <line x1="2" y1="16" x2="20" y2="16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          style={{
            borderTop: "1px solid var(--color-border-soft)",
            background: "var(--color-ivory)",
            padding: "1rem 1.25rem 1.5rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <MobileNavLink href="/#about" onClick={() => setMenuOpen(false)}>About</MobileNavLink>
            <MobileNavLink href="/#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</MobileNavLink>
            <MobileNavLink href="/#consultations" onClick={() => setMenuOpen(false)}>Consultations</MobileNavLink>
            <div style={{ paddingTop: "0.75rem" }}>
              <Link
                href="/book"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setMenuOpen(false)}
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "0.9rem",
        fontWeight: 500,
        color: "var(--color-charcoal-soft)",
        textDecoration: "none",
        letterSpacing: "0.01em",
        transition: "color var(--transition-fast)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-maroon)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-charcoal-soft)")}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block",
        padding: "0.75rem 0.5rem",
        fontFamily: "var(--font-sans)",
        fontSize: "1rem",
        fontWeight: 500,
        color: "var(--color-charcoal)",
        textDecoration: "none",
        borderBottom: "1px solid var(--color-border-soft)",
      }}
    >
      {children}
    </Link>
  );
}
