"use client";

import { useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  HeartHandshake,
  Percent,
  Coins,
  Landmark,
  Wallet,
  FileSignature,
  FileCheck2,
  ExternalLink,
  Copy,
  Check,
  Building2,
  User,
  ArrowRight,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Referrer, ReferrerStatus } from "@/types/referrer";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface ClientReferrerStatusViewProps {
  referrer: Referrer;
  onReapply?: () => void;
}

export function ClientReferrerStatusView({
  referrer,
  onReapply,
}: ClientReferrerStatusViewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isPending = referrer.status === ReferrerStatus.PENDING;
  const isUnderReview = referrer.status === ReferrerStatus.UNDER_REVIEW;
  const isProcessing = referrer.status === ReferrerStatus.PROCESSING;
  const isContracted = referrer.status === ReferrerStatus.CONTRACTED;
  const isPaid = referrer.status === ReferrerStatus.PAID;
  const isActive = referrer.status === ReferrerStatus.ACTIVE;
  const isSuspended = referrer.status === ReferrerStatus.SUSPENDED;
  const isRejected = referrer.status === ReferrerStatus.REJECTED;

  const getStageNum = (status: ReferrerStatus): number => {
    switch (status) {
      case ReferrerStatus.PENDING:
        return 1;
      case ReferrerStatus.UNDER_REVIEW:
        return 2;
      case ReferrerStatus.PROCESSING:
        return 3;
      case ReferrerStatus.CONTRACTED:
        return 4;
      case ReferrerStatus.PAID:
        return 5;
      case ReferrerStatus.ACTIVE:
        return 6;
      case ReferrerStatus.SUSPENDED:
        return 6;
      default:
        return 1;
    }
  };

  const currentStepNum = getStageNum(referrer.status);

  const steps = [
    {
      num: 1,
      id: "pending",
      title: "Application Received",
      desc: "Profile & remittance submitted",
      isDone: currentStepNum > 1,
      isActive: isPending,
    },
    {
      num: 2,
      id: "review",
      title: "Compliance Review",
      desc: "Identity & remittance verification",
      isDone: currentStepNum > 2,
      isActive: isUnderReview,
    },
    {
      num: 3,
      id: "processing",
      title: "Terms & Processing",
      desc: "15% Commercial Agreement drafting",
      isDone: currentStepNum > 3,
      isActive: isProcessing,
    },
    {
      num: 4,
      id: "contracted",
      title: "Agreement Executed",
      desc: "Referrer Agreement issued & signed",
      isDone: currentStepNum > 4,
      isActive: isContracted,
    },
    {
      num: 5,
      id: "paid",
      title: "Commercial Verified",
      desc: "Commercial onboarding confirmed",
      isDone: currentStepNum > 5,
      isActive: isPaid,
    },
    {
      num: 6,
      id: "active",
      title: "Partner Live",
      desc: "Referral attribution live",
      isDone: isActive,
      isActive: isActive,
    },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in-50 duration-300">
      {/* Status Hero Card */}
      <Card
        className={`border shadow-sm overflow-hidden ${
          isActive
            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-card"
            : isPaid
            ? "border-teal-500/40 bg-gradient-to-br from-teal-500/5 via-card to-card"
            : isContracted
            ? "border-purple-500/40 bg-gradient-to-br from-purple-500/5 via-card to-card"
            : isProcessing
            ? "border-indigo-500/40 bg-gradient-to-br from-indigo-500/5 via-card to-card"
            : isUnderReview
            ? "border-blue-500/40 bg-gradient-to-br from-blue-500/5 via-card to-card"
            : isPending
            ? "border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-card to-card"
            : isRejected
            ? "border-destructive/40 bg-gradient-to-br from-destructive/5 via-card to-card"
            : "border-orange-500/40 bg-gradient-to-br from-orange-500/5 via-card to-card"
        }`}
      >
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
                >
                  <HeartHandshake className="h-3 w-3" />
                  Referrer Partner Program
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                  {referrer.code}
                </Badge>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1"
                >
                  <Percent className="h-3 w-3" />
                  15% Fixed Commission
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {referrer.name}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Operating Portal:{" "}
                <code className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-foreground font-semibold">
                  {referrer.operatingHub}
                </code>
              </CardDescription>
            </div>

            {/* Status Indicator */}
            <Badge
              variant="outline"
              className={`px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : isPaid
                  ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30"
                  : isContracted
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                  : isProcessing
                  ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                  : isUnderReview
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                  : isPending
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : isSuspended
                  ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30"
                  : "bg-destructive/15 text-destructive border-destructive/30"
              }`}
            >
              {referrer.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-5">
          {/* Status Message */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20">
            {isPending && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground">
                    Application Received &amp; Queued for Verification
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Thank you for applying to join our global Referrer Partner network. Our compliance team is
                    currently verifying your partner details and remittance information. You will receive an
                    update within 24–48 business hours.
                  </p>
                </div>
              </div>
            )}

            {isUnderReview && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground">
                    Application Under Administrative Review
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    A platform onboarding officer is actively reviewing your credentials and preparing your 15% Referrer
                    Partnership Agreement.
                  </p>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground">
                    Commercial Terms &amp; Agreement Drafting
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your partner credentials have been verified. Our legal and operations team is finalizing your 15%
                    Distribution Referrer Agreement for execution.
                  </p>
                </div>
              </div>
            )}

            {isContracted && (
              <div className="flex items-start gap-3">
                <FileCheck2 className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground">
                    Partnership Agreement Executed
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your 15% Partnership Agreement has been executed. Final commercial terms and remittance checks
                    are in progress before live partner activation.
                  </p>
                </div>
              </div>
            )}

            {isPaid && (
              <div className="flex items-start gap-3">
                <Coins className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground">
                    Commercial Verification Complete
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Commercial terms and financial routing have been verified. Your dedicated Partner Hub is being
                    provisioned and will be active momentarily.
                  </p>
                </div>
              </div>
            )}

            {isRejected && (
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-destructive">
                    Application Declined
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {referrer.statusReason ||
                      "We were unable to approve your referrer partner application at this time based on our verification criteria."}
                  </p>
                  {onReapply && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-xs h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={onReapply}
                    >
                      Update Details &amp; Reapply
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isSuspended && (
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-orange-600 dark:text-orange-400">
                    Partner Account Temporarily Suspended
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {referrer.statusReason ||
                      "Your partner tracking has been paused for an administrative review. Please contact support@royalmotionit.com for resolution."}
                  </p>
                </div>
              </div>
            )}

            {isActive && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    Partner Account Active
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your partner account is active and verified. You can now access your Referrer Console to share
                    your custom referral link and track your 15% commission bounties.
                  </p>
                  <Button
                    render={<Link href="/referrer" />}
                    size="sm"
                    className="mt-2 text-xs h-8 gap-1.5"
                  >
                    <span>Launch Referrer Console</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 6-Step Visual Onboarding & Activation Flow */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Partner Onboarding &amp; Activation Flow</span>
              </h3>
              <span className="text-[11px] font-mono text-muted-foreground">
                {isActive ? "Completed (6 of 6)" : `Step ${currentStepNum} of 6`}
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
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        s.isDone
                          ? "text-emerald-600 dark:text-emerald-400"
                          : s.isActive
                          ? "text-primary font-extrabold"
                          : "text-muted-foreground"
                      }`}
                    >
                      STEP {s.num}
                    </span>
                    {s.isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : s.isActive && isRejected ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                    ) : s.isActive ? (
                      <div className="relative flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary/40"></span>
                        <Clock className="h-3.5 w-3.5 text-primary relative" />
                      </div>
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
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

          {/* 15% Commercial Framework Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Partner Commission Share
              </span>
              <div className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                15% Gross Cut
              </div>
              <p className="text-[11px] text-muted-foreground">
                Flat percentage of the total client platform acquisition ticket.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Minimum Benchmark Deal
              </span>
              <div className="text-xl font-extrabold font-mono text-foreground">
                ৳{referrer.dealBenchmarkBdt.toLocaleString()} BDT
              </div>
              <p className="text-[11px] text-muted-foreground">
                Minimum ticket floor per distribution client onboarded.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Minimum Guaranteed Bounty
              </span>
              <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                ৳{referrer.minGuaranteedBountyBdt.toLocaleString()} BDT
              </div>
              <p className="text-[11px] text-muted-foreground">
                Guaranteed cash bounty per baseline closed deal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
