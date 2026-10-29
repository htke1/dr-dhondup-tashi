import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, isAllowedAdminEmail, ADMIN_PASSWORD } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const isValidEmail = isAllowedAdminEmail(email);
    const isValidPassword = password === ADMIN_PASSWORD;

    if (!isValidEmail || !isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    const token = createSessionToken(email);

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
      maxAge: 7 * 24 * 60 * 60, // 7 days
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
