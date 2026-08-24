"use client";

import { useState, useEffect } from "react";
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
  Eye,
  FileCheck2,
  Globe,
  Headphones,
  Lock,
  Mail,
  Music,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { WhiteLabel, WhiteLabelStatus, WhiteLabelBusinessType } from "@/types/whitelabel";
import { AdminWhiteLabelDetailsSheet } from "./admin-whitelabel-details-sheet";
import { adminActivateWhiteLabelAction } from "@/actions/admin/whitelabel/admin-activate-whitelabel.action";

interface AdminWhiteLabelsTableProps {
  initialData: {
    items: any[];
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
      approved: number;
      rejected: number;
    };
  };
}

export function AdminWhiteLabelsTable({ initialData }: AdminWhiteLabelsTableProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData.items || []);
  const [counts, setCounts] = useState(initialData.counts || { all: 0, pending: 0, underReview: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedWhiteLabel, setSelectedWhiteLabel] = useState<WhiteLabel | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setItems(initialData.items || []);
    setCounts(
      initialData.counts || {
        all: 0,
        pending: 0,
        underReview: 0,
        approved: 0,
        rejected: 0,
      },
    );
    if (selectedWhiteLabel) {
      const updated = (initialData.items || []).find(
        (x: any) => x.id === selectedWhiteLabel.id,
      );
      if (updated) setSelectedWhiteLabel(updated);
    }
  }, [initialData]);

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
      toast.success("Applications refreshed.");
    }, 600);
  };

  const handleQuickActivate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await adminActivateWhiteLabelAction(id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to activate WhiteLabel.");
    }
  };

  const filteredItems = items.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchCode = item.code?.toLowerCase().includes(q);
      const matchEmail = item.contactEmail?.toLowerCase().includes(q);
      const matchContact = `${item.contactFirstName} ${item.contactLastName}`
        .toLowerCase()
        .includes(q);
      return matchName || matchCode || matchEmail || matchContact;
    }
    return true;
  });

  const statusBadges = {
    [WhiteLabelStatus.PENDING]: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    [WhiteLabelStatus.UNDER_REVIEW]: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    [WhiteLabelStatus.APPROVED]: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    [WhiteLabelStatus.REJECTED]: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    [WhiteLabelStatus.SUSPENDED]: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, code, contact or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar flex-wrap">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
          className="h-7 text-xs rounded-full px-3"
        >
          All ({counts.all})
        </Button>
        <Button
          variant={statusFilter === WhiteLabelStatus.PENDING ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(WhiteLabelStatus.PENDING)}
          className={`h-7 text-xs rounded-full px-3 ${
            statusFilter === WhiteLabelStatus.PENDING
              ? "bg-amber-600 text-white"
              : "text-amber-600 dark:text-amber-400 border-amber-500/30"
          }`}
        >
          Pending ({counts.pending})
        </Button>
        <Button
          variant={statusFilter === WhiteLabelStatus.UNDER_REVIEW ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(WhiteLabelStatus.UNDER_REVIEW)}
          className={`h-7 text-xs rounded-full px-3 ${
            statusFilter === WhiteLabelStatus.UNDER_REVIEW
              ? "bg-blue-600 text-white"
              : "text-blue-600 dark:text-blue-400 border-blue-500/30"
          }`}
        >
          Under Review ({counts.underReview})
        </Button>
        <Button
          variant={statusFilter === WhiteLabelStatus.APPROVED ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(WhiteLabelStatus.APPROVED)}
          className={`h-7 text-xs rounded-full px-3 ${
            statusFilter === WhiteLabelStatus.APPROVED
              ? "bg-emerald-600 text-white"
              : "text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
          }`}
        >
          Approved ({counts.approved})
        </Button>
        <Button
          variant={statusFilter === WhiteLabelStatus.REJECTED ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(WhiteLabelStatus.REJECTED)}
          className={`h-7 text-xs rounded-full px-3 ${
            statusFilter === WhiteLabelStatus.REJECTED
              ? "bg-rose-600 text-white"
              : "text-rose-600 dark:text-rose-400 border-rose-500/30"
          }`}
        >
          Rejected ({counts.rejected})
        </Button>
      </div>

      {/* Main Applications Table */}
      {filteredItems.length === 0 ? (
        <Card className="shadow-sm border-dashed border-border/60">
          <CardContent className="p-12 text-center space-y-3">
            <div className="p-3.5 rounded-full bg-muted/60 text-muted-foreground mx-auto w-fit">
              <Disc3 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No WhiteLabel applications found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No applications match your active search filter or status selection.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 text-[11px] uppercase tracking-wider">
                  <TableHead className="font-semibold">Company / Code</TableHead>
                  <TableHead className="font-semibold">Representative</TableHead>
                  <TableHead className="font-semibold">Business Type</TableHead>
                  <TableHead className="font-semibold">Catalog & Revenue</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((wl) => (
                  <TableRow
                    key={wl.id}
                    onClick={() => setSelectedWhiteLabel(wl)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors text-xs"
                  >
                    {/* Company / Code */}
                    <TableCell>
                      <div className="space-y-0.5 min-w-[180px]">
                        <div className="flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors">
                          <span>{wl.name}</span>
                          {wl.code && (
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] px-1.5 py-0 font-semibold border-border/80 bg-muted/40"
                            >
                              {wl.code}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          {wl.country && <span>{wl.country}</span>}
                          {wl.companyWebsite && <span>• {wl.companyWebsite}</span>}
                        </div>
                      </div>
                    </TableCell>

                    {/* Representative */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">
                          {wl.contactFirstName} {wl.contactLastName}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground truncate max-w-[160px]">
                          {wl.contactEmail}
                        </p>
                      </div>
                    </TableCell>

                    {/* Business Type */}
                    <TableCell>
                      <Badge variant="secondary" className="text-[11px] font-medium py-0 px-2">
                        {wl.businessType.replace("_", " ")}
                      </Badge>
                    </TableCell>

                    {/* Catalog & Revenue */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <span className="font-semibold text-foreground">
                          {wl.catalogTrackCount.toLocaleString()} tracks
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          ${Number(wl.monthlyRevenueUsd || 0).toLocaleString()} / mo
                        </p>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2.5 py-0.5 font-semibold capitalize ${
                          (statusBadges as Record<string, string>)[wl.status] ||
                          "border-border"
                        }`}
                      >
                        {String(wl.status).replace("_", " ").toLowerCase()}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {wl.status !== WhiteLabelStatus.APPROVED && (
                          <Button
                            size="sm"
                            onClick={(e) => handleQuickActivate(e, wl.id)}
                            className="h-7 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Activate
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedWhiteLabel(wl)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Inspect application"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Inspector Details Sheet */}
      {selectedWhiteLabel && (
        <AdminWhiteLabelDetailsSheet
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
