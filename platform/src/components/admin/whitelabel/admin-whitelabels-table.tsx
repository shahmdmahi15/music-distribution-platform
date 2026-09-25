"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Disc3,
  Eye,
  RefreshCw,
  Search,
  Globe,
  FileSignature,
  CreditCard,
  ShieldCheck,
  Building2,
  Music,
  DollarSign,
  Download,
  LayoutGrid,
  ListFilter,
  ArrowUpDown,
  ExternalLink,
  Copy,
  Check,
  Play,
  AlertTriangle,
  Server,
  Sparkles,
  Table as TableIcon,
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
import {
  WhiteLabel,
  WhiteLabelBusinessType,
  WhiteLabelStatus,
} from "@/types/whitelabel";
import { formatDate } from "@/lib/utils";
import { AdminWhiteLabelDetailsDialog } from "./admin-whitelabel-details-sheet";
import { adminUpdateWhiteLabelStatusAction } from "@/actions/admin/whitelabel/admin-update-whitelabel-status.action";
import { adminActivateWhiteLabelAction } from "@/actions/admin/whitelabel/admin-activate-whitelabel.action";

interface AdminWhiteLabelsTableProps {
  initialData: {
    items: WhiteLabel[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    counts: {
      all: number;
      pending: number;
      underReview: number;
      processing?: number;
      contracted?: number;
      paid?: number;
      active: number;
      rejected: number;
      suspended?: number;
    };
  };
}

const BUSINESS_TYPE_META: Record<
  string,
  { label: string; badgeClass: string }
> = {
  [WhiteLabelBusinessType.RECORD_LABEL]: {
    label: "Record Label",
    badgeClass:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  },
  [WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR]: {
    label: "Distributor / Aggregator",
    badgeClass:
      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  },
  [WhiteLabelBusinessType.MUSIC_PUBLISHER]: {
    label: "Music Publisher",
    badgeClass:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  [WhiteLabelBusinessType.REFERRER]: {
    label: "Referrer / Scout",
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
};

const LIFECYCLE_STEP_MAP: Record<string, number> = {
  [WhiteLabelStatus.PENDING]: 1,
  [WhiteLabelStatus.UNDER_REVIEW]: 2,
  [WhiteLabelStatus.PROCESSING]: 3,
  [WhiteLabelStatus.CONTRACTED]: 4,
  [WhiteLabelStatus.PAID]: 5,
  [WhiteLabelStatus.ACTIVE]: 6,
  [WhiteLabelStatus.SUSPENDED]: 6,
  [WhiteLabelStatus.REJECTED]: 0,
};

export function AdminWhiteLabelsTable({
  initialData,
}: AdminWhiteLabelsTableProps) {
  const router = useRouter();
  const [items, setItems] = useState<WhiteLabel[]>(initialData.items || []);
  const [counts, setCounts] = useState(
    initialData.counts || {
      all: 0,
      pending: 0,
      underReview: 0,
      processing: 0,
      contracted: 0,
      paid: 0,
      active: 0,
      rejected: 0,
      suspended: 0,
    },
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>("all");
  const [complianceFilter, setComplianceFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedWhiteLabel, setSelectedWhiteLabel] =
    useState<WhiteLabel | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [quickActionLoadingId, setQuickActionLoadingId] = useState<
    string | null
  >(null);

  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setItems(initialData.items || []);
    setCounts(
      initialData.counts || {
        all: 0,
        pending: 0,
        underReview: 0,
        processing: 0,
        contracted: 0,
        paid: 0,
        active: 0,
        rejected: 0,
        suspended: 0,
      },
    );
    if (selectedWhiteLabel) {
      const updated = (initialData.items || []).find(
        (x) => x.id === selectedWhiteLabel.id,
      );
      if (updated) setSelectedWhiteLabel(updated);
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("WhiteLabel ecosystem telemetry synchronized.");
    }, 500);
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied ${code} to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleQuickStatusAdvance = async (
    e: React.MouseEvent,
    wl: WhiteLabel,
    targetStatus: WhiteLabelStatus,
  ) => {
    e.stopPropagation();
    setQuickActionLoadingId(wl.id);
    try {
      if (targetStatus === WhiteLabelStatus.ACTIVE) {
        const res = await adminActivateWhiteLabelAction(wl.id);
        if (res.success) {
          toast.success(res.message);
          router.refresh();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await adminUpdateWhiteLabelStatusAction(wl.id, {
          status: targetStatus,
        });
        if (res.success) {
          toast.success(res.message);
          router.refresh();
        } else {
          toast.error(res.message);
        }
      }
    } catch {
      toast.error("Failed to advance application stage.");
    } finally {
      setQuickActionLoadingId(null);
    }
  };

  // Ecosystem Telemetry Aggregates
  const telemetry = useMemo(() => {
    let totalTracks = 0;
    let totalMonthlyDelivery = 0;
    let totalProjectedMonthlyRevenue = 0;
    let totalCollectedSubscriptionUsd = 0;
    let incorporatedCount = 0;
    let contractsCount = 0;

    for (const wl of items) {
      totalTracks += Number(wl.catalogTrackCount || 0);
      totalMonthlyDelivery += Number(wl.monthlyTrackDelivery || 0);
      totalProjectedMonthlyRevenue += Number(wl.monthlyRevenueUsd || 0);
      if (wl.isIncorporated) incorporatedCount++;
      if (wl.contractKey || (wl.documents && wl.documents.length > 0)) {
        contractsCount++;
      }
      const payments = wl.subscription?.payments || wl.payments || [];
      for (const p of payments) {
        if (p.status === "COMPLETED") {
          totalCollectedSubscriptionUsd += Number(p.amount || 0);
        }
      }
    }

    return {
      totalTracks,
      totalMonthlyDelivery,
      totalProjectedMonthlyRevenue,
      totalCollectedSubscriptionUsd,
      incorporatedCount,
      contractsCount,
    };
  }, [items]);

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (
        businessTypeFilter !== "all" &&
        item.businessType !== businessTypeFilter
      ) {
        return false;
      }
      if (complianceFilter === "ready_to_activate") {
        if (item.status !== WhiteLabelStatus.PAID) return false;
      } else if (complianceFilter === "contract_uploaded") {
        if (!item.contractKey) return false;
      } else if (complianceFilter === "incorporated") {
        if (!item.isIncorporated) return false;
      } else if (complianceFilter === "custom_infra") {
        if (!item.customDomain && !item.elasticIpv4) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchCode = item.code?.toLowerCase().includes(q);
        const matchSubdomain = item.subdomain?.toLowerCase().includes(q);
        const matchCustomDomain = item.customDomain?.toLowerCase().includes(q);
        const matchEmail = item.contactEmail?.toLowerCase().includes(q);
        const matchCountry = item.country?.toLowerCase().includes(q);
        const matchContact = `${item.contactFirstName} ${item.contactLastName}`
          .toLowerCase()
          .includes(q);
        return (
          matchName ||
          matchCode ||
          matchSubdomain ||
          matchCustomDomain ||
          matchEmail ||
          matchCountry ||
          matchContact
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortOrder === "catalog_desc") {
        return (b.catalogTrackCount || 0) - (a.catalogTrackCount || 0);
      }
      if (sortOrder === "revenue_desc") {
        return (
          Number(b.monthlyRevenueUsd || 0) - Number(a.monthlyRevenueUsd || 0)
        );
      }
      if (sortOrder === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [
    items,
    statusFilter,
    businessTypeFilter,
    complianceFilter,
    searchQuery,
    sortOrder,
  ]);

  const handleExportCsv = () => {
    if (filteredItems.length === 0) {
      toast.error("No records to export.");
      return;
    }

    const headers = [
      "Code",
      "Company Name",
      "Status",
      "Business Type",
      "Country",
      "Incorporated",
      "Subdomain",
      "Custom Domain",
      "Elastic IPv4",
      "Contact Name",
      "Contact Email",
      "Catalog Tracks",
      "Monthly Delivery",
      "Monthly Revenue (USD)",
      "Primary Genre / Focus",
      "Signup Model",
      "Contract Uploaded",
      "Submitted At",
    ];

    const rows = filteredItems.map((wl) => {
      const focus =
        wl.onboardingDetails?.primaryGenre ||
        wl.onboardingDetails?.ingestionProtocol ||
        wl.onboardingDetails?.primaryProAffiliation ||
        wl.onboardingDetails?.scoutNetworkCategory ||
        "Multi-Genre";
      return [
        wl.code,
        `"${(wl.name || "").replace(/"/g, '""')}"`,
        wl.status,
        wl.businessType,
        `"${wl.country || ""}"`,
        wl.isIncorporated ? "Yes" : "No",
        wl.subdomain ? `${wl.subdomain}.platform.royalmotionit.com` : "",
        wl.customDomain || "",
        wl.elasticIpv4 || "",
        `"${wl.contactFirstName} ${wl.contactLastName}"`,
        wl.contactEmail,
        wl.catalogTrackCount || 0,
        wl.monthlyTrackDelivery || 0,
        wl.monthlyRevenueUsd || 0,
        `"${focus}"`,
        wl.userSignupModel,
        wl.contractKey ? "Yes" : "No",
        wl.createdAt ? new Date(wl.createdAt).toISOString().split("T")[0] : "",
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `rmit-whitelabel-partners-${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredItems.length} WhiteLabel dossiers to CSV.`);
  };

  const statusBadges: Record<WhiteLabelStatus, string> = {
    [WhiteLabelStatus.PENDING]:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    [WhiteLabelStatus.UNDER_REVIEW]:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    [WhiteLabelStatus.PROCESSING]:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    [WhiteLabelStatus.CONTRACTED]:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    [WhiteLabelStatus.PAID]:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    [WhiteLabelStatus.ACTIVE]:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
    [WhiteLabelStatus.REJECTED]:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    [WhiteLabelStatus.SUSPENDED]:
      "bg-destructive/10 text-destructive border-destructive/30",
  };

  const processingCount =
    counts.processing ??
    items.filter((x) => x.status === WhiteLabelStatus.PROCESSING).length;
  const contractedCount =
    counts.contracted ??
    items.filter((x) => x.status === WhiteLabelStatus.CONTRACTED).length;
  const paidCount =
    counts.paid ??
    items.filter((x) => x.status === WhiteLabelStatus.PAID).length;
  const suspendedCount =
    counts.suspended ??
    items.filter((x) => x.status === WhiteLabelStatus.SUSPENDED).length;

  return (
    <div className="space-y-6">
      {/* 6-Card Executive KPI & Financial Telemetry Row */}
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
                <Disc3 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {counts.all}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>{telemetry.incorporatedCount} Incorporated</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Vetting & KYC Queue */}
        <Card
          onClick={() => setStatusFilter(WhiteLabelStatus.PENDING)}
          className={`glass-card cursor-pointer border-border/80 transition-all ${
            statusFilter === WhiteLabelStatus.PENDING ||
            statusFilter === WhiteLabelStatus.UNDER_REVIEW
              ? "ring-2 ring-amber-500/40 shadow-sm bg-amber-500/[0.03]"
              : "hover:border-border"
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Vetting Queue
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
              {counts.pending + counts.underReview}
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{counts.pending} Pending</span>
              <span>• {counts.underReview} In Review</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Contracting & Billing Pipeline */}
        <Card
          onClick={() => setStatusFilter(WhiteLabelStatus.PROCESSING)}
          className={`glass-card cursor-pointer border-border/80 transition-all ${
            statusFilter === WhiteLabelStatus.PROCESSING ||
            statusFilter === WhiteLabelStatus.CONTRACTED ||
            statusFilter === WhiteLabelStatus.PAID
              ? "ring-2 ring-purple-500/40 shadow-sm bg-purple-500/[0.03]"
              : "hover:border-border"
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Legal & Billing
              </span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <FileSignature className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
              {processingCount + contractedCount + paidCount}
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{contractedCount} Signed</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                • {paidCount} Paid
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Active Tenants */}
        <Card
          onClick={() => setStatusFilter(WhiteLabelStatus.ACTIVE)}
          className={`glass-card cursor-pointer border-border/80 transition-all ${
            statusFilter === WhiteLabelStatus.ACTIVE
              ? "ring-2 ring-emerald-500/40 shadow-sm bg-emerald-500/[0.03]"
              : "hover:border-border"
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Active Portals
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {counts.active}
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Live DNS</span>
              <span>• {suspendedCount} Suspended</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Ecosystem Catalog Volume */}
        <Card className="glass-card border-border/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Catalog Volume
              </span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Music className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {telemetry.totalTracks.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">
              +{telemetry.totalMonthlyDelivery.toLocaleString()} tracks / mo
              velocity
            </div>
          </CardContent>
        </Card>

        {/* KPI 6: Financial Ledger & GMV */}
        <Card className="glass-card border-border/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Subscription Rev
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              ${telemetry.totalCollectedSubscriptionUsd.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              Partner GMV: $
              {telemetry.totalProjectedMonthlyRevenue.toLocaleString()}/mo
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive 8-Stage Lifecycle Pipeline Funnel Bar */}
      <div className="p-3.5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Sequential Lifecycle Governance Funnel
          </span>
          <span className="text-[11px] text-muted-foreground">
            Click any stage to filter dossiers • Showing{" "}
            <strong className="text-foreground">{filteredItems.length}</strong>{" "}
            of <strong className="text-foreground">{items.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-1.5">
          {[
            {
              key: "all",
              label: "All Stages",
              count: counts.all,
              color: "border-primary/40 bg-primary/10 text-primary",
            },
            {
              key: WhiteLabelStatus.PENDING,
              label: "1. Pending",
              count: counts.pending,
              color:
                "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            },
            {
              key: WhiteLabelStatus.UNDER_REVIEW,
              label: "2. In Review",
              count: counts.underReview,
              color:
                "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
            },
            {
              key: WhiteLabelStatus.PROCESSING,
              label: "3. Processing",
              count: processingCount,
              color:
                "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
            },
            {
              key: WhiteLabelStatus.CONTRACTED,
              label: "4. Contracted",
              count: contractedCount,
              color:
                "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400",
            },
            {
              key: WhiteLabelStatus.PAID,
              label: "5. Paid",
              count: paidCount,
              color:
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            },
            {
              key: WhiteLabelStatus.ACTIVE,
              label: "6. Active Live",
              count: counts.active,
              color:
                "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            },
            {
              key: WhiteLabelStatus.SUSPENDED,
              label: "Suspended",
              count: suspendedCount,
              color:
                "border-destructive/40 bg-destructive/10 text-destructive",
            },
            {
              key: WhiteLabelStatus.REJECTED,
              label: "Declined",
              count: counts.rejected,
              color:
                "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
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
            placeholder="Search company, WL-code, subdomain, custom domain, representative, email, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-background"
          />
        </div>

        {/* Filter Selectors & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Business Type Filter */}
          <Select
            value={businessTypeFilter}
            onValueChange={(val) => setBusinessTypeFilter(val || "all")}
          >
            <SelectTrigger className="h-9 text-xs w-[175px] rounded-xl bg-background">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Business Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Business Models</SelectItem>
              <SelectItem value={WhiteLabelBusinessType.RECORD_LABEL}>
                Record Labels
              </SelectItem>
              <SelectItem value={WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR}>
                Distributors / Aggregators
              </SelectItem>
              <SelectItem value={WhiteLabelBusinessType.MUSIC_PUBLISHER}>
                Music Publishers
              </SelectItem>
              <SelectItem value={WhiteLabelBusinessType.REFERRER}>
                Referrers / Agencies
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Compliance / Readiness Filter */}
          <Select
            value={complianceFilter}
            onValueChange={(val) => setComplianceFilter(val || "all")}
          >
            <SelectTrigger className="h-9 text-xs w-[180px] rounded-xl bg-background">
              <ListFilter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Readiness Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Readiness States</SelectItem>
              <SelectItem value="ready_to_activate">
                Ready to Activate (PAID)
              </SelectItem>
              <SelectItem value="contract_uploaded">
                Signed Contract Uploaded
              </SelectItem>
              <SelectItem value="incorporated">
                Incorporated Legal Entity
              </SelectItem>
              <SelectItem value="custom_infra">
                Custom Domain / Elastic IP
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select
            value={sortOrder}
            onValueChange={(val) => setSortOrder(val || "newest")}
          >
            <SelectTrigger className="h-9 text-xs w-[170px] rounded-xl bg-background">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest Submissions</SelectItem>
              <SelectItem value="oldest">Oldest Submissions</SelectItem>
              <SelectItem value="catalog_desc">
                Largest Catalog Volume
              </SelectItem>
              <SelectItem value="revenue_desc">
                Highest Monthly Revenue
              </SelectItem>
              <SelectItem value="name_asc">Company Name (A–Z)</SelectItem>
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
              <Disc3 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No WhiteLabel partner dossiers match your filters
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try clearing your search query or switching the lifecycle stage
              filter above.
            </p>
            {(statusFilter !== "all" ||
              businessTypeFilter !== "all" ||
              complianceFilter !== "all" ||
              searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setBusinessTypeFilter("all");
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
              status: WhiteLabelStatus.PENDING,
              title: "1. Pending Vetting",
              accent: "border-t-4 border-t-amber-500",
            },
            {
              status: WhiteLabelStatus.UNDER_REVIEW,
              title: "2. Under Review",
              accent: "border-t-4 border-t-blue-500",
            },
            {
              status: WhiteLabelStatus.PROCESSING,
              title: "3. Processing",
              accent: "border-t-4 border-t-indigo-500",
            },
            {
              status: WhiteLabelStatus.CONTRACTED,
              title: "4. Contracted",
              accent: "border-t-4 border-t-purple-500",
            },
            {
              status: WhiteLabelStatus.PAID,
              title: "5. Paid (Ready)",
              accent: "border-t-4 border-t-emerald-500",
            },
            {
              status: WhiteLabelStatus.ACTIVE,
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
                  {colItems.map((wl) => (
                    <div
                      key={wl.id}
                      onClick={() => setSelectedWhiteLabel(wl)}
                      className="p-3 rounded-xl border border-border/70 bg-background hover:border-primary/50 hover:shadow-md transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                            style={{
                              background: `linear-gradient(135deg, ${wl.primaryColor || "#6366f1"}, ${wl.accentColor || "#ec4899"})`,
                            }}
                          >
                            {wl.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-foreground truncate">
                              {wl.name}
                            </p>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {wl.code}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 ${
                            BUSINESS_TYPE_META[wl.businessType]?.badgeClass ||
                            ""
                          }`}
                        >
                          {BUSINESS_TYPE_META[wl.businessType]?.label ||
                            wl.businessType}
                        </Badge>
                        {wl.subdomain && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-mono px-1.5 py-0"
                          >
                            {wl.subdomain}.rmit...
                          </Badge>
                        )}
                      </div>

                      <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>
                          {wl.catalogTrackCount.toLocaleString()} tracks
                        </span>
                        <span className="font-semibold text-foreground">
                          ${Number(wl.monthlyRevenueUsd || 0).toLocaleString()}
                          /mo
                        </span>
                      </div>
                    </div>
                  ))}
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
                    Partner Identity & Brand
                  </TableHead>
                  <TableHead className="font-bold">
                    Domain & Cloud Routing
                  </TableHead>
                  <TableHead className="font-bold">
                    Business Model & Focus
                  </TableHead>
                  <TableHead className="font-bold">
                    Decision Maker
                  </TableHead>
                  <TableHead className="font-bold">
                    Catalog & Revenue
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
                {filteredItems.map((wl) => {
                  const stepIdx = LIFECYCLE_STEP_MAP[wl.status] || 1;
                  const payments =
                    wl.subscription?.payments || wl.payments || [];
                  const hasCompletedPayment = payments.some(
                    (p) => p.status === "COMPLETED",
                  );
                  const focusLabel =
                    wl.onboardingDetails?.primaryGenre ||
                    wl.onboardingDetails?.ingestionProtocol?.replace(
                      /_/g,
                      " ",
                    ) ||
                    wl.onboardingDetails?.primaryProAffiliation ||
                    wl.onboardingDetails?.scoutNetworkCategory?.replace(
                      /_/g,
                      " ",
                    ) ||
                    "Multi-Genre / All Genres";

                  return (
                    <TableRow
                      key={wl.id}
                      onClick={() => setSelectedWhiteLabel(wl)}
                      className="cursor-pointer hover:bg-muted/50 transition-colors text-xs border-b border-border/40 group"
                    >
                      {/* 1. Partner Identity & Brand */}
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[210px]">
                          {wl.logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={wl.logoUrl}
                              alt={wl.name}
                              className="h-9 w-9 rounded-xl object-contain border border-border/60 bg-background p-1 shrink-0"
                            />
                          ) : (
                            <div
                              className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center text-white font-extrabold text-sm shadow-xs"
                              style={{
                                background: `linear-gradient(135deg, ${wl.primaryColor || "#6366f1"}, ${wl.accentColor || "#ec4899"})`,
                              }}
                            >
                              {wl.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {wl.name}
                              </span>
                              {wl.isIncorporated && (
                                <span
                                  title="Incorporated Legal Entity"
                                  className="text-emerald-500 shrink-0"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              {wl.code && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyCode(e, wl.code)}
                                  className="inline-flex items-center gap-1 font-mono px-1.5 py-0 rounded bg-muted/70 hover:bg-muted text-foreground font-semibold border border-border/60"
                                  title="Click to copy WL Code"
                                >
                                  {wl.code}
                                  {copiedCode === wl.code ? (
                                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-2.5 w-2.5 opacity-60" />
                                  )}
                                </button>
                              )}
                              {wl.country && <span>• {wl.country}</span>}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Domain & Cloud Routing */}
                      <TableCell>
                        <div className="space-y-1 min-w-[170px]">
                          {wl.subdomain ? (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3 text-primary shrink-0" />
                              <span className="font-mono text-[11px] font-semibold text-foreground truncate">
                                {wl.subdomain}.platform.royalmotionit.com
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              No subdomain set
                            </span>
                          )}

                          <div className="flex flex-wrap items-center gap-1">
                            {wl.customDomain && (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono px-1.5 py-0 border-blue-500/30 text-blue-600 dark:text-blue-400"
                              >
                                {wl.customDomain}
                              </Badge>
                            )}
                            {wl.elasticIpv4 ? (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 gap-1"
                              >
                                <Server className="h-2.5 w-2.5" />
                                {wl.elasticIpv4}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">
                                Cloudflare Managed Proxy
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Business Model & Focus */}
                      <TableCell>
                        <div className="space-y-1 min-w-[155px]">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold py-0 px-2 rounded-md ${
                              BUSINESS_TYPE_META[wl.businessType]?.badgeClass ||
                              ""
                            }`}
                          >
                            {BUSINESS_TYPE_META[wl.businessType]?.label ||
                              wl.businessType.replace(/_/g, " ")}
                          </Badge>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[165px]">
                            {focusLabel} • {wl.primaryCatalogLanguage || "EN"}
                          </div>
                        </div>
                      </TableCell>

                      {/* 4. Representative */}
                      <TableCell>
                        <div className="space-y-0.5 min-w-[150px]">
                          <p className="font-semibold text-foreground">
                            {wl.contactFirstName} {wl.contactLastName}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[160px]">
                            {wl.contactEmail}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Submitted {formatDate(wl.createdAt)}
                          </p>
                        </div>
                      </TableCell>

                      {/* 5. Catalog & Revenue */}
                      <TableCell>
                        <div className="space-y-0.5 text-xs min-w-[130px]">
                          <div className="font-bold text-foreground flex items-center gap-1">
                            <span>
                              {wl.catalogTrackCount.toLocaleString()} tracks
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            ${Number(wl.monthlyRevenueUsd || 0).toLocaleString()}{" "}
                            / mo
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            +{wl.monthlyTrackDelivery || 0}/mo •{" "}
                            {wl.artists?.length || 0} roster
                          </p>
                        </div>
                      </TableCell>

                      {/* 6. Lifecycle & Readiness */}
                      <TableCell>
                        <div className="space-y-1.5 min-w-[155px]">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2.5 py-0.5 font-bold capitalize inline-flex items-center gap-1.5 ${
                              (statusBadges as Record<string, string>)[
                                wl.status
                              ] || "border-border"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                wl.status === WhiteLabelStatus.ACTIVE ||
                                wl.status === WhiteLabelStatus.PAID
                                  ? "bg-emerald-500 animate-pulse"
                                  : wl.status === WhiteLabelStatus.PENDING
                                    ? "bg-amber-500"
                                    : wl.status ===
                                        WhiteLabelStatus.UNDER_REVIEW
                                      ? "bg-blue-500"
                                      : wl.status ===
                                          WhiteLabelStatus.PROCESSING
                                        ? "bg-indigo-500"
                                        : wl.status ===
                                            WhiteLabelStatus.CONTRACTED
                                          ? "bg-purple-500"
                                          : "bg-rose-500"
                              }`}
                            />
                            {String(wl.status).replace(/_/g, " ").toLowerCase()}
                          </Badge>

                          {/* 6-Step Progress Bar + Readiness Icons */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5, 6].map((s) => (
                                <div
                                  key={s}
                                  className={`h-1 w-3.5 rounded-full ${
                                    wl.status === WhiteLabelStatus.REJECTED
                                      ? "bg-rose-500/40"
                                      : s <= stepIdx
                                        ? "bg-primary"
                                        : "bg-muted"
                                  }`}
                                />
                              ))}
                            </div>

                            <div className="flex items-center gap-1">
                              {wl.contractKey && (
                                <span
                                  title="Signed Contract Uploaded"
                                  className="text-purple-500"
                                >
                                  <FileSignature className="h-3 w-3" />
                                </span>
                              )}
                              {hasCompletedPayment && (
                                <span
                                  title="Subscription Payment Verified"
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
                          {wl.status === WhiteLabelStatus.PENDING && (
                            <Button
                              size="sm"
                              disabled={quickActionLoadingId === wl.id}
                              onClick={(e) =>
                                handleQuickStatusAdvance(
                                  e,
                                  wl,
                                  WhiteLabelStatus.UNDER_REVIEW,
                                )
                              }
                              className="h-7 text-[11px] font-bold px-2.5 bg-blue-600 hover:bg-blue-500 text-white"
                            >
                              Begin Review
                            </Button>
                          )}

                          {wl.status === WhiteLabelStatus.UNDER_REVIEW && (
                            <Button
                              size="sm"
                              disabled={quickActionLoadingId === wl.id}
                              onClick={(e) =>
                                handleQuickStatusAdvance(
                                  e,
                                  wl,
                                  WhiteLabelStatus.PROCESSING,
                                )
                              }
                              className="h-7 text-[11px] font-bold px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                              Mark Processing
                            </Button>
                          )}

                          {wl.status === WhiteLabelStatus.PAID && (
                            <Button
                              size="sm"
                              disabled={quickActionLoadingId === wl.id}
                              onClick={(e) =>
                                handleQuickStatusAdvance(
                                  e,
                                  wl,
                                  WhiteLabelStatus.ACTIVE,
                                )
                              }
                              className="h-7 text-[11px] font-bold px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              Activate DNS
                            </Button>
                          )}

                          {wl.status === WhiteLabelStatus.ACTIVE &&
                            wl.subdomain && (
                              <a
                                href={`https://${wl.customDomain || `${wl.subdomain}.platform.royalmotionit.com`}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Open Live WhiteLabel Tenant Portal"
                                className="h-7 px-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 inline-flex items-center gap-1 text-[11px] font-semibold"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Live
                              </a>
                            )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWhiteLabel(wl)}
                            className="h-7 text-xs font-semibold gap-1.5 border-border/80 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5 text-primary" />
                            Inspect
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Inspector Details Command Center Dialog */}
      {selectedWhiteLabel && (
        <AdminWhiteLabelDetailsDialog
          whiteLabel={selectedWhiteLabel}
          open={Boolean(selectedWhiteLabel)}
          onOpenChange={(open) => {
            if (!open) setSelectedWhiteLabel(null);
          }}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
