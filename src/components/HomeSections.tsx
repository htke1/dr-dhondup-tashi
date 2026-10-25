import Link from "next/link";
import Image from "next/image";
import { APP_CONFIG } from "@/lib/config";

/* =========================================================
   HERO SECTION
   ========================================================= */
export function HeroSection() {
  return (
    <section
      className="hero-section"
      aria-labelledby="hero-heading"
      id="hero"
    >
      <div className="container">
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3.5rem",
            alignItems: "center",
          }}
        >
          {/* Left: text content */}
          <div>
            {/* Eyebrow */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <span
                style={{
                  width: "24px",
                  height: "2px",
                  background: "var(--color-saffron)",
                  display: "inline-block",
                }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--color-saffron)",
                }}
              >
                Senior General Physician · 21+ Years Experience
              </span>
            </div>

            {/* Heading */}
            <h1
              id="hero-heading"
              style={{ marginBottom: "0.5rem", color: "var(--color-charcoal)", lineHeight: 1.15 }}
            >
              {APP_CONFIG.doctor.name}
            </h1>

            {/* Sub-role line */}
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "var(--color-maroon)",
                letterSpacing: "0.02em",
                marginBottom: "0.75rem",
              }}
            >
              General Physician &middot; Clinical Sonologist &middot; Chief Medical Officer &middot; Community Health Advocate
            </p>

            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)",
                color: "var(--color-charcoal-soft)",
                marginBottom: "1.75rem",
                fontStyle: "italic",
                fontWeight: 300,
                lineHeight: 1.5,
              }}
            >
              &ldquo;{APP_CONFIG.site.tagline}&rdquo;
            </p>

            {/* Quick credentials strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.625rem",
                marginBottom: "1.75rem",
                fontSize: "0.8125rem",
                color: "var(--color-charcoal-mid)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--color-maroon)", fontWeight: 700 }}>✓</span>
                <span>MBBS &middot; M.Med Family Med (CMC Vellore)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--color-maroon)", fontWeight: 700 }}>✓</span>
                <span>Certified Clinical Sonologist</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--color-maroon)", fontWeight: 700 }}>✓</span>
                <span>CMO, Gaden Jangtse Hospital</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--color-maroon)", fontWeight: 700 }}>✓</span>
                <span>Echocardiography (TVGH Taiwan)</span>
              </div>
            </div>

            {/* Fee + duration badges */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                marginBottom: "2rem",
              }}
            >
              <span className="badge badge-maroon" style={{ fontSize: "0.85rem", padding: "0.35rem 0.85rem" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {APP_CONFIG.consultationFeeDisplay} per consultation
              </span>
              <span className="badge badge-saffron" style={{ fontSize: "0.85rem", padding: "0.35rem 0.85rem" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {APP_CONFIG.appointmentDurationMinutes} minutes
              </span>
              <span className="badge badge-saffron" style={{ fontSize: "0.85rem", padding: "0.35rem 0.85rem" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                Live Video via Google Meet
              </span>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <Link href="/book" className="btn btn-primary btn-lg" id="hero-book-btn">
                Book a Consultation
              </Link>
              <Link href="#consult-for" className="btn btn-secondary btn-lg">
                View Clinical Expertise
              </Link>
            </div>

            {/* Trust note */}
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.8125rem",
                color: "var(--color-charcoal-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Secure Razorpay Checkout &middot; Instant Google Meet Link &middot; Resend Confirmation
            </p>
          </div>

          {/* Right: doctor hero photo */}
          <div
            className="hero-photo"
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "420px",
                aspectRatio: "4/5",
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                boxShadow: "0 24px 48px -12px rgba(123, 45, 62, 0.22), 0 0 0 1px var(--color-border-soft)",
                background: "var(--color-cream-soft)",
              }}
            >
              <Image
                src="/images/HomePagePicture.jpeg"
                alt="Dr. Dhondup Tashi — Senior General Physician & Clinical Sonologist"
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                style={{ objectFit: "cover", objectPosition: "center top" }}
                priority
              />

              {/* Floating hospital & experience card */}
              <div
                style={{
                  position: "absolute",
                  bottom: "1.25rem",
                  left: "1.25rem",
                  right: "1.25rem",
                  background: "rgba(255, 255, 255, 0.94)",
                  backdropFilter: "blur(12px)",
                  padding: "0.875rem 1.125rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(123, 45, 62, 0.15)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "0.95rem", color: "var(--color-maroon)", margin: 0 }}>
                    Dr. Dhondup Tashi
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-charcoal-soft)", margin: "0.15rem 0 0 0" }}>
                    Chief Medical Officer &middot; Gaden Jangtse Hospital
                  </p>
                </div>
                <div
                  style={{
                    background: "var(--color-maroon-muted)",
                    color: "var(--color-maroon)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "var(--radius-sm)",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                  }}
                >
                  21+ Yrs Exp
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CONSULT FOR / CLINICAL EXPERTISE SECTION
   ========================================================= */
export function ConsultForSection() {
  const consultAreas = [
    {
      title: "Full Body Check-ups & Preventive Healthcare",
      category: "Preventive Medicine",
      description: "Routine health screening, risk factor evaluation, lifestyle modifications, and proactive disease prevention.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
    },
    {
      title: "Liver Diseases & Disorders",
      category: "Hepatology",
      description: "Evaluation and management of Fatty Liver, Chronic Hepatitis B, elevated liver enzymes, and chronic hepatic conditions.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      ),
    },
    {
      title: "Diabetes, Hypertension & Lifestyle Diseases",
      category: "Endocrinology & Cardio-metabolic",
      description: "Personalized clinical guidance for Type 2 Diabetes, high blood pressure, hyperlipidemia, and metabolic health.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      ),
    },
    {
      title: "Gastrointestinal & Digestive Problems",
      category: "Gastroenterology",
      description: "Diagnosis and care for chronic acidity, GERD, gastritis, irritable bowel syndrome (IBS), and recurrent indigestion.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      ),
    },
    {
      title: "Kidney Diseases & Kidney Stone Prevention",
      category: "Nephrology",
      description: "Renal health evaluation, chronic kidney disease monitoring, proteinuria review, and stone recurrence prevention.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
      ),
    },
    {
      title: "Minor Surgical Conditions",
      category: "Surgical Second Opinions",
      description: "Clinical evaluation for minor surgical conditions, post-operative wound healing, and surgical second opinions.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      ),
    },
    {
      title: "General Medical & Chronic Disease Management",
      category: "Primary & Family Care",
      description: "Comprehensive medical assessments for multi-system symptoms, chronic illnesses, and ongoing health management.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
        </svg>
      ),
    },
    {
      title: "Ultrasound (USG) Report Interpretation",
      category: "Clinical Sonology",
      description: "Detailed secondary review and clinical explanation of abdominal, pelvic, thyroid, and general sonography scans.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
      ),
    },
    {
      title: "Echocardiography (ECHO) Report Interpretation",
      category: "Cardiac Imaging Review",
      description: "In-depth review of echocardiogram findings, ejection fraction, valve evaluations, and cardiac ultrasound reports.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
    },
  ];

  return (
    <section
      className="section"
      aria-labelledby="consult-for-heading"
      id="consult-for"
      style={{ background: "var(--color-cream)" }}
    >
      <div className="container">
        <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="section-eyebrow">Clinical Focus & Services</span>
          <h2 id="consult-for-heading" style={{ fontSize: "clamp(1.75rem, 3vw, 2.4rem)" }}>
            Conditions & Services You Can Consult For
          </h2>
          <div className="divider-ornament" aria-hidden="true" style={{ justifyContent: "center" }}>
            <div className="divider-ornament-inner" />
          </div>
          <p style={{ maxWidth: "680px", margin: "0 auto", color: "var(--color-charcoal-soft)", fontSize: "1rem" }}>
            Dr. Dhondup Tashi provides evidence-based clinical consultations, medical second opinions, chronic care planning, and diagnostic report reviews for patients across India and worldwide.
          </p>
        </div>

        {/* 3x3 Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {consultAreas.map((area) => (
            <div
              key={area.title}
              className="card card-padded"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                border: "1px solid var(--color-border-soft)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-maroon-muted)",
                      color: "var(--color-maroon)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {area.icon}
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-saffron)",
                      background: "var(--color-saffron-pale)",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "var(--radius-full)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {area.category}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.15rem",
                    color: "var(--color-charcoal)",
                    marginBottom: "0.5rem",
                    lineHeight: 1.35,
                  }}
                >
                  {area.title}
                </h3>

                <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)", lineHeight: 1.55 }}>
                  {area.description}
                </p>
              </div>

              <div style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border-soft)" }}>
                <Link
                  href={`/book?reason=${encodeURIComponent(area.title)}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-maroon)",
                    textDecoration: "none",
                  }}
                >
                  Book for this condition
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div
          style={{
            marginTop: "3rem",
            background: "var(--color-maroon-muted)",
            border: "1px solid rgba(123, 45, 62, 0.2)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.25rem",
          }}
        >
          <div>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--color-maroon)", margin: 0 }}>
              Need a consultation for another medical concern or second opinion?
            </h4>
            <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)", margin: "0.25rem 0 0 0" }}>
              You can provide your specific symptoms or recent lab reports during the 3-step booking process.
            </p>
          </div>
          <Link href="/book" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
            Book Consultation &middot; {APP_CONFIG.consultationFeeDisplay}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   HOW IT WORKS SECTION
   ========================================================= */
export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Select a date & time",
      description:
        "Choose an available slot between 7:00 PM – 8:00 PM IST. Bookings close at 6:00 PM IST daily.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      number: "02",
      title: "Enter details & pay",
      description:
        `Provide your medical reason and preferred language (English or Tibetan). Complete payment securely via Razorpay (₹1,000 standard, or ₹500 with 50% subsidy for fathers & family heads).`,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
    },
    {
      number: "03",
      title: "Join Google Meet video call",
      description:
        "Receive an instant confirmation email with your dedicated Google Meet link and appointment instructions. Join from your phone, tablet, or laptop.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      ),
    },
  ];

  return (
    <section
      className="section section-alt"
      aria-labelledby="how-it-works-heading"
      id="how-it-works"
    >
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Simple & Transparent</span>
          <h2 id="how-it-works-heading">How Online Consultation Works</h2>
          <div className="divider-ornament" aria-hidden="true" style={{ justifyContent: "center" }}>
            <div className="divider-ornament-inner" />
          </div>
          <p style={{ maxWidth: "520px", margin: "0 auto", color: "var(--color-charcoal-soft)" }}>
            Book your appointment directly without creating an account.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {steps.map((step) => (
            <article
              key={step.number}
              className="card card-padded"
              style={{ position: "relative" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--color-maroon-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-maroon)",
                    flexShrink: 0,
                  }}
                >
                  {step.icon}
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "2rem",
                    fontWeight: 300,
                    color: "var(--color-border)",
                    lineHeight: 1,
                    alignSelf: "center",
                    marginLeft: "auto",
                  }}
                  aria-hidden="true"
                >
                  {step.number}
                </span>
              </div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{step.title}</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-charcoal-soft)" }}>
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link href="/book" className="btn btn-primary btn-lg" id="how-book-btn">
            Book an Appointment &middot; {APP_CONFIG.consultationFeeDisplay}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   ABOUT / BIOGRAPHY SECTION
   ========================================================= */
export function AboutSection() {
  return (
    <section
      className="section"
      aria-labelledby="about-heading"
      id="about"
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.35fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Left: About picture */}
          <div>
            <div
              style={{
                position: "relative",
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                aspectRatio: "4/5",
                boxShadow: "0 24px 48px -12px rgba(123, 45, 62, 0.22), 0 0 0 1px var(--color-border-soft)",
                background: "var(--color-cream-soft)",
              }}
            >
              <Image
                src="/images/AboutPicture.jpeg"
                alt="Dr. Dhondup Tashi during clinical patient care"
                fill
                sizes="(max-width: 768px) 100vw, 450px"
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>

            {/* Award & Honor Badge */}
            <div
              style={{
                marginTop: "1.5rem",
                background: "var(--color-saffron-pale)",
                border: "1px solid rgba(196,127,58,0.25)",
                borderRadius: "var(--radius-md)",
                padding: "1rem 1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "1.1rem" }}>🏅</span>
                <strong style={{ fontSize: "0.875rem", color: "var(--color-charcoal)" }}>
                  Dr. Chetan Bettagowda Medical Award
                </strong>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-soft)", lineHeight: 1.5, margin: 0 }}>
                Conferred by the Washington-based Machik organization in recognition of Dr. Tashi&apos;s pioneering contributions to rural healthcare and medical capacity building.
              </p>
            </div>

            {/* Goodwill Ambassador badge */}
            <div
              style={{
                marginTop: "0.75rem",
                background: "var(--color-maroon-muted)",
                border: "1px solid rgba(123,45,62,0.15)",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "1rem" }}>🌐</span>
                <strong style={{ fontSize: "0.875rem", color: "var(--color-maroon)" }}>
                  International Goodwill Ambassador
                </strong>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-soft)", margin: 0 }}>
                Taipei Veterans General Hospital (TVGH), Taiwan, following advanced training in clinical echocardiography.
              </p>
            </div>
          </div>

          {/* Right: Full Authentic Biography */}
          <div>
            <span className="section-eyebrow">Biography & Qualifications</span>
            <h2 id="about-heading" style={{ marginBottom: "0.5rem" }}>
              {APP_CONFIG.doctor.name}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.05rem",
                color: "var(--color-maroon)",
                marginBottom: "1.25rem",
                fontStyle: "italic",
                lineHeight: 1.4,
              }}
            >
              General Physician &middot; Clinical Sonologist &middot; Chief Medical Officer &middot; Community Health Advocate
            </p>

            <div className="divider-ornament" aria-hidden="true">
              <div className="divider-ornament-inner" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem", fontSize: "0.95rem", lineHeight: 1.65, color: "var(--color-charcoal)" }}>
              <p>
                <strong>Dr. Dhondup Tashi</strong> is a senior General Physician with <strong>more than 21 years of clinical experience</strong>. He serves as <strong>Chief Medical Officer at Gaden Jangtse Hospital</strong>, a charitable community hospital in Mundgod, Karnataka, India. Since 2015, he has also served as the Health Chair of RDTS and as an advisor to the Health Advisory Committee of the Department of Health, Central Tibetan Administration, Dharamsala.
              </p>

              <p>
                He earned his <strong>MBBS from Indira Gandhi Medical College, Shimla</strong>, and completed a <strong>Master&apos;s degree in Family Medicine with distinction at Christian Medical College (CMC), Vellore</strong>. He has also received postgraduate training in <strong>Rural Surgery and Clinical Ultrasonography</strong> and is a certified and registered <strong>Clinical Sonologist</strong>. In addition, he provides ultrasound services as a visiting consultant at Jyoti Health Center in Mundgod.
              </p>

              <p>
                Dr. Tashi completed advanced training in echocardiography at <strong>Taipei Veterans General Hospital (TVGH), Taiwan</strong>, where he was subsequently honoured as an <strong>International Goodwill Ambassador</strong>.
              </p>

              <p>
                His clinical interests and extensive experience include <strong>lifestyle-related diseases, liver and gastrointestinal disorders, preventive healthcare, primary care, and community medicine</strong>.
              </p>

              <p>
                A dedicated advocate for rural and community health, Dr. Tashi has led pioneering initiatives focused on the prevention and treatment of <strong>chronic Hepatitis B, Stomach Cancer, Diabetes, and Kidney Diseases</strong>, and helped establish the <strong>first dialysis unit in the Tibetan refugee community</strong>. He has also contributed to medical education by mentoring young Tibetan doctors and facilitating rural medicine electives for international medical students.
              </p>

              <p style={{ fontStyle: "italic", color: "var(--color-charcoal-mid)" }}>
                Dr. Tashi is committed to providing accessible, evidence-based, and compassionate healthcare. He is passionate about empowering patients through health education and improving the quality of medical care in underserved communities.
              </p>
            </div>

            {/* Structured Credentials Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.875rem",
                marginTop: "2rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--color-border-soft)",
              }}
            >
              {[
                "MBBS — IGMC Shimla",
                "M.Med Family Medicine (Distinction, CMC Vellore)",
                "Postgraduate Rural Surgery Residency",
                "Certified Clinical Sonologist",
                "Echocardiography — TVGH Taiwan",
                "Chief Medical Officer, Gaden Jangtse Hospital",
                "Health Chair RDTS & CTA Health Advisor",
                "Dr. Chetan Bettagowda Award (Machik)",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    color: "var(--color-charcoal-mid)",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-saffron)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ flexShrink: 0, marginTop: "0.2rem" }}
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem" }}>
              <Link href="/book" className="btn btn-primary btn-md">
                Schedule a Consultation with Dr. Tashi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CONSULTATION INFO SECTION
   ========================================================= */
export function ConsultationInfoSection() {
  const infoItems = [
    {
      label: "Consultation Format",
      value: "Private Video Call via Google Meet",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      ),
    },
    {
      label: "Duration",
      value: `${APP_CONFIG.appointmentDurationMinutes} minutes dedicated time`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: "Consultation Fee",
      value: `${APP_CONFIG.consultationFeeDisplay} INR per session`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label: "Evening Clinical Hours",
      value: "7:00 PM · 7:20 PM · 7:40 PM IST",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
  ];

  return (
    <section
      className="section section-alt"
      aria-labelledby="consultation-heading"
      id="consultations"
    >
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Patient Information</span>
          <h2 id="consultation-heading">Consultation Details & Booking Rules</h2>
          <div className="divider-ornament" aria-hidden="true" style={{ justifyContent: "center" }}>
            <div className="divider-ornament-inner" />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginBottom: "3rem",
          }}
        >
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="card card-padded"
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-maroon-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-maroon)",
                }}
              >
                {item.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-charcoal-muted)",
                    marginBottom: "0.25rem",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.05rem",
                    color: "var(--color-charcoal)",
                    fontWeight: 500,
                  }}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Family Head & Father Health Initiative */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(123, 45, 62, 0.08) 0%, rgba(196, 127, 58, 0.08) 100%)",
            border: "1.5px solid rgba(123, 45, 62, 0.25)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem 1.75rem",
            maxWidth: "760px",
            margin: "0 auto 2rem auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.3rem" }}>👨‍👧‍👦</span>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", color: "var(--color-maroon)", margin: 0 }}>
                Family Head &amp; Father Health Initiative
              </h3>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                background: "var(--color-maroon)",
                color: "#ffffff",
                padding: "0.25rem 0.65rem",
                borderRadius: "var(--radius-full)",
              }}
            >
              50% Subsidy · ₹500
            </span>
          </div>

          <p style={{ fontSize: "0.9rem", color: "var(--color-charcoal-mid)", lineHeight: 1.6, margin: 0 }}>
            In over 21 years of clinical practice, Dr. Dhondup Tashi has observed that fathers and family heads frequently prioritize their household responsibilities over their personal wellbeing, often delaying medical care until conditions become critical. To encourage proactive checkups, early screening, and timely intervention, a <strong>50% clinical subsidy (₹500 consultation fee)</strong> is available for all fathers and family heads.
          </p>

          <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              href="/book?subsidy=father"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: "none" }}
            >
              Book Subsidized Consultation (₹500) &rarr;
            </Link>
            <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-soft)" }}>
              No coupon required · 1-click selection in booking details
            </span>
          </div>
        </div>

        {/* Important notice */}
        <div
          style={{
            background: "var(--color-maroon-muted)",
            border: "1px solid rgba(123,45,62,0.15)",
            borderLeft: "3px solid var(--color-maroon)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem 1.5rem",
            display: "flex",
            gap: "0.875rem",
            alignItems: "flex-start",
            maxWidth: "760px",
            margin: "0 auto",
          }}
          role="note"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-maroon)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ flexShrink: 0, marginTop: "0.125rem" }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p style={{ fontWeight: 600, color: "var(--color-maroon)", marginBottom: "0.25rem", fontSize: "0.95rem" }}>
              Instant Confirmation & Rescheduling Policy
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)", lineHeight: 1.5, margin: 0 }}>
              Your appointment is guaranteed and your Google Meet room created the moment your Razorpay payment completes. Self-service rescheduling is permitted up to 6 hours before your session. Full refunds are available with at least 48 hours notice.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/book" className="btn btn-primary btn-lg" id="consult-book-btn">
            Book a Consultation &middot; {APP_CONFIG.consultationFeeDisplay}
          </Link>
        </div>
      </div>
    </section>
  );
}
