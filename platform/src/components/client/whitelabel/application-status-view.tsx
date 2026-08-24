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
  Disc3,
  ExternalLink,
  FileCheck2,
  Globe,
  Headphones,
  Camera,
  Lock,
  Mail,
  Music,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  DollarSign,
  Layers,
  FileText,
  Download,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WhiteLabel, WhiteLabelStatus, WhiteLabelDocument } from "@/types/whitelabel";
import { formatDate } from "@/lib/utils";
import { SubscriptionPayment } from "@/types/subscription";

interface ApplicationStatusViewProps {
  whiteLabel: WhiteLabel;
  payments?: SubscriptionPayment[];
  onReapply?: () => void;
}

export function WhiteLabelApplicationStatusView({
  whiteLabel,
  payments = [],
  onReapply,
}: ApplicationStatusViewProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      toast.success("Status refreshed.");
    }, 600);
  };

  const statusConfig = {
    [WhiteLabelStatus.PENDING]: {
      label: "Application Pending Review",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      description: "Our partner onboarding specialists are reviewing your catalog details and corporate documents.",
      currentStep: 1,
    },
    [WhiteLabelStatus.UNDER_REVIEW]: {
      label: "Under Review & Direct Contact",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      description: "Our team has contacted your representative for catalog validation and digital contract preparation.",
      currentStep: 2,
    },
    [WhiteLabelStatus.APPROVED]: {
      label: "WhiteLabel Activated & Live",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description: "Your WhiteLabel instance is active! Full distribution and developer tools are unlocked.",
      currentStep: 5,
    },
    [WhiteLabelStatus.REJECTED]: {
      label: "Application Needs Revision",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      description: whiteLabel.statusReason || "Additional verification or documentation is required.",
      currentStep: 2,
    },
    [WhiteLabelStatus.SUSPENDED]: {
      label: "Account Suspended",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      description: whiteLabel.statusReason || "Your WhiteLabel instance has been temporarily suspended.",
      currentStep: 5,
    },
  };

  const currentCfg = statusConfig[whiteLabel.status] || statusConfig[WhiteLabelStatus.PENDING];
  const hasCompletedPayment = payments.some((p) => p.status === "COMPLETED");

  const steps = [
    {
      num: 1,
      title: "Application Submitted",
      desc: "Received & queued for partner review",
      isDone: true,
    },
    {
      num: 2,
      title: "Under Review & RMIT Contact",
      desc: "Direct contact & catalog review",
      isDone: whiteLabel.status !== WhiteLabelStatus.PENDING,
      isActive: whiteLabel.status === WhiteLabelStatus.PENDING || whiteLabel.status === WhiteLabelStatus.UNDER_REVIEW,
    },
    {
      num: 3,
      title: "Digital Agreement & Signing",
      desc: "Upload signed PDF agreement",
      isDone: (whiteLabel.documents && whiteLabel.documents.length > 0) || whiteLabel.status === WhiteLabelStatus.APPROVED,
      isActive: whiteLabel.status === WhiteLabelStatus.UNDER_REVIEW,
    },
    {
      num: 4,
      title: "Payment Recording & Verification",
      desc: "Wire, bank, cash, or invoice verification",
      isDone: hasCompletedPayment || whiteLabel.status === WhiteLabelStatus.APPROVED,
      isActive: whiteLabel.status === WhiteLabelStatus.UNDER_REVIEW && !hasCompletedPayment,
    },
    {
      num: 5,
      title: "Subscription Live & Activated",
      desc: "Full WhiteLabel & developer access unlocked",
      isDone: whiteLabel.status === WhiteLabelStatus.APPROVED,
      isActive: whiteLabel.status === WhiteLabelStatus.APPROVED,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in-50 duration-300">
      {/* Hero Header Card */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
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
                  className="text-muted-foreground hover:text-foreground transition-colors"
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

        {/* Milestone Progression Stepper */}
        <Separator />
        <div className="p-6 bg-muted/20 space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Onboarding & Activation Progression
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {steps.map((s) => (
              <div
                key={s.num}
                className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                  s.isDone
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : s.isActive
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/50 bg-card/60 opacity-60"
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

      {/* Suspension Alert Banner */}
      {whiteLabel.status === WhiteLabelStatus.SUSPENDED && (
        <div className="p-4 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-3 shadow-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Account Temporarily Suspended</h4>
            <p className="text-xs text-muted-foreground">
              {whiteLabel.statusReason ||
                "Your WhiteLabel account has been temporarily suspended by platform administrators. Please contact RMIT support to resolve."}
            </p>
          </div>
        </div>
      )}

      {/* Legal Documents & S3 Stored Agreements */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />
              Legal Documents & Executed Agreements
            </CardTitle>
            <CardDescription className="text-xs">
              Executed partnership agreements and legal documentation verified and provided by RMIT administrators.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {whiteLabel.documents && whiteLabel.documents.length > 0 ? (
            <div className="space-y-2.5">
              {whiteLabel.documents.map((doc: WhiteLabelDocument) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-xs truncate">
                          {doc.name}
                        </p>
                        <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0">
                          {doc.code}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="capitalize">
                          {doc.type.replace(/_/g, " ").toLowerCase()}
                        </span>
                        {doc.fileSizeBytes && (
                          <span>• {(doc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                        )}
                        <span>• {formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {doc.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 shrink-0"
                      render={<a href={doc.fileUrl} target="_blank" rel="noreferrer" />}
                    >
                      <Download className="h-3 w-3" />
                      View PDF
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed rounded-xl space-y-2 text-muted-foreground">
              <File className="h-7 w-7 mx-auto opacity-50" />
              <p className="text-xs font-semibold">No documents uploaded yet</p>
              <p className="text-[11px] max-w-sm mx-auto">
                Once you sign your digital agreement with RMIT, upload the signed PDF here to advance to payment and activation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Top 3 Artists in Roster */}
      {whiteLabel.artists && whiteLabel.artists.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              Top Roster Artists ({whiteLabel.artists.length}/3)
            </CardTitle>
            <CardDescription className="text-xs">
              Direct DSP profile links submitted for streaming partner verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {whiteLabel.artists.map((artist, idx) => (
                <div
                  key={artist.id || idx}
                  className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground truncate">
                      {artist.artistName}
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0">
                      {artist.code || `#${idx + 1}`}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {artist.instagramHandle && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Camera className="h-3 w-3 text-pink-500 shrink-0" />
                        <span className="truncate">{artist.instagramHandle}</span>
                      </div>
                    )}

                    {artist.spotifyProfileUrl && (
                      <a
                        href={artist.spotifyProfileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline truncate"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span>Spotify Profile</span>
                      </a>
                    )}

                    {artist.youtubeChannelUrl && (
                      <a
                        href={artist.youtubeChannelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 hover:underline truncate"
                      >
                        <Video className="h-3 w-3 shrink-0" />
                        <span>YouTube Channel</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Re-apply CTA if rejected */}
      {whiteLabel.status === WhiteLabelStatus.REJECTED && onReapply && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between">
          <div className="space-y-0.5 text-xs text-rose-700 dark:text-rose-300">
            <p className="font-bold">Would you like to revise your application?</p>
            <p>Update your details or attach requested documents to resubmit for approval.</p>
          </div>
          <Button
            size="sm"
            onClick={onReapply}
            className="text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
          >
            Update Application
          </Button>
        </div>
      )}
    </div>
  );
}
