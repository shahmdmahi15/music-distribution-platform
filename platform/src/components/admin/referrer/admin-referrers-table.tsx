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

  const filteredItems = useMemo(() => {
    return data.items.filter((item) => {
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
          item.contactEmail.toLowerCase().includes(q);
        const matchesBank =
          (item.bankName && item.bankName.toLowerCase().includes(q)) ||
          (item.accountNumber && item.accountNumber.includes(q)) ||
          (item.walletNumber && item.walletNumber.includes(q));

        return matchesName || matchesCode || matchesRefCode || matchesContact || matchesBank;
      }
      return true;
    });
  }, [data.items, selectedStatus, selectedPayoutMethod, search]);

  const openDetails = (referrer: Referrer) => {
    setSelectedReferrer(referrer);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 4-KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/70 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground font-medium">
                Total Registered Referrers
              </span>
              <p className="text-2xl font-black text-foreground">
                {data.counts.total}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Active Partners
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {data.counts.active}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Pending Vetting & Review
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {data.counts.pending + data.counts.underReview}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground font-medium">
                Fixed Bounty Commission
              </span>
              <p className="text-2xl font-black text-primary">
                15% Share
              </p>
              <span className="text-[10px] text-muted-foreground block">
                Min ৳9,000 BDT per deal
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by agency, ref code, contact, bank or wallet..."
              className="pl-9 h-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
              <SelectItem value={ReferrerStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={ReferrerStatus.SUSPENDED}>Suspended</SelectItem>
              <SelectItem value={ReferrerStatus.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedPayoutMethod}
            onValueChange={(val) => setSelectedPayoutMethod(val || "ALL")}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Payout Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Methods</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="BKASH">bKash (MFS)</SelectItem>
              <SelectItem value="NAGAD">Nagad (MFS)</SelectItem>
              <SelectItem value="ROCKET">Rocket (MFS)</SelectItem>
            </SelectContent>
          </Select>
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
                      <div className="space-y-0.5 text-xs">
                        <span className="font-semibold text-foreground block">
                          {ref.contactFirstName} {ref.contactLastName}
                        </span>
                        <span className="text-[11px] text-muted-foreground block font-mono">
                          {ref.contactEmail}
                        </span>
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
                            <span>{ref.bankName || "Bank name not set"}</span>
                            {ref.accountNumber && (
                              <span className="block text-[10px]">
                                Acc: ••••{ref.accountNumber.slice(-4)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            <span>{ref.walletNumber || "Wallet not set"}</span>
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
                        variant="ghost"
                        className="h-8 text-xs gap-1"
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
