"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Layers,
  Globe,
  KeyRound,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  FileCode2,
  Server,
  Palette,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WhiteLabelBranding, WhiteLabelApiKey } from "@/types/whitelabel";
import { WhiteLabelSubNav } from "./whitelabel-subnav";

interface ClientOverviewViewProps {
  branding: WhiteLabelBranding;
  activeKeyCount: number;
  latestKeyPrefix?: string;
  userCount: number;
}

export function ClientOverviewView({
  branding,
  activeKeyCount,
  latestKeyPrefix,
  userCount,
}: ClientOverviewViewProps) {
  const [copied, setCopied] = useState(false);

  const portalUrl = branding.customDomain
    ? `https://${branding.customDomain}`
    : branding.subdomain
      ? `https://${branding.subdomain}.platform.royalmotionit.com`
      : "http://localhost:3001";

  const envSnippet = `# WhiteLabel Hosting Bundle (.env)
NEXT_PUBLIC_APP_URL="${portalUrl}"
API_BASE_URL="http://localhost:5000"
API_KEY="${latestKeyPrefix ? latestKeyPrefix.replace("...", "xxxx") : "rmit_live_your_generated_api_key"}"
DEFAULT_WHITELABEL_SUBDOMAIN="${branding.subdomain || ""}"`;

  const copySnippet = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    toast.success("Environment snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const isDomainConfigured = Boolean(branding.subdomain || branding.customDomain);
  const isBrandingComplete = Boolean(branding.name && (branding.logoUrl || branding.primaryColor));
  const isApiReady = activeKeyCount > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <WhiteLabelSubNav
        tenantName={branding.name}
        tenantCode={branding.code}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      {/* Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Brand Identity */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Brand Identity</div>
              <div className="text-sm font-bold text-foreground truncate max-w-[140px]">
                {branding.name || "Default Brand"}
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  className="h-2.5 w-2.5 rounded-full border border-border"
                  style={{ backgroundColor: branding.primaryColor || "#6366f1" }}
                />
                <span className="text-[11px] text-muted-foreground font-mono">
                  {branding.primaryColor || "#6366f1"}
                </span>
              </div>
            </div>
            <Link href="/whitelabel/branding">
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 2: Domain Routing */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <div className="text-xs text-muted-foreground font-medium">Routing Endpoint</div>
              <div className="text-sm font-bold text-foreground truncate">
                {branding.customDomain || (branding.subdomain ? `${branding.subdomain}.platform...` : "None configured")}
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  isDomainConfigured
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "border-amber-500/30 text-amber-500"
                }`}
              >
                {isDomainConfigured ? "Routing Active" : "Action Required"}
              </Badge>
            </div>
            <Link href="/whitelabel/domain">
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 3: API Credentials */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Active API Keys</div>
              <div className="text-sm font-bold text-foreground">
                {activeKeyCount} {activeKeyCount === 1 ? "Key Provisioned" : "Keys Provisioned"}
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  isApiReady
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "border-amber-500/30 text-amber-500"
                }`}
              >
                {isApiReady ? "Authorized" : "Generate Key"}
              </Badge>
            </div>
            <Link href="/whitelabel/api-keys">
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 4: Portal Users */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Portal Staff</div>
              <div className="text-sm font-bold text-foreground">
                {userCount} {userCount === 1 ? "Active User" : "Active Users"}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Role-based permissions
              </span>
            </div>
            <Link href="/whitelabel/users">
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 4-Step Production Launch Roadmap */}
      <Card className="border-border/70 shadow-xs bg-card">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Production Launch Checklist
              </CardTitle>
              <CardDescription className="text-xs">
                Essential configuration steps to deploy and serve your WhiteLabel portal to clients.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
              <span>Readiness:</span>
              <span className="text-foreground font-bold">
                {[isBrandingComplete, isDomainConfigured, isApiReady, true].filter(Boolean).length}/4 Complete
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {/* Step 1: Branding */}
          <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                isBrandingComplete
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-muted text-muted-foreground"
              }`}>
                {isBrandingComplete ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Brand Identity &amp; Creative Assets
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Upload brand logos, favicon, company name, and support contacts.
                </div>
              </div>
            </div>
            <Link href="/whitelabel/branding">
              <Button variant="outline" size="sm" className="text-xs h-8">
                {isBrandingComplete ? "Manage Assets" : "Configure"}
              </Button>
            </Link>
          </div>

          {/* Step 2: Domain */}
          <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                isDomainConfigured
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-muted text-muted-foreground"
              }`}>
                {isDomainConfigured ? <Check className="h-4 w-4" /> : "2"}
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Domain Routing &amp; DNS Ownership
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Assign platform subdomain (*.platform.royalmotionit.com) or verify custom domain with DNS TXT record.
                </div>
              </div>
            </div>
            <Link href="/whitelabel/domain">
              <Button variant="outline" size="sm" className="text-xs h-8">
                {isDomainConfigured ? "Manage DNS" : "Setup Domain"}
              </Button>
            </Link>
          </div>

          {/* Step 3: API Key */}
          <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                isApiReady
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-muted text-muted-foreground"
              }`}>
                {isApiReady ? <Check className="h-4 w-4" /> : "3"}
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  API Key Provisioning
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Generate an integration token to connect your hosted WhiteLabel bundle with the platform backend.
                </div>
              </div>
            </div>
            <Link href="/whitelabel/api-keys">
              <Button variant="outline" size="sm" className="text-xs h-8">
                {isApiReady ? "View Keys" : "Generate Key"}
              </Button>
            </Link>
          </div>

          {/* Step 4: Portal Launch */}
          <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  WhiteLabel Portal Deployment
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Deploy the bundle on your hosting server and point traffic to your domain.
                </div>
              </div>
            </div>
            <a href={portalUrl} target="_blank" rel="noreferrer">
              <Button size="sm" className="text-xs h-8 gap-1">
                <span>Launch Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Self-Hosted Bundle Integration Snippet */}
      <Card className="border-border/70 shadow-xs bg-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Self-Hosted Bundle Configuration Guide
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copySnippet}
              className="text-xs h-8 gap-1.5 font-mono"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy .env Snippet
                </>
              )}
            </Button>
          </div>
          <CardDescription className="text-xs">
            Deploy the WhiteLabel portal package on your hosting server (Vercel, AWS, VPS, or Docker) and configure these variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-xs overflow-x-auto text-zinc-300">
            <pre className="text-[11px] leading-relaxed select-all">{envSnippet}</pre>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-2 pt-1">
            <span>
              The WhiteLabel frontend will connect to your tenant partition via the authorized API Key.
            </span>
            <Link
              href="/whitelabel/api-keys"
              className="text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              Manage API Keys &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
