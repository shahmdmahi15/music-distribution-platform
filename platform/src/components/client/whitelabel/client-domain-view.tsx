"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Info,
  Server,
  Trash2,
  Sparkles,
  Layers,
  KeyRound,
  FileCode2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  WhiteLabelDomainConfig,
  WhiteLabelBranding,
} from "@/types/whitelabel";
import {
  clientUpdateDomainAction,
  clientVerifyDomainAction,
} from "@/actions/client/whitelabel/client-domain.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";
import Link from "next/link";

interface ClientDomainViewProps {
  initialConfig: WhiteLabelDomainConfig;
  branding: WhiteLabelBranding;
}

export function ClientDomainView({
  initialConfig,
  branding,
}: ClientDomainViewProps) {
  const [config, setConfig] = useState<WhiteLabelDomainConfig>(initialConfig);
  const [subdomainInput, setSubdomainInput] = useState(
    initialConfig.subdomain || branding.subdomain || "",
  );
  const [customDomainInput, setCustomDomainInput] = useState(
    initialConfig.customDomain || "",
  );
  const [savingSubdomain, setSavingSubdomain] = useState(false);
  const [savingCustomDomain, setSavingCustomDomain] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveSubdomain = async () => {
    const slug = subdomainInput.trim().toLowerCase();
    if (!slug) {
      toast.error("Please enter a valid subdomain slug.");
      return;
    }

    if (!/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(slug)) {
      toast.error(
        "Subdomain must contain only lowercase letters, numbers, and hyphens.",
      );
      return;
    }

    setSavingSubdomain(true);
    try {
      const res = await clientUpdateDomainAction({ subdomain: slug });
      if (res.success) {
        toast.success(res.message);
        setConfig((prev) => ({
          ...prev,
          subdomain: slug,
          platformSubdomainFqdn: `${slug}.platform.royalmotionit.com`,
        }));
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update subdomain.");
    } finally {
      setSavingSubdomain(false);
    }
  };

  const handleSaveCustomDomain = async () => {
    const domain = customDomainInput.trim().toLowerCase();
    if (!domain) {
      toast.error("Please enter a valid domain name (e.g., catalog.yourlabel.com).");
      return;
    }

    setSavingCustomDomain(true);
    try {
      const res = await clientUpdateDomainAction({ customDomain: domain });
      if (res.success) {
        toast.success(res.message);
        setConfig((prev) => ({
          ...prev,
          customDomain: res.customDomain || domain,
          verified: false,
          sslStatus: "PENDING_VERIFICATION",
          status: res.status || {
            verified: false,
            sslStatus: "PENDING_VERIFICATION",
            dnsStatus: "PENDING_VERIFICATION",
          },
        }));
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update custom domain.");
    } finally {
      setSavingCustomDomain(false);
    }
  };

  const handleRemoveCustomDomain = async () => {
    setSavingCustomDomain(true);
    try {
      const res = await clientUpdateDomainAction({ customDomain: "" });
      if (res.success) {
        toast.success("Custom domain removed.");
        setCustomDomainInput("");
        setConfig((prev) => ({
          ...prev,
          customDomain: null,
          verified: false,
          sslStatus: "NOT_CONFIGURED",
          status: {
            verified: false,
            sslStatus: "NOT_CONFIGURED",
            dnsStatus: "PENDING_SETUP",
          },
        }));
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to remove domain.");
    } finally {
      setSavingCustomDomain(false);
    }
  };

  const handleVerifyDns = async () => {
    setVerifying(true);
    try {
      const res = await clientVerifyDomainAction();
      if (res.success) {
        toast.success(res.message);
        if (res.status) {
          setConfig((prev) => ({
            ...prev,
            verified: res.status?.verified,
            sslStatus: res.status?.sslStatus,
            status: res.status,
          }));
        }
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to run DNS verification.");
    } finally {
      setVerifying(false);
    }
  };

  const isCustomVerified = Boolean(
    config.verified || config.status?.verified,
  );
  const cnameTarget = config.cnameTarget || config.cnameHost || "cname.whitelabel.royalmotionit.com";
  const verificationToken =
    config.domainVerificationToken || `rmit-verify-${branding.code}`;
  const txtName = config.customDomain
    ? `_royalmotionit-verification.${config.customDomain}`
    : "_royalmotionit-verification";
  const txtValue = `royalmotionit-verification=${verificationToken}`;

  const platformSubdomainUrl = config.subdomain
    ? `https://${config.subdomain}.platform.royalmotionit.com`
    : null;

  return (
    <div className="space-y-6">
      <WhiteLabelSubNav
        tenantName={branding.name}
        subdomain={config.subdomain || branding.subdomain}
        customDomain={config.customDomain}
      />

      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Subdomain Routing */}
        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground font-medium">
                Platform Subdomain
              </div>
              <div className="text-sm font-bold truncate mt-0.5 text-foreground">
                {config.subdomain
                  ? `${config.subdomain}.platform.royalmotionit.com`
                  : "Not configured"}
              </div>
              <Badge
                variant="outline"
                className="mt-1 text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              >
                Zero-Config SSL
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Custom Domain Status */}
        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                isCustomVerified
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-amber-500/10 text-amber-500"
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground font-medium">
                Custom Domain DNS
              </div>
              <div className="text-sm font-bold truncate mt-0.5 text-foreground">
                {config.customDomain || "None connected"}
              </div>
              <Badge
                variant={isCustomVerified ? "default" : "outline"}
                className={`mt-1 text-[10px] ${
                  isCustomVerified
                    ? "bg-emerald-500 text-white"
                    : "border-amber-500/30 text-amber-500"
                }`}
              >
                {isCustomVerified ? "VERIFIED & ACTIVE" : "PENDING DNS"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: SSL / TLS */}
        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                isCustomVerified || config.subdomain
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground font-medium">
                SSL / TLS Encryption
              </div>
              <div className="text-sm font-bold mt-0.5 text-foreground">
                {isCustomVerified || config.subdomain ? "AUTOMATIC (ACTIVE)" : "NOT PROVISIONED"}
              </div>
              <span className="text-[10px] text-muted-foreground">
                Automated TLS 1.3 encryption
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Routing Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Option 1: Dedicated Platform Subdomain */}
        <Card className="border-border/70 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Option A: Platform Subdomain
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Instant setup under *.platform.royalmotionit.com
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px]"
                >
                  Recommended
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use your dedicated platform subdomain if you don't own a custom
                domain. It requires zero DNS configuration and includes instant
                SSL certificate provisioning.
              </p>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Subdomain Prefix</Label>
                <div className="flex rounded-lg border border-border/80 overflow-hidden bg-background">
                  <Input
                    value={subdomainInput}
                    onChange={(e) => setSubdomainInput(e.target.value.toLowerCase())}
                    placeholder="myrecordlabel"
                    className="border-0 focus-visible:ring-0 text-xs font-mono rounded-none"
                  />
                  <span className="bg-muted px-3 py-2 text-xs font-mono text-muted-foreground border-l border-border/80 flex items-center">
                    .platform.royalmotionit.com
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Letters, numbers, and hyphens only (e.g.{" "}
                  <code className="text-foreground font-mono">royalmusic</code>).
                </p>
              </div>

              {platformSubdomainUrl && (
                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">
                      Live Subdomain URL:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(platformSubdomainUrl, "subdomain-url")
                      }
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                    >
                      {copiedKey === "subdomain-url" ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-foreground break-all text-xs font-semibold">
                    {platformSubdomainUrl}
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <CardContent className="pt-2 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {config.subdomain ? "Subdomain is active" : "Save to activate"}
            </span>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveSubdomain}
              disabled={savingSubdomain}
              className="text-xs font-semibold gap-1.5"
            >
              {savingSubdomain ? "Saving..." : "Save Subdomain"}
            </Button>
          </CardContent>
        </Card>

        {/* Option 2: Custom Domain */}
        <Card className="border-border/70 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Option B: Custom Domain
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Brand-owned FQDN (e.g. catalog.yourlabel.com)
                    </CardDescription>
                  </div>
                </div>
                {config.customDomain && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      isCustomVerified
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : "border-amber-500/30 text-amber-500"
                    }`}
                  >
                    {isCustomVerified ? "Verified" : "Pending DNS"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your brand's own domain to deliver a 100% white-labeled
                experience to artists and record labels. Requires TXT DNS
                verification below.
              </p>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Custom FQDN Domain</Label>
                <div className="flex gap-2">
                  <Input
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="catalog.yourrecordlabel.com"
                    className="text-xs font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveCustomDomain}
                    disabled={savingCustomDomain}
                    className="text-xs font-semibold flex-shrink-0"
                  >
                    {savingCustomDomain ? "Saving..." : "Save Domain"}
                  </Button>
                </div>
              </div>

              {config.customDomain && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Active Custom Domain:</span>
                    <code className="font-mono text-foreground font-semibold">
                      {config.customDomain}
                    </code>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCustomDomain}
                    disabled={savingCustomDomain}
                    className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-8 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Disconnect
                  </Button>
                </div>
              )}
            </CardContent>
          </div>

          <CardContent className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Ownership verified via DNS TXT record</span>
              <span className="font-mono text-[11px] text-foreground font-medium">
                TTL: 300s
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DNS Records Table for Custom Domains */}
      {config.customDomain && (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  DNS Ownership & Routing: {config.customDomain}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Follow the 2-step verification workflow. First verify domain ownership via TXT, then route traffic via CNAME or A Record.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVerifyDns}
                disabled={verifying}
                className="text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 flex-shrink-0"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    verifying ? "animate-spin text-primary" : ""
                  }`}
                />
                <span>{verifying ? "Verifying Ownership..." : "Verify TXT Record"}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/60">
              {/* Step 1: TXT Ownership Verification */}
              <div className="p-4 bg-card hover:bg-muted/20 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      STEP 1: TXT RECORD
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">
                      Domain Ownership Verification (Required First)
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      isCustomVerified
                        ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-bold"
                        : "text-amber-500 border-amber-500/30 bg-amber-500/10"
                    }`}
                  >
                    {isCustomVerified ? "OWNERSHIP VERIFIED" : "WAITING FOR TXT PROPAGATION"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Host / Name
                    </span>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/60 font-mono">
                      <span className="truncate mr-2 text-foreground font-semibold">
                        {txtName}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(txtName, "txt-name")}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        {copiedKey === "txt-name" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      TXT Value
                    </span>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/60 font-mono">
                      <span className="truncate mr-2 text-amber-500 dark:text-amber-300 font-semibold">
                        {txtValue}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(txtValue, "txt-value")}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        {copiedKey === "txt-value" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Traffic Routing (Locked until Step 1 TXT is verified) */}
              <div className="p-4 bg-card transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`font-mono text-xs font-bold ${
                        isCustomVerified
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      STEP 2: TRAFFIC ROUTING
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">
                      Point Custom Domain to RoyalMotionIT Gateway
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      isCustomVerified
                        ? "text-emerald-500 border-emerald-500/30"
                        : "text-muted-foreground border-border/50"
                    }`}
                  >
                    {isCustomVerified ? "UNLOCKED" : "LOCKED (AWAITING STEP 1)"}
                  </Badge>
                </div>

                {!isCustomVerified ? (
                  <div className="p-4 rounded-lg bg-muted/40 border border-dashed border-border/70 text-center space-y-1.5">
                    <Lock className="h-4 w-4 mx-auto text-muted-foreground" />
                    <p className="text-xs font-semibold text-foreground">
                      Routing Records are Locked
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                      Add the TXT record in Step 1 to your DNS provider (Cloudflare, GoDaddy, Namecheap, Route 53, etc.). Once verified, the CNAME and A-Record routing instructions will unlock immediately.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Domain ownership verified! Choose either <strong>Option A (CNAME)</strong> or <strong>Option B (A Record)</strong> in your DNS provider:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Option 2A: CNAME */}
                      <div className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground text-xs">
                            Option A: CNAME Record (Recommended)
                          </span>
                          <Badge variant="outline" className="text-[9px] font-mono">
                            Subdomains
                          </Badge>
                        </div>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="text-muted-foreground">Host: <span className="text-foreground">{config.customDomain.split(".")[0]}</span></div>
                          <div className="flex items-center justify-between p-1.5 rounded bg-background border">
                            <span className="truncate mr-2 text-foreground font-semibold">
                              cname.whitelabel.royalmotionit.com
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard("cname.whitelabel.royalmotionit.com", "cname-target")}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {copiedKey === "cname-target" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Option 2B: A Record */}
                      <div className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground text-xs">
                            Option B: A Record (Root Apex)
                          </span>
                          <Badge variant="outline" className="text-[9px] font-mono">
                            Root / Apex
                          </Badge>
                        </div>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="text-muted-foreground">Host: <span className="text-foreground">@</span></div>
                          <div className="flex items-center justify-between p-1.5 rounded bg-background border">
                            <span className="text-foreground font-semibold">
                              104.21.58.192
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard("104.21.58.192", "a-record-ip")}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {copiedKey === "a-record-ip" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {config.status?.diagnostic && (
              <Alert className="bg-muted/40 border-border/70 py-2.5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs text-muted-foreground font-mono">
                  {config.status.diagnostic}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* WhiteLabel Self-Hosting Deployment Guide */}
      <Card className="border-border/70 shadow-sm bg-gradient-to-r from-background to-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                Self-Hosted WhiteLabel Bundle Instructions
              </CardTitle>
            </div>
            <Link href="/whitelabel/api-keys">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                Generate API Key
              </Button>
            </Link>
          </div>
          <CardDescription className="text-xs">
            Customers host the WhiteLabel bundle on their own VPS or cloud instance and connect it to RoyalMotionIT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            When deploying the WhiteLabel portal bundle on your server, simply configure your{" "}
            <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">.env</code> with:
          </p>
          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-300 space-y-1 overflow-x-auto border border-zinc-800">
            <div>API_BASE_URL="http://localhost:5000"</div>
            <div className="text-amber-300">API_KEY="rmit_live_your_generated_key"</div>
            <div>DEFAULT_WHITELABEL_SUBDOMAIN="{config.subdomain || "yourbrand"}"</div>
          </div>
          <p>
            Once configured with your API key, your portal automatically fetches all brand colors, logo assets, domains, and SSO policies directly from the RoyalMotionIT backend engine.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
