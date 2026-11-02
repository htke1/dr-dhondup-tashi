import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dr. Dhondup Tashi — Physician Portal",
    short_name: "Dr. Tashi Portal",
    description:
      "Mobile Physician Web App for Dr. Dhondup Tashi to view patient appointments, launch Google Meet consultations, and verify UPI payments.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#7B2D3E",
    orientation: "portrait",
    categories: ["medical", "health", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
