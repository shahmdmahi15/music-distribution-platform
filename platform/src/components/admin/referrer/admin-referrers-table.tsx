"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Search,
  FileSignature,
  CreditCard,
  Building2,
  DollarSign,
  HeartHandshake,
  Landmark,
  Wallet,
  Coins,
  Percent,
  Copy,
  Check,
  Filter,
  X,
  ArrowUpDown,
  MessageSquare,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Download,
  Sparkles,
  Play,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Referrer, ReferrerStatus } from "@/types/referrer";
import { formatDate } from "@/lib/utils";
import { AdminReferrerDetailsDialog } from "./admin-referrer-details-dialog";
import { adminGetReferrersAction } from "@/actions/admin/referrer/admin-get-referrers.action";
import { adminUpdateReferrerStatusAction } from "@/actions/admin/referrer/admin-update-referrer-status.action";

interface AdminReferrersTableProps {
  initialData: {
    items: Referrer[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    counts: {
      total: number;
      pending: number;
      underReview: number;
      processing?: number;
      contracted?: number;
      paid?: number;
      active: number;
      suspended: number;
      rejected: number;
    };
  };
}

const LIFECYCLE_STEP_MAP: Record<string, number> = {
  [ReferrerStatus.PENDING]: 1,
  [ReferrerStatus.UNDER_REVIEW]: 2,
  [ReferrerStatus.PROCESSING]: 3,
  [ReferrerStatus.CONTRACTED]: 4,
  [ReferrerStatus.PAID]: 5,
  [ReferrerStatus.ACTIVE]: 6,
  [ReferrerStatus.SUSPENDED]: 6,
  [ReferrerStatus.REJECTED]: 0,
};

const STATUS_BADGES: Record<ReferrerStatus, string> = {
  [ReferrerStatus.PENDING]:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  [ReferrerStatus.UNDER_REVIEW]:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  [ReferrerStatus.PROCESSING]:
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  [ReferrerStatus.CONTRACTED]:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  [ReferrerStatus.PAID]:
    "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
  [ReferrerStatus.ACTIVE]:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  [ReferrerStatus.SUSPENDED]:
    "bg-destructive/10 text-destructive border-destructive/30",
  [ReferrerStatus.REJECTED]:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

export function AdminReferrersTable({ initialData }: AdminReferrersTableProps) {
  const router = useRouter();
  const [items, setItems] = useState<Referrer[]>(initialData.items || []);
  const [counts, setCounts] = useState(
    initialData.counts || {
      total: 0,
      pending: 0,
      underReview: 0,
      processing: 0,
      contracted: 0,
      paid: 0,
      active: 0,
      suspended: 0,
      rejected: 0,
    },
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payoutMethodFilter, setPayoutMethodFilter] = useState<string>("all");
  const [complianceFilter, setComplianceFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [quickActionLoadingId, setQuickActionLoadingId] = useState<string | null>(null);

  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setItems(initialData.items || []);
    setCounts(
      initialData.counts || {
        total: 0,
        pending: 0,
        underReview: 0,
        processing: 0,
        contracted: 0,
        paid: 0,
        active: 0,
        suspended: 0,
        rejected: 0,
      },
    );
  }

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await adminGetReferrersAction({
        limit: 100,
        status: statusFilter === "all" ? undefined : statusFilter,
        payoutMethod: payoutMethodFilter === "all" ? undefined : payoutMethodFilter,
        search: searchQuery.trim() || undefined,
      });

      if (res.success) {
        setItems(res.items);
        setCounts(res.counts);

        if (selectedReferrer) {
          const updated = res.items.find((r) => r.id === selectedReferrer.id);
          if (updated) setSelectedReferrer(updated);
        }
      }
    } catch {
      toast.error("Failed to refresh referrers.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickStatusAdvance = async (
    e: React.MouseEvent,
    ref: Referrer,
    targetStatus: ReferrerStatus,
  ) => {
    e.stopPropagation();
    setQuickActionLoadingId(ref.id);
    try {
      const res = await adminUpdateReferrerStatusAction(ref.id, {
        status: targetStatus,
      });
      if (res.success) {
        toast.success(res.message);
        handleRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to advance referrer status.");
    } finally {
      setQuickActionLoadingId(null);
    }
  };

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (
        payoutMethodFilter !== "all" &&
        item.payoutMethod !== payoutMethodFilter
      ) {
        return false;
      }
      if (complianceFilter === "ready_to_activate") {
        if (item.status !== ReferrerStatus.PAID) return false;
      } else if (complianceFilter === "contract_uploaded") {
        if (!item.contractKey) return false;
      } else if (complianceFilter === "incorporated") {
        if (!item.isIncorporated) return false;
      } else if (complianceFilter === "bank_verified") {
        if (!item.bankName && !item.walletNumber) return false;
      } else if (complianceFilter === "has_deals") {
        if (!item.deals || item.deals.length === 0) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchCode = item.code?.toLowerCase().includes(q);
        const matchRefCode = item.referralCode?.toLowerCase().includes(q);
        const matchContact = `${item.contactFirstName} ${item.contactLastName}`
          .toLowerCase()
          .includes(q);
        const matchEmail = item.contactEmail?.toLowerCase().includes(q);
        const matchPhone =
          (item.contactPhone && item.contactPhone.toLowerCase().includes(q)) ||
          (item.contactWhatsApp && item.contactWhatsApp.toLowerCase().includes(q));
        const matchCountry = item.country?.toLowerCase().includes(q);
        const matchBank =
          (item.bankName && item.bankName.toLowerCase().includes(q)) ||
          (item.accountNumber && item.accountNumber.includes(q)) ||
          (item.walletNumber && item.walletNumber.includes(q));

        return (
          matchName ||
          matchCode ||
          matchRefCode ||
          matchContact ||
          matchEmail ||
          matchPhone ||
          matchCountry ||
          matchBank
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOrder === "deals_desc") {
        return (b.deals?.length || 0) - (a.deals?.length || 0);
      }
      if (sortOrder === "bounty_desc") {
        const sumA = a.deals?.reduce((acc, d) => acc + (d.referrerBountyBdt || 0), 0) || 0;
        const sumB = b.deals?.reduce((acc, d) => acc + (d.referrerBountyBdt || 0), 0) || 0;
        return sumB - sumA;
      }
      if (sortOrder === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, statusFilter, payoutMethodFilter, complianceFilter, searchQuery, sortOrder]);

  const handleExportCsv = () => {
    if (filteredItems.length === 0) {
      toast.error("No records to export.");
      return;
    }

    const headers = [
      "Code",
      "Partner Name",
      "Status",
      "Referral Code",
      "Country",
      "Incorporated",
      "Contact Name",
      "Contact Email",
      "WhatsApp / Phone",
      "Payout Method",
      "Bank / MFS Provider",
      "Account / Wallet Number",
      "Commission Rate (%)",
      "Closed Deals Count",
      "Total Bounty (BDT)",
      "Contract Uploaded",
      "Submitted At",
    ];

    const rows = filteredItems.map((ref) => {
      const dealsCount = ref.deals?.length || 0;
      const totalBounty =
        ref.deals?.reduce((sum, d) => sum + (d.referrerBountyBdt || 0), 0) || 0;
      const provider =
        ref.payoutMethod === "BANK_TRANSFER"
          ? ref.bankName || "Bank"
          : ref.payoutMethod || "";
      const accNumber =
        ref.payoutMethod === "BANK_TRANSFER"
          ? ref.accountNumber || ""
          : ref.walletNumber || "";

      return [
        ref.code,
        `"${(ref.name || "").replace(/"/g, '""')}"`,
        ref.status,
        ref.referralCode,
        `"${ref.country || "Bangladesh"}"`,
        ref.isIncorporated ? "Yes" : "No",
        `"${ref.contactFirstName} ${ref.contactLastName}"`,
        ref.contactEmail,
        `"${ref.contactWhatsApp || ref.contactPhone || ""}"`,
        ref.payoutMethod || "BANK_TRANSFER",
        `"${provider}"`,
        `"${accNumber}"`,
        `${ref.commissionRate || 15}%`,
        dealsCount,
        totalBounty,
        ref.contractKey ? "Yes" : "No",
        ref.createdAt ? new Date(ref.createdAt).toISOString().split("T")[0] : "",
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `rmit-referrer-partners-${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredItems.length} referrer dossiers to CSV.`);
  };

  const openDetails = (ref: Referrer) => {
    setSelectedReferrer(ref);
    setIsDetailsOpen(true);
  };

  const processingCount =
    counts.processing ??
    items.filter((x) => x.status === ReferrerStatus.PROCESSING).length;
  const contractedCount =
    counts.contracted ??
    items.filter((x) => x.status === ReferrerStatus.CONTRACTED).length;
  const paidCount =
    counts.paid ??
    items.filter((x) => x.status === ReferrerStatus.PAID).length;
  const suspendedCount =
    counts.suspended ??
    items.filter((x) => x.status === ReferrerStatus.SUSPENDED).length;

  return (
    <div className="space-y-6">
      {/* 6-Card Executive KPI & Network Telemetry Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Ecosystem */}
        <Card
          onClick={() => setStatusFilter("all")}
          className={`glass-card cursor-pointer border-border/80 transition-all ${
            statusFilter === "all"
              ? "ring-2 ring-primary/40 shadow-sm bg-primary/[0.03]"
              : "hover:border-border"
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Dossiers
              </span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <HeartHandshake className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {counts.total}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              All scout & agency accounts
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Pending Vetting */}
        <Card
          onClick={() => setStatusFilter(ReferrerStatus.PENDING)}
          className={`glass-card cursor-pointer border-border/80 transition-all ${
            statusFilter === ReferrerStatus.PENDING
              ? "ring-2 ring-amber-500/40 shadow-sm bg-amber-500/[0.03]"
              : "hover:border-border"
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                1. Pending Vetting
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {counts.pending}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Stage 1 • Unreviewed queue
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Under Review */}
        <Card
          onClick={() => setStatusFilter(ReferrerStatus.UNDER_REVIEW)}
          className={`glass-card cursor-pointer border-border/80 transition-all ${
            statusFilter === ReferrerStatus.UNDER_REVIEW
              ? "ring-2 ring-blue-500/40 shadow-sm bg-blue-500/[0.03]"
              : "hover:border-border"
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                2. Under Review
              </span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {counts.underReview}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Stage 2 • KYB assessment
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Processing */}
        <Card
          onClick={() => setStatusFilter(ReferrerStatus.PROCESSING)}
          className={`glass-card cursor-pointer border-border/80 transition-all ${
            statusFilter === ReferrerStatus.PROCESSING
              ? "ring-2 ring-indigo-500/40 shadow-sm bg-indigo-500/[0.03]"
              : "hover:border-border"
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                3. In Processing
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {processingCount}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Stage 3 • Contract drafting
            </p>
          </CardContent>
        </Card>

        {/* KPI 5: Contracted */}
        <Card
          onClick={() => setStatusFilter(ReferrerStatus.CONTRACTED)}
          className={`glass-card cursor-pointer border-border/80 transition-all ${
            statusFilter === ReferrerStatus.CONTRACTED
              ? "ring-2 ring-purple-500/40 shadow-sm bg-purple-500/[0.03]"
              : "hover:border-border"
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                4. Contracted
              </span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <FileSignature className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {contractedCount}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Stage 4 • Signed S3 PDF
            </p>
          </CardContent>
        </Card>

        {/* KPI 6: Commercial Paid (Ready) */}
        <Card
          onClick={() => setStatusFilter(ReferrerStatus.PAID)}
          className={`glass-card cursor-pointer border-border/80 transition-all ${
            statusFilter === ReferrerStatus.PAID
              ? "ring-2 ring-emerald-500/40 shadow-sm bg-emerald-500/[0.03]"
              : "hover:border-border"
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                5. Commercial Paid
              </span>
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {paidCount}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Stage 5 • Ready to activate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive 6-Stage Lifecycle Progress Bar & Pill Filters */}
      <div className="p-3.5 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span>Sequential Referrer Lifecycle Filter</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {filteredItems.length} matching dossiers
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            {
              key: "all",
              label: "All Referrers",
              count: counts.total,
              color: "border-primary/40 bg-primary/10 text-primary",
            },
            {
              key: ReferrerStatus.PENDING,
              label: "1. Pending",
              count: counts.pending,
              color: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            },
            {
              key: ReferrerStatus.UNDER_REVIEW,
              label: "2. Under Review",
              count: counts.underReview,
              color: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
            },
            {
              key: ReferrerStatus.PROCESSING,
              label: "3. Processing",
              count: processingCount,
              color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
            },
            {
              key: ReferrerStatus.CONTRACTED,
              label: "4. Contracted",
              count: contractedCount,
              color: "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400",
            },
            {
              key: ReferrerStatus.PAID,
              label: "5. Paid (Ready)",
              count: paidCount,
              color: "border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400",
            },
            {
              key: ReferrerStatus.ACTIVE,
              label: "6. Active Live",
              count: counts.active,
              color: "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            },
            {
              key: ReferrerStatus.SUSPENDED,
              label: "Suspended",
              count: suspendedCount,
              color: "border-destructive/40 bg-destructive/10 text-destructive",
            },
          ].map((stage) => {
            const isActive = statusFilter === stage.key;
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => setStatusFilter(stage.key)}
                className={`px-2.5 py-2 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 ${
                  isActive
                    ? `${stage.color} ring-2 ring-primary/30 font-bold shadow-xs`
                    : "border-border/60 bg-background/60 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <span className="text-[11px] truncate">{stage.label}</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono px-1.5 py-0 h-4 shrink-0"
                >
                  {stage.count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Dimensional Filter, Sort, Export & View Mode Toolbar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-card/40 p-3 rounded-2xl border border-border/70">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search partner, code, referral code, representative, email, phone, bank, or wallet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs rounded-xl bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Selectors & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Remittance Payout Method Filter */}
          <Select
            items={{
              all: "All Remittance",
              BANK_TRANSFER: "Bank Wire / Transfer",
              BKASH: "bKash (MFS)",
              NAGAD: "Nagad (MFS)",
              ROCKET: "Rocket (MFS)",
            }}
            value={payoutMethodFilter}
            onValueChange={(val) => setPayoutMethodFilter(val || "all")}
          >
            <SelectTrigger className="h-9 text-xs w-[165px] rounded-xl bg-background">
              <Landmark className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Payout Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Remittance</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Wire / Transfer</SelectItem>
              <SelectItem value="BKASH">bKash (MFS)</SelectItem>
              <SelectItem value="NAGAD">Nagad (MFS)</SelectItem>
              <SelectItem value="ROCKET">Rocket (MFS)</SelectItem>
            </SelectContent>
          </Select>

          {/* Compliance / Readiness Filter */}
          <Select
            items={{
              all: "All Readiness States",
              ready_to_activate: "Ready to Activate (PAID)",
              contract_uploaded: "Signed Contract Uploaded",
              incorporated: "Incorporated Legal Entity",
              bank_verified: "Remittance Account Set",
              has_deals: "Active with Closed Deals",
            }}
            value={complianceFilter}
            onValueChange={(val) => setComplianceFilter(val || "all")}
          >
            <SelectTrigger className="h-9 text-xs w-[175px] rounded-xl bg-background">
              <ListFilter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Readiness Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Readiness States</SelectItem>
              <SelectItem value="ready_to_activate">Ready to Activate (PAID)</SelectItem>
              <SelectItem value="contract_uploaded">Signed Contract Uploaded</SelectItem>
              <SelectItem value="incorporated">Incorporated Legal Entity</SelectItem>
              <SelectItem value="bank_verified">Remittance Account Set</SelectItem>
              <SelectItem value="has_deals">Active with Closed Deals</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select
            items={{
              newest: "Newest Submissions",
              oldest: "Oldest Submissions",
              deals_desc: "Most Deals Closed",
              bounty_desc: "Highest Bounty Generated",
              name_asc: "Partner Name (A–Z)",
            }}
            value={sortOrder}
            onValueChange={(val) => setSortOrder(val || "newest")}
          >
            <SelectTrigger className="h-9 text-xs w-[165px] rounded-xl bg-background">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest Submissions</SelectItem>
              <SelectItem value="oldest">Oldest Submissions</SelectItem>
              <SelectItem value="deals_desc">Most Deals Closed</SelectItem>
              <SelectItem value="bounty_desc">Highest Bounty Generated</SelectItem>
              <SelectItem value="name_asc">Partner Name (A–Z)</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle (Table vs Kanban Board) */}
          <div className="flex items-center rounded-xl border border-border/80 bg-background p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Enterprise Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === "board"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Pipeline Board View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </button>
          </div>

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-9 text-xs gap-1.5 rounded-xl bg-background"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 text-xs gap-1.5 rounded-xl bg-background"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Sync
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <Card className="shadow-sm border-dashed border-border/60">
          <CardContent className="p-12 text-center space-y-3">
            <div className="p-3.5 rounded-full bg-muted/60 text-muted-foreground mx-auto w-fit">
              <HeartHandshake className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No referrer partner dossiers match your filters
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try clearing your search query or switching the lifecycle stage
              filter above.
            </p>
            {(statusFilter !== "all" ||
              payoutMethodFilter !== "all" ||
              complianceFilter !== "all" ||
              searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setPayoutMethodFilter("all");
                  setComplianceFilter("all");
                  setSearchQuery("");
                }}
                className="text-xs mt-2"
              >
                Reset All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "board" ? (
        /* PIPELINE KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-2">
          {[
            {
              status: ReferrerStatus.PENDING,
              title: "1. Pending Vetting",
              accent: "border-t-4 border-t-amber-500",
            },
            {
              status: ReferrerStatus.UNDER_REVIEW,
              title: "2. Under Review",
              accent: "border-t-4 border-t-blue-500",
            },
            {
              status: ReferrerStatus.PROCESSING,
              title: "3. Processing",
              accent: "border-t-4 border-t-indigo-500",
            },
            {
              status: ReferrerStatus.CONTRACTED,
              title: "4. Contracted",
              accent: "border-t-4 border-t-purple-500",
            },
            {
              status: ReferrerStatus.PAID,
              title: "5. Paid (Ready)",
              accent: "border-t-4 border-t-teal-500",
            },
            {
              status: ReferrerStatus.ACTIVE,
              title: "6. Active Live",
              accent: "border-t-4 border-t-emerald-600",
            },
          ].map((col) => {
            const colItems = filteredItems.filter(
              (item) => item.status === col.status,
            );
            return (
              <div
                key={col.status}
                className={`rounded-2xl border border-border/80 bg-card/50 p-3 space-y-3 flex flex-col min-h-[420px] ${col.accent}`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <span className="font-bold text-xs text-foreground">
                    {col.title}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-mono px-1.5 py-0"
                  >
                    {colItems.length}
                  </Badge>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colItems.map((ref) => {
                    const dealsCount = ref.deals?.length || 0;
                    const totalBounty =
                      ref.deals?.reduce((sum, d) => sum + (d.referrerBountyBdt || 0), 0) || 0;

                    return (
                      <div
                        key={ref.id}
                        onClick={() => openDetails(ref)}
                        className="p-3 rounded-xl border border-border/70 bg-background hover:border-primary/50 hover:shadow-md transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-2xs bg-gradient-to-br from-amber-500 to-indigo-600">
                              {ref.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">
                                {ref.name}
                              </p>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {ref.code}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] font-bold">
                            <span>{ref.referralCode}</span>
                          </div>
                          {ref.payoutMethod && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-mono px-1.5 py-0 border-border/80"
                            >
                              {ref.payoutMethod === "BANK_TRANSFER"
                                ? "Bank"
                                : ref.payoutMethod}
                            </Badge>
                          )}
                        </div>

                        <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                            {ref.commissionRate || 15}% Flat Cut
                          </span>
                          <span className="font-semibold text-foreground">
                            {dealsCount} deals (৳{totalBounty.toLocaleString()})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {colItems.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-border/50 rounded-xl">
                      No dossiers in stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ENTERPRISE DATA TABLE VIEW */
        <div className="rounded-2xl border border-border/80 overflow-hidden shadow-sm bg-card/60 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-[10px] uppercase tracking-wider border-b border-border/80">
                  <TableHead className="font-bold">
                    Partner Identity & Agency
                  </TableHead>
                  <TableHead className="font-bold">
                    Attribution Referral Code
                  </TableHead>
                  <TableHead className="font-bold">
                    Decision Maker & Contact
                  </TableHead>
                  <TableHead className="font-bold">
                    Remittance & Financials
                  </TableHead>
                  <TableHead className="font-bold">
                    Commission & Telemetry
                  </TableHead>
                  <TableHead className="font-bold">
                    Lifecycle & Readiness
                  </TableHead>
                  <TableHead className="text-right font-bold">
                    Governance Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((ref) => {
                  const stepIdx = LIFECYCLE_STEP_MAP[ref.status] || 1;
                  const dealsCount = ref.deals?.length || 0;
                  const totalBounty =
                    ref.deals?.reduce((sum, d) => sum + (d.referrerBountyBdt || 0), 0) || 0;

                  return (
                    <TableRow
                      key={ref.id}
                      onClick={() => openDetails(ref)}
                      className="cursor-pointer hover:bg-muted/50 transition-colors text-xs border-b border-border/40 group"
                    >
                      {/* 1. Partner Identity & Brand */}
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center text-white font-extrabold text-sm shadow-xs bg-gradient-to-br from-amber-500 to-indigo-600">
                            {ref.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {ref.name}
                              </span>
                              {ref.isIncorporated && (
                                <span
                                  title="Incorporated Legal Entity"
                                  className="text-emerald-500 shrink-0"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              {ref.code && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(ref.code, `code-${ref.id}`, e)}
                                  className="inline-flex items-center gap-1 font-mono px-1.5 py-0 rounded bg-muted/70 hover:bg-muted text-foreground font-semibold border border-border/60"
                                  title="Click to copy Code"
                                >
                                  {ref.code}
                                  {copiedKey === `code-${ref.id}` ? (
                                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-2.5 w-2.5 opacity-60" />
                                  )}
                                </button>
                              )}
                              <span>• {ref.country || "Bangladesh"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Referral Code & Attribution */}
                      <TableCell>
                        <div className="min-w-[140px]">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/25 text-primary font-mono text-xs font-bold shadow-2xs">
                            <span>{ref.referralCode}</span>
                            <button
                              onClick={(e) => handleCopy(ref.referralCode, `ref-${ref.id}`, e)}
                              className="hover:text-foreground opacity-70 hover:opacity-100 transition-opacity"
                              title="Copy referral code"
                            >
                              {copiedKey === `ref-${ref.id}` ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Decision Maker & Contact */}
                      <TableCell>
                        <div className="space-y-1 text-xs min-w-[180px]">
                          <span className="font-semibold text-foreground block">
                            {ref.contactFirstName} {ref.contactLastName}
                          </span>
                          <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[160px]">
                            {ref.contactEmail}
                          </p>
                          {(() => {
                            const wa = ref.contactWhatsApp || ref.contactPhone || "";
                            const cleanWa = wa.replace(/[^0-9]/g, "");
                            if (!cleanWa) return null;
                            return (
                              <a
                                href={`https://wa.me/${cleanWa}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="h-2.5 w-2.5" />
                                <span>{wa}</span>
                              </a>
                            );
                          })()}
                        </div>
                      </TableCell>

                      {/* 4. Remittance & Financials */}
                      <TableCell>
                        <div className="space-y-0.5 text-xs min-w-[140px]">
                          <div className="flex items-center gap-1.5">
                            {ref.payoutMethod === "BANK_TRANSFER" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-emerald-500/40 text-emerald-600 bg-emerald-500/10 gap-1 font-mono"
                              >
                                <Landmark className="h-3 w-3" />
                                Bank Wire
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-purple-500/40 text-purple-600 bg-purple-500/10 gap-1 font-mono"
                              >
                                <Wallet className="h-3 w-3" />
                                {ref.payoutMethod || "MFS"}
                              </Badge>
                            )}
                          </div>

                          {ref.payoutMethod === "BANK_TRANSFER" ? (
                            <div className="text-[10px] text-muted-foreground font-mono">
                              <span className="font-semibold text-foreground/90 block truncate max-w-[150px]">
                                {ref.bankName || "Bank not set"}
                              </span>
                              {ref.accountNumber && (
                                <span className="text-[9px]">Acc: ••••{ref.accountNumber.slice(-4)}</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground font-mono">
                              <span className="font-semibold text-foreground/90 block">
                                {ref.walletNumber || "Wallet not set"}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 5. Commission & Telemetry */}
                      <TableCell>
                        <div className="space-y-0.5 text-xs min-w-[130px]">
                          <div className="font-bold text-foreground flex items-center gap-1">
                            <Percent className="h-3 w-3 text-amber-500" />
                            <span>{ref.commissionRate || 15}% Flat Cut</span>
                          </div>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            ৳{totalBounty.toLocaleString()} BDT
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {dealsCount} closed deals logged
                          </p>
                        </div>
                      </TableCell>

                      {/* 6. Lifecycle & Readiness */}
                      <TableCell>
                        <div className="space-y-1.5 min-w-[155px]">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2.5 py-0.5 font-bold capitalize inline-flex items-center gap-1.5 ${
                              STATUS_BADGES[ref.status] || "border-border"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                ref.status === ReferrerStatus.ACTIVE ||
                                ref.status === ReferrerStatus.PAID
                                  ? "bg-emerald-500 animate-pulse"
                                  : ref.status === ReferrerStatus.PENDING
                                    ? "bg-amber-500"
                                    : ref.status === ReferrerStatus.UNDER_REVIEW
                                      ? "bg-blue-500"
                                      : ref.status === ReferrerStatus.PROCESSING
                                        ? "bg-indigo-500"
                                        : ref.status === ReferrerStatus.CONTRACTED
                                          ? "bg-purple-500"
                                          : "bg-rose-500"
                              }`}
                            />
                            {String(ref.status).replace(/_/g, " ").toLowerCase()}
                          </Badge>

                          {/* 6-Step Progress Bar + Readiness Icons */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5, 6].map((s) => (
                                <div
                                  key={s}
                                  className={`h-1 w-3.5 rounded-full ${
                                    ref.status === ReferrerStatus.REJECTED
                                      ? "bg-rose-500/40"
                                      : s <= stepIdx
                                        ? "bg-primary"
                                        : "bg-muted"
                                  }`}
                                />
                              ))}
                            </div>

                            <div className="flex items-center gap-1">
                              {ref.contractKey && (
                                <span
                                  title="Signed Contract Uploaded"
                                  className="text-purple-500"
                                >
                                  <FileSignature className="h-3 w-3" />
                                </span>
                              )}
                              {(ref.bankName || ref.walletNumber) && (
                                <span
                                  title="Remittance Details Set"
                                  className="text-emerald-500"
                                >
                                  <CreditCard className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 7. Governance Actions */}
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ref.status === ReferrerStatus.PENDING && (
                            <Button
                              size="sm"
                              disabled={quickActionLoadingId === ref.id}
                              onClick={(e) =>
                                handleQuickStatusAdvance(
                                  e,
                                  ref,
                                  ReferrerStatus.UNDER_REVIEW,
                                )
                              }
                              className="h-7 text-[11px] font-bold px-2.5 bg-blue-600 hover:bg-blue-500 text-white"
                            >
                              Begin Review
                            </Button>
                          )}

                          {ref.status === ReferrerStatus.UNDER_REVIEW && (
                            <Button
                              size="sm"
                              disabled={quickActionLoadingId === ref.id}
                              onClick={(e) =>
                                handleQuickStatusAdvance(
                                  e,
                                  ref,
                                  ReferrerStatus.PROCESSING,
                                )
                              }
                              className="h-7 text-[11px] font-bold px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                              Mark Processing
                            </Button>
                          )}

                          {ref.status === ReferrerStatus.PAID && (
                            <Button
                              size="sm"
                              disabled={quickActionLoadingId === ref.id}
                              onClick={(e) =>
                                handleQuickStatusAdvance(
                                  e,
                                  ref,
                                  ReferrerStatus.ACTIVE,
                                )
                              }
                              className="h-7 text-[11px] font-bold px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              Activate
                            </Button>
                          )}

                          {ref.status === ReferrerStatus.ACTIVE && (
                            <div className="h-7 px-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 text-[11px] font-semibold">
                              <CheckCircle2 className="h-3 w-3" />
                              Live
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetails(ref)}
                            className="h-7 text-xs font-semibold gap-1.5 border-border/80 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all shadow-2xs"
                          >
                            <Eye className="h-3 w-3" />
                            Manage
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Table Bottom Status Bar */}
          <div className="p-3 px-4 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing <strong className="text-foreground">{filteredItems.length}</strong> of{" "}
              <strong className="text-foreground">{counts.total}</strong> registered referrer partners
            </span>
            {(statusFilter !== "all" ||
              payoutMethodFilter !== "all" ||
              complianceFilter !== "all" ||
              searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPayoutMethodFilter("all");
                  setComplianceFilter("all");
                  setSearchQuery("");
                }}
                className="text-primary hover:underline text-xs"
              >
                Reset active filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <AdminReferrerDetailsDialog
        referrer={selectedReferrer}
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) setSelectedReferrer(null);
        }}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
