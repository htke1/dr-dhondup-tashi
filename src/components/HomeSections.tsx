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
            gap: "4rem",
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
                marginBottom: "1.5rem",
              }}
            >
              <span
                style={{
                  width: "24px",
                  height: "1.5px",
                  background: "var(--color-saffron)",
                  display: "inline-block",
                }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--color-saffron)",
                }}
              >
                Online Medical Consultations
              </span>
            </div>

            {/* Heading */}
            <h1
              id="hero-heading"
              style={{ marginBottom: "0.5rem", color: "var(--color-charcoal)" }}
            >
              {APP_CONFIG.doctor.name}
            </h1>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                color: "var(--color-charcoal-soft)",
                marginBottom: "1.5rem",
                fontStyle: "italic",
                fontWeight: 300,
              }}
            >
              {APP_CONFIG.site.tagline}
            </p>

            {/* Fee + duration */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                marginBottom: "2rem",
              }}
            >
              <span className="badge badge-maroon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {APP_CONFIG.consultationFeeDisplay} per consultation
              </span>
              <span className="badge badge-saffron">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {APP_CONFIG.appointmentDurationMinutes} minutes
              </span>
              <span className="badge badge-saffron">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
                </svg>
                Via Google Meet
              </span>
            </div>

            {/* CTA */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <Link href="/book" className="btn btn-primary btn-lg" id="hero-book-btn">
                Book an Appointment
              </Link>
              <Link href="/#about" className="btn btn-secondary btn-lg">
                Learn More
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
              Secure payment · Confirmation after verified payment · No account needed
            </p>
          </div>

          {/* Right: doctor photo */}
          <div
            className="hero-photo"
            aria-hidden="true"
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <DoctorPhotoPlaceholder />
          </div>
        </div>
      </div>
    </section>
  );
}

function DoctorPhotoPlaceholder() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "400px",
        aspectRatio: "4/5",
        borderRadius: "var(--radius-xl)",
        background: "linear-gradient(145deg, var(--color-maroon-muted), var(--color-saffron-pale))",
        border: "1px solid var(--color-border-soft)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle geometric pattern */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}
        viewBox="0 0 400 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <pattern id="geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="40" height="40" fill="none" stroke="#7B2D3E" strokeWidth="0.5"/>
          <rect x="10" y="10" width="20" height="20" fill="none" stroke="#C47F3A" strokeWidth="0.5" transform="rotate(45 20 20)"/>
        </pattern>
        <rect width="400" height="500" fill="url(#geo)"/>
      </svg>

      {/* Doctor silhouette icon */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        style={{ opacity: 0.35 }}
        aria-hidden="true"
      >
        <circle cx="40" cy="28" r="18" fill="var(--color-maroon)"/>
        <path d="M8 72c0-17.673 14.327-32 32-32s32 14.327 32 32" fill="var(--color-maroon)"/>
      </svg>

      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "0.9rem",
          color: "var(--color-charcoal-soft)",
          textAlign: "center",
          padding: "0 2rem",
        }}
      >
        Professional photograph<br />to be provided
      </p>
    </div>
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
        "Choose from available appointment slots. New bookings for same-day slots close at 6:00 PM IST daily.",
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
      title: "Enter your details & pay",
      description:
        `Fill in a simple form with your name, contact, and age. Pay the ${APP_CONFIG.consultationFeeDisplay} consultation fee securely. Your slot is confirmed only after payment is verified by the server.`,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
    },
    {
      number: "03",
      title: "Receive confirmation & join",
      description:
        "After payment is verified, you receive a confirmation email with a Google Meet link and joining instructions.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.4 2 2 0 0 1 3.62 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9A16 16 0 0 0 15 16.09l1.07-.87a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
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
          <span className="section-eyebrow">Simple process</span>
          <h2 id="how-it-works-heading">How It Works</h2>
          <div className="divider-ornament" aria-hidden="true" style={{ justifyContent: "center" }}>
            <div className="divider-ornament-inner" />
          </div>
          <p style={{ maxWidth: "520px", margin: "0 auto", color: "var(--color-charcoal-soft)" }}>
            Booking a consultation takes just a few minutes. No account required.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {steps.map((step, i) => (
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
              {i < steps.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "-0.75rem",
                    transform: "translateY(-50%)",
                    color: "var(--color-border)",
                    display: "flex",
                  }}
                  aria-hidden="true"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              )}
            </article>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link href="/book" className="btn btn-primary btn-lg" id="how-book-btn">
            Book Your Appointment
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
            gridTemplateColumns: "1fr 1.4fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Left: photo placeholder */}
          <div>
            <div
              style={{
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                background: "var(--color-maroon-muted)",
                aspectRatio: "4/5",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--color-border-soft)",
              }}
            >
              <svg width="64" height="64" viewBox="0 0 80 80" fill="none" aria-hidden="true" style={{ opacity: 0.3 }}>
                <circle cx="40" cy="28" r="18" fill="var(--color-maroon)"/>
                <path d="M8 72c0-17.673 14.327-32 32-32s32 14.327 32 32" fill="var(--color-maroon)"/>
              </svg>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-charcoal-muted)", marginTop: "1rem", padding: "0 1.5rem", textAlign: "center" }}>
                Photograph to be provided
              </p>
            </div>

            {/* Award badge */}
            <div
              style={{
                marginTop: "1.25rem",
                background: "var(--color-saffron-pale)",
                border: "1px solid rgba(196,127,58,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1rem",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "0.95rem",
                  color: "var(--color-saffron)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  lineHeight: 1.5,
                }}
              >
                &ldquo;This Award aligns with my lifelong commitment to providing comprehensive
                and compassionate care to the underserved community.&rdquo;
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-charcoal-soft)", marginTop: "0.5rem" }}>
                — Dr. Dhondup Tashi
              </p>
            </div>
          </div>

          {/* Right: biography */}
          <div>
            <span className="section-eyebrow">About the doctor</span>
            <h2 id="about-heading" style={{ marginBottom: "0.5rem" }}>
              {APP_CONFIG.doctor.name}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.05rem",
                color: "var(--color-maroon)",
                marginBottom: "1.5rem",
                fontStyle: "italic",
              }}
            >
              {APP_CONFIG.doctor.role}
              <br />
              <span style={{ fontFamily: "var(--font-sans)", fontStyle: "normal", fontSize: "0.875rem", color: "var(--color-charcoal-soft)" }}>
                {APP_CONFIG.doctor.hospital}
              </span>
            </p>

            <div className="divider-ornament" aria-hidden="true">
              <div className="divider-ornament-inner" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p>
                Dr. Dhondup Tashi has served as Chief Medical Officer and Primary Care Physician
                at Gaden Jangtse Charitable Hospital in Mundgod, Karnataka since 2013, providing
                dedicated clinical care to both Indian and Tibetan underserved rural communities.
              </p>
              <p>
                Noted for his clinical aptitude, Dr. Dhondup Tashi has led the development of the
                Gajang Medical Center — a state-of-the-art facility housing an endoscopy centre,
                ultrasonography and fibroscan centre, the first dialysis unit in the Tibetan
                community for patients with renal failure, and the first real-time Hepatitis-B PCR
                laboratory in the Tibetan community.
              </p>
              <p>
                Having specialised in family medicine, he completed three years of rural surgery
                residency and went on to undertake postgraduate training in clinical sonography.
                He continues to serve the high-altitude Tibetan refugee community in Jangthang,
                Ladakh — where he was raised — through medical camps and public health awareness
                programmes.
              </p>
              <p>
                In 2023, Dr. Dhondup Tashi was honoured as the inaugural Dr. Bettegowda Scholar
                by Machik, in recognition of his outstanding dedication to clinical practice,
                mentorship, and the growth of Tibetan medical capacity in India and the global
                diaspora.
              </p>
            </div>

            {/* Highlights */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                marginTop: "2rem",
              }}
            >
              {[
                "Family medicine specialist",
                "Rural surgery residency (3 years)",
                "Clinical sonography training",
                "Chief Medical Officer since 2013",
                "Public health leadership",
                "Dr. Bettegowda Scholar 2023",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    color: "var(--color-charcoal-mid)",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-saffron)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ flexShrink: 0, marginTop: "0.125rem" }}
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {item}
                </div>
              ))}
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
      label: "Format",
      value: "Online via Google Meet",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      ),
    },
    {
      label: "Duration",
      value: `${APP_CONFIG.appointmentDurationMinutes} minutes per session`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: "Consultation Fee",
      value: `${APP_CONFIG.consultationFeeDisplay} INR`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label: "Available Slots",
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
          <span className="section-eyebrow">What to expect</span>
          <h2 id="consultation-heading">Consultation Details</h2>
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

        {/* Important note */}
        <div
          style={{
            background: "var(--color-maroon-muted)",
            border: "1px solid rgba(123,45,62,0.15)",
            borderLeft: "3px solid var(--color-maroon)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
            maxWidth: "700px",
            margin: "0 auto",
          }}
          role="note"
        >
          <svg
            width="18"
            height="18"
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
            <p style={{ fontWeight: 500, color: "var(--color-maroon)", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
              Confirmation after verified payment
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal-soft)" }}>
              Your appointment is confirmed only after payment is verified by our server. Same-day
              bookings close at 6:00 PM IST. A 20-minute online consultation is not a substitute
              for in-person emergency care.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/book" className="btn btn-primary btn-lg" id="consult-book-btn">
            Book a Consultation — {APP_CONFIG.consultationFeeDisplay}
          </Link>
        </div>
      </div>
    </section>
  );
}
