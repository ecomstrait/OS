import { requireUser } from "@ecomstrait/auth/session";
import { ensureSubscription } from "@/lib/subscription";
import { MerchantChrome } from "@/components/app/merchant-chrome";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Every merchant gets a subscription row (Free, or the first-100 Full promo).
  await ensureSubscription();
  return <MerchantChrome email={user.email ?? ""}>{children}</MerchantChrome>;
}
