import { NextRequest, NextResponse } from "next/server";
import { backend, SESSION_COOKIE } from "@/lib/auth";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== process.env.WEB_ORIGIN) return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid request" }, { status: 400 }); }
  if (typeof body?.email !== "string" || typeof body?.password !== "string" || body.email.length > 254 || body.password.length > 128) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
  try {
    const response = await backend("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: body.email, password: body.password }) });
    if (!response.ok) return NextResponse.json({ message: response.status === 429 ? "Too many attempts. Try again shortly." : "Unable to sign in with these credentials." }, { status: response.status });
    const session = await response.json();
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      await backend("/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${session.accessToken}` } });
      return NextResponse.json({ message: "Use the mobile app for this account." }, { status: 403 });
    }
    const result = NextResponse.json({ destination: session.user.role === "MANAGER" ? "/manager" : "/" });
    result.cookies.set(SESSION_COOKIE, session.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: session.expiresIn });
    return result;
  } catch { return NextResponse.json({ message: "Sign-in service is unavailable. Please try again." }, { status: 503 }); }
}
