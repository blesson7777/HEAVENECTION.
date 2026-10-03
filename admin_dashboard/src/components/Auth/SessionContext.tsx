"use client";
import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/auth";
const SessionContext = createContext<SessionUser | null>(null);
export const SessionProvider = SessionContext.Provider;
export function useSession() {
  const user = useContext(SessionContext);
  if (!user) throw new Error("Session provider is required");
  return user;
}
