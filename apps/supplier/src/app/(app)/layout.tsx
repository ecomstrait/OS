import { requireUser, getProfile } from "@ecomstrait/auth/session";
import { AppChrome } from "@/components/app/app-chrome";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getProfile();

  return (
    <AppChrome email={user.email ?? ""} role={profile?.role ?? "supplier"}>
      {children}
    </AppChrome>
  );
}
