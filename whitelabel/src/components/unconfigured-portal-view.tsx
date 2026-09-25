"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  KeyRound,
  Globe,
  Palette,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Server,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Layers,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhiteLabelTenant } from "@/types/user";

interface TenantDiagnostics {
  apiKeyProvided: boolean;
  maskedKey?: string;
  apiBaseUrl?: string;
  statusCode?: number;
  subdomainConfigured?: string;
  details?: string;
}

interface UnconfiguredPortalViewProps {
  tenant?: WhiteLabelTenant | null;
  error?: string;
  diagnostics?: TenantDiagnostics;
}

export function UnconfiguredPortalView({
  tenant,
  error,
  diagnostics,
}: UnconfiguredPortalViewProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const keyConfigured = diagnostics?.apiKeyProvided ?? false;
  const maskedKey = diagnostics?.maskedKey || "Not configured in .env";
  const apiBaseUrl = diagnostics?.apiBaseUrl || "http://localhost:5000";

  // Check statuses
  const isApiConnected = Boolean(tenant && !error);
  const isTenantActive = tenant?.status === "ACTIVE";
  const isBrandingConfigured = Boolean(
    tenant?.name && tenant.name.trim() !== "" && tenant.name !== "WhiteLabel Portal",
  );
  const isThemeConfigured = Boolean(tenant?.primaryColor || tenant?.theme?.primaryColor);
  const isDomainConfigured = Boolean(tenant?.subdomain || tenant?.customDomain);
  const isOwnerConfigured = Boolean(tenant?.hasOwner);
  const isSetupComplete = Boolean(tenant?.isSetupComplete);

  const auditItems = [
    {
      category: "Environment (.env)",
      title: "API Integration Key",
      status: keyConfigured,
      value: maskedKey,
      description: keyConfigured
        ? "API_KEY loaded and authorized in runtime environment."
        : "Missing API_KEY in whitelabel/.env. Must match an active key from Platform Console.",
      icon: KeyRound,
    },
    {
      category: "Environment (.env)",
      title: "API Base URL Connection",
      status: isApiConnected,
      value: apiBaseUrl,
      description: isApiConnected
        ? `Connected successfully to platform backend (HTTP ${diagnostics?.statusCode || 200}).`
        : "Unable to reach platform backend API. Verify API_BASE_URL is reachable.",
      icon: Server,
    },
    {
      category: "Database & Tenancy",
      title: "Tenant Record In Database",
      status: Boolean(tenant?.id),
      value: tenant?.id ? `Tenant ID: ${tenant.id.slice(0, 10)}...` : "Not Resolved",
      description: tenant?.id
        ? `Tenant '${tenant.name || tenant.code}' loaded from database partition.`
        : "Database did not recognize this API key or tenant ID.",
      icon: Layers,
    },
    {
      category: "Brand Identity",
      title: "Brand Name & Creative Assets",
      status: isBrandingConfigured,
      value: tenant?.name || "Pending Setup",
      description: isBrandingConfigured
        ? `Brand name '${tenant?.name}' and visual creative assets configured.`
        : "Brand name, logos, and support details must be configured via the Setup Wizard.",
      icon: Palette,
    },
    {
      category: "Appearance",
      title: "Dual-Mode Theme & Colors",
      status: isThemeConfigured,
      value: tenant?.theme?.mode
        ? `Mode: ${tenant.theme.mode.toUpperCase()} | ${tenant.primaryColor || "#6366f1"}`
        : "Default Palette",
      description: isThemeConfigured
        ? "Dual-mode CSS variables and font loaded from database."
        : "Custom primary/accent palette awaiting customization in wizard.",
      icon: Sparkles,
    },
    {
      category: "Routing & DNS",
      title: "Authoritative Domain Routing",
      status: isDomainConfigured,
      value:
        tenant?.customDomain ||
        (tenant?.subdomain ? `${tenant.subdomain}.platform.royalmotionit.com` : "None Assigned"),
      description: isDomainConfigured
        ? "Subdomain or verified custom domain assigned to tenant."
        : "Domain routing not yet assigned. Configure in Platform Console Domain settings.",
      icon: Globe,
    },
    {
      category: "Staff & Super Admin",
      title: "WhiteLabel Owner User",
      status: isOwnerConfigured,
      value: isOwnerConfigured ? "Owner Account Active" : "Pending Creation",
      description: isOwnerConfigured
        ? "WhiteLabel Super Admin account is provisioned with OWNER privileges."
        : "No OWNER account exists yet. Step 5 of the Platform Setup Wizard will create it.",
      icon: UserCheck,
    },
    {
      category: "Onboarding State",
      title: "Platform Setup Wizard Status",
      status: isSetupComplete,
      value: isSetupComplete ? "Setup Finalized" : "Pending Wizard Completion",
      description: isSetupComplete
        ? "Setup wizard marked complete in platform database."
        : "The 7-step guided setup wizard in Platform Client Console has not been completed.",
      icon: Wand2,
    },
  ];

  const configuredCount = auditItems.filter((i) => i.status).length;
  const totalCount = auditItems.length;
  const configuredPercent = Math.round((configuredCount / totalCount) * 100);

  const platformWizardUrl = "http://localhost:3000/whitelabel/setup";

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const handleCopyReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      status: isSetupComplete ? "CONFIGURED" : "PENDING_SETUP",
      configuredPercent: `${configuredPercent}%`,
      tenant: tenant
        ? {
            id: tenant.id,
            code: tenant.code,
            name: tenant.name,
            subdomain: tenant.subdomain,
            customDomain: tenant.customDomain,
            isSetupComplete: tenant.isSetupComplete,
            hasOwner: tenant.hasOwner,
          }
        : null,
      diagnostics: {
        apiKeyConfigured: keyConfigured,
        maskedKey,
        apiBaseUrl,
        statusCode: diagnostics?.statusCode,
      },
      audit: auditItems.map((item) => ({
        title: item.title,
        status: item.status ? "CONFIGURED" : "MISSING",
        value: item.value,
      })),
      error: error || null,
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-300">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[400px] bg-indigo-500/10 rounded-full blur-[160px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <div className="font-semibold tracking-tight text-sm text-zinc-100 flex items-center gap-2">
              <span>{tenant?.name || "WhiteLabel Music Portal"}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Setup Required
              </span>
              {tenant?.code && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {tenant.code}
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400">
              Platform Client Console Guided Setup Gateway
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 gap-1.5 h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh Status</span>
          </Button>

          <a href={platformWizardUrl} target="_blank" rel="noreferrer">
            <Button
              size="sm"
              className="text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold gap-1.5 h-8 shadow-md shadow-amber-500/10"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Open Setup Wizard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8 flex-1">
        {/* Hero Notice & Primary Call-To-Action */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-zinc-900/40 to-zinc-900/80 p-6 sm:p-8 backdrop-blur-md shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Client Onboarding in Platform Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50">
                WhiteLabel Portal Is Not Configured
              </h1>
              <p className="text-sm text-zinc-300 leading-relaxed">
                This WhiteLabel portal has been deployed with minimal credentials (3 environment variables),
                but your portal configuration must be completed inside the{" "}
                <strong className="text-amber-400 font-semibold">Platform Client Console</strong>.
                There you will configure your brand identity, colors, registration policy, and create your initial{" "}
                <strong className="text-zinc-100 font-semibold">WhiteLabel Super Admin / Owner</strong> account.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
              <a href={platformWizardUrl} target="_blank" rel="noreferrer">
                <Button className="w-full text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold gap-2 h-11 px-5 shadow-lg shadow-amber-500/20">
                  <Wand2 className="w-4 h-4" />
                  <span>Launch Platform Setup Wizard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReport}
                className="w-full text-xs border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 gap-1.5 h-9"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Report Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Diagnostic Audit</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-5 border-t border-amber-500/20">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-400 font-medium">Portal Readiness Status</span>
              <span className="font-mono font-bold text-amber-400">
                {configuredCount} of {totalCount} Items Configured ({configuredPercent}%)
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${configuredPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live Audit Checklist: What Is Configured vs What Is Not */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Live Configuration Audit</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time breakdown of what is configured in database &amp; environment vs. what is still required.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {configuredCount} Configured
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {totalCount - configuredCount} Pending
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {auditItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`rounded-xl border p-4 backdrop-blur-sm transition-all ${
                    item.status
                      ? "border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/30"
                      : "border-amber-500/20 bg-zinc-900/60 hover:border-amber-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          item.status
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-100 truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs text-zinc-400 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        item.status
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {item.status ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Configured</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500 text-[11px]">Value:</span>
                    <span
                      className={`truncate max-w-[240px] px-2 py-0.5 rounded ${
                        item.status
                          ? "bg-zinc-950 text-zinc-200 border border-zinc-800"
                          : "bg-amber-950/20 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4 Guided Steps for the Client */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 sm:p-8 space-y-5">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How To Complete Onboarding (4 Steps)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              The entire onboarding is fully managed inside your client console. Follow these steps:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/30">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-xs font-bold text-zinc-200">Open Platform Wizard</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Log into your client account at <code className="text-zinc-300">/whitelabel/setup</code>.
              </p>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/30">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="text-xs font-bold text-zinc-200">Set Identity &amp; Theme</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Enter your company brand name, pick your dual-mode colors, and configure registration model.
              </p>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/30">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="text-xs font-bold text-zinc-200">Provision Super Admin</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Step 5 creates your initial portal Owner user with full administrative credentials.
              </p>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/30">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h3 className="text-xs font-bold text-zinc-200">Save &amp; Go Live</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Click &quot;Save &amp; Activate WhiteLabel&quot;. Refresh this tab and your portal launches instantly!
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <FileCode2 className="w-4 h-4 text-zinc-500" />
              <span>
                Hosting environment: Only <code className="text-amber-400 font-semibold">3 .env variables</code> required.
                Everything else is stored in the platform database.
              </span>
            </div>
            <a href={platformWizardUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold gap-1.5 h-9 shadow-md shadow-amber-500/10">
                <span>Go To Platform Console Setup Wizard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>

        {/* Collapsible Technical Debug Information */}
        <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950/40">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 transition-colors"
          >
            <span className="flex items-center gap-2 font-mono">
              <Server className="w-3.5 h-3.5 text-zinc-500" />
              <span>Technical Diagnostics &amp; API Telemetry</span>
              {diagnostics?.statusCode && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                  HTTP {diagnostics.statusCode}
                </span>
              )}
            </span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDetails && (
            <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/80 space-y-3 font-mono text-xs">
              <div className="text-zinc-500">API Endpoint:</div>
              <div className="bg-zinc-900 p-2.5 rounded text-amber-300 break-all">
                GET {apiBaseUrl}/whitelabel/tenant
              </div>

              <div className="text-zinc-500 mt-2">Active API Key:</div>
              <div className="bg-zinc-900 p-2.5 rounded text-zinc-300">
                {maskedKey}
              </div>

              {diagnostics?.details && (
                <>
                  <div className="text-zinc-500 mt-2">Server Details:</div>
                  <pre className="bg-zinc-900 p-2.5 rounded text-zinc-400 whitespace-pre-wrap text-[11px] overflow-x-auto">
                    {diagnostics.details}
                  </pre>
                </>
              )}

              {error && (
                <>
                  <div className="text-zinc-500 mt-2">Response Message:</div>
                  <pre className="bg-zinc-900 p-2.5 rounded text-red-400 whitespace-pre-wrap text-[11px] overflow-x-auto">
                    {error}
                  </pre>
                </>
              )}

              <div className="text-[11px] text-zinc-500 pt-1">
                Note: In production, this diagnostic screen is only displayed to clients before onboarding is finalized.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/80 py-5 text-center text-xs text-zinc-500">
        RoyalMotionIT WhiteLabel Distribution &bull; Powered by Single Tenant Runtime Engine
      </footer>
    </div>
  );
}
