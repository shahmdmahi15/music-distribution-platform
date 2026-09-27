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
  const isRejected = referrer.status === ReferrerStatus.REJECTED;
  const isSuspended = referrer.status === ReferrerStatus.SUSPENDED;
  const isActive = referrer.status === ReferrerStatus.ACTIVE;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Status Hero Card */}
      <Card
        className={`border shadow-sm overflow-hidden ${
          isActive
            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-card"
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

        <CardContent className="p-6 pt-0 space-y-4">
          {/* Status Message */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20">
            {isPending && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground">
                    Application Received & Queued for Verification
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
                    A platform onboarding officer is reviewing your credentials and preparing your 15% Referrer
                    Partnership Agreement.
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
                      Update Details & Reapply
                    </Button>
                  )}
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

          {/* 15% Commercial Framework Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border border-border/70 bg-card">
              <span className="text-[11px] text-muted-foreground block">
                Commission Share
              </span>
              <span className="text-xl font-black text-primary">
                {referrer.commissionRate}% Flat Cut
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Of gross white label deal value
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-border/70 bg-card">
              <span className="text-[11px] text-muted-foreground block">
                Benchmark Ticket
              </span>
              <span className="text-xl font-black text-foreground">
                ৳{referrer.dealBenchmarkBdt.toLocaleString()} BDT
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Minimum distributor platform sale
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-border/70 bg-card">
              <span className="text-[11px] text-muted-foreground block">
                Minimum Bounty / Deal
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ৳{referrer.minGuaranteedBountyBdt.toLocaleString()} BDT
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Calculated 15% minimum payout
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Details Layout (Wide, Balanced) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Remittance Information */}
        <Card className="border-border/70">
          <CardHeader className="p-4 pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Landmark className="h-4 w-4 text-emerald-500" />
              Remittance Payout Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payout Method:</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {referrer.payoutMethod === "BANK_TRANSFER"
                  ? "Direct Bank Transfer"
                  : `${referrer.payoutMethod} (MFS)`}
              </Badge>
            </div>

            {referrer.payoutMethod === "BANK_TRANSFER" ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="font-semibold text-foreground">
                    {referrer.bankName || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account Holder:</span>
                  <span className="font-semibold text-foreground">
                    {referrer.accountName || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="font-mono font-bold text-foreground">
                    {referrer.accountNumber || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Branch District:</span>
                  <span className="text-foreground">{referrer.branchDistrict || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Branch Name:</span>
                  <span className="text-foreground">{referrer.branchName || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Routing Number:</span>
                  <span className="font-mono text-foreground">
                    {referrer.routingNumber || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">SWIFT Code:</span>
                  <span className="font-mono text-foreground">
                    {referrer.swiftCode || "—"}
                  </span>
                </div>
              </>
            ) : (
              <div className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-1">
                <span className="text-muted-foreground block text-[11px]">
                  Mobile Wallet Number:
                </span>
                <span className="text-base font-mono font-bold text-foreground">
                  {referrer.walletNumber || "—"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Primary Contact & Entity */}
        <Card className="border-border/70">
          <CardHeader className="p-4 pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Partner Representative & Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contact Name:</span>
              <span className="font-semibold text-foreground">
                {referrer.contactFirstName} {referrer.contactLastName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-mono text-[11px] text-foreground">
                {referrer.contactEmail}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-mono text-foreground">
                {referrer.contactPhone || "Not provided"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Country:</span>
              <span className="text-foreground">{referrer.country || "Bangladesh"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Custom Referral Code:</span>
              <div className="inline-flex items-center gap-1 font-mono font-bold text-primary">
                <span>{referrer.referralCode}</span>
                <button
                  onClick={() => handleCopy(referrer.referralCode, "refCode")}
                  className="hover:text-foreground"
                >
                  {copiedKey === "refCode" ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Submitted On:</span>
              <span className="text-muted-foreground">{formatDate(referrer.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Preview (if uploaded) */}
      {referrer.contractUrl && (
        <Card className="border-border/70">
          <CardHeader className="p-4 pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-primary" />
                Signed Partnership Agreement
              </div>
              <Button
                render={
                  <a
                    href={referrer.contractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Download PDF
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs text-muted-foreground">
            Official 15% Referrer Partnership Agreement countersigned and archived in secure S3 storage.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
