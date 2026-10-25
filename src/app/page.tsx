import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import {
  HeroSection,
  HowItWorksSection,
  AboutSection,
  ConsultationInfoSection,
} from "@/components/HomeSections";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/config";

export default function HomePage() {
  return (
    <>
      <SiteNav />

      <main id="main-content">
        {/* Skip to content for accessibility */}
        <a
          href="#main-content"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: "1px",
            height: "1px",
            overflow: "hidden",
          }}
          className="skip-link"
        >
          Skip to main content
        </a>

        <HeroSection />
        <HowItWorksSection />
        <AboutSection />
        <ConsultationInfoSection />
      </main>

      {/* Mobile persistent booking CTA */}
      <div className="mobile-booking-cta" role="complementary" aria-label="Book an appointment">
        <Link
          href="/book"
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          id="mobile-sticky-book-btn"
        >
          Book an Appointment · {APP_CONFIG.consultationFeeDisplay}
        </Link>
      </div>

      <SiteFooter />
    </>
  );
}
