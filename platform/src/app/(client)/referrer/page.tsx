import { meAction } from "@/actions/auth/me.action";
import { clientGetReferrerStatusAction } from "@/actions/client/referrer/client-get-referrer-status.action";
import { clientGetReferrerMeAction } from "@/actions/client/referrer/client-get-referrer-me.action";
import { ReferrerDashboardView } from "@/components/client/referrer/referrer-dashboard-view";
import { ClientReferrerStatusView } from "@/components/client/referrer/client-referrer-status-view";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, HeartHandshake } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReferrerPage() {
  const [me, referrerStatus, referrerMe] = await Promise.all([
    meAction(),
    clientGetReferrerStatusAction(),
    clientGetReferrerMeAction(),
  ]);

  if (!me.success || !me.user) {
    redirect("/auth/login?redirect=/referrer");
  }

  // If user has applied as a Referrer
  if (referrerStatus.hasApplied && referrerStatus.referrer) {
    // If ACTIVE, render full interactive Referrer Dashboard
    if (referrerStatus.status === "ACTIVE") {
      const activeReferrer = referrerMe.referrer || referrerStatus.referrer;
      return (
        <div className="w-full min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8">
          <ReferrerDashboardView referrer={activeReferrer} user={me.user} />
        </div>
      );
    }

    // If PENDING, UNDER_REVIEW, REJECTED, or SUSPENDED, show Status View
    return (
      <div className="w-full min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8">
        <ClientReferrerStatusView referrer={referrerStatus.referrer} />
      </div>
    );
  }

  // If user hasn't applied as Referrer yet
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <Card className="max-w-md w-full border-border/80 shadow-md">
        <CardHeader className="text-center pb-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold">
            Referrer Partner Program
          </CardTitle>
          <CardDescription className="text-xs">
            You do not currently have a registered Referrer Partner account. Earn 15% flat commission bounties
            (min ৳9,000 BDT per deal) by referring music distributors to our platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button
            render={<Link href="/" />}
            size="sm"
            className="text-xs font-semibold"
          >
            Apply as Referrer Partner
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
