import { NextRequest, NextResponse } from "next/server";
import { backend, SESSION_COOKIE } from "@/lib/auth";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== process.env.WEB_ORIGIN) return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  try {
    if (token) {
      const response = await backend("/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok && response.status !== 401) throw new Error("Logout failed");
    }
    const result = NextResponse.json({ ok: true });
    result.cookies.delete(SESSION_COOKIE);
    return result;
  } catch { return NextResponse.json({ message: "Could not sign out. Please retry." }, { status: 503 }); }
}
