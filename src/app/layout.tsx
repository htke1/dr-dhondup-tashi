import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_CONFIG } from "@/lib/config";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.site.name,
    template: `%s | ${APP_CONFIG.site.name}`,
  },
  description: `Book an online medical consultation with ${APP_CONFIG.doctor.name}. ${APP_CONFIG.site.tagline} Consultations available daily via Google Meet.`,
  keywords: ["online doctor consultation", "Dr Dhondup Tashi", "Tibetan doctor", "online medical appointment", "teleconsultation India"],
  authors: [{ name: APP_CONFIG.doctor.name }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_CONFIG.site.url,
    siteName: APP_CONFIG.site.name,
    title: APP_CONFIG.site.name,
    description: `${APP_CONFIG.site.tagline} Book a 20-minute online consultation for ${APP_CONFIG.consultationFeeDisplay}.`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
