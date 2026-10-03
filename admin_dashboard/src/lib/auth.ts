import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type SessionUser = { id: string; email: string; name: string; role: "ADMIN" | "MANAGER" | "STAFF" };
export const SESSION_COOKIE = "heavenection_session";
export function apiUrl(path: string) {
  const base = process.env.API_BASE_URL;
  if (!base) throw new Error("API_BASE_URL is not configured");
  return `${base.replace(/\/$/, "")}${path}`;
}
export async function backend(path: string, options: RequestInit = {}) {
  return fetch(apiUrl(path), { ...options, cache: "no-store", signal: AbortSignal.timeout(10000) });
}
export async function requireUser(): Promise<SessionUser> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) redirect("/auth/signin");
  const response = await backend("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401) redirect("/auth/signin");
  if (!response.ok) throw new Error("Authentication service unavailable");
  const user: SessionUser = await response.json();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") redirect("/auth/signin?access=mobile");
  return user;
}
