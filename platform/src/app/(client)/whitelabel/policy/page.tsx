import { clientGetRegistrationPolicyAction } from "@/actions/client/whitelabel/client-registration-policy.action";
import { clientGetPortalUsersAction } from "@/actions/client/whitelabel/client-portal-users.action";
import { clientGetBrandingAction } from "@/actions/client/whitelabel/client-get-branding.action";
import { ClientRegistrationPolicyView } from "@/components/client/whitelabel/client-registration-policy-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WhiteLabelSignupModel } from "@/types/whitelabel";

export const dynamic = "force-dynamic";

export default async function WhiteLabelPolicyPage() {
  const [policyResult, usersResult, brandingResult] = await Promise.all([
    clientGetRegistrationPolicyAction(),
    clientGetPortalUsersAction(),
    clientGetBrandingAction(),
  ]);

  if (!brandingResult.success || !brandingResult.branding) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold">
              WhiteLabel Not Activated
            </CardTitle>
            <CardDescription className="text-xs">
              {brandingResult.message ||
                "You must have an active WhiteLabel application before managing registration policies."}
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

  if (
    !brandingResult.branding.isSetupComplete &&
    !brandingResult.branding.isSetupCompleted
  ) {
    redirect("/whitelabel/setup");
  }

  const fallbackPolicy = {
    userSignupModel:
      brandingResult.branding.userSignupModel ||
      WhiteLabelSignupModel.INVITE_ONLY,
    policySettings: {
      inviteCodes: [],
      requireEmailVerification: true,
      defaultRole: "CLIENT",
      customWelcomeMessage: "",
      allowDirectApplication: true,
    },
    stats: {
      totalUsers: usersResult.users?.length || 0,
      pendingApprovals:
        usersResult.users?.filter((u) => u.isApproved === false).length || 0,
      activeInviteCodes: 0,
    },
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <ClientRegistrationPolicyView
        branding={brandingResult.branding}
        initialPolicy={policyResult.policy || fallbackPolicy}
        initialUsers={usersResult.users || []}
      />
    </div>
  );
}
