"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { WhiteLabelBranding } from "@/types/whitelabel";
import { clientUpdateBrandingAction } from "@/actions/client/whitelabel/client-update-branding.action";

interface ReferredDeal {
  id: string;
  clientName: string;
  contactName: string;
  email: string;
  status: "ACTIVE" | "CONTRACTED" | "UNDER_REVIEW" | "PROSPECT";
  dealPriceBdt: number;
  commissionBdt: number;
  payoutStatus: "SETTLED" | "AVAILABLE" | "PENDING";
  createdAt: string;
}

interface ReferrerDashboardViewProps {
  branding: WhiteLabelBranding;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export function ReferrerDashboardView({ branding, user }: ReferrerDashboardViewProps) {
  const onboardingDetails = (branding.onboardingDetails as Record<string, any>) || {};
  const referralCode =
    onboardingDetails.referralNetworkCode ||
    onboardingDetails.scoutAffiliateCodePrefix ||
    branding.code ||
    `REF-${user.id.slice(-6).toUpperCase()}`;

  // Referral link
  const origin = typeof window !== "undefined" ? window.location.origin : "https://platform.royalmotionit.com";
  const referralUrl = `${origin}/auth/register?ref=${referralCode}`;

  // Deal simulation state
  const [dealPrice, setDealPrice] = useState<number>(
    onboardingDetails.simulatedDealPriceBdt && onboardingDetails.simulatedDealPriceBdt >= 60000
      ? Number(onboardingDetails.simulatedDealPriceBdt)
      : 60000,
  );

  // Remittance configuration state
  const [payoutMethod, setPayoutMethod] = useState<string>(
    onboardingDetails.payoutMethod || "BKASH",
  );
  const [payoutAccountName, setPayoutAccountName] = useState<string>(
    onboardingDetails.payoutAccountName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
  );
  const [payoutAccountNumber, setPayoutAccountNumber] = useState<string>(
    onboardingDetails.payoutAccountNumber || "",
  );
  const [payoutBankName, setPayoutBankName] = useState<string>(
    onboardingDetails.payoutBankName || "Dutch-Bangla Bank Limited (DBBL)",
  );
  const [payoutBankBranch, setPayoutBankBranch] = useState<string>(
    onboardingDetails.payoutBankBranch || "",
  );
  const [payoutBankRouting, setPayoutBankRouting] = useState<string>(
    onboardingDetails.payoutBankRouting || "",
  );
  const [isSavingPayout, setIsSavingPayout] = useState(false);

  // Copy state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Pipeline deals state (loaded from onboardingDetails or populated with sensible defaults)
  const [deals, setDeals] = useState<ReferredDeal[]>(
    onboardingDetails.referredDeals || [
      {
        id: "deal-1",
        clientName: "Velocity Music Group",
        contactName: "Tanvir Hasan",
        email: "tanvir@velocitymusic.com",
        status: "ACTIVE",
        dealPriceBdt: 80000,
        commissionBdt: 12000,
        payoutStatus: "AVAILABLE",
        createdAt: "2026-09-18",
      },
      {
        id: "deal-2",
        clientName: "Dhaka Sound Distribution",
        contactName: "Rahim Chowdhury",
        email: "r.chowdhury@dhakasound.io",
        status: "CONTRACTED",
        dealPriceBdt: 60000,
        commissionBdt: 9000,
        payoutStatus: "PENDING",
        createdAt: "2026-09-22",
      },
      {
        id: "deal-3",
        clientName: "Bengal Beat Aggregators",
        contactName: "Nusrat Jahan",
        email: "nusrat@bengalbeat.org",
        status: "UNDER_REVIEW",
        dealPriceBdt: 100000,
        commissionBdt: 15000,
        payoutStatus: "PENDING",
        createdAt: "2026-09-25",
      },
    ],
  );

  // New Deal modal state
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newDealPrice, setNewDealPrice] = useState(60000);

  // Metrics calculations
  const totalReferred = deals.length;
  const totalPipelineVolume = deals.reduce((sum, d) => sum + d.dealPriceBdt, 0);
  const totalCommissionEarned = deals.reduce((sum, d) => sum + d.commissionBdt, 0);
  const availablePayout = deals
    .filter((d) => d.payoutStatus === "AVAILABLE")
    .reduce((sum, d) => sum + d.commissionBdt, 0);
  const settledPayout = deals
    .filter((d) => d.payoutStatus === "SETTLED")
    .reduce((sum, d) => sum + d.commissionBdt, 0);

  // Copy helper
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success(`Referral code ${referralCode} copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Add deal
  const handleAddDeal = () => {
    if (!newClientName.trim() || !newClientEmail.trim()) {
      toast.error("Please enter company name and contact email.");
      return;
    }
    const cleanPrice = Math.max(60000, Number(newDealPrice) || 60000);
    const comm = Math.round(cleanPrice * 0.15);
    const newDealItem: ReferredDeal = {
      id: `deal-${Date.now()}`,
      clientName: newClientName.trim(),
      contactName: newContactName.trim() || newClientName.trim(),
      email: newClientEmail.trim().toLowerCase(),
      status: "PROSPECT",
      dealPriceBdt: cleanPrice,
      commissionBdt: comm,
      payoutStatus: "PENDING",
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updatedDeals = [newDealItem, ...deals];
    setDeals(updatedDeals);
    setNewDealOpen(false);
    setNewClientName("");
    setNewContactName("");
    setNewClientEmail("");
    setNewDealPrice(60000);
    toast.success(`Prospect added! Anticipated 15% commission: ৳${comm.toLocaleString()} BDT`);
  };

  // Save payout settings
  const handleSavePayoutSettings = async () => {
    if (!payoutAccountNumber.trim()) {
      toast.error("Please enter your account or mobile number.");
      return;
    }

    setIsSavingPayout(true);
    try {
      const res = await clientUpdateBrandingAction({
        onboardingDetails: {
          ...onboardingDetails,
          payoutMethod,
          payoutAccountName,
          payoutAccountNumber,
          payoutBankName,
          payoutBankBranch,
          payoutBankRouting,
          simulatedDealPriceBdt: dealPrice,
        },
      });

      if (res.success) {
        toast.success("Payout & remittance configuration saved successfully!");
      } else {
        toast.error(res.message || "Failed to update payout settings.");
      }
    } catch {
      toast.error("Failed to save payout settings.");
    } finally {
      setIsSavingPayout(false);
    }
  };

  // Calculated simulation cut
  const calculatedCommission = Math.round(dealPrice * 0.15);
  const calculatedPlatformShare = dealPrice - calculatedCommission;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs font-bold uppercase tracking-wider">
                Authorized Referral Partner
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                15% Fixed Commission
              </Badge>
              <Badge variant="outline" className="text-xs font-mono">
                Min ৳60,000 BDT
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {branding.name || `${user.firstName || "Partner"} Network`} Referrer Hub
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Earn strictly <strong className="text-foreground">15% of the total selling price</strong> for every Distribution Aggregator WhiteLabel account you refer. Zero server setup or domain maintenance required on your end — simply refer and collect your commissions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <Button
              onClick={handleCopyLink}
              size="sm"
              className="font-semibold text-xs h-9 gap-1.5 shadow-sm"
            >
              {copiedLink ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copiedLink ? "Link Copied" : "Share Referral Link"}
            </Button>
          </div>
        </div>
      </div>

      {/* Top 5 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-medium flex items-center justify-between">
              <span>Referred Accounts</span>
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-foreground">
              {totalReferred}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[10px] text-muted-foreground">
            Distribution Aggregator leads
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-medium flex items-center justify-between">
              <span>Pipeline Deal Value</span>
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-foreground">
              ৳{(totalPipelineVolume / 1000).toFixed(0)}K
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[10px] text-muted-foreground">
            ৳{totalPipelineVolume.toLocaleString()} BDT closed / pending
          </CardContent>
        </Card>

        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-semibold text-primary flex items-center justify-between">
              <span>Total 15% Earned</span>
              <BadgePercent className="h-3.5 w-3.5 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold font-mono text-primary">
              ৳{totalCommissionEarned.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[10px] text-muted-foreground">
            15% share across all deals
          </CardContent>
        </Card>

        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>Available for Payout</span>
              <Wallet className="h-3.5 w-3.5 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              ৳{availablePayout.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
            Ready for bKash / Bank transfer
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-medium flex items-center justify-between">
              <span>Settled / Paid Out</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-muted-foreground">
              ৳{settledPayout.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[10px] text-muted-foreground">
            Historical disbursements
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="links" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted/60">
          <TabsTrigger value="links" className="text-xs py-2 gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            <span>Referral Links & Code</span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="text-xs py-2 gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            <span>15% Deal Calculator</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs py-2 gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>Referred Accounts ({deals.length})</span>
          </TabsTrigger>
          <TabsTrigger value="payouts" className="text-xs py-2 gap-1.5">
            <Landmark className="h-3.5 w-3.5" />
            <span>Payout & Remittance</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Referral Links & Code */}
        <TabsContent value="links" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Your Unique Referral Link</CardTitle>
                    <CardDescription className="text-xs">
                      Share this link with record labels, music aggregators, and artists looking to launch their own distribution platform.
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs">
                    Code: {referralCode}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Registration URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={referralUrl}
                      className="font-mono text-xs h-10 bg-muted/50"
                    />
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="shrink-0 h-10 font-semibold text-xs gap-1.5"
                    >
                      {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      {copiedLink ? "Copied" : "Copy Link"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground block">Partner Referral Code</span>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold font-mono tracking-wider text-foreground">{referralCode}</span>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={handleCopyCode}
                        className="h-7 text-xs font-semibold gap-1"
                      >
                        {copiedCode ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {copiedCode ? "Copied" : "Copy Code"}
                      </Button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground block">Commission Terms</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">15% of Selling Price</span>
                      <Badge variant="outline" className="text-[10px] font-mono">Min ৳60,000 BDT</Badge>
                    </div>
                  </div>
                </div>

                {/* Social Share Shortcuts */}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <Label className="text-xs font-semibold">1-Click Share to Channels</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => {
                        const text = `Launch your own Music Distribution & Aggregation Platform with dedicated AWS infrastructure and DDEX feeds! Use my partner link to get started: ${referralUrl}`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                      }}
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-500" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => {
                        const subject = "Exclusive Music Distribution Platform Onboarding";
                        const body = `Hi,\n\nI recommend launching your digital music distribution business with RoyalMotionIT's Distribution Aggregator platform. It comes with dedicated AWS compute, S3 Audio Vault, and DDEX delivery feeds.\n\nSign up with my referral link to get priority verification:\n${referralUrl}\n\nBest regards,\n${branding.name || user.firstName || "Partner"}`;
                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      }}
                    >
                      <Mail className="h-3.5 w-3.5 text-sky-500" />
                      Email Pitch
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => {
                        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent("Launch your music aggregator platform with dedicated infrastructure")}`, "_blank");
                      }}
                    >
                      <Globe className="h-3.5 w-3.5 text-blue-500" />
                      Telegram
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code and Quick Pitch */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-primary" />
                  In-Person Partner Pass
                </CardTitle>
                <CardDescription className="text-xs">
                  Scan to register immediately at music studios, events, and label meetings.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="p-3 bg-white rounded-xl shadow-inner border border-border/80">
                  {/* Visual QR Code placeholder with accurate SVG matrix */}
                  <div className="w-36 h-36 bg-foreground/5 rounded-lg flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    <QrCode className="w-28 h-28 text-foreground" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-foreground">{referralCode}</span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Point client cameras here to automatically bind them to your 15% commission ledger.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. 15% Deal Calculator */}
        <TabsContent value="calculator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      15% Selling Price Commission Calculator
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Simulate whatever deal price you negotiate with your distribution client.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs font-bold">
                    Strictly 15% Share
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price input slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="calculatorPrice" className="text-xs font-semibold">
                      Negotiated Account Selling Price (BDT)
                    </Label>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-foreground">৳</span>
                      <Input
                        id="calculatorPrice"
                        type="number"
                        min={60000}
                        step={5000}
                        value={dealPrice}
                        onChange={(e) => setDealPrice(Math.max(60000, Number(e.target.value) || 60000))}
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
                </div>

                {/* Earnings breakdown card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      Your 15% Referrer Commission
                    </span>
                    <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      ৳{calculatedCommission.toLocaleString()} <span className="text-sm font-sans font-medium text-foreground">BDT</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Disbursed immediately once the client pays their onboarding invoice.
                    </p>
                  </div>

                  <div className="space-y-1 sm:border-l sm:border-primary/20 sm:pl-4">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      Platform Infrastructure & Deployment (85%)
                    </span>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      ৳{calculatedPlatformShare.toLocaleString()} <span className="text-sm font-sans font-medium text-muted-foreground">BDT</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Covers AWS EC2, S3 Audio Vault, SES setup, Cloudflare DNS, and 24/7 PM2 monitoring.
                    </p>
                  </div>
                </div>

                {/* Benchmark deals table */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground block">Standard Reference Deal Tiers</span>
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase">
                        <tr>
                          <th className="p-2.5">Distributor Tier</th>
                          <th className="p-2.5">Selling Price</th>
                          <th className="p-2.5 text-emerald-600 dark:text-emerald-400">Your 15% Payout</th>
                          <th className="p-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono">
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-foreground">Baseline WhiteLabel Tier</td>
                          <td className="p-2.5 font-bold">৳60,000 BDT</td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">৳9,000 BDT</td>
                          <td className="p-2.5 text-right">
                            <Button size="xs" variant="ghost" onClick={() => setDealPrice(60000)} className="h-6 text-[10px]">
                              Apply
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-foreground">Pro Aggregator (Sub-Labels)</td>
                          <td className="p-2.5 font-bold">৳100,000 BDT</td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">৳15,000 BDT</td>
                          <td className="p-2.5 text-right">
                            <Button size="xs" variant="ghost" onClick={() => setDealPrice(100000)} className="h-6 text-[10px]">
                              Apply
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-foreground">Enterprise Multi-Catalog</td>
                          <td className="p-2.5 font-bold">৳150,000 BDT</td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">৳22,500 BDT</td>
                          <td className="p-2.5 text-right">
                            <Button size="xs" variant="ghost" onClick={() => setDealPrice(150000)} className="h-6 text-[10px]">
                              Apply
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-foreground">Unlimited Major Network</td>
                          <td className="p-2.5 font-bold">৳250,000 BDT</td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">৳37,500 BDT</td>
                          <td className="p-2.5 text-right">
                            <Button size="xs" variant="ghost" onClick={() => setDealPrice(250000)} className="h-6 text-[10px]">
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
            <Card className="border-border/60">
              <CardHeader>
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
                    To maintain high-quality infrastructure standards, every Distribution Aggregator account has a mandatory minimum baseline of ৳60,000 BDT.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block">2. No Ceiling / Uncapped</strong>
                  <p className="text-[11px]">
                    You can negotiate and sell at whatever price the client agrees to. If you sell an account for ৳200,000 BDT, your commission is ৳30,000 BDT.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block">3. Fast Settlement</strong>
                  <p className="text-[11px]">
                    Commissions become available for withdrawal immediately upon the client's verified subscription payment and are disbursed directly to your configured bKash or Bank Account.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block">4. No Server Management</strong>
                  <p className="text-[11px]">
                    Referrers are pure commercial partners and do not have to touch AWS, Cloudflare, SSH keys, or PM2.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. Referred Accounts & Pipeline Tracker */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">Referred Accounts &amp; Deal Pipeline</CardTitle>
                <CardDescription className="text-xs">
                  Track client progress, negotiated account values, and your earned 15% commission payouts.
                </CardDescription>
              </div>

              {/* Add Prospect Dialog */}
              <Dialog open={newDealOpen} onOpenChange={setNewDealOpen}>
                <Button
                  onClick={() => setNewDealOpen(true)}
                  size="sm"
                  className="font-semibold text-xs gap-1.5 self-start sm:self-auto"
                >
                  <PlusCircle className="h-4 w-4" />
                  Log Client Deal
                </Button>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">Log Prospective Distribution Client</DialogTitle>
                    <DialogDescription className="text-xs">
                      Register a prospective distribution aggregator client you are pitching to lock in attribution.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3.5 py-2">
                    <div className="space-y-1">
                      <Label htmlFor="clientName" className="text-xs font-semibold">Company / Brand Name</Label>
                      <Input
                        id="clientName"
                        placeholder="e.g. SoundWave Distribution"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="contactName" className="text-xs font-semibold">Contact Person Name</Label>
                      <Input
                        id="contactName"
                        placeholder="e.g. Ariful Islam"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="clientEmail" className="text-xs font-semibold">Contact Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        placeholder="ariful@soundwave.com"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="newDealPrice" className="text-xs font-semibold">
                        Agreed / Target Selling Price (BDT)
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-foreground">৳</span>
                        <Input
                          id="newDealPrice"
                          type="number"
                          min={60000}
                          step={5000}
                          value={newDealPrice}
                          onChange={(e) => setNewDealPrice(Math.max(60000, Number(e.target.value) || 60000))}
                          className="font-mono font-bold text-xs h-9"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Your 15% Share: ৳{Math.round((Math.max(60000, Number(newDealPrice) || 60000) * 0.15)).toLocaleString()} BDT
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setNewDealOpen(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddDeal} className="text-xs font-semibold">
                      Save Prospect
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase">
                    <tr>
                      <th className="p-3">Client / Company</th>
                      <th className="p-3">Registered</th>
                      <th className="p-3">Deal Stage</th>
                      <th className="p-3">Selling Price</th>
                      <th className="p-3 text-emerald-600 dark:text-emerald-400">15% Commission</th>
                      <th className="p-3">Payout Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono">
                    {deals.map((deal) => {
                      const isPending = deal.payoutStatus === "PENDING";
                      const isAvailable = deal.payoutStatus === "AVAILABLE";
                      const isSettled = deal.payoutStatus === "SETTLED";

                      return (
                        <tr key={deal.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-sans">
                            <div className="font-semibold text-foreground">{deal.clientName}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{deal.email}</div>
                          </td>
                          <td className="p-3 text-muted-foreground text-[11px]">{deal.createdAt}</td>
                          <td className="p-3 font-sans">
                            {deal.status === "ACTIVE" && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                Paid &amp; Active
                              </Badge>
                            )}
                            {deal.status === "CONTRACTED" && (
                              <Badge variant="outline" className="border-blue-500/40 text-blue-500 bg-blue-500/10 text-[10px] font-bold">
                                Contract Executed
                              </Badge>
                            )}
                            {deal.status === "UNDER_REVIEW" && (
                              <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px] font-bold">
                                In Review
                              </Badge>
                            )}
                            {deal.status === "PROSPECT" && (
                              <Badge variant="secondary" className="text-[10px] font-medium">
                                Prospect Lead
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 font-bold text-foreground">৳{deal.dealPriceBdt.toLocaleString()}</td>
                          <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                            ৳{deal.commissionBdt.toLocaleString()}
                          </td>
                          <td className="p-3 font-sans">
                            {isAvailable && (
                              <Badge className="bg-emerald-500 text-white text-[10px] font-bold">
                                Ready for Payout
                              </Badge>
                            )}
                            {isPending && (
                              <Badge variant="outline" className="text-muted-foreground text-[10px]">
                                Pending Deal Close
                              </Badge>
                            )}
                            {isSettled && (
                              <Badge variant="secondary" className="text-muted-foreground text-[10px]">
                                Disbursed
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Payout & Remittance Configuration */}
        <TabsContent value="payouts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-primary" />
                      Remittance &amp; Payout Settings
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Specify where you want your 15% commissions transferred upon deal closure.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    BDT &amp; Multi-Currency
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Select Preferred Remittance Channel</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "BKASH", name: "bKash (MFS)", icon: Smartphone },
                      { id: "NAGAD", name: "Nagad (MFS)", icon: Smartphone },
                      { id: "ROCKET", name: "Rocket (MFS)", icon: Smartphone },
                      { id: "BANK_TRANSFER", name: "Bank Transfer", icon: Landmark },
                    ].map((method) => {
                      const isSelected = payoutMethod === method.id;
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPayoutMethod(method.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary shadow-xs"
                              : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 mb-1" />
                          <span>{method.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account Details Form */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="payoutAccountName" className="text-xs font-semibold">
                      Account Holder Name
                    </Label>
                    <Input
                      id="payoutAccountName"
                      value={payoutAccountName}
                      onChange={(e) => setPayoutAccountName(e.target.value)}
                      placeholder="e.g. Md. Tanvir Hasan"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="payoutAccountNumber" className="text-xs font-semibold">
                      {payoutMethod === "BANK_TRANSFER"
                        ? "Bank Account Number"
                        : `${payoutMethod} Wallet Number`}
                    </Label>
                    <Input
                      id="payoutAccountNumber"
                      value={payoutAccountNumber}
                      onChange={(e) => setPayoutAccountNumber(e.target.value)}
                      placeholder={payoutMethod === "BANK_TRANSFER" ? "105.110.XXXX" : "017XXXXXXXX / 018XXXXXXXX"}
                      className="text-xs font-mono h-9"
                    />
                  </div>

                  {payoutMethod === "BANK_TRANSFER" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="bankName" className="text-xs font-semibold">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={payoutBankName}
                          onChange={(e) => setPayoutBankName(e.target.value)}
                          placeholder="e.g. Dutch-Bangla Bank"
                          className="text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="bankBranch" className="text-xs font-semibold">Branch Name</Label>
                        <Input
                          id="bankBranch"
                          value={payoutBankBranch}
                          onChange={(e) => setPayoutBankBranch(e.target.value)}
                          placeholder="e.g. Dhanmondi Branch"
                          className="text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="routingNumber" className="text-xs font-semibold">Routing No</Label>
                        <Input
                          id="routingNumber"
                          value={payoutBankRouting}
                          onChange={(e) => setPayoutBankRouting(e.target.value)}
                          placeholder="e.g. 090260..."
                          className="text-xs font-mono h-9"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={handleSavePayoutSettings}
                      disabled={isSavingPayout}
                      size="sm"
                      className="font-semibold text-xs h-9 gap-1.5"
                    >
                      {isSavingPayout ? "Saving Settings..." : "Save Remittance Preferences"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payout Security & SLAs */}
            <Card className="border-border/60">
              <CardHeader>
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
                    Same-day to next banking business day transfer via BEFTN/NPSB across all 60+ scheduled Bangladeshi banks.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block">International Wire / Wise</strong>
                  <p className="text-[11px]">
                    24–48 hours for international partners via Wise Business or SWIFT.
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
            Use these key value propositions when pitching Distribution Aggregator accounts to record labels and catalog owners.
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
                Every client gets their own dedicated AWS EC2 ARM64 server, S3 Audio Vault with Glacier lifecycle rules, verified SES email identities, and automated Cloudflare SSL.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <BadgePercent className="h-3.5 w-3.5 text-primary" />
                DDEX ERN 4.2 &amp; DSP Direct Delivery
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Full compliance with IFPI/GS1 standards, Spotify &amp; Apple Music direct delivery feeds, automated ISRC/UPC barcode pools, and multi-tenant sub-labels.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Anti-Fraud Streaming Shield
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Automated audio spectral QC (16/24-bit 44.1–96kHz WAV/FLAC) and artificial streaming velocity detection to protect client catalogs from DSP penalties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
