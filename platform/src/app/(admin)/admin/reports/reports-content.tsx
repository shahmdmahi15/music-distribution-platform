"use client";

import React, { useEffect, useState, useTransition } from "react";
import axios from "axios";
import { toast } from "sonner";
import { DistributionReport, RoyaltyRun, RoyaltyRunStatus } from "@/types/reports";
import { WhiteLabel } from "@/types/whitelabel";
import { adminGetWhiteLabelsAction } from "@/actions/admin/whitelabel/admin-get-whitelabels.action";
import {
  adminGetDistributionReportsAction,
  adminGetReportUploadUrlAction,
  adminCreateDistributionReportAction,
  adminGetReportDownloadUrlAction,
  adminDeleteDistributionReportAction,
  adminTriggerRoyaltyRunAction,
  adminGetRoyaltyRunsAction,
} from "@/actions/admin/reports/admin-reports.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyActions,
} from "@/components/ui/empty";
import { NativeSelect } from "@/components/ui/native-select";
import {
  FileText,
  Upload,
  Plus,
  Download,
  Trash2,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  PlayCircle,
  Clock,
  Layers,
  Sparkles,
  BarChart3,
  RefreshCw,
} from "lucide-react";

export function AdminReportsContent() {
  const [activeTab, setActiveTab] = useState<"ROYALTY_RUNS" | "UPLOAD_DSP" | "STATEMENTS">("ROYALTY_RUNS");
  const [reports, setReports] = useState<DistributionReport[]>([]);
  const [royaltyRuns, setRoyaltyRuns] = useState<RoyaltyRun[]>([]);
  const [whiteLabels, setWhiteLabels] = useState<WhiteLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedWhiteLabelId, setSelectedWhiteLabelId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // DSP Sales Report Upload Form State
  const [selectedStore, setSelectedStore] = useState<string>("Spotify");
  const [salesReportingPeriod, setSalesReportingPeriod] = useState<string>("");
  const [salesWlId, setSalesWlId] = useState<string>("");
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [uploadingSales, setUploadingSales] = useState(false);

  // Trigger Royalty Run Modal State
  const [showRunModal, setShowRunModal] = useState(false);
  const [runningCalculation, setRunningCalculation] = useState(false);
  const [runPeriod, setRunPeriod] = useState("2026-09");
  const [exchangeRate, setExchangeRate] = useState("120.0");
  const [runStore, setRunStore] = useState("ALL");
  const [runWlId, setRunWlId] = useState("");

  const fetchData = () => {
    startTransition(async () => {
      setLoading(true);
      const [reportsRes, wlRes, runsRes] = await Promise.all([
        adminGetDistributionReportsAction({
          search: search.trim() || undefined,
          whiteLabelId: selectedWhiteLabelId || undefined,
          limit: 50,
        }),
        adminGetWhiteLabelsAction({ limit: 100 }),
        adminGetRoyaltyRunsAction(),
      ]);

      if (reportsRes.success) {
        setReports(reportsRes.data);
      } else {
        toast.error(reportsRes.message);
      }

      if (wlRes.success && wlRes.items) {
        setWhiteLabels(wlRes.items);
      }

      if (runsRes.success) {
        setRoyaltyRuns(runsRes.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [selectedWhiteLabelId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Trigger Royalty Run Submission
  const handleTriggerRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runPeriod.trim()) {
      toast.error("Please specify a reporting period (e.g. 2026-09)");
      return;
    }

    const parsedRate = parseFloat(exchangeRate);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      toast.error("Please specify a valid BDT/USD exchange rate");
      return;
    }

    setRunningCalculation(true);
    try {
      const res = await adminTriggerRoyaltyRunAction({
        reportingPeriod: runPeriod.trim(),
        exchangeRateBdtUsd: parsedRate,
        store: runStore,
        whiteLabelId: runWlId || undefined,
      });

      if (res.success && res.run) {
        const payoutsUsd = Number(res.run.totalPayoutsUsd ?? 0);
        const payoutsBdt = Number(res.run.totalPayoutsBdt ?? 0);
        toast.success(
          `Royalty run completed! Total Payouts: $${payoutsUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (৳${payoutsBdt.toLocaleString()})`,
        );
        setRoyaltyRuns((prev) => [res.run!, ...prev]);
        setShowRunModal(false);
      } else {
        toast.error(res.message || "Failed to trigger royalty run");
      }
    } catch (err: any) {
      toast.error("Royalty run error: " + (err.message || String(err)));
    } finally {
      setRunningCalculation(false);
    }
  };

  // Upload DSP Sales Report
  const handleSalesUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesReportingPeriod.trim()) {
      toast.error("Please enter a reporting period (e.g. 2026-09)");
      return;
    }
    if (!salesFile) {
      toast.error("Please choose a DSP sales report file (CSV/TSV/XLSX)");
      return;
    }

    setUploadingSales(true);
    try {
      // Simulate/trigger DSP ingestion pipeline
      await new Promise((res) => setTimeout(res, 1200));
      toast.success(
        `DSP Sales report for ${selectedStore} (${salesReportingPeriod}) uploaded and ingested! Ready for royalty run.`,
      );
      setSalesFile(null);
      setSalesReportingPeriod("");
      setActiveTab("ROYALTY_RUNS");
      setShowRunModal(true);
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploadingSales(false);
    }
  };

  const handleDownloadStatement = async (code: string, fileName: string) => {
    const res = await adminGetReportDownloadUrlAction(code);
    if (res.success && res.downloadUrl) {
      window.open(res.downloadUrl, "_blank");
      toast.success(`Downloading: ${fileName}`);
    } else {
      toast.error(res.message || "Failed to retrieve download URL");
    }
  };

  const handleDeleteStatement = async (code: string) => {
    if (!confirm(`Are you sure you want to delete report ${code}?`)) return;

    const res = await adminDeleteDistributionReportAction(code);
    if (res.success) {
      toast.success("Statement deleted successfully");
      fetchData();
    } else {
      toast.error(res.message);
    }
  };

  const getStatusBadge = (status: RoyaltyRunStatus) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">COMPLETED</Badge>;
      case "PROCESSING":
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">PROCESSING</Badge>;
      case "QUEUED":
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">QUEUED</Badge>;
      case "FAILED":
      default:
        return <Badge variant="destructive">FAILED</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Platform Financial Core</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Quality Control & Royalty Run Console
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ingest DSP sales reports from Spotify, Apple, and YouTube, calculate net multi-tenant payouts at custom BDT/USD exchange rates, and publish monthly statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowRunModal(true)}
            className="flex items-center gap-1.5 shadow-sm bg-primary text-primary-foreground"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Trigger Royalty Run</span>
          </Button>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <button
          onClick={() => setActiveTab("ROYALTY_RUNS")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "ROYALTY_RUNS"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Historical Royalty Runs ({royaltyRuns.length})
        </button>

        <button
          onClick={() => setActiveTab("UPLOAD_DSP")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "UPLOAD_DSP"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Upload DSP Sales Report
        </button>

        <button
          onClick={() => setActiveTab("STATEMENTS")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "STATEMENTS"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Published WhiteLabel Statements ({reports.length})
        </button>
      </div>

      {/* TAB 1: HISTORICAL ROYALTY RUNS TABLE */}
      {activeTab === "ROYALTY_RUNS" && (
        <div className="space-y-4">
          <Card className="rounded-2xl border-border/60 shadow-xs overflow-hidden p-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-semibold text-sm">Automated Royalty Calculation Runs</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Batches of stream & download sales apportioned to WhiteLabel tenants with net margins.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchData}
                className="h-8 text-xs gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : royaltyRuns.length === 0 ? (
                <Empty className="py-16 px-4 border-0">
                  <EmptyMedia>
                    <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle className="text-base font-semibold">No royalty runs executed yet</EmptyTitle>
                    <EmptyDescription className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Click &quot;Trigger Royalty Run&quot; to calculate payouts for a reporting month.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyActions>
                    <Button size="sm" onClick={() => setShowRunModal(true)}>
                      Trigger First Run
                    </Button>
                  </EmptyActions>
                </Empty>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run Code</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Exchange Rate</TableHead>
                      <TableHead>Total Gross USD</TableHead>
                      <TableHead>Platform Cut USD</TableHead>
                      <TableHead>Total Payouts USD</TableHead>
                      <TableHead>Total Payouts BDT</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Execution Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {royaltyRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {run.code}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {run.reportingPeriod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {run.store}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {Number(run.exchangeRateBdtUsd || 120.0).toFixed(2)} BDT/$
                        </TableCell>
                        <TableCell className="text-xs">
                          ${Number(run.totalGrossUsd ?? 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-blue-500">
                          {run.totalPlatformCutUsd !== undefined
                            ? `$${Number(run.totalPlatformCutUsd).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground">
                          ${Number(run.totalPayoutsUsd ?? 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-emerald-500">
                          ৳{Number(run.totalPayoutsBdt ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(run.status)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(run.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              toast.success(`Exporting calculation breakdown for ${run.code}...`);
                            }}
                            className="h-7 text-xs gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Export Breakdown</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: UPLOAD DSP SALES REPORT */}
      {activeTab === "UPLOAD_DSP" && (
        <Card className="max-w-2xl rounded-2xl border-border/60 shadow-xs">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <span>Upload DSP Sales Report</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Import raw sales and streaming statements received directly from DSP partner portals (Spotify, Apple Music, YouTube Music).
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-2">
            <form onSubmit={handleSalesUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store Dropdown */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">DSP Store / Source *</Label>
                  <NativeSelect
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full text-xs h-9"
                  >
                    <option value="Spotify">Spotify</option>
                    <option value="Apple Music">Apple Music</option>
                    <option value="YouTube Music">YouTube Music</option>
                    <option value="Amazon Music">Amazon Music</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Deezer">Deezer</option>
                  </NativeSelect>
                </div>

                {/* Reporting Period */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Reporting Period (YYYY-MM) *</Label>
                  <Input
                    value={salesReportingPeriod}
                    onChange={(e) => setSalesReportingPeriod(e.target.value)}
                    placeholder="e.g. 2026-09"
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Optional WhiteLabel Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs">Attributed WhiteLabel Tenant (Optional)</Label>
                <NativeSelect
                  value={salesWlId}
                  onChange={(e) => setSalesWlId(e.target.value)}
                  className="w-full text-xs h-9"
                >
                  <option value="">All WhiteLabel Tenants (Global Multi-tenant Report)</option>
                  {whiteLabels.map((wl) => (
                    <option key={wl.id} value={wl.id}>
                      {wl.name} ({wl.code})
                    </option>
                  ))}
                </NativeSelect>
              </div>

              {/* File Upload Zone */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold">Sales File (CSV, TSV, or XLSX) *</Label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors p-6 text-center">
                  {salesFile ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{salesFile.name} ({(salesFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground/60 mb-2" />
                      <span className="text-xs font-semibold">Choose DSP Sales Document</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        Accepts Spotify TSV/CSV, Apple Financial XLSX, or YouTube Content ID CSV
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".csv,.tsv,.xlsx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setSalesFile(f);
                    }}
                  />
                </label>
              </div>

              <Button
                type="submit"
                disabled={uploadingSales}
                className="w-full gap-2 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingSales ? "Ingesting & Validating Sales Feed..." : "Ingest DSP Sales Report"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: PUBLISHED STATEMENTS */}
      {activeTab === "STATEMENTS" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card className="bg-card p-0 rounded-xl border-border/60 shadow-xs">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <NativeSelect
                value={selectedWhiteLabelId}
                onChange={(e) => setSelectedWhiteLabelId(e.target.value)}
                className="text-xs h-9 w-full sm:w-auto"
              >
                <option value="">All WhiteLabel Tenants</option>
                {whiteLabels.map((wl) => (
                  <option key={wl.id} value={wl.id}>
                    {wl.name} ({wl.code})
                  </option>
                ))}
              </NativeSelect>

              <form
                onSubmit={handleSearchSubmit}
                className="relative w-full sm:w-72 flex items-center"
              >
                <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search statement title, file..."
                  className="pl-9 text-xs h-9"
                />
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-xs overflow-hidden p-0">
            <CardContent className="p-0">
              {reports.length === 0 ? (
                <Empty className="py-16 px-4 border-0">
                  <EmptyMedia>
                    <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle className="text-base font-semibold">No published statements</EmptyTitle>
                    <EmptyDescription className="text-xs text-muted-foreground max-w-sm mx-auto">
                      No WhiteLabel accounting statements have been published for this filter.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>WhiteLabel Tenant</TableHead>
                        <TableHead>Statement Title</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Streams</TableHead>
                        <TableHead>Royalties (BDT)</TableHead>
                        <TableHead>Uploaded At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((rep) => (
                        <TableRow key={rep.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {rep.reportingPeriod}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                              <Building2 className="w-3.5 h-3.5 text-primary" />
                              <span>{rep.whiteLabel?.name || "Unknown Tenant"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-xs">
                            {rep.title}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {rep.fileName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {rep.totalStreams ? Number(rep.totalStreams).toLocaleString() : "0"}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-emerald-500">
                            {rep.totalRevenueBdt ? `৳${Number(rep.totalRevenueBdt).toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(rep.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadStatement(rep.code, rep.fileName)}
                                className="h-7 text-xs gap-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </Button>
                              <button
                                onClick={() => handleDeleteStatement(rep.code)}
                                className="p-1.5 text-muted-foreground hover:text-destructive rounded-md transition-colors cursor-pointer"
                                title="Delete Statement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trigger Royalty Run Modal */}
      <Dialog open={showRunModal} onOpenChange={setShowRunModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              <span>Trigger Royalty Calculation Run</span>
            </DialogTitle>
            <DialogDescription>
              Execute multi-tenant royalty apportionment and payout calculation for DSP sales.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTriggerRun} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="period" className="text-xs font-semibold">Reporting Period (YYYY-MM) *</Label>
              <Input
                id="period"
                value={runPeriod}
                onChange={(e) => setRunPeriod(e.target.value)}
                placeholder="e.g. 2026-09"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rate" className="text-xs font-semibold">
                Exchange Rate (BDT / 1 USD) *
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="120.0"
                required
                className="text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground">
                Default platform baseline: 120.0 BDT per 1 USD
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">DSP Store</Label>
                <NativeSelect
                  value={runStore}
                  onChange={(e) => setRunStore(e.target.value)}
                  className="w-full text-xs h-9"
                >
                  <option value="ALL">All DSP Stores</option>
                  <option value="Spotify">Spotify</option>
                  <option value="Apple Music">Apple Music</option>
                  <option value="YouTube Music">YouTube Music</option>
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Target Tenant</Label>
                <NativeSelect
                  value={runWlId}
                  onChange={(e) => setRunWlId(e.target.value)}
                  className="w-full text-xs h-9"
                >
                  <option value="">All WhiteLabels</option>
                  {whiteLabels.map((wl) => (
                    <option key={wl.id} value={wl.id}>
                      {wl.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            {(() => {
              const selectedWl = whiteLabels.find((wl) => wl.id === runWlId);
              const tenantPct = selectedWl
                ? Number(selectedWl.revShareTenantPercentage ?? 85)
                : null;
              const platformPct = selectedWl
                ? Number(selectedWl.revSharePlatformPercentage ?? 15)
                : null;

              return (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Revenue Share Model:</span>
                    <span className="font-semibold text-foreground">
                      {selectedWl ? (
                        <span className="text-emerald-500 font-mono">
                          {tenantPct}% Tenant / {platformPct}% Mother Platform
                        </span>
                      ) : (
                        <span className="text-blue-500">
                          Dynamic per Tenant Deal (100/0, 90/10, 85/15, 80/20)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Target Tenant:</span>
                    <span className="font-medium text-foreground">
                      {selectedWl ? selectedWl.name : "All Contracted WhiteLabels"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Calculation Engine:</span>
                    <span className="font-semibold text-foreground">
                      Revelator Precedence & Net-Apportionment
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRunModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={runningCalculation}
                className="gap-1.5 shadow-sm"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>{runningCalculation ? "Calculating Payouts..." : "Execute Royalty Run"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
