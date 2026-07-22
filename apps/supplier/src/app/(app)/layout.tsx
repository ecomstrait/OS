import { requireUser, getProfile } from "@ecomstrait/auth/session";
import { createClient } from "@ecomstrait/auth/server";
import { getNotifications } from "@/lib/notifications";
import { getMySupplier } from "@/lib/supplier-context";
import { claimInvites } from "@/lib/team-actions";
import { AppChrome } from "@/components/app/app-chrome";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getProfile();

  // Link any pending staff invitations addressed to this user's email.
  await claimInvites();

  const supabase = await createClient();
  const my = await getMySupplier();
  const notifications = await getNotifications(
    supabase,
    my ? { id: my.supplierId, status: my.status } : null,
  );

  return (
    <AppChrome email={user.email ?? ""} role={profile?.role ?? "supplier"} notifications={notifications}>
      {children}
    </AppChrome>
  );
}
