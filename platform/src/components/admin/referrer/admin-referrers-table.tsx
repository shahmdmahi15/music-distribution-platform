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

export function AdminReferrersTable({ initialData }: AdminReferrersTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "deals" | "name">("newest");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
        payoutMethod: selectedPayoutMethod === "ALL" ? undefined : selectedPayoutMethod,
        search: search.trim() || undefined,
      });

      if (res.success) {
        setData({
          items: res.items,
          pagination: res.pagination,
          counts: res.counts,
        });

        // Also refresh selected referrer if open
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

  // Aggregated deal metrics across all referrers
  const { totalClosedDeals, totalBountiesGenerated } = useMemo(() => {
    let dealsCount = 0;
    let bountySum = 0;
    data.items.forEach((item) => {
      if (item.deals) {
        dealsCount += item.deals.length;
        item.deals.forEach((d) => {
          bountySum += d.referrerBountyBdt || 0;
        });
      }
    });
    return { totalClosedDeals: dealsCount, totalBountiesGenerated: bountySum };
  }, [data.items]);

  const filteredItems = useMemo(() => {
    const filtered = data.items.filter((item) => {
      // Status Filter
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) {
        return false;
      }
      // Payout Method Filter
      if (
        selectedPayoutMethod !== "ALL" &&
        item.payoutMethod !== selectedPayoutMethod
      ) {
        return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesRefCode = item.referralCode.toLowerCase().includes(q);
        const matchesContact =
          `${item.contactFirstName} ${item.contactLastName}`.toLowerCase().includes(q) ||
          item.contactEmail.toLowerCase().includes(q) ||
          (item.contactWhatsApp && item.contactWhatsApp.toLowerCase().includes(q));
        const matchesCountry = item.country && item.country.toLowerCase().includes(q);
        const matchesBank =
          (item.bankName && item.bankName.toLowerCase().includes(q)) ||
          (item.accountNumber && item.accountNumber.includes(q)) ||
          (item.walletNumber && item.walletNumber.includes(q));

        return matchesName || matchesCode || matchesRefCode || matchesContact || matchesCountry || matchesBank;
      }
      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "deals") {
        return (b.deals?.length || 0) - (a.deals?.length || 0);
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [data.items, selectedStatus, selectedPayoutMethod, search, sortBy]);

  const hasActiveFilters = search.trim() !== "" || selectedStatus !== "ALL" || selectedPayoutMethod !== "ALL" || sortBy !== "newest";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedStatus("ALL");
    setSelectedPayoutMethod("ALL");
    setSortBy("newest");
  };

  const openDetails = (referrer: Referrer) => {
    setSelectedReferrer(referrer);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 4-KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/70 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground font-medium">
                Total Registered Referrers
              </span>
              <p className="text-2xl font-black text-foreground">
                {data.counts.total}
              </p>
              <span className="text-[10px] text-muted-foreground block">
                All-time scout & agency accounts
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Active Approved Partners
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {data.counts.active}
              </p>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block font-mono">
                Authorized for 15% commissions
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Pending Vetting Queue
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {data.counts.pending + data.counts.underReview}
              </p>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block font-mono">
                {data.counts.pending} pending • {data.counts.underReview} in review
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground font-medium">
                Closed Deals & Bounties
              </span>
              <p className="text-2xl font-black text-primary">
                ৳{totalBountiesGenerated.toLocaleString()} BDT
              </p>
              <span className="text-[10px] text-muted-foreground block font-mono">
                {totalClosedDeals} deals logged across network
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Coins className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter, Search & Sorting Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agency, code, representative, email, bank, wallet..."
              className="pl-9 pr-8 h-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Select
            value={selectedStatus}
            onValueChange={(val) => setSelectedStatus(val || "ALL")}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value={ReferrerStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={ReferrerStatus.UNDER_REVIEW}>Under Review</SelectItem>
              <SelectItem value={ReferrerStatus.PROCESSING}>Processing</SelectItem>
              <SelectItem value={ReferrerStatus.CONTRACTED}>Contracted</SelectItem>
              <SelectItem value={ReferrerStatus.PAID}>Commercial Paid</SelectItem>
              <SelectItem value={ReferrerStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={ReferrerStatus.SUSPENDED}>Suspended</SelectItem>
              <SelectItem value={ReferrerStatus.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Payout Method Filter */}
          <Select
            value={selectedPayoutMethod}
            onValueChange={(val) => setSelectedPayoutMethod(val || "ALL")}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Payout Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Remittance</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="BKASH">bKash (MFS)</SelectItem>
              <SelectItem value="NAGAD">Nagad (MFS)</SelectItem>
              <SelectItem value="ROCKET">Rocket (MFS)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By Dropdown */}
          <Select
            value={sortBy}
            onValueChange={(val) => {
              if (val === "newest" || val === "oldest" || val === "deals" || val === "name") {
                setSortBy(val);
              }
            }}
          >
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="deals">Most Deals</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleResetFilters}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-9 text-xs gap-1.5 shrink-0"
          disabled={isRefreshing}
          onClick={handleRefresh}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Referrers Enterprise Table */}
      <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs font-bold text-foreground">
                Partner / Agency
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Referral Code
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Representative
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Remittance Details
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Commission Terms
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Status
              </TableHead>
              <TableHead className="text-right text-xs font-bold text-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <HeartHandshake className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-xs font-semibold text-foreground">
                      No referrer partners found
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Try adjusting your filters or search keywords.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((ref) => {
                const totalDeals = ref.deals?.length || 0;
                const totalBounty =
                  ref.deals?.reduce((sum, d) => sum + d.referrerBountyBdt, 0) || 0;

                return (
                  <TableRow
                    key={ref.id}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => openDetails(ref)}
                  >
                    {/* Partner Entity */}
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-foreground block">
                          {ref.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                          <span>{ref.code}</span>
                          <span>•</span>
                          <span>{ref.country || "Bangladesh"}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Referral Attribution Code */}
                    <TableCell className="py-3">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-mono text-[11px] font-bold">
                        <span>{ref.referralCode}</span>
                        <button
                          onClick={(e) => handleCopy(ref.referralCode, ref.id, e)}
                          className="hover:text-foreground"
                        >
                          {copiedKey === ref.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* Representative */}
                    <TableCell className="py-3">
                      <div className="space-y-1 text-xs">
                        <span className="font-semibold text-foreground block">
                          {ref.contactFirstName} {ref.contactLastName}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                          <a
                            href={`mailto:${ref.contactEmail}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline hover:text-foreground"
                          >
                            {ref.contactEmail}
                          </a>
                        </div>
                        {/* WhatsApp / Phone Badge */}
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
                              title="Chat with representative on WhatsApp"
                            >
                              <MessageSquare className="h-2.5 w-2.5" />
                              <span>{wa}</span>
                            </a>
                          );
                        })()}
                      </div>
                    </TableCell>

                    {/* Remittance Details (Bank vs MFS) */}
                    <TableCell className="py-3">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          {ref.payoutMethod === "BANK_TRANSFER" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-emerald-500/40 text-emerald-600 bg-emerald-500/10 gap-1 font-mono"
                            >
                              <Landmark className="h-3 w-3" />
                              Bank Transfer
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-purple-500/40 text-purple-600 bg-purple-500/10 gap-1 font-mono"
                            >
                              <Wallet className="h-3 w-3" />
                              {ref.payoutMethod}
                            </Badge>
                          )}
                        </div>

                        {ref.payoutMethod === "BANK_TRANSFER" ? (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            <span className="font-semibold text-foreground/90">{ref.bankName || "Bank not set"}</span>
                            {ref.accountNumber && (
                              <div className="flex items-center gap-1 text-[10px]">
                                <span>Acc: ••••{ref.accountNumber.slice(-4)}</span>
                                <button
                                  onClick={(e) => handleCopy(ref.accountNumber || "", `acc-${ref.id}`, e)}
                                  className="hover:text-foreground p-0.5"
                                  title="Copy account number"
                                >
                                  {copiedKey === `acc-${ref.id}` ? (
                                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-2.5 w-2.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                            <span className="font-semibold text-foreground">{ref.walletNumber || "Wallet not set"}</span>
                            {ref.walletNumber && (
                              <button
                                onClick={(e) => handleCopy(ref.walletNumber || "", `wal-${ref.id}`, e)}
                                className="hover:text-foreground p-0.5"
                                title="Copy wallet number"
                              >
                                {copiedKey === `wal-${ref.id}` ? (
                                  <Check className="h-2.5 w-2.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5" />
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Commission Terms */}
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                          <Percent className="h-3 w-3 text-amber-500" />
                          <span>{ref.commissionRate}% Flat Cut</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {totalDeals} Deals (৳{totalBounty.toLocaleString()} BDT)
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          ref.status === ReferrerStatus.ACTIVE
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : ref.status === ReferrerStatus.PAID
                            ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30"
                            : ref.status === ReferrerStatus.CONTRACTED
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                            : ref.status === ReferrerStatus.PROCESSING
                            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                            : ref.status === ReferrerStatus.UNDER_REVIEW
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : ref.status === ReferrerStatus.PENDING
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : ref.status === ReferrerStatus.SUSPENDED
                            ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30"
                            : "bg-destructive/15 text-destructive border-destructive/30"
                        }`}
                      >
                        {ref.status}
                      </Badge>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1 border-border/80 hover:border-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetails(ref);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Table Bottom Status Bar */}
        <div className="p-3 px-4 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{filteredItems.length}</strong> of{" "}
            <strong className="text-foreground">{data.counts.total}</strong> registered referrer partners
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-primary hover:underline text-xs"
            >
              Reset active filters
            </button>
          )}
        </div>
      </div>

      {/* Details Dialog */}
      <AdminReferrerDetailsDialog
        referrer={selectedReferrer}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedReferrer(null);
        }}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
