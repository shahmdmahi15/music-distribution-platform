import { clientGetBrandingAction } from "@/actions/client/whitelabel/client-get-branding.action";
import { clientGetApiKeysAction } from "@/actions/client/whitelabel/client-api-keys.action";
import { clientGetPortalUsersAction } from "@/actions/client/whitelabel/client-portal-users.action";
import { ClientOverviewView } from "@/components/client/whitelabel/client-overview-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function WhiteLabelOverviewPage() {
  const [brandingResult, keysResult, usersResult] = await Promise.all([
    clientGetBrandingAction(),
    clientGetApiKeysAction(),
    clientGetPortalUsersAction(),
  ]);

  if (!brandingResult.success || !brandingResult.branding) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold">WhiteLabel Not Activated</CardTitle>
            <CardDescription className="text-xs">
              {brandingResult.message ||
                "You must have an approved WhiteLabel application before accessing the console."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button render={<Link href="/" />} size="sm" className="text-xs font-semibold">
              Return to Application Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const keys = keysResult.keys || [];
  const users = usersResult.users || [];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <ClientOverviewView
        branding={brandingResult.branding}
        activeKeyCount={keys.filter((k) => k.status === "ACTIVE").length}
        latestKeyPrefix={keys[0]?.prefix}
        userCount={users.length}
      />
    </div>
  );
}
