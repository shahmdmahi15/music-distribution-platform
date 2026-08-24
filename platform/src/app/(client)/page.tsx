import { meAction } from "@/actions/auth/me.action";
import { clientGetCurrentSubscriptionAction } from "@/actions/client/subscription/client-get-current-subscription.action";
import { ClientWhiteLabelView } from "@/components/client/whitelabel/client-whitelabel-view";
import { redirect } from "next/navigation";

export default async function ClientRootPage() {
  const [me, subRes] = await Promise.all([
    meAction(),
    clientGetCurrentSubscriptionAction(),
  ]);

  if (!me.success || !me.user) {
    redirect("/auth/login");
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <ClientWhiteLabelView
        user={me.user}
        subscription={subRes.subscription || null}
      />
    </div>
  );
}
