"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Disc3,
  Globe2,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  FileText,
  Headphones,
  Zap,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clientGetOnboardingDraftAction } from "@/actions/client/whitelabel/client-onboarding-draft.action";

interface ClientOnboardingWelcomeProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onStart: () => void;
  onResumeDraft: (draft: any) => void;
}

export function ClientOnboardingWelcome({
  user,
  onStart,
  onResumeDraft,
}: ClientOnboardingWelcomeProps) {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<any | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);

  useEffect(() => {
    async function checkDraft() {
      try {
        // Check local storage first for instant feedback
        const local = localStorage.getItem("rmit_onboarding_draft");
        if (local) {
          const parsed = JSON.parse(local);
          if (
            parsed &&
            (parsed.name || parsed.companyWebsite || parsed.contactFirstName)
          ) {
            setHasDraft(true);
            setDraftData(parsed);
          }
        }

        // Also check API draft
        const res = await clientGetOnboardingDraftAction();
        if (res.success && res.draft) {
          setHasDraft(true);
          setDraftData(res.draft);
        }
      } catch (err) {
        console.error("Error loading onboarding draft:", err);
      } finally {
        setIsLoadingDraft(false);
      }
    }
    checkDraft();
  }, []);

  const dspPartners = [
    "Spotify Direct",
    "Apple Music Lossless",
    "YouTube Music & Content ID",
    "Amazon Music HD",
    "Tidal & Deezer Hi-Res",
    "TikTok & ByteDance Sound Sync",
  ];

  const phases = [
    {
      num: "01",
      title: "Organization & Catalog Profile",
      desc: "Provide your record label or distribution entity details, master catalog size, and 1 to 3 top roster artists.",
      time: "3 mins",
      icon: Building2,
    },
    {
      num: "02",
      title: "Branding & Custom Subdomain",
      desc: "Claim your dedicated platform address (e.g. yourbrand.platform.royalmotionit.com) and set brand theme preferences.",
      time: "2 mins",
      icon: Globe2,
    },
    {
      num: "03",
      title: "Vetting & Fast-Track SLA",
      desc: "Platform administrators review your application within 24-48 hours, prepare formal licensing contracts, and provision your live instance.",
      time: "24-48h SLA",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="w-full space-y-8 animate-in fade-in-50 duration-300">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-muted/40 p-6 sm:p-10 shadow-sm">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-primary/15 text-primary border-primary/30 font-semibold text-xs gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              Enterprise Partner Onboarding
            </Badge>
            <Badge
              variant="outline"
              className="text-xs font-mono text-muted-foreground"
            >
              256-Bit TLS Secured
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Welcome to RoyalMotionIT, {user.firstName || "Partner"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            You&apos;re minutes away from provisioning your branded music
            distribution ecosystem. Distribute high-fidelity sound recordings to
            150+ global DSPs with automated Cloudflare routing and transparent
            royalty ledgers.
          </p>

          {/* Action CTA Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {hasDraft && draftData ? (
              <>
                <Button
                  onClick={() => onResumeDraft(draftData)}
                  className="h-11 px-6 text-sm font-semibold gap-2 shadow-md bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resume Application (Saved Draft)
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={onStart}
                  className="h-11 px-5 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Start Fresh Application
                </Button>
              </>
            ) : (
              <Button
                onClick={onStart}
                className="h-11 px-7 text-sm font-semibold gap-2 shadow-md"
              >
                Begin Onboarding Application
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:ml-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Takes ~5 minutes • Progress auto-saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Phase Roadmap */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Your Onboarding Journey
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            3 Simple Milestones
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phases.map((phase) => {
            const Icon = phase.icon;
            return (
              <Card
                key={phase.num}
                className="border-border/70 shadow-xs relative overflow-hidden group hover:border-primary/50 transition-all"
              >
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {phase.time}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    {phase.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {phase.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Preparation Checklist & Trust Network */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Checklist */}
        <Card className="lg:col-span-7 border-border/70 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              What You Will Need to Complete Application
            </CardTitle>
            <CardDescription className="text-xs">
              Having these ready ensures fast-track approval by our catalog
              team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">
                    Legal Entity or Trade Name
                  </strong>
                  <span className="text-muted-foreground text-[11px]">
                    Your record label, agency, or corporate business identity.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">
                    Catalog Sizing & Deliveries
                  </strong>
                  <span className="text-muted-foreground text-[11px]">
                    Estimated master track count and monthly delivery cadence.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">
                    1 to 3 Top Roster Artists
                  </strong>
                  <span className="text-muted-foreground text-[11px]">
                    Names and links to verified Spotify or Instagram profiles.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">
                    Desired Platform Subdomain
                  </strong>
                  <span className="text-muted-foreground text-[11px]">
                    The unique web address where your creators will log in.
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DSP Pipes Guarantee */}
        <Card className="lg:col-span-5 border-border/70 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              Direct Ingestion Channels
            </CardTitle>
            <CardDescription className="text-xs">
              Lossless delivery directly to major streaming services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {dspPartners.map((partner, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="px-2.5 py-1 text-[11px] font-medium border-border/80 bg-muted/30 text-foreground flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {partner}
                </Badge>
              ))}
            </div>

            <div className="pt-3 border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Royalty Ledger Accounting:</span>
                <span className="font-semibold text-foreground">
                  100% Pass-through
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>DNS & SSL Gateway:</span>
                <span className="font-semibold text-foreground">
                  Cloudflare Automated
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Review Turnaround SLA:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  24-48 Hours
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
