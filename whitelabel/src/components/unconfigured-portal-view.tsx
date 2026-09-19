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
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnconfiguredPortalViewProps {
  error?: string;
  diagnostics?: {
    apiKeyProvided: boolean;
    maskedKey?: string;
    apiBaseUrl?: string;
    statusCode?: number;
    subdomainConfigured?: string;
    details?: string;
  };
}

export function UnconfiguredPortalView({
  error,
  diagnostics,
}: UnconfiguredPortalViewProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const keyConfigured = diagnostics?.apiKeyProvided ?? false;
  const maskedKey = diagnostics?.maskedKey || "Not configured in .env";
  const apiBaseUrl = diagnostics?.apiBaseUrl || "http://localhost:5000";

  const handleCopyReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      status: "SETUP_INCOMPLETE",
      error: error || "WhiteLabel portal configuration or branding not loaded",
      apiKeyConfigured: keyConfigured,
      maskedKey: maskedKey,
      apiBaseUrl: apiBaseUrl,
      host: typeof window !== "undefined" ? window.location.host : "",
      subdomainConfigured: diagnostics?.subdomainConfigured || "None",
      statusCode: diagnostics?.statusCode,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-zinc-100 flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-300">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[400px] bg-indigo-500/10 rounded-full blur-[160px]" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <div className="font-semibold tracking-tight text-sm text-zinc-100 flex items-center gap-2">
              WhiteLabel Music Portal
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Setup Required
              </span>
            </div>
            <div className="text-xs text-zinc-400">
              Diagnostic &amp; Initial Provisioning Engine
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </Button>
          <a
            href="http://localhost:3000/whitelabel/branding"
            target="_blank"
            rel="noreferrer"
          >
            <Button
              size="sm"
              className="text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium gap-1.5 shadow-md shadow-amber-500/10"
            >
              Platform Console
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </header>

      {/* Main Diagnostic Container */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8 flex-1">
        {/* Hero Notice */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Server className="w-3.5 h-3.5" />
            Whitelabel Bundle Hosted &amp; Waiting For Configuration
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50">
            WhiteLabel Portal Is Not Configured
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This deployment has not finished connecting to its parent platform.
            To protect your brand and artists, the portal will not load generic
            defaults until your branding and API credentials are confirmed.
          </p>
        </div>

        {/* 4 Core Diagnostic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. API Key Diagnostic */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    keyConfigured
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/10 text-red-400 border border-red-500/30"
                  }`}
                >
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    Integration API Key
                  </div>
                  <div className="text-xs text-zinc-400">
                    Tenant authorization token in hosting <code className="text-amber-300">.env</code>
                  </div>
                </div>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  keyConfigured
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}
              >
                {keyConfigured ? "Key Present" : "Missing Key"}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Configured Key:</span>
                <code className="text-zinc-300 font-mono bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                  {maskedKey}
                </code>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                {keyConfigured
                  ? "An API key was provided. If you see this screen, ensure the key is generated from Platform -> Management -> WhiteLabel -> API Keys and the API backend is active."
                  : "No API_KEY variable found in your hosting environment. Add your integration key generated from your client console."}
              </p>
            </div>
          </div>

          {/* 2. Domain & DNS Ownership Diagnostic */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    Domain &amp; DNS Verification
                  </div>
                  <div className="text-xs text-zinc-400">
                    Custom domain TXT / CNAME or Subdomain
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                DNS Check
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Host Routing:</span>
                <span className="text-zinc-300 font-mono">
                  {typeof window !== "undefined"
                    ? window.location.host
                    : "localhost:3001"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                For custom domains, prove ownership using a DNS <code className="text-amber-300">TXT</code> record
                or configure your designated subdomain on{" "}
                <code className="text-zinc-300">*.platform.royalmotionit.com</code> in the Platform Domain settings.
              </p>
            </div>
          </div>

          {/* 3. Branding & Customization Status */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    Branding &amp; Theme Identity
                  </div>
                  <div className="text-xs text-zinc-400">
                    Logo, portal name, colors, and favicon
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Needs Sync
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
              <p className="text-xs text-zinc-400 leading-normal">
                Your portal pulls your custom company name, logo, primary/secondary colors,
                and social links directly from the Platform API. Once configured in the Platform Console,
                your theme updates automatically without modifying source code.
              </p>
            </div>
          </div>

          {/* 4. WhiteLabel Subscription & Permissions */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    Tenant Permissions &amp; API Link
                  </div>
                  <div className="text-xs text-zinc-400">
                    Full scope synchronization
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Full Permission Required
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
              <p className="text-xs text-zinc-400 leading-normal">
                Each API key securely bridges your WhiteLabel deployment with your dedicated database partition,
                enabling catalog distribution, artist onboarding, and royalty reports.
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Setup Guide */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                Setup Checklist for WhiteLabel Administrators
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Complete these steps in your RoyalMotionIT Platform account to launch your portal
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyReport}
              className="text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-300 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Diagnostic Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Diagnostic Report
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="space-y-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">
                Set Brand &amp; Colors
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Open <strong className="text-zinc-300">Management &rarr; WhiteLabel &rarr; Identity &amp; Branding</strong>.
                Upload your logo, define your portal title, and select your custom brand palette.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">
                Configure DNS / Subdomain
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Go to <strong className="text-zinc-300">WhiteLabel &rarr; Domain &amp; DNS</strong>.
                Verify your custom domain with a TXT record or assign your subdomain under{" "}
                <code className="text-zinc-300">*.platform.royalmotionit.com</code>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">
                Copy API Key to .env
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Generate an API key under <strong className="text-zinc-300">WhiteLabel &rarr; API Keys</strong>.
                Paste it into your hosting server's <code className="text-amber-300">whitelabel/.env</code> as{" "}
                <code className="text-zinc-300">API_KEY="rmit_live_..."</code> and reload.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <FileCode2 className="w-4 h-4 text-zinc-500" />
              <span>Hosting target: <code className="text-zinc-300">{apiBaseUrl}</code></span>
            </div>
            <a
              href="http://localhost:3000/whitelabel/branding"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto"
            >
              <Button className="w-full sm:w-auto text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold gap-1.5 shadow-lg shadow-amber-500/10">
                Go To Platform Console Now
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
              Technical Error &amp; Diagnostics Response ({error || "No API response received"})
            </span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDetails && (
            <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/80 space-y-3 font-mono text-xs">
              <div className="text-zinc-500">API Endpoint Queried:</div>
              <div className="bg-zinc-900 p-2.5 rounded text-amber-300 break-all">
                GET {apiBaseUrl}/whitelabel/tenant
              </div>

              <div className="text-zinc-500 mt-2">Active API Key:</div>
              <div className="bg-zinc-900 p-2.5 rounded text-zinc-300">
                {maskedKey}
              </div>

              <div className="text-zinc-500 mt-2">Error Payload:</div>
              <pre className="bg-zinc-900 p-2.5 rounded text-red-400 whitespace-pre-wrap text-[11px] overflow-x-auto">
                {error || "Failed to load tenant info from backend API."}
              </pre>

              <div className="text-[11px] text-zinc-500 pt-1">
                Note: In production, this diagnostic console is only visible to portal administrators when the site is unconfigured.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        RoyalMotionIT WhiteLabel Distribution Platform &bull; Architecture v2.0
      </footer>
    </div>
  );
}
