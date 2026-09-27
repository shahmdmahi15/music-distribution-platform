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
  Filter,
  Trash2,
  ArrowRight,
  Info,
  Layers,
  Send,
  MessageSquare,
  Lock,
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
import { Referrer } from "@/types/referrer";
import { clientUpdateBrandingAction } from "@/actions/client/whitelabel/client-update-branding.action";
import { clientApplyReferrerAction } from "@/actions/client/referrer/client-apply-referrer.action";

export interface ReferredDeal {
  id: string;
  clientName: string;
  contactName: string;
  email: string;
  phone?: string;
  status: "ACTIVE" | "CONTRACTED" | "UNDER_REVIEW" | "PROSPECT";
  dealPriceBdt: number;
  commissionBdt: number;
  payoutStatus: "SETTLED" | "AVAILABLE" | "PENDING";
  createdAt: string;
  notes?: string;
}

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

export function ReferrerDashboardView({ branding, referrer, user }: ReferrerDashboardViewProps) {
  const onboardingDetails =
    (referrer?.onboardingDetails as Record<string, any>) ||
    (branding?.onboardingDetails as Record<string, any>) ||
    {};

  const referralCode =
    referrer?.referralCode ||
    onboardingDetails.referralNetworkCode ||
    onboardingDetails.scoutAffiliateCodePrefix ||
    branding?.code ||
    `REF-${user.id.slice(-6).toUpperCase()}`;

  // Referral URL
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://platform.royalmotionit.com";
  const referralUrl = `${origin}/auth/register?ref=${referralCode}`;

  // Deal simulation state
  const [dealPrice, setDealPrice] = useState<number>(
    referrer?.dealBenchmarkBdt ||
      (onboardingDetails.simulatedDealPriceBdt &&
      Number(onboardingDetails.simulatedDealPriceBdt) >= 60000
        ? Number(onboardingDetails.simulatedDealPriceBdt)
        : 60000),
  );

  // Remittance configuration state
  const [payoutMethod, setPayoutMethod] = useState<string>(
    referrer?.payoutMethod || onboardingDetails.payoutMethod || "BANK_TRANSFER",
  );
  const [payoutBankName, setPayoutBankName] = useState<string>(
    referrer?.bankName || onboardingDetails.payoutBankName || "",
  );
  const [payoutAccountName, setPayoutAccountName] = useState<string>(
    referrer?.accountName ||
      onboardingDetails.payoutAccountName ||
      onboardingDetails.payoutAccountHolderName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim(),
  );
  const [payoutAccountNumber, setPayoutAccountNumber] = useState<string>(
    referrer?.accountNumber || onboardingDetails.payoutAccountNumber || "",
  );
  const [payoutWalletNumber, setPayoutWalletNumber] = useState<string>(
    referrer?.walletNumber ||
      onboardingDetails.payoutWalletNumber ||
      (referrer?.payoutMethod !== "BANK_TRANSFER" && referrer?.accountNumber
        ? referrer.accountNumber
        : "") ||
      (onboardingDetails.payoutMethod !== "BANK_TRANSFER"
        ? onboardingDetails.payoutAccountNumber || ""
        : ""),
  );
  const [payoutBranchDistrict, setPayoutBranchDistrict] = useState<string>(
    referrer?.branchDistrict || onboardingDetails.payoutBranchDistrict || "",
  );
  const [payoutBankBranch, setPayoutBankBranch] = useState<string>(
    referrer?.branchName || onboardingDetails.payoutBankBranch || "",
  );
  const [payoutBankRouting, setPayoutBankRouting] = useState<string>(
    referrer?.routingNumber || onboardingDetails.payoutBankRouting || "",
  );
  const [payoutSwiftCode, setPayoutSwiftCode] = useState<string>(
    referrer?.swiftCode || onboardingDetails.payoutSwiftCode || "",
  );
  const [isSavingPayout, setIsSavingPayout] = useState(false);

  // Copy state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSnapshot, setCopiedSnapshot] = useState(false);

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);

  // Pipeline deals state
  const [deals, setDeals] = useState<ReferredDeal[]>(
    onboardingDetails.referredDeals || [
      {
        id: "deal-1",
        clientName: "Velocity Music Group",
        contactName: "Tanvir Hasan",
        email: "tanvir@velocitymusic.com",
        phone: "+880 1712-345678",
        status: "ACTIVE",
        dealPriceBdt: 80000,
        commissionBdt: 12000,
        payoutStatus: "AVAILABLE",
        createdAt: "2026-09-18",
        notes: "Onboarded with 3 sub-labels and DDEX feeds.",
      },
      {
        id: "deal-2",
        clientName: "Dhaka Sound Distribution",
        contactName: "Rahim Chowdhury",
        email: "r.chowdhury@dhakasound.io",
        phone: "+880 1819-234567",
        status: "CONTRACTED",
        dealPriceBdt: 60000,
        commissionBdt: 9000,
        payoutStatus: "PENDING",
        createdAt: "2026-09-22",
        notes: "Contract executed. Awaiting subscription settlement.",
      },
      {
        id: "deal-3",
        clientName: "Bengal Beat Aggregators",
        contactName: "Nusrat Jahan",
        email: "nusrat@bengalbeat.org",
        phone: "+880 1911-889900",
        status: "UNDER_REVIEW",
        dealPriceBdt: 100000,
        commissionBdt: 15000,
        payoutStatus: "PENDING",
        createdAt: "2026-09-25",
        notes: "Under technical architecture demonstration.",
      },
    ],
  );

  // Pipeline filters
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<string>("ALL");

  // Filtered pipeline deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch =
        !pipelineSearch.trim() ||
        deal.clientName.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
        deal.contactName.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
        deal.email.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
        (deal.phone && deal.phone.includes(pipelineSearch));

      const matchesStatus =
        pipelineStatusFilter === "ALL" || deal.status === pipelineStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deals, pipelineSearch, pipelineStatusFilter]);

  // New Deal Form State
  const [newClientName, setNewClientName] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newDealStatus, setNewDealStatus] = useState<
    "PROSPECT" | "UNDER_REVIEW" | "CONTRACTED"
  >("PROSPECT");
  const [newDealPrice, setNewDealPrice] = useState(60000);
  const [newDealNotes, setNewDealNotes] = useState("");

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

  // Copy helpers
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
      phone: newClientPhone.trim() || undefined,
      status: newDealStatus,
      dealPriceBdt: cleanPrice,
      commissionBdt: comm,
      payoutStatus: "PENDING",
      createdAt: new Date().toISOString().split("T")[0],
      notes: newDealNotes.trim() || undefined,
    };

    const updatedDeals = [newDealItem, ...deals];
    setDeals(updatedDeals);
    setNewDealOpen(false);
    setNewClientName("");
    setNewContactName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewDealStatus("PROSPECT");
    setNewDealPrice(60000);
    setNewDealNotes("");
    toast.success(
      `Prospect registered! Anticipated 15% partner commission: ৳${comm.toLocaleString()} BDT`,
    );
  };

  // Delete deal
  const handleDeleteDeal = (id: string, name: string) => {
    setDeals(deals.filter((d) => d.id !== id));
    toast.success(`Removed "${name}" from pipeline.`);
  };

  // Save payout settings
  const handleSavePayoutSettings = async () => {
    if (payoutMethod === "BANK_TRANSFER") {
      if (!payoutBankName.trim()) {
        toast.error("Please enter the Bank Name.");
        return;
      }
      if (!payoutAccountName.trim()) {
        toast.error("Please enter the Account Name.");
        return;
      }
      if (!payoutAccountNumber.trim()) {
        toast.error("Please enter the Bank Account Number.");
        return;
      }
      if (!payoutBranchDistrict.trim()) {
        toast.error("Please enter the Branch District.");
        return;
      }
      if (!payoutBankBranch.trim()) {
        toast.error("Please enter the Branch Name.");
        return;
      }
      if (!payoutBankRouting.trim()) {
        toast.error("Please enter the Routing Number.");
        return;
      }
      if (!payoutSwiftCode.trim()) {
        toast.error("Please enter the Swift Code.");
        return;
      }
    } else {
      const activeWallet = (payoutWalletNumber || payoutAccountNumber).trim();
      if (!activeWallet) {
        toast.error(`Please enter your ${payoutMethod} Wallet Mobile Number.`);
        return;
      }
    }

    setIsSavingPayout(true);
    try {
      const activeWallet = (payoutWalletNumber || payoutAccountNumber).trim();
      let res;
      if (referrer) {
        res = await clientApplyReferrerAction({
          name: referrer.name,
          referralCode: referrer.referralCode,
          contactFirstName: referrer.contactFirstName,
          contactLastName: referrer.contactLastName,
          contactEmail: referrer.contactEmail,
          country: referrer.country || "Bangladesh",
          contactPhone: referrer.contactPhone || undefined,
          contactWhatsApp:
            referrer.contactWhatsApp || referrer.contactPhone || "Not provided",
          contactLinkedIn: referrer.contactLinkedIn || undefined,
          payoutMethod,
          bankName: payoutMethod === "BANK_TRANSFER" ? payoutBankName.trim() : undefined,
          accountName: payoutMethod === "BANK_TRANSFER" ? payoutAccountName.trim() : undefined,
          accountNumber: payoutMethod === "BANK_TRANSFER" ? payoutAccountNumber.trim() : undefined,
          branchDistrict: payoutMethod === "BANK_TRANSFER" ? payoutBranchDistrict.trim() : undefined,
          branchName: payoutMethod === "BANK_TRANSFER" ? payoutBankBranch.trim() : undefined,
          routingNumber: payoutMethod === "BANK_TRANSFER" ? payoutBankRouting.trim() : undefined,
          swiftCode: payoutMethod === "BANK_TRANSFER" ? payoutSwiftCode.trim().toUpperCase() : undefined,
          walletNumber: payoutMethod !== "BANK_TRANSFER" ? activeWallet : undefined,
          onboardingDetails: {
            ...onboardingDetails,
            simulatedDealPriceBdt: dealPrice,
            referredDeals: deals,
          },
        });
      } else {
        res = await clientUpdateBrandingAction({
          onboardingDetails: {
            ...onboardingDetails,
            payoutMethod,
            payoutBankName: payoutBankName.trim(),
            payoutAccountName: payoutAccountName.trim(),
            payoutAccountHolderName: payoutAccountName.trim(),
            payoutAccountNumber:
              payoutMethod === "BANK_TRANSFER" ? payoutAccountNumber.trim() : activeWallet,
            payoutWalletNumber:
              payoutMethod !== "BANK_TRANSFER"
                ? activeWallet
                : onboardingDetails.payoutWalletNumber || "",
            payoutBranchDistrict: payoutBranchDistrict.trim(),
            payoutBankBranch: payoutBankBranch.trim(),
            payoutBankRouting: payoutBankRouting.trim(),
            payoutSwiftCode: payoutSwiftCode.trim().toUpperCase(),
            simulatedDealPriceBdt: dealPrice,
            referredDeals: deals,
          },
        });
      }

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
    <div className="w-full space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Authorized Referrer Partner
              </Badge>
              <Badge
                variant="secondary"
                className="font-mono text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 gap-1"
              >
                <BadgePercent className="h-3 w-3" />
                15% Guaranteed Commission
              </Badge>
              <Badge variant="outline" className="text-[11px] font-mono">
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

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={() => setIsShareModalOpen(true)}
              size="sm"
              className="font-semibold text-xs h-9 gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Share2 className="h-4 w-4" />
              <span>Share &amp; Promote</span>
            </Button>
            <Button
              onClick={() => setNewDealOpen(true)}
              variant="outline"
              size="sm"
              className="font-semibold text-xs h-9 gap-1.5 border-border/80 shadow-xs"
            >
              <PlusCircle className="h-4 w-4 text-emerald-500" />
              <span>Log Client Deal</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Top 5 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
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

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
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

        <Card className="border-amber-500/40 bg-amber-500/5 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>Total 15% Earned</span>
              <BadgePercent className="h-3.5 w-3.5 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              ৳{totalCommissionEarned.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[10px] text-muted-foreground">
            15% share across all deals
          </CardContent>
        </Card>

        <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-xs">
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

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
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
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="links" className="text-xs py-2.5 gap-1.5 font-medium">
            <Share2 className="h-3.5 w-3.5" />
            <span>Referral Links &amp; Tools</span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="text-xs py-2.5 gap-1.5 font-medium">
            <Calculator className="h-3.5 w-3.5" />
            <span>15% Deal Calculator</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs py-2.5 gap-1.5 font-medium">
            <Users className="h-3.5 w-3.5" />
            <span>Pipeline Deals ({deals.length})</span>
          </TabsTrigger>
          <TabsTrigger value="payouts" className="text-xs py-2.5 gap-1.5 font-medium">
            <Landmark className="h-3.5 w-3.5" />
            <span>Payout &amp; Remittance</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* 1. Referral Links & Code */}
        {/* ========================================================================= */}
        <TabsContent value="links" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Your Dedicated Partner Referral Link
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Share this link with record labels, music aggregators, and artists looking to
                      launch their own distribution platform.
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs self-start sm:self-center">
                    Code: {referralCode}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Attribution Registration URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={referralUrl}
                      className="font-mono text-xs h-10 bg-muted/50 selection:bg-primary/20"
                    />
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="shrink-0 h-10 font-semibold text-xs gap-1.5"
                    >
                      {copiedLink ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedLink ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                      title="Test URL in new window"
                      onClick={() => window.open(referralUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Partner Referral Code
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold font-mono tracking-wider text-foreground">
                        {referralCode}
                      </span>
                      <Button
                        size="xs"
                        variant="ghost"
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

                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Commercial Terms
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        15% of Selling Price
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Min ৳60,000 BDT
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 1-Click Fast Actions */}
                <div className="pt-3 border-t border-border/40 space-y-2">
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
                      className="text-xs h-8 gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
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
                      className="text-xs h-8 gap-1.5 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
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
                      className="text-xs h-8 gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
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
                      className="text-xs h-8 gap-1.5 ml-auto"
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
            <Card className="border-border/80 shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-primary" />
                  In-Person Partner Pass
                </CardTitle>
                <CardDescription className="text-xs">
                  Scan immediately at music studios, events, and label meetings.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4 text-center pb-6">
                <div className="p-3.5 bg-white dark:bg-card rounded-2xl shadow-inner border border-border/80">
                  <div className="w-36 h-36 bg-foreground/5 rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    <QrCode className="w-28 h-28 text-foreground" />
                  </div>
                </div>
                <div className="space-y-1 max-w-[220px]">
                  <span className="text-xs font-mono font-bold text-foreground">
                    Code: {referralCode}
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Point client cameras here to automatically bind them to your 15% commission
                    ledger.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  className="text-xs gap-1.5"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share2 className="h-3 w-3" />
                  View Partner Pass Modal
                </Button>
              </CardContent>
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
                    Track client progress, negotiated account values, and your earned 15% commission payouts.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
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
                    placeholder="Search client, representative..."
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

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {["ALL", "ACTIVE", "CONTRACTED", "UNDER_REVIEW", "PROSPECT"].map((status) => (
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
                        ? `All (${deals.length})`
                        : status === "ACTIVE"
                        ? "Active"
                        : status === "CONTRACTED"
                        ? "Contracted"
                        : status === "UNDER_REVIEW"
                        ? "In Review"
                        : "Prospects"}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase">
                    <tr>
                      <th className="p-3">Client / Organization</th>
                      <th className="p-3">Contact Person</th>
                      <th className="p-3">Logged Date</th>
                      <th className="p-3">Deal Stage</th>
                      <th className="p-3">Selling Price</th>
                      <th className="p-3 text-emerald-600 dark:text-emerald-400">15% Bounty</th>
                      <th className="p-3">Payout Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono">
                    {filteredDeals.length > 0 ? (
                      filteredDeals.map((deal) => {
                        const isPending = deal.payoutStatus === "PENDING";
                        const isAvailable = deal.payoutStatus === "AVAILABLE";
                        const isSettled = deal.payoutStatus === "SETTLED";

                        return (
                          <tr key={deal.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-sans">
                              <div className="font-semibold text-foreground">{deal.clientName}</div>
                              <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                                <span>{deal.email}</span>
                                {deal.phone && (
                                  <>
                                    <span>•</span>
                                    <span>{deal.phone}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-sans text-muted-foreground">
                              {deal.contactName}
                            </td>
                            <td className="p-3 text-muted-foreground text-[11px]">{deal.createdAt}</td>
                            <td className="p-3 font-sans">
                              {deal.status === "ACTIVE" && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                  Paid &amp; Active
                                </Badge>
                              )}
                              {deal.status === "CONTRACTED" && (
                                <Badge
                                  variant="outline"
                                  className="border-blue-500/40 text-blue-500 bg-blue-500/10 text-[10px] font-bold"
                                >
                                  Contract Executed
                                </Badge>
                              )}
                              {deal.status === "UNDER_REVIEW" && (
                                <Badge
                                  variant="outline"
                                  className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px] font-bold"
                                >
                                  In Review
                                </Badge>
                              )}
                              {deal.status === "PROSPECT" && (
                                <Badge variant="secondary" className="text-[10px] font-medium">
                                  Prospect Lead
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 font-bold text-foreground">
                              ৳{deal.dealPriceBdt.toLocaleString()}
                            </td>
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
                                  Pending Close
                                </Badge>
                              )}
                              {isSettled && (
                                <Badge variant="secondary" className="text-muted-foreground text-[10px]">
                                  Disbursed
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-right font-sans">
                              <div className="flex items-center justify-end gap-1">
                                {deal.phone && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10"
                                    title="Open WhatsApp Chat"
                                    onClick={() => {
                                      const cleanPhone = deal.phone!.replace(/[^0-9]/g, "");
                                      window.open(`https://wa.me/${cleanPhone}`, "_blank");
                                    }}
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  title="Copy Email"
                                  onClick={() => {
                                    navigator.clipboard.writeText(deal.email);
                                    toast.success(`Copied ${deal.email}`);
                                  }}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  title="Remove Deal"
                                  onClick={() => handleDeleteDeal(deal.id, deal.clientName)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground font-sans">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Users className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-xs font-semibold">No pipeline deals match your filter.</p>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                setPipelineSearch("");
                                setPipelineStatusFilter("ALL");
                              }}
                              className="text-xs h-7"
                            >
                              Reset Filters
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 4. Payout & Remittance Configuration */}
        {/* ========================================================================= */}
        <TabsContent value="payouts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-primary" />
                      Remittance &amp; Payout Settings
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Specify where you want your 15% commissions transferred upon deal closure.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs self-start sm:self-center">
                    BDT &amp; Multi-Currency
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Active Remittance Snapshot Card */}
                {(payoutAccountNumber || payoutWalletNumber || referrer?.accountNumber) && (
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Active Remittance Channel Configured</span>
                      </div>
                      <p className="text-xs font-mono text-foreground font-semibold">
                        {payoutMethod === "BANK_TRANSFER"
                          ? `${payoutBankName || "Bank"} • A/C ${payoutAccountNumber} (${payoutAccountName})`
                          : `${payoutMethod} Wallet • ${payoutWalletNumber || payoutAccountNumber}`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-xs h-7 gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 self-start sm:self-auto"
                      onClick={() => {
                        const info =
                          payoutMethod === "BANK_TRANSFER"
                            ? `${payoutBankName} | A/C: ${payoutAccountNumber} | ${payoutAccountName}`
                            : `${payoutMethod}: ${payoutWalletNumber || payoutAccountNumber}`;
                        navigator.clipboard.writeText(info);
                        setCopiedSnapshot(true);
                        toast.success("Remittance snapshot copied!");
                        setTimeout(() => setCopiedSnapshot(false), 2000);
                      }}
                    >
                      {copiedSnapshot ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedSnapshot ? "Copied" : "Copy Snapshot"}</span>
                    </Button>
                  </div>
                )}

                {/* Channel Selector */}
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
                <div className="space-y-4 pt-1">
                  {payoutMethod === "BANK_TRANSFER" ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="payoutBankName"
                            className="text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Bank Name</span>
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="payoutBankName"
                            value={payoutBankName}
                            onChange={(e) => setPayoutBankName(e.target.value)}
                            placeholder="e.g. Dutch-Bangla Bank"
                            className="text-xs h-9"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="payoutAccountName"
                            className="text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Account Name</span>
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="payoutAccountName"
                            value={payoutAccountName}
                            onChange={(e) => setPayoutAccountName(e.target.value)}
                            placeholder="e.g. Shah Md. Mahi"
                            className="text-xs h-9"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="payoutAccountNumber"
                            className="text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Account Number</span>
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="payoutAccountNumber"
                            value={payoutAccountNumber}
                            onChange={(e) => setPayoutAccountNumber(e.target.value.trim())}
                            placeholder="e.g. 2050XXXXXXXXXXXXX"
                            className="text-xs font-mono h-9"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="payoutBranchDistrict"
                            className="text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Branch District</span>
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="payoutBranchDistrict"
                            value={payoutBranchDistrict}
                            onChange={(e) => setPayoutBranchDistrict(e.target.value)}
                            placeholder="e.g. Dhaka"
                            className="text-xs h-9"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="payoutBankBranch"
                            className="text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Branch Name</span>
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="payoutBankBranch"
                            value={payoutBankBranch}
                            onChange={(e) => setPayoutBankBranch(e.target.value)}
                            placeholder="e.g. Dhanmondi Branch"
                            className="text-xs h-9"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="payoutBankRouting"
                            className="text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Routing Number</span>
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="payoutBankRouting"
                            value={payoutBankRouting}
                            onChange={(e) => setPayoutBankRouting(e.target.value.trim())}
                            placeholder="e.g. 090260123"
                            className="text-xs font-mono h-9"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="payoutSwiftCode"
                            className="text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Swift Code</span>
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="payoutSwiftCode"
                            value={payoutSwiftCode}
                            onChange={(e) => setPayoutSwiftCode(e.target.value.toUpperCase().trim())}
                            placeholder="e.g. DBBLBDDH"
                            className="text-xs font-mono uppercase h-9"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 max-w-md">
                      <Label
                        htmlFor="payoutWalletNumber"
                        className="text-xs font-semibold flex items-center gap-1"
                      >
                        <span>
                          {payoutMethod === "NAGAD"
                            ? "Nagad Wallet Number"
                            : payoutMethod === "ROCKET"
                            ? "Rocket Wallet Number"
                            : "bKash Wallet Number"}
                        </span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="payoutWalletNumber"
                        value={payoutWalletNumber || payoutAccountNumber}
                        onChange={(e) => {
                          setPayoutWalletNumber(e.target.value.trim());
                          setPayoutAccountNumber(e.target.value.trim());
                        }}
                        placeholder="e.g. 017XXXXXXXX / 018XXXXXXXX"
                        className="text-xs font-mono h-9"
                      />
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
                <Label htmlFor="clientEmail" className="text-xs font-semibold flex items-center gap-1">
                  <span>Contact Email</span>
                  <span className="text-destructive">*</span>
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
                  value={newDealStatus}
                  onValueChange={(val) => {
                    if (val === "PROSPECT" || val === "UNDER_REVIEW" || val === "CONTRACTED") {
                      setNewDealStatus(val);
                    }
                  }}
                >
                  <SelectTrigger className="text-xs h-9 w-full">
                    <SelectValue />
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
                  ৳{Math.round(newDealPrice * 0.15).toLocaleString()}{" "}
                  <span className="text-xs font-sans font-medium text-foreground">BDT</span>
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Platform Cloud Share (85%)
                </span>
                <div className="text-sm font-bold font-mono text-foreground">
                  ৳{Math.round(newDealPrice * 0.85).toLocaleString()} BDT
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
              onClick={handleAddDeal}
              className="text-xs h-9 font-semibold gap-1.5 bg-primary text-primary-foreground"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Register Deal in Pipeline</span>
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
                Referral attribution operates on a 30-day tracking window. Once the client registers, their organization is permanently mapped to your Partner Ledger for automatic 15% bounty disbursements.
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
    </div>
  );
}
