"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Layers,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  FileCode2,
  Sparkles,
  Cloud,
  Server,
  HardDrive,
  Cpu,
  Globe,
  Terminal,
  Zap,
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
import { WhiteLabelBranding, ProvisioningStatus } from "@/types/whitelabel";
import { WhiteLabelSubNav } from "./whitelabel-subnav";
import { ClientCloudProvisioningTerminal } from "./client-cloud-provisioning-terminal";

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
  const [showTerminal, setShowTerminal] = useState(false);

  const portalUrl = branding.customDomain
    ? `https://${branding.customDomain}`
    : branding.subdomain
      ? `https://${branding.subdomain}.platform.royalmotionit.com`
      : "http://localhost:3001";

  const envSnippet = `# WhiteLabel Hosting Bundle (.env)
# Only 3 environment variables required. All branding, themes & SEO load from database via Setup Wizard.
API_BASE_URL="http://localhost:5000"
API_KEY="${latestKeyPrefix ? latestKeyPrefix.replace("...", "xxxx") : "rmit_live_your_generated_api_key"}"
INTERNAL_API_SECRET="your_32_character_internal_api_secret"`;

  const copySnippet = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    toast.success("Environment snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const isDomainConfigured = Boolean(
    branding.subdomain || branding.customDomain,
  );
  const isBrandingComplete = Boolean(
    branding.name && (branding.logoUrl || branding.primaryColor),
  );
  const isApiReady = activeKeyCount > 0;
  const isSetupDone = Boolean(branding.isSetupComplete);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <WhiteLabelSubNav
        tenantName={branding.name}
        tenantCode={branding.code}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      {/* Setup Wizard Incomplete Alert Banner */}
      {!isSetupDone && (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Initial WhiteLabel Setup Pending
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]"
                  >
                    Action Required
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Your tenant is active, but your portal identity has not yet
                  been initialized. Run the guided 7-step wizard to configure
                  your brand name, dual-mode theme colors, registration policy,
                  and provision your initial WhiteLabel Super Admin account.
                </p>
              </div>
            </div>
            <Link href="/whitelabel/setup" className="shrink-0">
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 h-9 shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Launch Setup Wizard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Top Actions & Notification Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>WhiteLabel Management Hub</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Production readiness checklist, live tenant telemetry, and
            self-hosted configuration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/whitelabel/setup">
            <Button
              variant={isSetupDone ? "outline" : "default"}
              size="sm"
              className="text-xs h-9 gap-1.5 font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>
                {isSetupDone ? "Reconfigure Wizard" : "Launch Setup Wizard"}
              </span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={copySnippet}
            className="text-xs h-9 gap-1.5 font-mono"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy .env Config</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Brand Identity */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">
                Brand Identity
              </div>
              <div className="text-sm font-bold text-foreground truncate max-w-[140px]">
                {branding.name || "Default Brand"}
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  className="h-2.5 w-2.5 rounded-full border border-border"
                  style={{
                    backgroundColor: branding.primaryColor || "#6366f1",
                  }}
                />
                <span className="text-[11px] text-muted-foreground font-mono">
                  {branding.primaryColor || "#6366f1"}
                </span>
              </div>
            </div>
            <Link href="/whitelabel/branding">
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 2: Domain Routing */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <div className="text-xs text-muted-foreground font-medium">
                Routing Endpoint
              </div>
              <div className="text-sm font-bold text-foreground truncate">
                {branding.customDomain ||
                  (branding.subdomain
                    ? `${branding.subdomain}.platform...`
                    : "None configured")}
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
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 3: API Credentials */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">
                Active API Keys
              </div>
              <div className="text-sm font-bold text-foreground">
                {activeKeyCount}{" "}
                {activeKeyCount === 1 ? "Key Provisioned" : "Keys Provisioned"}
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
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 4: Portal Users */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">
                Portal Staff
              </div>
              <div className="text-sm font-bold text-foreground">
                {userCount} {userCount === 1 ? "Active User" : "Active Users"}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Role-based permissions
              </span>
            </div>
            <Link href="/whitelabel/users">
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Cloud Infrastructure & Edge Routing (AWS + Cloudflare) */}
      <Card className="border-border/70 shadow-xs bg-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Multi-Cloud Infrastructure Telemetry
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono font-semibold ${
                      branding.provisioningStatus ===
                        ProvisioningStatus.ACTIVE || branding.awsInstanceId
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : branding.provisioningStatus ===
                            ProvisioningStatus.FAILED
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    }`}
                  >
                    {branding.provisioningStatus ===
                      ProvisioningStatus.ACTIVE || branding.awsInstanceId
                      ? "CLOUD DEPLOYED"
                      : branding.provisioningStatus || "NOT DEPLOYED"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Dedicated AWS EC2 compute, Elastic IP static IPv4, S3 Audio
                  Vault, SES v2 email, and Cloudflare DNS routing.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTerminal(!showTerminal)}
                className="text-xs h-8 gap-1.5 font-mono"
              >
                <Terminal className="h-3.5 w-3.5 text-amber-500" />
                <span>
                  {showTerminal ? "Hide Console" : "View Cloud Terminal"}
                </span>
              </Button>
              <Link href="/whitelabel/setup">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-sm"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>
                    {branding.awsInstanceId
                      ? "Re-provision Cloud"
                      : "Deploy Cloud"}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        {showTerminal && (
          <div className="p-4 bg-zinc-950 border-b border-zinc-800">
            <ClientCloudProvisioningTerminal
              onSuccess={() => {
                toast.success("Cloud infrastructure synchronized.");
              }}
            />
          </div>
        )}

        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. EC2 Compute */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Server className="h-3.5 w-3.5 text-blue-500" />
                  EC2 Instance
                </span>
                <span className="font-mono text-[10px] text-emerald-500">
                  {branding.awsInstanceState || "ACTIVE"}
                </span>
              </div>
              <div className="font-mono font-bold text-sm text-foreground truncate">
                {branding.awsInstanceId || "i-09f4b7a2... (Provisioned)"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {branding.awsInstanceType || "t4g.medium (ARM64 Graviton)"}
              </div>
            </div>

            {/* 2. Dedicated Elastic IP */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Cpu className="h-3.5 w-3.5 text-amber-500" />
                  Dedicated Elastic IP
                </span>
                <span className="font-mono text-[10px] text-emerald-500">
                  STATIC IPv4
                </span>
              </div>
              <div className="font-mono font-bold text-sm text-foreground truncate">
                {branding.awsElasticIp ||
                  branding.elasticIpv4 ||
                  "54.226.114.89"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Zero-Downtime Dedicated IPv4
              </div>
            </div>

            {/* 3. S3 Audio Vault */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                  S3 Audio Vault
                </span>
                <span className="font-mono text-[10px] text-emerald-500">
                  CORS + GLACIER
                </span>
              </div>
              <div className="font-mono font-bold text-sm text-foreground truncate">
                {branding.bucketName || "rmit-audio-vault"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Cost-saving Glacier archive rules
              </div>
            </div>

            {/* 4. Cloudflare DNS & SSL */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Globe className="h-3.5 w-3.5 text-sky-500" />
                  Edge SSL &amp; Routing
                </span>
                <span className="font-mono text-[10px] text-emerald-500">
                  PROXIED
                </span>
              </div>
              <div className="font-mono font-bold text-sm text-foreground truncate">
                {branding.customDomain ||
                  (branding.subdomain
                    ? `${branding.subdomain}.platform...`
                    : "backstage.royalmotionit.com")}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Automatic DKIM CNAME &amp; Edge SSL
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4-Step Production Launch Roadmap */}
      <Card className="border-border/70 shadow-xs bg-card">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Production Launch Checklist
              </CardTitle>
              <CardDescription className="text-xs">
                Essential configuration steps to deploy and serve your
                WhiteLabel portal to clients.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
              <span>Readiness:</span>
              <span className="text-foreground font-bold">
                {
                  [
                    isSetupDone,
                    isBrandingComplete,
                    isDomainConfigured,
                    isApiReady,
                    true,
                  ].filter(Boolean).length
                }
                /5 Complete
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {/* Step 1: Guided Setup Wizard */}
          <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isSetupDone
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-amber-500/10 text-amber-500"
                }`}
              >
                {isSetupDone ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>Guided WhiteLabel Setup Wizard</span>
                  {isSetupDone && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]"
                    >
                      Configured
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  7-step guided workflow for brand identity, dual-mode themes,
                  registration policy, and owner creation.
                </div>
              </div>
            </div>
            <Link href="/whitelabel/setup">
              <Button
                variant={isSetupDone ? "outline" : "default"}
                size="sm"
                className="text-xs h-8"
              >
                {isSetupDone ? "Reconfigure" : "Launch Wizard"}
              </Button>
            </Link>
          </div>

          {/* Step 2: Branding */}
          <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isBrandingComplete
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isBrandingComplete ? <Check className="h-4 w-4" /> : "2"}
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Brand Identity &amp; Creative Assets
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Upload brand logos, favicon, company name, and support
                  contacts.
                </div>
              </div>
            </div>
            <Link href="/whitelabel/branding">
              <Button variant="outline" size="sm" className="text-xs h-8">
                {isBrandingComplete ? "Manage Assets" : "Configure"}
              </Button>
            </Link>
          </div>

          {/* Step 3: Domain */}
          <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isDomainConfigured
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDomainConfigured ? <Check className="h-4 w-4" /> : "3"}
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Domain Routing &amp; DNS Ownership
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Assign platform subdomain (*.platform.royalmotionit.com) or
                  verify custom domain with DNS TXT record.
                </div>
              </div>
            </div>
            <Link href="/whitelabel/domain">
              <Button variant="outline" size="sm" className="text-xs h-8">
                {isDomainConfigured ? "Manage DNS" : "Setup Domain"}
              </Button>
            </Link>
          </div>

          {/* Step 4: API Key */}
          <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isApiReady
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isApiReady ? <Check className="h-4 w-4" /> : "4"}
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  API Key Provisioning
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Generate an integration token to connect your hosted
                  WhiteLabel bundle with the platform backend.
                </div>
              </div>
            </div>
            <Link href="/whitelabel/api-keys">
              <Button variant="outline" size="sm" className="text-xs h-8">
                {isApiReady ? "View Keys" : "Generate Key"}
              </Button>
            </Link>
          </div>

          {/* Step 5: Portal Launch */}
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
                  Deploy the bundle on your hosting server and point traffic to
                  your domain.
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
            Deploy the WhiteLabel portal package on your hosting server (Vercel,
            AWS, VPS, or Docker) and configure these variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-xs overflow-x-auto text-zinc-300">
            <pre className="text-[11px] leading-relaxed select-all">
              {envSnippet}
            </pre>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-2 pt-1">
            <span>
              The WhiteLabel frontend will connect to your tenant partition via
              the authorized API Key.
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
