"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Share2,
  Copy,
  Check,
  Sparkles,
  QrCode,
  ArrowUpRight,
  Calculator,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  Wallet,
  Landmark,
  Smartphone,
  Globe,
  Sliders,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  BadgePercent,
  PlusCircle,
  Search,
  X,
  Lock,
  Headphones,
  MessageSquare,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { WhiteLabelBranding } from "@/types/whitelabel";
import { Referrer, ReferrerDeal } from "@/types/referrer";
import { clientCreateDealAction } from "@/actions/client/referrer/client-create-deal.action";

interface ReferrerDashboardViewProps {
  branding?: WhiteLabelBranding;
  referrer?: Referrer;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

const PRICE_PRESETS = [
  { label: "৳60k (Min)", value: 60000, desc: "Baseline Aggregator" },
  { label: "৳80k", value: 80000, desc: "Standard Label" },
  { label: "৳100k", value: 100000, desc: "Pro Aggregator" },
  { label: "৳150k", value: 150000, desc: "Enterprise Catalog" },
  { label: "৳200k", value: 200000, desc: "Unlimited Network" },
];

const DEAL_STAGE_ITEMS = {
  PROSPECT: "Prospect Lead",
  UNDER_REVIEW: "In Discussion / Demo",
  CONTRACTED: "Contract Executed",
};

export function ReferrerDashboardView({ branding, referrer, user }: ReferrerDashboardViewProps) {
  const onboardingDetails =
    (referrer?.onboardingDetails as Record<string, any>) ||
    (branding?.onboardingDetails as Record<string, any>) ||
    {};

  const referralCode =
    referrer?.referralCode ||
    onboardingDetails.referralNetworkCode ||
    `REF-${user.id.slice(-6).toUpperCase()}`;

  // Referral URL
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://platform.royalmotionit.com";
  const referralUrl = `${origin}/auth/register?ref=${referralCode}`;

  // Interactive simulation state
  const [dealPrice, setDealPrice] = useState<number>(
    referrer?.dealBenchmarkBdt ||
      (onboardingDetails.simulatedDealPriceBdt &&
      Number(onboardingDetails.simulatedDealPriceBdt) >= 60000
        ? Number(onboardingDetails.simulatedDealPriceBdt)
        : 60000),
  );

  // Copy state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSnapshot, setCopiedSnapshot] = useState(false);

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Live Database Deals State
  const [deals, setDeals] = useState<ReferrerDeal[]>(referrer?.deals || []);
  const referredUsers = referrer?.referredUsers || [];

  // Pipeline deals filter & search
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<string>("ALL");
  const [pipelineViewMode, setPipelineViewMode] = useState<"DEALS" | "USERS">("DEALS");

  // New Deal Form State
  const [newClientName, setNewClientName] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newDealStatus, setNewDealStatus] = useState<string>("PROSPECT");
  const [newDealPrice, setNewDealPrice] = useState<number>(referrer?.dealBenchmarkBdt || 60000);
  const [newDealNotes, setNewDealNotes] = useState("");
  const [isSubmittingDeal, setIsSubmittingDeal] = useState(false);

  // Dynamic Telemetry Calculations from Real Data
  const totalReferred = referredUsers.length + deals.length;
  const totalPipelineVolume = deals.reduce((sum, d) => sum + (d.sellingPriceBdt || 0), 0);
  const totalCommissionEarned = deals.reduce((sum, d) => sum + (d.referrerBountyBdt || 0), 0);
  const availablePayout = deals
    .filter((d) => d.status === "PAID" || d.status === "WON" || d.status === "ACTIVE")
    .reduce((sum, d) => sum + (d.referrerBountyBdt || 0), 0);
  const settledPayout = 0; // Historical disbursement tracking

  // Filtered pipeline deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch =
        !pipelineSearch.trim() ||
        deal.clientName.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
        (deal.clientEmail && deal.clientEmail.toLowerCase().includes(pipelineSearch.toLowerCase()));

      const matchesStatus =
        pipelineStatusFilter === "ALL" || deal.status === pipelineStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deals, pipelineSearch, pipelineStatusFilter]);

  // Filtered referred users
  const filteredUsers = useMemo(() => {
    return referredUsers.filter((u) => {
      if (!pipelineSearch.trim()) return true;
      const term = pipelineSearch.toLowerCase();
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      return (
        fullName.includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.subscription?.whiteLabel?.name &&
          u.subscription.whiteLabel.name.toLowerCase().includes(term))
      );
    });
  }, [referredUsers, pipelineSearch]);

  // Copy handler helper
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success(`Partner code "${referralCode}" copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Submit real deal to backend
  const handleAddDeal = async () => {
    if (!newClientName.trim()) {
      toast.error("Please provide the Client or Organization Name.");
      return;
    }

    setIsSubmittingDeal(true);
    try {
      const res = await clientCreateDealAction({
        clientName: newClientName.trim(),
        clientEmail: newClientEmail.trim() || undefined,
        contactName: newContactName.trim() || undefined,
        contactPhone: newClientPhone.trim() || undefined,
        sellingPriceBdt: newDealPrice,
        notes: newDealNotes.trim() || undefined,
      });

      if (res.success && res.deal) {
        setDeals([res.deal, ...deals]);
        setNewDealOpen(false);
        setNewClientName("");
        setNewContactName("");
        setNewClientEmail("");
        setNewClientPhone("");
        setNewDealStatus("PROSPECT");
        setNewDealPrice(referrer?.dealBenchmarkBdt || 60000);
        setNewDealNotes("");
        toast.success(
          `Prospect registered! Anticipated 15% partner commission: ৳${res.deal.referrerBountyBdt.toLocaleString()} BDT`,
        );
      } else {
        toast.error(res.message || "Failed to register prospective deal.");
      }
    } catch {
      toast.error("An error occurred while registering the deal.");
    } finally {
      setIsSubmittingDeal(false);
    }
  };

  // Calculated simulation cut
  const calculatedCommission = Math.round(dealPrice * ((referrer?.commissionRate || 15) / 100));
  const calculatedPlatformShare = dealPrice - calculatedCommission;

  return (
    <div className="w-full space-y-8 pb-16 animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider gap-1.5 py-1 px-2.5"
              >
                <Sparkles className="h-3 w-3" />
                Authorized Referrer Partner
              </Badge>
              <Badge
                variant="secondary"
                className="font-mono text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 gap-1.5 py-1 px-2.5"
              >
                <BadgePercent className="h-3.5 w-3.5" />
                15% Guaranteed Commission
              </Badge>
              <Badge variant="outline" className="text-[11px] font-mono py-1 px-2.5">
                Min ৳60,000 BDT Floor
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {referrer?.name || branding?.name || `${user.firstName || "Partner"} Network`} Referrer
              Console
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Earn strictly <strong className="text-foreground">15% of the total selling price</strong>{" "}
              for every Distribution Aggregator WhiteLabel account you refer. Zero server setup or
              domain maintenance required on your end — share your partner link and collect your
              bounties.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => setIsShareModalOpen(true)}
              size="sm"
              className="font-semibold text-xs h-10 px-4 gap-2 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Share2 className="h-4 w-4" />
              <span>Share &amp; Promote</span>
            </Button>
            <Button
              onClick={() => setNewDealOpen(true)}
              variant="outline"
              size="sm"
              className="font-semibold text-xs h-10 px-4 gap-2 border-border/80 shadow-xs hover:bg-muted"
            >
              <PlusCircle className="h-4 w-4 text-emerald-500" />
              <span>Log Client Deal</span>
            </Button>
          </div>
        </div>
      </div>

      {/* High-Contrast Executive Metrics Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Metric 1: Referred Accounts */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-5 shadow-xs transition-all hover:shadow-md hover:border-foreground/20 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Referred Accounts
              </span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono tracking-tight text-foreground">
              {totalReferred}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between font-medium">
            <span>Direct Signups</span>
            <span className="font-mono font-bold text-foreground">{referredUsers.length}</span>
          </div>
        </div>

        {/* Metric 2: Pipeline Deal Value */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-5 shadow-xs transition-all hover:shadow-md hover:border-foreground/20 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Pipeline Volume
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono tracking-tight text-foreground">
              {totalPipelineVolume === 0
                ? "৳0"
                : totalPipelineVolume >= 1000000
                ? `৳${(totalPipelineVolume / 1000000).toFixed(1)}M`
                : `৳${(totalPipelineVolume / 1000).toFixed(0)}K`}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between font-medium">
            <span>Total Deal Value</span>
            <span className="font-mono font-bold text-foreground">৳{totalPipelineVolume.toLocaleString()} BDT</span>
          </div>
        </div>

        {/* Metric 3: Total 15% Bounty Earned */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] via-card to-card p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-500/50 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Total 15% Bounty
              </span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
                <BadgePercent className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              ৳{totalCommissionEarned.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-500/20 text-[11px] text-muted-foreground flex items-center justify-between font-medium">
            <span>Commission Rate</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">15% Flat</span>
          </div>
        </div>

        {/* Metric 4: Available for Payout */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.1] via-card to-card p-5 shadow-xs ring-1 ring-emerald-500/20 transition-all hover:shadow-md hover:border-emerald-500/60 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Available Payout
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              ৳{availablePayout.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-500/20 text-[11px] text-muted-foreground flex items-center justify-between font-medium">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Settled &amp; ready
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">bKash/Bank</span>
          </div>
        </div>

        {/* Metric 5: Historical Disbursed */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-5 shadow-xs transition-all hover:shadow-md hover:border-foreground/20 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Historical Paid
              </span>
              <div className="p-2 rounded-xl bg-muted text-muted-foreground shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono tracking-tight text-foreground/70">
              ৳{settledPayout.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between font-medium">
            <span>Completed Payouts</span>
            <span className="font-mono font-bold text-foreground/70">
              {deals.filter((d: any) => d.status === "PAID").length} settled
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Segmented Control */}
      <Tabs defaultValue="links" className="space-y-6 sm:space-y-8">
        <div className="p-1.5 rounded-2xl border border-border/80 bg-muted/40 dark:bg-card/90 shadow-xs backdrop-blur-md">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full h-auto gap-1.5 bg-transparent p-0">
            <TabsTrigger
              value="links"
              className="py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-transparent data-active:bg-background data-active:text-foreground data-active:shadow-sm data-active:border-border/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
            >
              <Share2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Referral Links &amp; Tools</span>
            </TabsTrigger>

            <TabsTrigger
              value="calculator"
              className="py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-transparent data-active:bg-background data-active:text-foreground data-active:shadow-sm data-active:border-border/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
            >
              <Calculator className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="truncate">15% Deal Calculator</span>
            </TabsTrigger>

            <TabsTrigger
              value="pipeline"
              className="py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-transparent data-active:bg-background data-active:text-foreground data-active:shadow-sm data-active:border-border/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
            >
              <Users className="h-4 w-4 shrink-0 text-sky-500" />
              <span className="truncate">Pipeline &amp; Leads</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-muted text-foreground border border-border/60">
                {totalReferred}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="payouts"
              className="py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-transparent data-active:bg-background data-active:text-foreground data-active:shadow-sm data-active:border-border/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
            >
              <Lock className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="truncate">Payout &amp; Remittance</span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Locked
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================================= */}
        {/* 1. Referral Links & Code */}
        {/* ========================================================================= */}
        <TabsContent value="links" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 border-border/80 shadow-sm rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Globe className="h-4 w-4" />
                      </div>
                      <span>Your Dedicated Partner Referral Link</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Share this link with record labels, music aggregators, and artists looking to
                      launch their own distribution platform.
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs self-start sm:self-center py-1 px-2.5">
                    Code: {referralCode}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">Attribution Registration URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={referralUrl}
                      className="font-mono text-xs sm:text-sm h-11 bg-muted/40 border-border/80 selection:bg-primary/20"
                    />
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="shrink-0 h-11 px-4 font-semibold text-xs gap-1.5 border-border/80"
                    >
                      {copiedLink ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedLink ? "Copied" : "Copy Link"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-11 w-11 text-muted-foreground hover:text-foreground border-border/80"
                      title="Test URL in new window"
                      onClick={() => window.open(referralUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Partner Referral Code
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold font-mono tracking-wider text-foreground">
                        {referralCode}
                      </span>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={handleCopyCode}
                        className="h-7 text-xs font-semibold gap-1"
                      >
                        {copiedCode ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedCode ? "Copied" : "Copy Code"}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Commercial Terms
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        15% of Selling Price
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Min ৳60,000 BDT
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 1-Click Fast Actions */}
                <div className="pt-4 border-t border-border/50 space-y-2.5">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    <span>1-Click Promote Channels</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Instant pre-composed outreach
                    </span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => {
                        const text = `Launch your own Music Distribution & Aggregation Platform with dedicated AWS infrastructure and DDEX direct delivery feeds! Use my partner link for priority onboarding: ${referralUrl}`;
                        window.open(
                          `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
                          "_blank",
                        );
                      }}
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-500" />
                      WhatsApp Direct
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 gap-1.5 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                      onClick={() => {
                        const subject = "Exclusive Music Distribution Platform Onboarding";
                        const body = `Hi,\n\nI recommend launching your digital music distribution business with RoyalMotionIT's Distribution Aggregator platform. It comes with dedicated AWS compute, S3 Audio Vault, and DDEX direct delivery feeds.\n\nSign up with my referral link to get priority verification:\n${referralUrl}\nReferral Code: ${referralCode}\n\nBest regards,\n${
                          referrer?.name || branding?.name || user.firstName || "Partner"
                        }`;
                        window.location.href = `mailto:?subject=${encodeURIComponent(
                          subject,
                        )}&body=${encodeURIComponent(body)}`;
                      }}
                    >
                      <Mail className="h-3.5 w-3.5 text-sky-500" />
                      Email Pitch
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                      onClick={() => {
                        window.open(
                          `https://t.me/share/url?url=${encodeURIComponent(
                            referralUrl,
                          )}&text=${encodeURIComponent(
                            "Launch your music aggregator platform with dedicated infrastructure",
                          )}`,
                          "_blank",
                        );
                      }}
                    >
                      <Globe className="h-3.5 w-3.5 text-blue-500" />
                      Telegram
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs h-9 gap-1.5 ml-auto"
                      onClick={() => setIsShareModalOpen(true)}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Open Full Share Modal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* In-Person Partner Pass */}
            <Card className="border-border/80 shadow-sm rounded-2xl flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">In-Person Partner Pass</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Scan at studios, events, and label meetings.
                    </CardDescription>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4 text-center my-4">
                <div className="p-4 bg-white dark:bg-card rounded-2xl shadow-inner border border-border/80">
                  <div className="w-36 h-36 bg-foreground/5 rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    <QrCode className="w-28 h-28 text-foreground" />
                  </div>
                </div>
                <div className="space-y-1 max-w-[220px]">
                  <span className="text-xs font-mono font-bold text-foreground">
                    Code: {referralCode}
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Point client cameras here to automatically bind them to your 15% commission ledger.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 h-9"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="h-3.5 w-3.5" />
                View Partner Pass Modal
              </Button>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 2. 15% Deal Calculator */}
        {/* ========================================================================= */}
        <TabsContent value="calculator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      15% Selling Price Commission Calculator
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Simulate whatever deal price you negotiate with your distribution client.
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold self-start sm:self-center"
                  >
                    Strictly 15% Share
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price input slider */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Label htmlFor="calculatorPrice" className="text-xs font-semibold">
                      Negotiated Account Selling Price (BDT)
                    </Label>
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="font-bold text-sm text-foreground">৳</span>
                      <Input
                        id="calculatorPrice"
                        type="number"
                        min={60000}
                        step={5000}
                        value={dealPrice}
                        onChange={(e) =>
                          setDealPrice(Math.max(60000, Number(e.target.value) || 60000))
                        }
                        className="w-36 font-mono font-bold text-base h-9 text-right"
                      />
                    </div>
                  </div>

                  <input
                    type="range"
                    min={60000}
                    max={300000}
                    step={5000}
                    value={dealPrice}
                    onChange={(e) => setDealPrice(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>৳60,000 (Min Baseline)</span>
                    <span>৳150,000 (Standard Pro)</span>
                    <span>৳300,000+ (Enterprise)</span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRICE_PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        variant={dealPrice === preset.value ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-7 gap-1"
                        onClick={() => setDealPrice(preset.value)}
                      >
                        <span>{preset.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Earnings breakdown card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      Your 15% Referrer Commission
                    </span>
                    <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      ৳{calculatedCommission.toLocaleString()}{" "}
                      <span className="text-sm font-sans font-medium text-foreground">BDT</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Disbursed immediately once the client pays their onboarding invoice.
                    </p>
                  </div>

                  <div className="space-y-1 sm:border-l sm:border-primary/20 sm:pl-4">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      Platform Infrastructure &amp; Deployment (85%)
                    </span>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      ৳{calculatedPlatformShare.toLocaleString()}{" "}
                      <span className="text-sm font-sans font-medium text-muted-foreground">BDT</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Covers AWS EC2, S3 Audio Vault, SES setup, Cloudflare DNS, and 24/7 PM2 monitoring.
                    </p>
                  </div>
                </div>

                {/* Benchmark deals table */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Standard Reference Deal Tiers
                  </span>
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase">
                        <tr>
                          <th className="p-2.5">Distributor Tier</th>
                          <th className="p-2.5">Selling Price</th>
                          <th className="p-2.5 text-emerald-600 dark:text-emerald-400">
                            Your 15% Payout
                          </th>
                          <th className="p-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono">
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-foreground">
                            Baseline WhiteLabel Tier
                          </td>
                          <td className="p-2.5 font-bold">৳60,000 BDT</td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                            ৳9,000 BDT
                          </td>
                          <td className="p-2.5 text-right">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setDealPrice(60000)}
                              className="h-6 text-[10px]"
                            >
                              Apply
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-foreground">
                            Pro Aggregator (Sub-Labels)
                          </td>
                          <td className="p-2.5 font-bold">৳100,000 BDT</td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                            ৳15,000 BDT
                          </td>
                          <td className="p-2.5 text-right">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setDealPrice(100000)}
                              className="h-6 text-[10px]"
                            >
                              Apply
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-foreground">
                            Enterprise Multi-Catalog
                          </td>
                          <td className="p-2.5 font-bold">৳150,000 BDT</td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                            ৳22,500 BDT
                          </td>
                          <td className="p-2.5 text-right">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setDealPrice(150000)}
                              className="h-6 text-[10px]"
                            >
                              Apply
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-foreground">
                            Unlimited Major Network
                          </td>
                          <td className="p-2.5 font-bold">৳250,000 BDT</td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                            ৳37,500 BDT
                          </td>
                          <td className="p-2.5 text-right">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setDealPrice(250000)}
                              className="h-6 text-[10px]"
                            >
                              Apply
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rules & Transparency */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Referral Policy Rules
                </CardTitle>
                <CardDescription className="text-xs">
                  Transparent guidelines governing the 15% commission model.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1">
                  <strong className="text-foreground block">1. ৳60,000 BDT Floor</strong>
                  <p className="text-[11px]">
                    To maintain high-quality infrastructure standards, every Distribution Aggregator
                    account has a mandatory minimum baseline of ৳60,000 BDT.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block">2. No Ceiling / Uncapped</strong>
                  <p className="text-[11px]">
                    You can negotiate and sell at whatever price the client agrees to. If you sell an
                    account for ৳200,000 BDT, your commission is ৳30,000 BDT.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block">3. Fast Settlement</strong>
                  <p className="text-[11px]">
                    Commissions become available for withdrawal immediately upon the client's verified
                    subscription payment and are disbursed directly to your configured bKash or Bank
                    Account.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block">4. No Server Management</strong>
                  <p className="text-[11px]">
                    Referrers are pure commercial partners and do not have to touch AWS, Cloudflare, SSH
                    keys, or PM2.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 3. Referred Accounts & Pipeline Tracker */}
        {/* ========================================================================= */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Referred Accounts &amp; Deal Pipeline
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Real-time ledger of referred user registrations and negotiated client deals.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-border/80 p-0.5 bg-muted/40">
                    <Button
                      variant={pipelineViewMode === "DEALS" ? "secondary" : "ghost"}
                      size="xs"
                      onClick={() => setPipelineViewMode("DEALS")}
                      className="text-xs h-7 font-semibold"
                    >
                      Pipeline Deals ({deals.length})
                    </Button>
                    <Button
                      variant={pipelineViewMode === "USERS" ? "secondary" : "ghost"}
                      size="xs"
                      onClick={() => setPipelineViewMode("USERS")}
                      className="text-xs h-7 font-semibold"
                    >
                      Referred Users ({referredUsers.length})
                    </Button>
                  </div>

                  <Button
                    onClick={() => setNewDealOpen(true)}
                    size="sm"
                    className="font-semibold text-xs h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Log Client Deal</span>
                  </Button>
                </div>
              </div>

              {/* Pipeline Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={
                      pipelineViewMode === "DEALS"
                        ? "Search client, email..."
                        : "Search referred user, email..."
                    }
                    value={pipelineSearch}
                    onChange={(e) => setPipelineSearch(e.target.value)}
                    className="pl-8 pr-8 h-8 text-xs bg-muted/30"
                  />
                  {pipelineSearch && (
                    <button
                      onClick={() => setPipelineSearch("")}
                      className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {pipelineViewMode === "DEALS" && (
                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {["ALL", "PENDING", "PAID", "CANCELLED"].map((status) => (
                      <Button
                        key={status}
                        variant={pipelineStatusFilter === status ? "secondary" : "ghost"}
                        size="xs"
                        className={`text-xs h-7 font-medium ${
                          pipelineStatusFilter === status
                            ? "bg-secondary text-secondary-foreground font-bold shadow-2xs"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setPipelineStatusFilter(status)}
                      >
                        {status === "ALL"
                          ? `All Deals (${deals.length})`
                          : status === "PAID"
                          ? "Paid & Active"
                          : status === "PENDING"
                          ? "Pending Close"
                          : "Cancelled"}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {pipelineViewMode === "DEALS" ? (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase">
                      <tr>
                        <th className="p-3">Deal Code</th>
                        <th className="p-3">Client / Organization</th>
                        <th className="p-3">Logged Date</th>
                        <th className="p-3">Selling Price</th>
                        <th className="p-3 text-emerald-600 dark:text-emerald-400">15% Bounty</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {filteredDeals.length > 0 ? (
                        filteredDeals.map((deal) => {
                          const isPaid = deal.status === "PAID" || deal.status === "ACTIVE";
                          const isPending = deal.status === "PENDING";
                          const isCancelled = deal.status === "CANCELLED";

                          return (
                            <tr key={deal.id} className="hover:bg-muted/20 transition-colors">
                              <td className="p-3 font-mono font-bold text-foreground">
                                {deal.code}
                              </td>
                              <td className="p-3 font-sans">
                                <div className="font-semibold text-foreground">{deal.clientName}</div>
                                {deal.clientEmail && (
                                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                    {deal.clientEmail}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-muted-foreground text-[11px]">
                                {new Date(deal.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 font-bold text-foreground">
                                ৳{deal.sellingPriceBdt.toLocaleString()}
                              </td>
                              <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                                ৳{deal.referrerBountyBdt.toLocaleString()}
                              </td>
                              <td className="p-3 font-sans">
                                {isPaid && (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                    Paid &amp; Active
                                  </Badge>
                                )}
                                {isPending && (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px] font-bold"
                                  >
                                    Pending Close
                                  </Badge>
                                )}
                                {isCancelled && (
                                  <Badge variant="secondary" className="text-muted-foreground text-[10px]">
                                    Cancelled
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 text-right font-sans">
                                <div className="flex items-center justify-end gap-1">
                                  {deal.clientEmail && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                      title="Copy Email"
                                      onClick={() => {
                                        navigator.clipboard.writeText(deal.clientEmail!);
                                        toast.success(`Copied ${deal.clientEmail}`);
                                      }}
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground font-sans">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Users className="h-8 w-8 text-muted-foreground/40" />
                              <p className="text-xs font-semibold">No client deals logged yet.</p>
                              <p className="text-[11px] text-muted-foreground max-w-sm">
                                Register a client lead using the button above or share your partner link to start earning 15% commissions.
                              </p>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => setNewDealOpen(true)}
                                className="text-xs h-7 mt-1 gap-1"
                              >
                                <PlusCircle className="h-3 w-3" />
                                Log First Deal
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase">
                      <tr>
                        <th className="p-3">User Code</th>
                        <th className="p-3">Client Representative</th>
                        <th className="p-3">Registration Date</th>
                        <th className="p-3">WhiteLabel Platform</th>
                        <th className="p-3">Account Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => {
                          const wl = u.subscription?.whiteLabel;
                          return (
                            <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                              <td className="p-3 font-mono font-bold text-foreground">{u.code}</td>
                              <td className="p-3 font-sans">
                                <div className="font-semibold text-foreground">
                                  {u.firstName} {u.lastName}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                  {u.email}
                                </div>
                              </td>
                              <td className="p-3 text-muted-foreground text-[11px]">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 font-sans">
                                {wl ? (
                                  <div>
                                    <div className="font-semibold text-foreground">{wl.name}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Status: {wl.status}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">
                                    Application Pending
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-sans">
                                {wl?.status === "ACTIVE" ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                    Live Subscriber
                                  </Badge>
                                ) : wl ? (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px] font-bold"
                                  >
                                    Onboarding ({wl.status})
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-muted-foreground text-[10px]">
                                    Registered Lead
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 text-right font-sans">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  title="Copy Email"
                                  onClick={() => {
                                    navigator.clipboard.writeText(u.email);
                                    toast.success(`Copied ${u.email}`);
                                  }}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground font-sans">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Users className="h-8 w-8 text-muted-foreground/40" />
                              <p className="text-xs font-semibold">No direct user signups recorded yet.</p>
                              <p className="text-[11px] text-muted-foreground max-w-sm">
                                When distributors sign up using your partner link or referral code, their accounts appear here automatically.
                              </p>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={handleCopyLink}
                                className="text-xs h-7 mt-1 gap-1"
                              >
                                <Copy className="h-3 w-3" />
                                Copy Partner Link
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 4. Payout & Remittance Configuration (STRICTLY LOCKED) */}
        {/* ========================================================================= */}
        <TabsContent value="payouts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-500" />
                      Remittance &amp; Payout Configuration
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Official verified disbursement channels for partner commission settlement.
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold self-start sm:self-center gap-1"
                  >
                    <Lock className="h-3 w-3" />
                    Security Locked
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Security Compliance Alert Banner */}
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground">
                      Remittance Details are Verified &amp; Locked
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      For AML/KYB regulatory compliance and fraud prevention, your payout channel
                      and account details cannot be altered directly through the self-service console.
                      If you need to change your disbursement bank account or mobile wallet number,
                      please contact platform administration.
                    </p>
                  </div>
                </div>

                {/* Verified Channel Details Card */}
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      {referrer?.payoutMethod === "BANK_TRANSFER" ? (
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Landmark className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Smartphone className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {referrer?.payoutMethod === "BANK_TRANSFER"
                            ? "Direct Electronic Bank Wire"
                            : `${referrer?.payoutMethod || "MFS"} Mobile Financial Service`}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Disbursement Mode: {referrer?.payoutMethod || "BANK_TRANSFER"}
                        </div>
                      </div>
                    </div>

                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      Verified Channel
                    </Badge>
                  </div>

                  {referrer?.payoutMethod === "BANK_TRANSFER" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          Bank Name
                        </span>
                        <span className="font-semibold text-foreground">
                          {referrer?.bankName || "Not configured"}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          Account Holder Name
                        </span>
                        <span className="font-semibold text-foreground">
                          {referrer?.accountName || "Not configured"}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Account Number
                          </span>
                          {referrer?.accountNumber && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(referrer.accountNumber!);
                                toast.success("Account number copied!");
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          {referrer?.accountNumber || "Not configured"}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          Branch District
                        </span>
                        <span className="font-semibold text-foreground">
                          {referrer?.branchDistrict || "Not configured"}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          Branch Name
                        </span>
                        <span className="font-semibold text-foreground">
                          {referrer?.branchName || "Not configured"}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Routing Number
                          </span>
                          {referrer?.routingNumber && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(referrer.routingNumber!);
                                toast.success("Routing number copied!");
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          {referrer?.routingNumber || "Not configured"}
                        </span>
                      </div>

                      {referrer?.swiftCode && (
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 space-y-0.5 sm:col-span-2 md:col-span-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-medium">
                              SWIFT Code
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(referrer.swiftCode!);
                                toast.success("SWIFT code copied!");
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-mono font-bold text-foreground">
                            {referrer.swiftCode}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          MFS Provider
                        </span>
                        <span className="font-semibold text-foreground">
                          {referrer?.payoutMethod || "bKash"}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Wallet Mobile Number
                          </span>
                          {(referrer?.walletNumber || referrer?.accountNumber) && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  referrer.walletNumber || referrer.accountNumber!,
                                );
                                toast.success("Wallet number copied!");
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <span className="font-mono font-bold text-foreground text-sm">
                          {referrer?.walletNumber || referrer?.accountNumber || "Not configured"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40">
                    <p className="text-[11px] text-muted-foreground">
                      Need to update this account? Contact administration for secure verification.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSupportModalOpen(true)}
                      className="text-xs h-8 gap-1.5 shrink-0"
                    >
                      <Headphones className="h-3.5 w-3.5" />
                      <span>Request Modification</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payout Security & SLAs */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Payout Processing SLAs
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated disbursement turnaround times.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1">
                  <strong className="text-foreground block">bKash / Nagad / Rocket</strong>
                  <p className="text-[11px]">
                    Instant to 4-hour settlement directly to personal or merchant numbers.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block">Bank BEFTN / NPSB</strong>
                  <p className="text-[11px]">
                    Same-day to next banking business day transfer via BEFTN/NPSB across all 60+
                    scheduled Bangladeshi banks.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block">Compliance Safeguard</strong>
                  <p className="text-[11px]">
                    Disbursements are matched strictly against verified client subscription invoices
                    to maintain 100% accounting transparency.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Distribution Aggregator Platform Pitch Kit */}
      <Card className="border-border/60 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Distributor Aggregator Sales Pitch Kit
          </CardTitle>
          <CardDescription className="text-xs">
            Use these key value propositions when pitching Distribution Aggregator accounts to record
            labels and catalog owners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                Dedicated Cloud Infrastructure
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Every client gets their own dedicated AWS EC2 ARM64 server, S3 Audio Vault with
                Glacier lifecycle rules, verified SES email identities, and automated Cloudflare SSL.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <BadgePercent className="h-3.5 w-3.5 text-primary" />
                DDEX ERN 4.2 &amp; DSP Direct Delivery
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Full compliance with IFPI/GS1 standards, Spotify &amp; Apple Music direct delivery
                feeds, automated ISRC/UPC barcode pools, and multi-tenant sub-labels.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Anti-Fraud Streaming Shield
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Automated audio spectral QC (16/24-bit 44.1–96kHz WAV/FLAC) and artificial streaming
                velocity detection to protect client catalogs from DSP penalties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: Log Client Deal Modal */}
      {/* ========================================================================= */}
      <Dialog open={newDealOpen} onOpenChange={setNewDealOpen}>
        <DialogContent className="w-full max-w-[94vw] sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-border/80 shadow-2xl z-[70]">
          <DialogHeader className="p-5 pb-4 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">
                    Log Prospective Distribution Client
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Register a prospective distribution aggregator client to lock in your 15% attribution.
                  </DialogDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[10px] font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hidden sm:inline-flex"
              >
                15% Bounty
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="clientName" className="text-xs font-semibold flex items-center gap-1">
                  <span>Company / Label Name</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clientName"
                  placeholder="e.g. SoundWave Distribution"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactName" className="text-xs font-semibold">
                  Contact Person Name
                </Label>
                <Input
                  id="contactName"
                  placeholder="e.g. Ariful Islam"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="clientEmail" className="text-xs font-semibold">
                  Contact Email
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="ariful@soundwave.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clientPhone" className="text-xs font-semibold">
                  Contact WhatsApp / Phone
                </Label>
                <Input
                  id="clientPhone"
                  placeholder="e.g. +880 1712-345678"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Initial Deal Stage</Label>
                <Select
                  items={DEAL_STAGE_ITEMS}
                  value={newDealStatus}
                  onValueChange={(val) => {
                    if (val === "PROSPECT" || val === "UNDER_REVIEW" || val === "CONTRACTED") {
                      setNewDealStatus(val);
                    }
                  }}
                >
                  <SelectTrigger className="text-xs h-9 w-full">
                    <SelectValue placeholder="Select deal stage" />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="PROSPECT" className="text-xs">
                      Prospect Lead
                    </SelectItem>
                    <SelectItem value="UNDER_REVIEW" className="text-xs">
                      In Discussion / Demo
                    </SelectItem>
                    <SelectItem value="CONTRACTED" className="text-xs">
                      Contract Executed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newDealPrice" className="text-xs font-semibold flex items-center justify-between">
                  <span>Target Selling Price (BDT)</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Min ৳60,000</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground">৳</span>
                  <Input
                    id="newDealPrice"
                    type="number"
                    min={60000}
                    step={5000}
                    value={newDealPrice}
                    onChange={(e) =>
                      setNewDealPrice(Math.max(60000, Number(e.target.value) || 60000))
                    }
                    className="font-mono font-bold text-xs h-9 text-right"
                  />
                </div>
              </div>
            </div>

            {/* Price Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((p) => (
                <Button
                  key={p.value}
                  type="button"
                  variant={newDealPrice === p.value ? "secondary" : "outline"}
                  size="xs"
                  className="text-xs h-6 font-mono"
                  onClick={() => setNewDealPrice(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* 15% Commercial Calculation Card */}
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Your Anticipated 15% Bounty
                </span>
                <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  ৳{Math.round(newDealPrice * ((referrer?.commissionRate || 15) / 100)).toLocaleString()}{" "}
                  <span className="text-xs font-sans font-medium text-foreground">BDT</span>
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Platform Cloud Share (85%)
                </span>
                <div className="text-sm font-bold font-mono text-foreground">
                  ৳{Math.round(newDealPrice * (1 - (referrer?.commissionRate || 15) / 100)).toLocaleString()} BDT
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dealNotes" className="text-xs font-semibold">
                Pitch Notes / Technical Needs (Optional)
              </Label>
              <Textarea
                id="dealNotes"
                placeholder="e.g. Client needs 5 sub-label tenants, Spotify direct delivery feed, and custom domain setup."
                value={newDealNotes}
                onChange={(e) => setNewDealNotes(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 shrink-0 flex items-center justify-between sm:justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewDealOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSubmittingDeal}
              onClick={handleAddDeal}
              className="text-xs h-9 font-semibold gap-1.5 bg-primary text-primary-foreground"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{isSubmittingDeal ? "Registering..." : "Register Deal in Pipeline"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: Share & Promote Modal */}
      {/* ========================================================================= */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="w-full max-w-[94vw] sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-border/80 shadow-2xl z-[70]">
          <DialogHeader className="p-5 pb-4 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">
                    Share Referral Link &amp; Partner Assets
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Promote your partner code to record labels and aggregators to earn 15% bounties.
                  </DialogDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs font-bold border-primary/30 bg-primary/10 text-primary"
              >
                {referralCode}
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {/* Direct Outreach Shortcuts */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold block">1-Click Direct Outreach Channels</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Button
                  variant="outline"
                  className="h-14 flex flex-col items-center justify-center border-emerald-500/30 hover:bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1"
                  onClick={() => {
                    const text = `Launch your own Music Distribution & Aggregation Platform with dedicated AWS infrastructure and DDEX direct delivery feeds! Use my partner referral link to get priority onboarding:\n${referralUrl}\nPartner Code: ${referralCode}`;
                    window.open(
                      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
                      "_blank",
                    );
                  }}
                >
                  <Phone className="h-4 w-4 text-emerald-500" />
                  <span>Share on WhatsApp</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-14 flex flex-col items-center justify-center border-sky-500/30 hover:bg-sky-500/10 text-xs font-semibold text-sky-600 dark:text-sky-400 gap-1"
                  onClick={() => {
                    const subject = "Exclusive Music Distribution Platform Onboarding";
                    const body = `Hi,\n\nI recommend launching your digital music distribution business with RoyalMotionIT's Distribution Aggregator platform. It comes with dedicated AWS compute, S3 Audio Vault, and DDEX direct delivery feeds.\n\nSign up with my referral link to get priority verification:\n${referralUrl}\nReferral Code: ${referralCode}\n\nBest regards,\n${
                      referrer?.name || branding?.name || user.firstName || "Partner"
                    }`;
                    window.location.href = `mailto:?subject=${encodeURIComponent(
                      subject,
                    )}&body=${encodeURIComponent(body)}`;
                  }}
                >
                  <Mail className="h-4 w-4 text-sky-500" />
                  <span>Send Email Pitch</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-14 flex flex-col items-center justify-center border-blue-500/30 hover:bg-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-400 gap-1"
                  onClick={() => {
                    window.open(
                      `https://t.me/share/url?url=${encodeURIComponent(
                        referralUrl,
                      )}&text=${encodeURIComponent(
                        "Launch your music aggregator platform with dedicated AWS infrastructure",
                      )}`,
                      "_blank",
                    );
                  }}
                >
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span>Share on Telegram</span>
                </Button>
              </div>
            </div>

            {/* Link Box */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Attribution Registration Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={referralUrl}
                  className="font-mono text-xs h-9 bg-muted/40"
                />
                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  className="shrink-0 h-9 font-semibold text-xs gap-1.5"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>

            {/* Code Box */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Partner Referral Code (Manual Onboarding)
                </span>
                <span className="text-base font-bold font-mono tracking-wider text-foreground">
                  {referralCode}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={handleCopyCode}
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCode ? "Copied" : "Copy Code"}</span>
              </Button>
            </div>

            {/* QR Card */}
            <div className="p-4 rounded-xl border border-border/80 bg-card flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2 bg-white dark:bg-card rounded-xl border border-border/80 shrink-0">
                <div className="w-24 h-24 bg-foreground/5 rounded-lg flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-foreground" />
                </div>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-foreground block">In-Person Instant Registration</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Display this QR code directly on your mobile screen during artist meetings or label pitches. Clients who scan are automatically attributed to your partner account.
                </p>
              </div>
            </div>

            {/* Attribution Notice */}
            <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" />
                Attribution &amp; Settlement Guarantee
              </span>
              <p>
                Referral attribution operates continuously once the client registers. Their organization is permanently mapped to your Partner Ledger for automatic 15% bounty disbursements upon subscription settlement.
              </p>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 shrink-0 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareModalOpen(false)}
              className="text-xs h-9"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: Request Payout Modification Modal */}
      {/* ========================================================================= */}
      <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
        <DialogContent className="w-full max-w-[94vw] sm:max-w-md p-0 overflow-hidden rounded-2xl border-border/80 shadow-2xl z-[70]">
          <DialogHeader className="p-5 pb-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Request Remittance Update
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Submit bank/MFS changes to platform administration.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              To update your registered bank transfer account or mobile wallet number, please contact platform compliance support with your Partner Code: <strong className="font-mono text-foreground">{referralCode}</strong>.
            </p>

            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Admin Support WhatsApp</span>
                <Button
                  size="xs"
                  variant="ghost"
                  className="h-6 text-emerald-600 gap-1 text-[11px]"
                  onClick={() => {
                    const text = `Hello Platform Admin, I need to request an update to my verified remittance details for Partner Code: ${referralCode}.`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                >
                  <Phone className="h-3 w-3" />
                  Chat on WhatsApp
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Compliance Email</span>
                <span className="font-mono text-foreground font-semibold">compliance@royalmotionit.com</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-700 dark:text-amber-400">
              Changes require verification to protect your payouts against unauthorized account redirection.
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSupportModalOpen(false)}
              className="text-xs h-9"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
