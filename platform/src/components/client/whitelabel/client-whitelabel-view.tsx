"use client";

import { useState } from "react";
import { WhiteLabelOnboardingWizard } from "./onboarding-wizard";
import { WhiteLabelApplicationStatusView } from "./application-status-view";
import { WhiteLabel, WhiteLabelStatus } from "@/types/whitelabel";
import { Subscription, PaymentStatus } from "@/types/subscription";
import {
  Building2,
  Disc3,
  Globe,
  KeyRound,
  Layers,
  Sparkles,
  Users,
  Webhook,
  CreditCard,
  Logs,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Music,
  Headphones,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface ClientWhiteLabelViewProps {
  user: {
    id: string;
    code?: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  subscription?: Subscription | null;
}

export function ClientWhiteLabelView({
  user,
  subscription,
}: ClientWhiteLabelViewProps) {
  const [showWizard, setShowWizard] = useState(false);

  const whiteLabel = subscription?.whiteLabel;
  const payments = subscription?.payments || [];
  const activePayment = payments.find((p) => p.status === PaymentStatus.COMPLETED);

  const isFullyActive =
    whiteLabel?.status === WhiteLabelStatus.APPROVED && Boolean(activePayment);

  // If user clicked reapply, show wizard
  if (showWizard) {
    return (
      <WhiteLabelOnboardingWizard
        user={user}
        onSuccess={() => setShowWizard(false)}
      />
    );
  }

  // If no application submitted yet
  if (!whiteLabel) {
    return <WhiteLabelOnboardingWizard user={user} />;
  }

  // If application is submitted (pending, under review, rejected, or waiting for payment)
  if (!isFullyActive) {
    return (
      <WhiteLabelApplicationStatusView
        whiteLabel={whiteLabel}
        payments={payments}
        onReapply={() => setShowWizard(true)}
      />
    );
  }

  // Fully Active WhiteLabel Hub
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in-50 duration-300">
      {/* Active WhiteLabel Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-muted/40 border border-primary/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-emerald-600 text-white font-semibold text-xs gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Live & Operational
            </Badge>
            <Badge variant="outline" className="font-mono text-xs font-bold">
              {whiteLabel.code}
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {whiteLabel.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Your branded distribution ecosystem is running live. Manage custom themes, domains, developer credentials, and ingestion pipelines below.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            className="gap-2 text-xs font-bold shadow-sm"
            render={<Link href="#" />}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Customize Theme
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Catalog Volume</span>
              <p className="text-2xl font-bold text-foreground">
                {whiteLabel.catalogTrackCount.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Active Master Tracks
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Music className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Monthly Ingestion</span>
              <p className="text-2xl font-bold text-foreground">
                {whiteLabel.monthlyTrackDelivery.toLocaleString()}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Deliveries / Month
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Roster Artists</span>
              <p className="text-2xl font-bold text-foreground">
                {whiteLabel.artists?.length || 0}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Verified Profiles
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Headphones className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Monthly Revenue</span>
              <p className="text-2xl font-bold text-foreground">
                ${Number(whiteLabel.monthlyRevenueUsd || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                USD Run Rate
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Hub Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WhiteLabel Identity & Theme */}
        <Card className="border-border/60 shadow-sm hover:border-primary/50 transition-all group">
          <CardHeader className="pb-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-2">
              <Disc3 className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Brand Identity & Theme</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardTitle>
            <CardDescription className="text-xs">
              Configure your platform logo, dark/light color schemes, fonts, and favicon.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            <span className="font-semibold text-foreground">Status:</span> Customized
          </CardContent>
        </Card>

        {/* Custom Domain & SSL */}
        <Card className="border-border/60 shadow-sm hover:border-primary/50 transition-all group">
          <CardHeader className="pb-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit mb-2">
              <Globe className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Custom Domain & DNS</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardTitle>
            <CardDescription className="text-xs">
              Map your own domain (e.g. app.yourlabel.com) with automated SSL provisioning.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            <span className="font-semibold text-foreground">Routing:</span> Ready for CNAME
          </CardContent>
        </Card>

        {/* API Keys & Webhooks */}
        <Card className="border-border/60 shadow-sm hover:border-primary/50 transition-all group">
          <CardHeader className="pb-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit mb-2">
              <KeyRound className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Developer API & Webhooks</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardTitle>
            <CardDescription className="text-xs">
              Generate programmatic API tokens and subscribe to streaming delivery webhooks.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            <span className="font-semibold text-foreground">API Version:</span> v1.0 REST
          </CardContent>
        </Card>
      </div>

      {/* Top Roster Artists */}
      {whiteLabel.artists && whiteLabel.artists.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              Verified Top Roster Artists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {whiteLabel.artists.map((artist, idx) => (
                <div
                  key={artist.id || idx}
                  className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground truncate">
                      {artist.artistName}
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0">
                      {artist.code}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {artist.spotifyProfileUrl && (
                      <a
                        href={artist.spotifyProfileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Spotify
                      </a>
                    )}
                    {artist.instagramHandle && (
                      <span className="text-[11px] truncate">
                        {artist.instagramHandle}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
