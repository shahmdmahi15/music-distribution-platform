import { clientGetDomainAction } from "@/actions/client/whitelabel/client-domain.action";
import { clientGetBrandingAction } from "@/actions/client/whitelabel/client-get-branding.action";
import { ClientDomainView } from "@/components/client/whitelabel/client-domain-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function WhiteLabelDomainPage() {
  const [domainResult, brandingResult] = await Promise.all([
    clientGetDomainAction(),
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
                "You must have an approved WhiteLabel application before configuring custom domains."}
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

  const defaultDomainConfig = {
    subdomain: brandingResult.branding.subdomain,
    platformSubdomainFqdn: brandingResult.branding.subdomain
      ? `${brandingResult.branding.subdomain}.platform.royalmotionit.com`
      : null,
    customDomain: brandingResult.branding.customDomain,
    cnameHost: "backstage",
    cnameTarget: brandingResult.branding.subdomain
      ? `${brandingResult.branding.subdomain}.platform.royalmotionit.com`
      : "platform.royalmotionit.com",
    txtRecordName: `_royalmotionit-verification.${brandingResult.branding.customDomain || "yourdomain.com"}`,
    txtRecordValue: `royalmotionit-verification=rmit-verify-${brandingResult.branding.code}`,
    verified: !!brandingResult.branding.customDomain,
    sslStatus: brandingResult.branding.customDomain
      ? "ACTIVE"
      : "NOT_CONFIGURED",
    hasCloudflareCredentials:
      domainResult.domain?.hasCloudflareCredentials ??
      brandingResult.branding.hasCloudflareCredentials ??
      Boolean(
        brandingResult.branding.cloudflareZoneId &&
        brandingResult.branding.cloudflareBaseDomain,
      ),
    cloudflareBaseDomain:
      domainResult.domain?.cloudflareBaseDomain ??
      brandingResult.branding.cloudflareBaseDomain ??
      null,
    expectedCustomDomain:
      domainResult.domain?.expectedCustomDomain ??
      (brandingResult.branding.cloudflareBaseDomain
        ? `backstage.${brandingResult.branding.cloudflareBaseDomain
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/\/.*$/, "")
            .replace(/^backstage\./, "")
            .replace(/^\.+|\.+$/g, "")}`
        : null),
    status: {
      verified: !!brandingResult.branding.customDomain,
      sslStatus: brandingResult.branding.customDomain
        ? ("ACTIVE" as const)
        : ("NOT_CONFIGURED" as const),
      dnsStatus: brandingResult.branding.customDomain
        ? ("CONNECTED" as const)
        : ("PENDING_SETUP" as const),
    },
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <ClientDomainView
        initialConfig={domainResult.domain || defaultDomainConfig}
        branding={brandingResult.branding}
      />
    </div>
  );
}
