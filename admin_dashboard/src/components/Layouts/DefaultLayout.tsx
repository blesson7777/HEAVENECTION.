import { requireUser } from "@/lib/auth";
import { SessionProvider } from "@/components/Auth/SessionContext";
import DashboardShell from "./DashboardShell";
export default async function DefaultLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <SessionProvider value={user}><DashboardShell>{children}</DashboardShell></SessionProvider>;
}
