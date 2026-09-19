"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  FileCheck2,
  Globe,
  Lock,
  Mail,
  Music,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  DollarSign,
  FileText,
  Download,
  File,
  ChevronRight,
  Receipt,
  FileSignature,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WhiteLabel, WhiteLabelStatus } from "@/types/whitelabel";
import { formatDate } from "@/lib/utils";
import { SubscriptionPayment } from "@/types/subscription";
import { clientGetContractPreviewAction } from "@/actions/client/whitelabel/client-get-contract-preview.action";

interface ApplicationStatusViewProps {
  whiteLabel: WhiteLabel;
  payments?: SubscriptionPayment[];
  onReapply?: () => void;
}

export function WhiteLabelApplicationStatusView({
  whiteLabel,
  payments = [],
}: ApplicationStatusViewProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewingContract, setIsPreviewingContract] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Status updated.");
    }, 600);
  };

  const handlePreviewContract = async () => {
    setIsPreviewingContract(true);
    try {
      const res = await clientGetContractPreviewAction();
      if (res.success && res.contractUrl) {
        window.open(res.contractUrl, "_blank");
      } else {
        toast.error(res.message || "Contract file could not be loaded.");
      }
    } catch {
      toast.error("Failed to fetch contract preview.");
    } finally {
      setIsPreviewingContract(false);
    }
  };

  const statusConfig: Record<
    WhiteLabelStatus,
    {
      label: string;
      color: string;
      description: string;
      stepIndex: number;
    }
  > = {
    [WhiteLabelStatus.PENDING]: {
      label: "Application Pending Review",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      description:
        "Your WhiteLabel application has been safely received. Platform administrators will review your credentials and reach out directly.",
      stepIndex: 1,
    },
    [WhiteLabelStatus.UNDER_REVIEW]: {
      label: "Under Review & Direct Contact",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      description:
        "A platform administrator is currently reviewing your catalog details and reaching out to finalize partnership terms.",
      stepIndex: 2,
    },
    [WhiteLabelStatus.PROCESSING]: {
      label: "Review Complete • Contract Preparation",
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      description:
        "Review is complete! The formal partnership agreement is being drafted and prepared for mutual execution.",
      stepIndex: 3,
    },
    [WhiteLabelStatus.CONTRACTED]: {
      label: "Agreement Executed (Contract Signed)",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      description:
        "The signed agreement has been uploaded by the platform administrator. You can preview the agreement below. Next step is hand-to-hand / offline payment registration.",
      stepIndex: 4,
    },
    [WhiteLabelStatus.PAID]: {
      label: "Payment Verified • Pending Final Activation",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description:
        "Payment has been registered and verified by administrators. Cloudflare DNS provisioning and final account activation are being finalized.",
      stepIndex: 5,
    },
    [WhiteLabelStatus.APPROVED]: {
      label: "WhiteLabel Active & Operational",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description:
        "Your WhiteLabel instance is completely operational with automated Cloudflare routing and full platform console unlocked.",
      stepIndex: 6,
    },
    [WhiteLabelStatus.ACTIVE]: {
      label: "WhiteLabel Active & Operational",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description:
        "Your WhiteLabel instance is live! Subdomain routing is automated via Cloudflare, and full console navigation is unlocked.",
      stepIndex: 6,
    },
    [WhiteLabelStatus.REJECTED]: {
      label: "Application Declined",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      description:
        whiteLabel.statusReason ||
        "Your application was reviewed and could not be approved at this time. Please contact support for more details.",
      stepIndex: 2,
    },
    [WhiteLabelStatus.SUSPENDED]: {
      label: "WhiteLabel Suspended",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      description:
        whiteLabel.statusReason ||
        "Your WhiteLabel instance has been suspended due to subscription expiration or administrative action.",
      stepIndex: 6,
    },
  };

  const currentCfg = statusConfig[whiteLabel.status] || statusConfig[WhiteLabelStatus.PENDING];
  const stepIdx = currentCfg.stepIndex;

  const steps = [
    {
      num: 1,
      id: "pending",
      title: "1. Submitted",
      desc: "Received & pending initial review",
      isDone: stepIdx > 1,
      isActive: stepIdx === 1,
    },
    {
      num: 2,
      id: "review",
      title: "2. Under Review",
      desc: "Admin catalog verification & contact",
      isDone: stepIdx > 2,
      isActive: stepIdx === 2,
    },
    {
      num: 3,
      id: "processing",
      title: "3. Processing",
      desc: "Review complete, agreement drafting",
      isDone: stepIdx > 3,
      isActive: stepIdx === 3,
    },
    {
      num: 4,
      id: "contracted",
      title: "4. Contracted",
      desc: "Signed agreement uploaded & verified",
      isDone: stepIdx > 4,
      isActive: stepIdx === 4,
    },
    {
      num: 5,
      id: "paid",
      title: "5. Paid",
      desc: "Hand-to-hand / offline payment registered",
      isDone: stepIdx > 5,
      isActive: stepIdx === 5,
    },
    {
      num: 6,
      id: "active",
      title: "6. Active",
      desc: "Cloudflare DNS live & console unlocked",
      isDone: stepIdx >= 6 && whiteLabel.status !== WhiteLabelStatus.SUSPENDED,
      isActive: stepIdx >= 6 && whiteLabel.status !== WhiteLabelStatus.SUSPENDED,
    },
  ];

  const latestPayment = payments[0] || (whiteLabel.payments && whiteLabel.payments[0]);
  const isLive = whiteLabel.status === WhiteLabelStatus.ACTIVE || whiteLabel.status === WhiteLabelStatus.APPROVED;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in-50 duration-300">
      {/* Header Card */}
      <Card className="overflow-hidden border-border/80 shadow-md glass-card">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {whiteLabel.name}
                </h1>
                <Badge
                  variant="outline"
                  className="font-mono text-xs px-2 py-0.5 font-bold border-primary/40 bg-primary/10 text-primary"
                >
                  {whiteLabel.code}
                </Badge>
                <button
                  onClick={() => copyToClipboard(whiteLabel.code, "WhiteLabel Code")}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Copy WhiteLabel Code"
                >
                  {copiedField === "WhiteLabel Code" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{whiteLabel.businessType.replace("_", " ")}</span>
                {whiteLabel.country && <span>• {whiteLabel.country}</span>}
                {whiteLabel.companyWebsite && (
                  <span>• {whiteLabel.companyWebsite}</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh Status
              </Button>
            </div>
          </div>

          {/* Status Alert Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${currentCfg.color}`}>
            <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">{currentCfg.label}</p>
              <p className="text-xs opacity-90 leading-relaxed">
                {currentCfg.description}
              </p>
            </div>
          </div>
        </div>

        {/* 6-Step Milestone Progression Stepper */}
        <Separator />
        <div className="p-6 bg-muted/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Onboarding & Activation Flow
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              Step {Math.min(stepIdx, 6)} of 6
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                  s.isDone
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : s.isActive
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs"
                      : "border-border/40 bg-card/40 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    STEP {s.num}
                  </span>
                  {s.isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="font-bold text-xs text-foreground leading-tight">
                  {s.title}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Active WhiteLabel Live Gateway */}
      {isLive && (
        <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-sm">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px] font-bold">
                  ACTIVE & OPERATIONAL
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Cloudflare Automated DNS Active
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                Your WhiteLabel instance is provisioned and ready for your clients.
              </p>
              {whiteLabel.subdomain && (
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  https://{whiteLabel.subdomain}.platform.royalmotionit.com
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {whiteLabel.subdomain && (
                <a
                  href={`https://${whiteLabel.subdomain}.platform.royalmotionit.com`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground text-xs font-medium gap-1.5 h-9 px-3 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit Live Subdomain
                </a>
              )}
              <Button
                size="sm"
                onClick={() => router.push("/whitelabel/domain")}
                className="gap-1.5 text-xs h-9 bg-primary text-primary-foreground"
              >
                Configure Custom Domain
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Agreement Section */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-primary" />
              Partnership Contract Agreement
            </CardTitle>
            <CardDescription className="text-xs">
              The official executed agreement governing your WhiteLabel licensing and service level terms.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {whiteLabel.contractKey ? (
            <div className="p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {whiteLabel.contractFileName || "Executed_Contract_Agreement.pdf"}
                    </p>
                    <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                      SIGNED & VERIFIED
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {whiteLabel.contractFileSize && (
                      <span>{(whiteLabel.contractFileSize / 1024).toFixed(1)} KB</span>
                    )}
                    {whiteLabel.contractUploadedAt && (
                      <span suppressHydrationWarning>
                        • Uploaded {formatDate(whiteLabel.contractUploadedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewContract}
                disabled={isPreviewingContract}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                {isPreviewingContract ? "Loading..." : "Preview / Download PDF"}
              </Button>
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed rounded-xl space-y-2 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto opacity-40 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">
                Contract Agreement Not Yet Uploaded
              </p>
              <p className="text-[11px] max-w-sm mx-auto">
                Once the initial catalog review is marked complete, your platform administrator will upload the signed contract agreement here for your records.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Information Section */}
      {(latestPayment || whiteLabel.status === WhiteLabelStatus.PAID || isLive) && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Recorded Payment & Subscription Status
              </CardTitle>
              <CardDescription className="text-xs">
                Offline, wire, or hand-to-hand payment registered and verified by platform administrators.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {latestPayment ? (
              <div className="p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      ${latestPayment.amount.toLocaleString()} USD
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                      {latestPayment.status}
                    </Badge>
                    {latestPayment.code && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        #{latestPayment.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span suppressHydrationWarning>
                      Valid: {formatDate(latestPayment.startsAt)} – {formatDate(latestPayment.endsAt)}
                    </span>
                  </p>
                </div>

                <div className="text-xs text-muted-foreground font-mono bg-background/80 px-3 py-1.5 rounded-lg border border-border/50">
                  Payment Confirmed by Admin
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border bg-muted/20 text-xs text-muted-foreground">
                Payment verified. Subscription active.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suspension Alert Banner */}
      {whiteLabel.status === WhiteLabelStatus.SUSPENDED && (
        <div className="p-4 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-3 shadow-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Account Temporarily Suspended</h4>
            <p className="text-xs text-muted-foreground">
              {whiteLabel.statusReason ||
                "Your WhiteLabel account has been suspended by platform administrators. Please contact RMIT support to resolve."}
            </p>
          </div>
        </div>
      )}

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact & Corporate Info */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Corporate & Contact Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
              <span className="text-muted-foreground text-[11px] block">Primary Representative</span>
              <p className="font-semibold text-foreground">
                {whiteLabel.contactFirstName} {whiteLabel.contactLastName}
              </p>
              <p className="text-muted-foreground font-mono">{whiteLabel.contactEmail}</p>
              {whiteLabel.contactLinkedIn && (
                <p className="text-[11px] text-primary pt-0.5 truncate">
                  {whiteLabel.contactLinkedIn}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground block">Incorporated</span>
                <span className="font-bold text-foreground">
                  {whiteLabel.isIncorporated ? "Yes" : "No"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground block">Years in Business</span>
                <span className="font-bold text-foreground">
                  {whiteLabel.yearsInBusiness} {whiteLabel.yearsInBusiness === 1 ? "year" : "years"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Catalog & Distribution Telemetry */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              Catalog Telemetry & Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground text-[10px] block">Catalog</span>
                <span className="font-bold text-sm text-foreground">
                  {whiteLabel.catalogTrackCount}
                </span>
                <span className="text-[10px] text-muted-foreground block">tracks</span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground text-[10px] block">Monthly</span>
                <span className="font-bold text-sm text-foreground">
                  {whiteLabel.monthlyTrackDelivery}
                </span>
                <span className="text-[10px] text-muted-foreground block">deliv. / mo</span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground text-[10px] block">Revenue</span>
                <span className="font-bold text-sm text-foreground">
                  ${Number(whiteLabel.monthlyRevenueUsd || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground block">USD / mo</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-muted-foreground text-[11px] block font-medium">
                Current Distributors:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {whiteLabel.currentDistributors?.map((d) => (
                  <Badge key={d} variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
