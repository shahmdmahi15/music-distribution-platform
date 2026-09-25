"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Server,
  Cloud,
  Globe,
  Mail,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Terminal,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  clientGetProvisioningStatusAction,
  clientStartCloudProvisioningAction,
  StartCloudProvisioningInput,
} from "@/actions/client/whitelabel/client-cloud-provisioning.action";
import {
  WhiteLabelProvisioningTelemetry,
  ProvisioningStatus,
} from "@/types/whitelabel";
import { toast } from "sonner";

interface ClientCloudProvisioningTerminalProps {
  onSuccess?: (customDomain: string) => void;
  onCancel?: () => void;
}

export function ClientCloudProvisioningTerminal({
  onSuccess,
  onCancel,
}: ClientCloudProvisioningTerminalProps) {
  const [telemetry, setTelemetry] =
    useState<WhiteLabelProvisioningTelemetry | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await clientGetProvisioningStatusAction();
      if (res.success && res.telemetry) {
        setTelemetry(res.telemetry);

        if (
          res.telemetry.provisioningStatus === ProvisioningStatus.ACTIVE ||
          res.telemetry.provisioningProgress === 100
        ) {
          setIsPolling(false);
          if (onSuccess && res.telemetry.customDomain) {
            onSuccess(res.telemetry.customDomain);
          }
        } else if (
          res.telemetry.provisioningStatus === ProvisioningStatus.FAILED
        ) {
          setIsPolling(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch provisioning telemetry:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (isPolling) {
        fetchStatus();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isPolling]);

  // Auto scroll terminal to bottom on new logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [telemetry?.provisioningLogs]);

  const progress = telemetry?.provisioningProgress || 0;
  const isComplete =
    progress === 100 ||
    telemetry?.provisioningStatus === ProvisioningStatus.ACTIVE;
  const isFailed = telemetry?.provisioningStatus === ProvisioningStatus.FAILED;
  const customDomain = telemetry?.customDomain || "backstage.yourdomain.com";
  const portalUrl = `https://${customDomain}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedUrl(true);
    toast.success("Portal URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden font-sans">
      {/* Top Console Bar */}
      <div className="px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/70">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-zinc-100">
                Automated Cloud Provisioning Engine
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono font-semibold ${
                  isComplete
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : isFailed
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                }`}
              >
                {isComplete ? "DEPLOYED" : isFailed ? "HALTED" : "PROVISIONING"}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live AWS (EC2, Elastic IP, S3, SES) &amp; Cloudflare DNS automation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isComplete && (
            <Button
              size="sm"
              onClick={copyUrl}
              variant="outline"
              className="text-xs h-8 border-zinc-700 bg-zinc-900 text-zinc-300 gap-1.5"
            >
              {copiedUrl ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>Copy URL</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={fetchStatus}
            variant="outline"
            className="text-xs h-8 border-zinc-700 bg-zinc-900 text-zinc-300 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Progress Header */}
      <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Pipeline Stage
            </div>
            <div className="text-sm font-bold text-zinc-100 mt-0.5">
              {telemetry?.provisioningStep || "Initializing cloud deployment..."}
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-xl font-black text-amber-400">
              {progress}%
            </span>
          </div>
        </div>

        {/* Progress Bar with glow */}
        <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Multi-Cloud Resource Grid Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
          {/* 1. S3 Vault */}
          <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center gap-2 text-xs">
            <HardDrive
              className={`h-4 w-4 shrink-0 ${
                progress >= 30 ? "text-emerald-400" : "text-zinc-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500 uppercase font-mono">
                S3 Vault
              </div>
              <div className="font-semibold text-zinc-200 truncate">
                {progress >= 30 ? "Ready (CORS)" : "Pending"}
              </div>
            </div>
          </div>

          {/* 2. SES Email */}
          <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center gap-2 text-xs">
            <Mail
              className={`h-4 w-4 shrink-0 ${
                progress >= 50 ? "text-emerald-400" : "text-zinc-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500 uppercase font-mono">
                SES + DKIM
              </div>
              <div className="font-semibold text-zinc-200 truncate">
                {progress >= 50 ? "Injected" : "Pending"}
              </div>
            </div>
          </div>

          {/* 3. Elastic IP */}
          <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center gap-2 text-xs">
            <Globe
              className={`h-4 w-4 shrink-0 ${
                telemetry?.awsElasticIp ? "text-emerald-400" : "text-zinc-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500 uppercase font-mono">
                Elastic IP
              </div>
              <div className="font-mono font-semibold text-zinc-200 truncate">
                {telemetry?.awsElasticIp || "Allocating..."}
              </div>
            </div>
          </div>

          {/* 4. EC2 Instance */}
          <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center gap-2 text-xs">
            <Server
              className={`h-4 w-4 shrink-0 ${
                telemetry?.awsInstanceId ? "text-emerald-400" : "text-zinc-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500 uppercase font-mono">
                EC2 Server
              </div>
              <div className="font-mono font-semibold text-zinc-200 truncate">
                {telemetry?.awsInstanceId
                  ? `${telemetry.awsInstanceId.slice(0, 10)}...`
                  : "Launching..."}
              </div>
            </div>
          </div>

          {/* 5. Cloudflare DNS */}
          <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center gap-2 text-xs col-span-2 sm:col-span-1">
            <Cloud
              className={`h-4 w-4 shrink-0 ${
                progress >= 94 ? "text-emerald-400" : "text-zinc-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500 uppercase font-mono">
                Cloudflare DNS
              </div>
              <div className="font-semibold text-zinc-200 truncate">
                {progress >= 94 ? "A Record Live" : "Pending"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Output Screen */}
      <div className="p-5 font-mono text-xs bg-[#090b10] min-h-[260px] max-h-[380px] overflow-y-auto space-y-2 select-text">
        <div className="text-zinc-500 pb-2 border-b border-zinc-800/80">
          # RoyalMotionIT Cloud Provisioning Shell v2.4 (AWS + Cloudflare API)
        </div>

        {(!telemetry?.provisioningLogs ||
          telemetry.provisioningLogs.length === 0) && (
          <div className="text-zinc-500 italic py-4">
            Awaiting provisioning trigger...
          </div>
        )}

        {telemetry?.provisioningLogs?.map((log, idx) => {
          const isErr = log.status === "ERROR";
          const isSuccess = log.status === "SUCCESS";
          const isWarn = log.status === "WARN";

          return (
            <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <span className="text-zinc-500 shrink-0 select-none">
                [{log.timestamp.slice(11, 19)}]
              </span>
              <span
                className={`font-bold shrink-0 px-1.5 py-0.2 rounded text-[10px] ${
                  isErr
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : isSuccess
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : isWarn
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {log.step}
              </span>
              <span
                className={
                  isErr
                    ? "text-rose-300 font-medium"
                    : isSuccess
                      ? "text-emerald-300 font-medium"
                      : isWarn
                        ? "text-amber-300"
                        : "text-zinc-300"
                }
              >
                {log.message}
              </span>
            </div>
          );
        })}

        <div ref={terminalEndRef} />
      </div>

      {/* Bottom Live Handover Card (When 100% Complete) */}
      {isComplete && (
        <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border-t border-emerald-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-zinc-100">
                  WhiteLabel Portal is Deployed &amp; Fully Active!
                </h4>
              </div>
              <p className="text-xs text-zinc-400">
                Your portal is now routing through Cloudflare Edge SSL to your
                dedicated AWS Elastic IP.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <a href={portalUrl} target="_blank" rel="noreferrer">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold gap-1.5 h-10 px-5 shadow-lg shadow-emerald-500/20 text-xs sm:text-sm">
                  <span>Open Live Portal</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Failure State Notice */}
      {isFailed && (
        <div className="p-5 bg-rose-950/30 border-t border-rose-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-rose-200">
                Provisioning Failed
              </div>
              <div className="text-xs text-rose-300 mt-0.5">
                {telemetry?.provisioningError || "Encountered an error during automated setup."}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={fetchStatus}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-8"
          >
            Retry Check
          </Button>
        </div>
      )}
    </div>
  );
}
