import { meAction } from "@/actions/auth/me.action";
import { clientGetCurrentSubscriptionAction } from "@/actions/client/subscription/client-get-current-subscription.action";
import { clientGetReferrerStatusAction } from "@/actions/client/referrer/client-get-referrer-status.action";
import { ClientWhiteLabelView } from "@/components/client/whitelabel/client-whitelabel-view";
import { redirect } from "next/navigation";

export default async function ClientRootPage() {
  const [me, subRes, referrerRes] = await Promise.all([
    meAction(),
    clientGetCurrentSubscriptionAction(),
    clientGetReferrerStatusAction(),
  ]);

  if (!me.success || !me.user) {
    redirect("/auth/login");
  }

  // If user is an active Referrer partner, take them directly to the Referrer Console
  if (referrerRes.hasApplied && referrerRes.status === "ACTIVE") {
    redirect("/referrer");
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8">
      <ClientWhiteLabelView
        user={me.user}
        subscription={subRes.subscription || null}
        referrer={referrerRes.referrer || null}
      />
    </div>
  );
}
