"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Globe,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Server,
  Trash2,
  Lock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Zap,
  Cloud,
  Layers,
  Sparkles,
  CheckCircle,
  XCircle,
  Activity,
  Radio,
  Info,
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
import {
  WhiteLabelDomainConfig,
  WhiteLabelBranding,
  CloudflareInterconnectionResult,
  DomainHoldResult,
  DomainCnameResult,
  DomainHealthReport,
} from "@/types/whitelabel";
import {
  clientUpdateDomainAction,
  clientVerifyCloudflareInterconnectionAction,
  clientHoldAndVerifyDomainAction,
  clientApplyCnameAction,
  clientGetDomainHealthAction,
} from "@/actions/client/whitelabel/client-domain.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";

interface ClientDomainViewProps {
  initialConfig: WhiteLabelDomainConfig;
  branding: WhiteLabelBranding;
}

export function ClientDomainView({
  initialConfig,
  branding,
}: ClientDomainViewProps) {
  const [config, setConfig] = useState<WhiteLabelDomainConfig>(initialConfig);
  const [elasticIpv4Input, setElasticIpv4Input] = useState(
    initialConfig.elasticIpv4 || branding.elasticIpv4 || "",
  );
  const [savingElasticIpv4, setSavingElasticIpv4] = useState(false);

  const rawBaseDomain =
    config.cloudflareBaseDomain || branding.cloudflareBaseDomain || "";
  const cleanBaseDomain = rawBaseDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^backstage\./, "")
    .replace(/^\.+|\.+$/g, "");

  const expectedCustomDomain = cleanBaseDomain
    ? `backstage.${cleanBaseDomain}`
    : "";

  const isInitialCustomDomainConfigured = Boolean(
    config.customDomain &&
    (config.verified ||
      config.status?.verified ||
      config.sslStatus === "ACTIVE"),
  );

  const hasCloudflareCreds = Boolean(
    config.hasCloudflareCredentials ??
    (branding.hasCloudflareCredentials ||
      Boolean(branding.cloudflareZoneId && branding.cloudflareBaseDomain)),
  );


  // Periodic Health State
  const [domainHealth, setDomainHealth] = useState<DomainHealthReport | null>(
    initialConfig.health || null,
  );
  const [lastHealthCheckedAt, setLastHealthCheckedAt] = useState<Date | null>(
    initialConfig.health?.lastCheckedAt
      ? new Date(initialConfig.health.lastCheckedAt)
      : null,
  );
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Stepper / Pipeline interactive states
  const [isCheckingCf, setIsCheckingCf] = useState(false);
  const [cfCheckResult, setCfCheckResult] =
    useState<CloudflareInterconnectionResult | null>(
      initialConfig.health?.step1.status === "VERIFIED"
        ? {
            success: true,
            step: "VERIFIED",
            message: initialConfig.health.step1.message,
            details: initialConfig.health.step1.details,
          }
        : hasCloudflareCreds && isInitialCustomDomainConfigured
          ? {
              success: true,
              step: "VERIFIED",
              message: `Cloudflare credentials interconnected and routing custom domain.`,
              details: {
                zoneId: branding.cloudflareZoneId || undefined,
                zoneName: cleanBaseDomain,
                zoneStatus: "active",
                hasDnsEditPermission: true,
              },
            }
          : null,
    );

  const [isHoldingDomain, setIsHoldingDomain] = useState(false);
  const [holdResult, setHoldResult] = useState<DomainHoldResult | null>(
    initialConfig.verified ||
      initialConfig.health?.step2.status === "VERIFIED" ||
      isInitialCustomDomainConfigured
      ? {
          success: true,
          domainVerified: true,
          heldDomain: initialConfig.customDomain || expectedCustomDomain,
          message:
            initialConfig.health?.step2.message ||
            `Domain "${initialConfig.customDomain || expectedCustomDomain}" held and ownership verified.`,
        }
      : null,
  );

  const [isApplyingCname, setIsApplyingCname] = useState(false);
  const [cnameResult, setCnameResult] = useState<DomainCnameResult | null>(
    isInitialCustomDomainConfigured ||
      initialConfig.health?.step3.status === "VERIFIED"
      ? {
          success: true,
          cnameFqdn: initialConfig.customDomain || expectedCustomDomain,
          cnameTarget: initialConfig.elasticIpv4 || config.elasticIpv4 || "Dedicated Cloud Instance",
          proxied: true,
          message:
            initialConfig.health?.step3.message ||
            `A-Record routing active and pointed directly to dedicated cloud instance.`,
        }
      : null,
  );

  const [isRunningFullFlow, setIsRunningFullFlow] = useState(false);
  const [fullFlowStep, setFullFlowStep] = useState<number>(0);

  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const verificationToken =
    config.domainVerificationToken || `rmit-verify-${branding.code}`;
  const txtValue = `royalmotionit-verification=${verificationToken}`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // --- Live Health Check Routine (Periodic & Manual) ---
  const handleLiveHealthCheck = useCallback(
    async (force = false, showToast = false) => {
      setIsCheckingHealth(true);
      try {
        const res = await clientGetDomainHealthAction(force);
        if (res.success && res.health) {
          setDomainHealth(res.health);
          setLastHealthCheckedAt(new Date(res.health.lastCheckedAt));

          // Sync Step 1
          if (res.health.step1.status === "VERIFIED") {
            setCfCheckResult({
              success: true,
              step: "VERIFIED",
              message: res.health.step1.message,
              details: res.health.step1.details,
            });
          } else if (res.health.step1.status === "FAILED") {
            setCfCheckResult({
              success: false,
              step: "FAILED",
              message: res.health.step1.message,
              details: res.health.step1.details,
            });
          }

          // Sync Step 2
          if (res.health.step2.status === "VERIFIED") {
            setHoldResult({
              success: true,
              domainVerified: true,
              heldDomain: res.health.step2.heldDomain,
              verificationToken: res.health.step2.verificationToken,
              message: res.health.step2.message,
            });
          } else if (res.health.step2.status === "FAILED") {
            setHoldResult({
              success: false,
              domainVerified: false,
              heldDomain: res.health.step2.heldDomain,
              verificationToken: res.health.step2.verificationToken,
              message: res.health.step2.message,
            });
          }

          // Sync Step 3
          if (res.health.step3.status === "VERIFIED") {
            setCnameResult({
              success: true,
              cnameFqdn: res.health.step3.cnameFqdn,
              cnameTarget: res.health.step3.target,
              proxied: res.health.step3.proxied,
              message: res.health.step3.message,
            });
          } else if (res.health.step3.status === "FAILED") {
            setCnameResult({
              success: false,
              cnameFqdn: res.health.step3.cnameFqdn,
              cnameTarget: res.health.step3.target,
              proxied: false,
              message: res.health.step3.message,
            });
          }

          // Strictly synchronize config state with health report
          setConfig((prev) => ({
            ...prev,
            customDomain: res.health?.step2.heldDomain || prev.customDomain,
            verified: res.health?.step2.status === "VERIFIED",
            sslStatus:
              res.health?.step3.status === "VERIFIED"
                ? "ACTIVE"
                : "PENDING_VERIFICATION",
            status: {
              ...prev.status,
              verified: res.health?.step2.status === "VERIFIED",
              sslStatus:
                res.health?.step3.status === "VERIFIED"
                  ? "ACTIVE"
                  : "PENDING_VERIFICATION",
              dnsStatus:
                res.health?.step3.status === "VERIFIED"
                  ? "ACTIVE"
                  : "PENDING_SETUP",
            },
          }));

          if (showToast) {
            if (
              res.health.allConnected &&
              res.health.subdomain.status === "VERIFIED"
            ) {
              toast.success(
                "Health check: Subdomain, Elastic IP & all 3 Custom Domain layers are healthy!",
              );
            } else if (!res.health.allConnected) {
              toast.warning(
                res.health.step3.status === "FAILED"
                  ? "CNAME record not found in Cloudflare. Routing is inactive."
                  : res.health.step2.status === "FAILED"
                    ? "TXT ownership record missing in Cloudflare."
                    : "Domain health check completed with issues.",
              );
            } else {
              toast.info("Periodic domain & subdomain health check completed.");
            }
          }
        }
      } catch (err: unknown) {
        if (showToast) {
          const msg = err instanceof Error ? err.message : "Health check error";
          toast.error(msg);
        }
      } finally {
        setIsCheckingHealth(false);
      }
    },
    [expectedCustomDomain],
  );

  // Auto-verify on mount and periodic interval every 30 seconds
  useEffect(() => {
    // Immediate initial health check for subdomain & custom domain
    handleLiveHealthCheck(false, false);

    // Periodic check every 30 seconds
    const interval = setInterval(() => {
      handleLiveHealthCheck(false, false);
    }, 30000);

    return () => clearInterval(interval);
  }, [handleLiveHealthCheck]);

  // Format last checked time
  const getLastCheckedLabel = () => {
    if (!lastHealthCheckedAt) return "Pending initial check";
    const diffSeconds = Math.max(
      0,
      Math.floor((Date.now() - lastHealthCheckedAt.getTime()) / 1000),
    );
    if (diffSeconds < 10) return "Checked just now";
    if (diffSeconds < 60) return `Checked ${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    return `Checked ${diffMinutes}m ago`;
  };

  // Step 1 status calculation
  const isStep1Verified = Boolean(
    domainHealth
      ? domainHealth.step1.status === "VERIFIED"
      : cfCheckResult?.success,
  );
  const isStep1Failed = Boolean(
    domainHealth
      ? domainHealth.step1.status === "FAILED"
      : cfCheckResult && !cfCheckResult.success,
  );

  // Step 2 status calculation
  const isStep2Verified = Boolean(
    domainHealth
      ? domainHealth.step2.status === "VERIFIED"
      : holdResult?.domainVerified || config.verified,
  );
  const isStep2Failed = Boolean(
    domainHealth
      ? domainHealth.step2.status === "FAILED"
      : holdResult && !holdResult.success,
  );

  // Step 3 status calculation
  const isStep3Verified = Boolean(
    domainHealth
      ? domainHealth.step3.status === "VERIFIED"
      : cnameResult?.success && config.sslStatus === "ACTIVE",
  );
  const isStep3Failed = Boolean(
    domainHealth
      ? domainHealth.step3.status === "FAILED"
      : cnameResult && !cnameResult.success,
  );

  const areAllLayersConnected = Boolean(
    domainHealth
      ? domainHealth.allConnected
      : isStep1Verified && isStep2Verified && isStep3Verified,
  );

  const isCustomDomainActive = Boolean(
    config.customDomain && isStep3Verified && areAllLayersConnected,
  );

  const isSubdomainVerified = Boolean(
    domainHealth
      ? domainHealth.subdomain.status === "VERIFIED"
      : Boolean(config.subdomain),
  );

  // --- Option A: Save Elastic IPv4 ---
  const handleSaveElasticIpv4 = async () => {
    const ip = elasticIpv4Input.trim();
    if (ip && !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
      toast.error("Please enter a valid IPv4 address (e.g., 54.210.12.34).");
      return;
    }

    setSavingElasticIpv4(true);
    try {
      const res = await clientUpdateDomainAction({ elasticIpv4: ip });
      if (res.success) {
        toast.success(res.message);
        setConfig((prev) => ({
          ...prev,
          elasticIpv4: ip || null,
        }));
        handleLiveHealthCheck(true, false);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update Elastic IPv4.");
    } finally {
      setSavingElasticIpv4(false);
    }
  };


  // --- Step 1: Verify 3-Way Cloudflare Interconnection ---
  const handleVerifyCloudflare = async () => {
    setIsCheckingCf(true);
    setCfCheckResult(null);
    try {
      const res = await clientVerifyCloudflareInterconnectionAction();
      setCfCheckResult(res);
      if (res.success) {
        toast.success(res.message);
        handleLiveHealthCheck(true, false);
      } else {
        toast.error(res.message);
      }
      return res.success;
    } catch {
      const errRes: CloudflareInterconnectionResult = {
        success: false,
        step: "NETWORK_ERROR",
        message: "Failed to communicate with Cloudflare verification service.",
      };
      setCfCheckResult(errRes);
      toast.error(errRes.message);
      return false;
    } finally {
      setIsCheckingCf(false);
    }
  };

  // --- Step 2: Hold Domain & Verify Ownership ---
  const handleHoldAndVerifyDomain = async () => {
    setIsHoldingDomain(true);
    setHoldResult(null);
    try {
      const res = await clientHoldAndVerifyDomainAction();
      setHoldResult(res);
      if (res.success) {
        toast.success(res.message);
        setConfig((prev) => ({
          ...prev,
          customDomain: res.heldDomain || expectedCustomDomain,
          verified: res.domainVerified ?? true,
          domainVerificationToken:
            res.verificationToken || prev.domainVerificationToken,
        }));
        handleLiveHealthCheck(true, false);
      } else {
        toast.error(res.message);
      }
      return res.success;
    } catch {
      const errRes: DomainHoldResult = {
        success: false,
        message: "Failed to hold domain and verify ownership.",
      };
      setHoldResult(errRes);
      toast.error(errRes.message);
      return false;
    } finally {
      setIsHoldingDomain(false);
    }
  };

  // --- Step 3: Apply CNAME Routing ---
  const handleApplyCname = async () => {
    setIsApplyingCname(true);
    setCnameResult(null);
    try {
      const res = await clientApplyCnameAction();
      setCnameResult(res);
      if (res.success) {
        toast.success(res.message);
        setConfig((prev) => ({
          ...prev,
          customDomain: expectedCustomDomain,
          verified: true,
          sslStatus: "ACTIVE",
          status: {
            verified: true,
            sslStatus: "ACTIVE",
            dnsStatus: "ACTIVE",
          },
        }));
        handleLiveHealthCheck(true, false);
      } else {
        toast.error(res.message);
      }
      return res.success;
    } catch {
      const errRes: DomainCnameResult = {
        success: false,
        message: "Failed to apply Cloudflare CNAME record.",
      };
      setCnameResult(errRes);
      toast.error(errRes.message);
      return false;
    } finally {
      setIsApplyingCname(false);
    }
  };

  // --- 1-Click Complete Automated Onboarding Pipeline ---
  const handleRunFullAutomatedOnboarding = async () => {
    if (!hasCloudflareCreds || !cleanBaseDomain) {
      toast.error(
        "Please configure Cloudflare credentials in Credentials & SSO first.",
      );
      return;
    }

    setIsRunningFullFlow(true);
    setFullFlowStep(1);

    try {
      // Step 1: Interconnection
      toast.info(
        "Step 1/3: Verifying Cloudflare credentials interconnection...",
      );
      const cfRes = await clientVerifyCloudflareInterconnectionAction();
      setCfCheckResult(cfRes);
      if (!cfRes.success) {
        toast.error(
          cfRes.message || "Cloudflare 3-way interconnection failed.",
        );
        setIsRunningFullFlow(false);
        setFullFlowStep(0);
        return;
      }
      toast.success(
        "Step 1 Passed: Cloudflare API Token, Zone ID, and Base Domain interconnected!",
      );

      // Step 2: Domain Hold & Ownership
      setFullFlowStep(2);
      toast.info(
        `Step 2/3: Holding domain ${expectedCustomDomain} & verifying ownership...`,
      );
      const holdRes = await clientHoldAndVerifyDomainAction();
      setHoldResult(holdRes);
      if (!holdRes.success) {
        toast.error(
          holdRes.message || "Failed to hold domain or verify ownership.",
        );
        setIsRunningFullFlow(false);
        setFullFlowStep(0);
        return;
      }
      toast.success(`Step 2 Passed: Domain held and ownership verified!`);

      // Step 3: Apply A-Record Routing
      setFullFlowStep(3);
      toast.info(
        `Step 3/3: Applying A-Record routing pointing backstage to ${config.elasticIpv4 || "dedicated cloud instance"}...`,
      );
      const cnameRes = await clientApplyCnameAction();
      setCnameResult(cnameRes);
      if (!cnameRes.success) {
        toast.error(cnameRes.message || "Failed to apply DNS routing.");
        setIsRunningFullFlow(false);
        setFullFlowStep(0);
        return;
      }

      setFullFlowStep(4);
      toast.success(
        `🎉 Custom domain "${expectedCustomDomain}" is now 100% active and live with TLS 1.3 proxying!`,
      );

      setConfig((prev) => ({
        ...prev,
        customDomain: expectedCustomDomain,
        verified: true,
        sslStatus: "ACTIVE",
        status: {
          verified: true,
          sslStatus: "ACTIVE",
          dnsStatus: "ACTIVE",
        },
      }));

      handleLiveHealthCheck(true, false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred";
      toast.error(`Automated onboarding failed: ${errMsg}`);
    } finally {
      setIsRunningFullFlow(false);
    }
  };

  // --- Disconnect Custom Domain ---
  const handleRemoveCustomDomain = async () => {
    if (
      !confirm(
        `Are you sure you want to disconnect custom domain "${config.customDomain}"? This will remove routing and return all traffic to your platform subdomain.`,
      )
    ) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const res = await clientUpdateDomainAction({ customDomain: "" });
      if (res.success) {
        toast.success("Custom domain disconnected successfully.");
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
        setHoldResult(null);
        setCnameResult(null);
        setCfCheckResult(null);
        setFullFlowStep(0);
        handleLiveHealthCheck(true, false);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to disconnect custom domain.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <WhiteLabelSubNav
        tenantName={branding.name}
        tenantCode={branding.code}
        subdomain={config.subdomain || branding.subdomain}
        customDomain={config.customDomain}
      />

      {/* Top Banner / Notification Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span>Domain, Subdomain &amp; Elastic IP Infrastructure</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Continuous periodic verification active for platform subdomains,
            Elastic IPv4 routing, and Cloudflare custom domains.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs font-semibold px-2.5 py-1"
          >
            Cloudflare Proxied
          </Badge>
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs font-semibold px-2.5 py-1"
          >
            TLS 1.3 Automatic
          </Badge>
        </div>
      </div>

      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Custom Backstage Domain & Dedicated Server Status */}
        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                <span>Custom Backstage Domain</span>
                {domainHealth?.subdomain && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {domainHealth.subdomain.recordType} Record
                  </span>
                )}
              </div>
              <div className="text-sm font-bold truncate mt-0.5 text-foreground font-mono">
                {config.customDomain || expectedCustomDomain || "Not configured"}
              </div>
              <Badge
                variant="outline"
                className={`mt-1 text-[10px] font-semibold ${
                  isCustomDomainActive
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : isStep3Failed
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                }`}
              >
                {isCustomDomainActive
                  ? config.elasticIpv4
                    ? `A-Record Active (${config.elasticIpv4})`
                    : "Custom Domain Active"
                  : isStep3Failed
                    ? "Routing Attention Needed"
                    : "Routing Pending Setup"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Custom Domain Status */}
        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                isCustomDomainActive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : isStep3Failed
                    ? "bg-rose-500/10 text-rose-400"
                    : config.customDomain
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {isStep3Failed ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground font-medium">
                Custom Domain Status
              </div>
              <div className="text-sm font-bold truncate mt-0.5 text-foreground font-mono">
                {config.customDomain ||
                  expectedCustomDomain ||
                  "None connected"}
              </div>
              <Badge
                variant={isCustomDomainActive ? "default" : "outline"}
                className={`mt-1 text-[10px] ${
                  isCustomDomainActive
                    ? "bg-emerald-500 text-white font-bold"
                    : isStep3Failed
                      ? "border-rose-500/30 text-rose-400 bg-rose-500/10 font-bold"
                      : config.customDomain
                        ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                        : "border-border/50 text-muted-foreground"
                }`}
              >
                {isCustomDomainActive
                  ? "ACTIVE & PROXIED"
                  : isStep3Failed
                    ? "CNAME ROUTING DISCONNECTED"
                    : config.customDomain
                      ? "RESERVED / PENDING CNAME"
                      : "NOT CONNECTED"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Cloudflare Interconnection */}
        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                hasCloudflareCreds
                  ? "bg-purple-500/10 text-purple-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Cloud className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground font-medium">
                Cloudflare Integration
              </div>
              <div className="text-sm font-bold truncate mt-0.5 text-foreground font-mono">
                {cleanBaseDomain ? cleanBaseDomain : "No Base Domain"}
              </div>
              <Badge
                variant="outline"
                className={`mt-1 text-[10px] ${
                  isStep1Verified
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold"
                    : hasCloudflareCreds
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                      : "text-muted-foreground border-border/50"
                }`}
              >
                {isStep1Verified
                  ? "Interconnected & Active"
                  : hasCloudflareCreds
                    ? "Credentials Configured"
                    : "Credentials Required"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Routing & Infrastructure Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dedicated Cloud Instance & Network Infrastructure */}
        <Card className="border-border/70 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Dedicated Cloud Instance &amp; Server Network
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Dedicated cloud server Elastic IPv4 and direct custom domain routing
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    config.elasticIpv4
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold"
                      : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                  }`}
                >
                  {config.elasticIpv4
                    ? "Elastic IP Assigned"
                    : "Provisioning Pending"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Elastic IPv4 Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-indigo-500" />
                    Hosted Server Elastic IPv4
                  </Label>
                  {config.elasticIpv4 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    >
                      A-Record Active ({config.elasticIpv4})
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={elasticIpv4Input}
                    onChange={(e) => setElasticIpv4Input(e.target.value.trim())}
                    placeholder="54.210.12.34 (AWS / Cloud Elastic IPv4)"
                    className="text-xs font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveElasticIpv4}
                    disabled={savingElasticIpv4}
                    className="text-xs font-semibold shrink-0 gap-1.5"
                  >
                    {savingElasticIpv4 ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Routing...
                      </>
                    ) : (
                      "Save IP"
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Enter your cloud server&apos;s Elastic IPv4. Cloudflare DNS
                  routes your custom backstage domain directly to your dedicated server.
                </p>
              </div>

              {/* Subdomain & Elastic IP Live Periodic Health Status */}
              {config.subdomain && (
                <div
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    domainHealth?.subdomain.status === "VERIFIED"
                      ? "bg-emerald-500/5 border-emerald-500/25"
                      : domainHealth?.subdomain.status === "FAILED"
                        ? "bg-rose-500/5 border-rose-500/25"
                        : "bg-muted/30 border-border/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Radio
                        className={`h-3.5 w-3.5 ${
                          domainHealth?.subdomain.status === "VERIFIED"
                            ? "text-emerald-500 animate-pulse"
                            : "text-indigo-400"
                        }`}
                      />
                      <span>Subdomain &amp; Elastic IP Periodic Monitor</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono font-bold ${
                        domainHealth?.subdomain.status === "VERIFIED"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          : domainHealth?.subdomain.status === "FAILED"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {domainHealth?.subdomain.status === "VERIFIED"
                        ? "VERIFIED & HEALTHY"
                        : domainHealth?.subdomain.status === "FAILED"
                          ? "MISMATCH DETECTED"
                          : "MONITORED"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                    <div className="bg-background/60 p-2 rounded border border-border/60">
                      <span className="text-muted-foreground block text-[9px]">
                        Routing Type
                      </span>
                      <span className="font-semibold text-foreground">
                        {config.customDomain
                          ? "CNAME -> backstage.<customdomain>"
                          : config.elasticIpv4
                            ? "A Record (Dedicated Elastic IP)"
                            : "CNAME (Platform Default)"}
                      </span>
                    </div>
                    <div className="bg-background/60 p-2 rounded border border-border/60">
                      <span className="text-muted-foreground block text-[9px]">
                        Target Address
                      </span>
                      <span className="font-semibold text-primary truncate block" title={config.customDomain || domainHealth?.subdomain.expectedTarget || "backstage.yourdomain"}>
                        {config.customDomain
                          ? (config.customDomain.startsWith("backstage.")
                              ? config.customDomain
                              : `backstage.${config.customDomain}`)
                          : domainHealth?.subdomain.expectedTarget ||
                            config.elasticIpv4 ||
                            "Configured post-provisioning"}
                      </span>
                    </div>
                  </div>

                  {domainHealth?.subdomain.message && (
                    <p className="text-[11px] text-muted-foreground pt-0.5">
                      {domainHealth.subdomain.message}
                    </p>
                  )}
                </div>
              )}

            </CardContent>
          </div>

          <CardContent className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Dedicated Instance Architecture</span>
              <span className="font-mono text-[11px] text-foreground font-semibold">
                Direct A-Record Routing
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Dedicated Custom Domain Header & Pre-requisite Check */}
        <Card className="border-border/70 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Option B: Custom Domain
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {cleanBaseDomain
                        ? `Brand-owned FQDN (backstage.${cleanBaseDomain})`
                        : "Brand-owned FQDN (backstage.<basedomain>)"}
                    </CardDescription>
                  </div>
                </div>
                {isCustomDomainActive ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-semibold"
                  >
                    Active &amp; Proxied
                  </Badge>
                ) : !hasCloudflareCreds ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30"
                  >
                    Cloudflare Setup Required
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30 font-mono"
                  >
                    {expectedCustomDomain}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your brand&apos;s own domain to deliver an
                uncompromising white-labeled experience. Custom domain is
                strictly enforced as{" "}
                <code className="text-primary font-mono font-semibold">
                  backstage.&lt;basedomain&gt;
                </code>{" "}
                and uses your configured Cloudflare Zone for zero-touch DNS
                orchestration.
              </p>

              {!hasCloudflareCreds || !cleanBaseDomain ? (
                /* Warning banner when credentials missing */
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 mt-0.5 shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-foreground">
                        Cloudflare Credentials Required First
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        To assign and onboard a custom domain, your{" "}
                        <strong className="text-foreground">
                          Cloudflare API Token
                        </strong>
                        , <strong className="text-foreground">Zone ID</strong>,
                        and{" "}
                        <strong className="text-foreground">Base Domain</strong>{" "}
                        must be saved in <strong>Credentials &amp; SSO</strong>.
                      </p>
                      <p className="text-[11px] text-amber-500 font-medium">
                        Custom domain format:{" "}
                        <code className="font-mono font-bold">
                          backstage.&lt;basedomain&gt;
                        </code>
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Button
                      render={<Link href="/whitelabel/sso" />}
                      size="sm"
                      className="text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Configure Cloudflare in Credentials &amp; SSO
                      <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* Credentials Present - Overview Strip & 1-Click Action */
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-purple-500/25 bg-purple-500/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Cloudflare Configured in SSO</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono bg-purple-500/10 text-purple-400 border-purple-500/30"
                      >
                        Zone:{" "}
                        {branding.cloudflareZoneId
                          ? `${branding.cloudflareZoneId.slice(0, 8)}...`
                          : "Active"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-purple-500/10">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">
                          Base Domain:
                        </span>
                        <span className="font-mono text-foreground font-semibold">
                          {cleanBaseDomain}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">
                          Target Custom Domain:
                        </span>
                        <span className="font-mono text-purple-400 font-bold">
                          {expectedCustomDomain}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Automated Onboarding Hero Card */}
                  <div className="p-3.5 rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        <span>1-Click Complete Onboarding Pipeline</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-mono font-bold bg-primary/20 text-primary uppercase"
                      >
                        Automated Flow
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Executes all 3 steps automatically: verifies Cloudflare
                      3-way interconnection, holds domain &amp; verifies
                      ownership via TXT, and applies proxied CNAME routing.
                    </p>

                    <Button
                      type="button"
                      onClick={handleRunFullAutomatedOnboarding}
                      disabled={isRunningFullFlow || areAllLayersConnected}
                      className="w-full text-xs font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    >
                      {isRunningFullFlow ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>
                            {fullFlowStep === 1
                              ? "Step 1/3: Verifying Cloudflare..."
                              : fullFlowStep === 2
                                ? "Step 2/3: Holding Domain & TXT Verification..."
                                : fullFlowStep === 3
                                  ? "Step 3/3: Applying CNAME Routing..."
                                  : "Finalizing..."}
                          </span>
                        </>
                      ) : areAllLayersConnected ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>
                            Domain Fully Onboarded &amp; Continuously Monitored
                          </span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5" />
                          <span>Run Complete Automated Onboarding</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Active Custom Domain Display & Disconnect */}
              {config.customDomain && (
                <div className="p-3 rounded-lg bg-card border border-border/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px]">
                        Active Custom Domain:
                      </span>
                      <code className="font-mono text-foreground font-bold">
                        {config.customDomain}
                      </code>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCustomDomain}
                      disabled={isDisconnecting || isRunningFullFlow}
                      className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 px-2"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Disconnect
                    </Button>
                  </div>

                  {isCustomDomainActive && (
                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                      <span className="text-emerald-500 flex items-center gap-1 font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Live HTTPS traffic enabled (Orange Cloud)
                      </span>
                      <a
                        href={`https://${config.customDomain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-mono"
                      >
                        Visit https://{config.customDomain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </div>

          <CardContent className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Target Dedicated Instance:</span>
              <span className="font-mono text-[11px] text-foreground font-semibold">
                {config.elasticIpv4 || "Assigned Elastic IP"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3-Step Interactive Onboarding Pipeline with Periodic Monitoring */}
      {hasCloudflareCreds && cleanBaseDomain && (
        <Card className="border-border/70 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Custom Domain Onboarding Pipeline</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Follow the 3 sequential steps or click &quot;Run Complete
                  Automated Onboarding&quot; above.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[11px] px-2.5 py-0.5 self-start sm:self-auto bg-primary/5 text-primary border-primary/20"
              >
                Target: {expectedCustomDomain}
              </Badge>
            </div>
          </CardHeader>

          {/* Real-time Periodic Health Indicator Strip */}
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-foreground">
                Continuous Periodic Verification Active
              </span>
              <span className="text-[11px] text-muted-foreground">
                • Subdomains, Elastic IP &amp; Custom Domain Monitored (
                {getLastCheckedLabel()})
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLiveHealthCheck(true, true)}
              disabled={isCheckingHealth || isRunningFullFlow}
              className="text-[11px] h-7 px-2.5 gap-1.5 self-end sm:self-auto shrink-0 border-border/80 hover:bg-muted"
            >
              <RefreshCw
                className={`h-3 w-3 ${isCheckingHealth ? "animate-spin" : ""}`}
              />
              <span>
                {isCheckingHealth ? "Checking..." : "Live Health Check"}
              </span>
            </Button>
          </div>

          {/* Celebratory Banner when All Layers Are Connected */}
          {areAllLayersConnected && (
            <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="font-semibold text-foreground">
                  All Layers Interconnected &amp; Operating Nominally
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-mono shrink-0"
              >
                Subdomain DNS • Elastic IP • Cloudflare API • Domain Hold TXT •
                Proxied CNAME
              </Badge>
            </div>
          )}

          <CardContent className="p-0 divide-y divide-border/60">
            {/* STEP 1: Verify 3-Way Cloudflare Interconnection */}
            <div className="p-4 sm:p-5 space-y-3 bg-card hover:bg-muted/10 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-400 font-bold text-xs flex items-center justify-center border border-purple-500/20">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span>Cloudflare 3-Way Interconnection</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Verify that your API Token, Zone ID, and Base Domain (
                      {cleanBaseDomain}) are interconnected and active.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      isStep1Verified
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : isStep1Failed
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isStep1Verified
                      ? "INTERCONNECTED & ACTIVE"
                      : isStep1Failed
                        ? "VERIFICATION FAILED"
                        : "NOT VERIFIED YET"}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleVerifyCloudflare}
                    disabled={isCheckingCf || isRunningFullFlow}
                    className="text-xs h-8 px-2.5 gap-1.5 shrink-0"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${isCheckingCf ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isCheckingCf ? "Checking..." : "Verify Cloudflare"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Step 1 Details / Feedback */}
              {(cfCheckResult || isStep1Verified) && (
                <div
                  className={`text-xs p-3 rounded-lg border space-y-2 ${
                    isStep1Verified
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-rose-500/5 border-rose-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {isStep1Verified ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    )}
                    <span
                      className={
                        isStep1Verified
                          ? "text-emerald-500 font-semibold"
                          : "text-rose-400 font-semibold"
                      }
                    >
                      {cfCheckResult?.message ||
                        domainHealth?.step1.message ||
                        `Cloudflare credentials interconnected properly. Zone matches "${cleanBaseDomain}".`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40 text-[11px] font-mono">
                    <div className="bg-background/50 p-1.5 rounded">
                      <span className="text-muted-foreground block text-[9px]">
                        Zone Name
                      </span>
                      <span className="text-foreground font-semibold">
                        {cfCheckResult?.details?.zoneName ||
                          domainHealth?.step1.details?.zoneName ||
                          cleanBaseDomain}
                      </span>
                    </div>
                    <div className="bg-background/50 p-1.5 rounded">
                      <span className="text-muted-foreground block text-[9px]">
                        Zone Status
                      </span>
                      <span className="text-emerald-400 font-semibold uppercase">
                        {cfCheckResult?.details?.zoneStatus ||
                          domainHealth?.step1.details?.zoneStatus ||
                          "ACTIVE"}
                      </span>
                    </div>
                    <div className="bg-background/50 p-1.5 rounded">
                      <span className="text-muted-foreground block text-[9px]">
                        DNS Edit Perms
                      </span>
                      <span className="text-indigo-400 font-semibold">
                        {(cfCheckResult?.details?.hasDnsEditPermission ?? true)
                          ? "Granted"
                          : "Restricted"}
                      </span>
                    </div>
                    <div className="bg-background/50 p-1.5 rounded">
                      <span className="text-muted-foreground block text-[9px]">
                        Target FQDN
                      </span>
                      <span className="text-purple-400 font-semibold truncate block">
                        {expectedCustomDomain}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Hold Domain & Verify Ownership */}
            <div className="p-4 sm:p-5 space-y-3 bg-card hover:bg-muted/10 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-500 font-bold text-xs flex items-center justify-center border border-amber-500/20">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span>Reserve Domain &amp; Verify Ownership</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Reserves{" "}
                      <code className="font-mono text-primary">
                        {expectedCustomDomain}
                      </code>{" "}
                      and verifies ownership via automated Cloudflare TXT
                      record.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      isStep2Verified
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : holdResult
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isStep2Verified
                      ? "HELD & OWNERSHIP VERIFIED"
                      : holdResult
                        ? "HELD (WAITING TXT)"
                        : "NOT HELD"}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleHoldAndVerifyDomain}
                    disabled={isHoldingDomain || isRunningFullFlow}
                    className="text-xs h-8 px-2.5 gap-1.5 shrink-0"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${isHoldingDomain ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isHoldingDomain
                        ? "Reserving..."
                        : "Hold & Verify Domain"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Step 2 Details & TXT Record Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                    <span>Host / Subdomain Name:</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      (Type: TXT)
                    </span>
                  </span>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/70 font-mono">
                    <span className="truncate mr-2 text-foreground font-semibold">
                      _royalmotionit-verification.backstage
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          "_royalmotionit-verification.backstage",
                          "txt-host",
                        )
                      }
                      className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                    >
                      {copiedKey === "txt-host" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                    <span>Verification TXT Value:</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      TTL: 120s
                    </span>
                  </span>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/70 font-mono">
                    <span className="truncate mr-2 text-amber-500 dark:text-amber-300 font-semibold text-[11px]">
                      {txtValue}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(txtValue, "txt-val")}
                      className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                    >
                      {copiedKey === "txt-val" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Helpful Cloudflare TXT Quotation Marks Callout */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/60 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-foreground">
                    TXT Record Quotation Marks:{" "}
                  </span>
                  Cloudflare may automatically enclose the TXT record content in
                  double quotation marks (
                  <code className="text-primary font-mono font-semibold">
                    &quot;{txtValue}&quot;
                  </code>
                  ). Our platform normalizes quotation marks automatically, so
                  ownership verification functions seamlessly whether entered
                  with or without quotes.
                </div>
              </div>

              {holdResult && (
                <div
                  className={`text-xs p-2.5 rounded-lg border flex items-center gap-2 ${
                    holdResult.success
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-medium"
                      : "bg-rose-500/5 border-rose-500/20 text-rose-400 font-medium"
                  }`}
                >
                  {holdResult.success ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  )}
                  <span>{holdResult.message}</span>
                </div>
              )}
            </div>

            {/* STEP 3: Route Custom Domain to Dedicated Cloud Instance (A-Record) */}
            <div className="p-4 sm:p-5 space-y-3 bg-card hover:bg-muted/10 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="h-6 w-6 rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs flex items-center justify-center border border-blue-500/20">
                    3
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span>Route Custom Domain to Dedicated Cloud Instance (A-Record)</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Routes <code className="font-mono text-primary">backstage.{cleanBaseDomain}</code> directly to your dedicated cloud instance (<code className="font-mono text-primary">{config.elasticIpv4 || "assigned Elastic IP"}</code>) with Cloudflare SSL &amp; DDoS protection.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      isStep3Verified
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : isStep3Failed
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isStep3Verified
                      ? "A-RECORD & PROXY ACTIVE"
                      : isStep3Failed
                        ? "DNS RECORD MISSING (FAILED)"
                        : "PENDING DNS"}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyCname}
                    disabled={isApplyingCname || isRunningFullFlow}
                    className="text-xs h-8 px-2.5 gap-1.5 shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${isApplyingCname ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isApplyingCname ? "Applying..." : "Apply DNS Routing"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Step 3 Target & Routing Summary Box */}
              <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-background p-2 rounded border border-border/60">
                    <span className="text-muted-foreground block text-[10px]">
                      Primary Custom Backstage
                    </span>
                    <span className="font-bold text-foreground">backstage</span>
                    <span className="text-[10px] text-muted-foreground block">
                      .{cleanBaseDomain}
                    </span>
                  </div>

                  <div className="bg-background p-2 rounded border border-border/60">
                    <span className="text-muted-foreground block text-[10px]">
                      Dedicated Server Elastic IP (A-Record)
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary truncate mr-1" title={config.elasticIpv4 || "Pending Provisioning"}>
                        {config.elasticIpv4 || "Pending Provisioning"}
                      </span>
                      {config.elasticIpv4 && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(config.elasticIpv4!, "elastic-ip")
                          }
                          className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                        >
                          {copiedKey === "elastic-ip" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-background p-2 rounded border border-border/60">
                    <span className="text-muted-foreground block text-[10px]">
                      Cloudflare Proxy
                    </span>
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      <Cloud className="h-3.5 w-3.5" />
                      Orange Cloud (Proxied)
                    </span>
                  </div>
                </div>
              </div>

              {cnameResult && (
                <div
                  className={`text-xs p-2.5 rounded-lg border flex items-center gap-2 ${
                    cnameResult.success
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-medium"
                      : "bg-rose-500/5 border-rose-500/20 text-rose-400 font-medium"
                  }`}
                >
                  {cnameResult.success ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  )}
                  <span>{cnameResult.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
