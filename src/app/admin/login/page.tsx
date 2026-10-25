"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/config";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("drdhondup.tashi@gmail.com");
  const [password, setPassword] = useState("tashi2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-ivory)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Top badge */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.5rem",
              color: "var(--color-maroon)",
              textDecoration: "none",
              fontWeight: 500,
              display: "inline-block",
              marginBottom: "0.5rem",
            }}
          >
            {APP_CONFIG.doctor.name}
          </Link>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-charcoal-muted)",
            }}
          >
            Doctor Administration Portal
          </p>
        </div>

        {/* Card */}
        <div className="card card-padded" style={{ background: "var(--color-cream)" }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.5rem",
              color: "var(--color-charcoal)",
              marginBottom: "0.375rem",
            }}
          >
            Physician Login
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-charcoal-soft)",
              marginBottom: "1.5rem",
            }}
          >
            Access your consultation schedule, patient intake records, and private clinical notes.
          </p>

          {/* Dev credentials hint */}
          <div
            style={{
              background: "var(--color-saffron-pale)",
              border: "1px solid rgba(196,127,58,0.25)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              fontSize: "0.8125rem",
              color: "var(--color-charcoal)",
            }}
          >
            <strong>Default dev credentials:</strong>
            <div style={{ marginTop: "0.25rem", fontFamily: "monospace", fontSize: "0.75rem" }}>
              Email: drdhondup.tashi@gmail.com<br />
              Password: tashi2026
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "var(--color-maroon-muted)",
                border: "1px solid rgba(123,45,62,0.3)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
                fontSize: "0.8125rem",
                color: "var(--color-maroon)",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                htmlFor="admin-email"
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--color-charcoal)",
                  marginBottom: "0.375rem",
                }}
              >
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--color-charcoal)",
                  marginBottom: "0.375rem",
                }}
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                style={{ width: "100%" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
              id="admin-login-btn"
            >
              {loading ? "Authenticating..." : "Sign In to Portal"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link
            href="/"
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-charcoal-soft)",
              textDecoration: "none",
            }}
          >
            ← Back to Patient Website
          </Link>
        </div>
      </div>
    </div>
  );
}
