import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, isAllowedAdminIdentifier, verifyAdminPassword } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawIdentifier = body.username || body.email || "";
    const password = body.password || "";
    const identifier = rawIdentifier.trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    let isValid = false;

    // 1. Primary verification via Supabase Database Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && anonKey) {
      try {
        const supabase = createClient(supabaseUrl, anonKey);
        const authEmail = identifier.toLowerCase() === "doctortashi"
          ? "doctortashi@drdhondup.com"
          : identifier.toLowerCase();

        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (!error && data.session) {
          isValid = true;
        }
      } catch (err) {
        console.warn("Supabase auth verification note:", err);
      }
    }

    // 2. Cryptographic salted PBKDF2 verification fallback
    if (!isValid) {
      const isAllowed = isAllowedAdminIdentifier(identifier);
      const isPasswordCorrect = verifyAdminPassword(password);
      if (isAllowed && isPasswordCorrect) {
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your username and password." },
        { status: 401 }
      );
    }

    const token = createSessionToken(identifier);

    const response = NextResponse.json({
      success: true,
      message: "Authenticated successfully.",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days persistent web app session
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication server error." },
      { status: 500 }
    );
  }
}
