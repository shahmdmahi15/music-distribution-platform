import { meAction } from "@/actions/auth/me.action";
import { clientGetBrandingAction } from "@/actions/client/whitelabel/client-get-branding.action";
import { ReferrerDashboardView } from "@/components/client/referrer/referrer-dashboard-view";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReferrerPage() {
  const [me, brandingRes] = await Promise.all([
    meAction(),
    clientGetBrandingAction(),
  ]);

  if (!me.success || !me.user) {
    redirect("/auth/login?redirect=/referrer");
  }

  // If branding is missing or not registered yet
  if (!brandingRes.success || !brandingRes.branding) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold">
              Referrer Account Not Activated
            </CardTitle>
            <CardDescription className="text-xs">
              {brandingRes.message ||
                "You must have an active Referrer or Distribution account to access the Referrer Hub."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button
              render={<Link href="/" />}
              size="sm"
              className="text-xs font-semibold"
            >
              Return to Application Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8">
      <ReferrerDashboardView branding={brandingRes.branding} user={me.user} />
    </div>
  );
}
