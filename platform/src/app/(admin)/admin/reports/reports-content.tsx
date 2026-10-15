"use client";

import React, { useEffect, useState, useTransition } from "react";
import axios from "axios";
import { toast } from "sonner";
import { DistributionReport } from "@/types/reports";
import { WhiteLabel } from "@/types/whitelabel";
import { adminGetWhiteLabelsAction } from "@/actions/admin/whitelabel/admin-get-whitelabels.action";
import {
  adminGetDistributionReportsAction,
  adminGetReportUploadUrlAction,
  adminCreateDistributionReportAction,
  adminGetReportDownloadUrlAction,
  adminDeleteDistributionReportAction,
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
} from "lucide-react";

export function AdminReportsContent() {
  const [reports, setReports] = useState<DistributionReport[]>([]);
  const [whiteLabels, setWhiteLabels] = useState<WhiteLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedWhiteLabelId, setSelectedWhiteLabelId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [targetWlId, setTargetWlId] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [title, setTitle] = useState("");
  const [totalStreams, setTotalStreams] = useState("");
  const [totalRevenueBdt, setTotalRevenueBdt] = useState("");
  const [totalRevenueUsd, setTotalRevenueUsd] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchReportsAndWhiteLabels = () => {
    startTransition(async () => {
      setLoading(true);
      const [reportsRes, wlRes] = await Promise.all([
        adminGetDistributionReportsAction({
          search: search.trim() || undefined,
          whiteLabelId: selectedWhiteLabelId || undefined,
          limit: 50,
        }),
        adminGetWhiteLabelsAction({ limit: 100 }),
      ]);

      if (reportsRes.success) {
        setReports(reportsRes.data);
      } else {
        toast.error(reportsRes.message);
      }

      if (wlRes.success && wlRes.items) {
        setWhiteLabels(wlRes.items);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchReportsAndWhiteLabels();
  }, [selectedWhiteLabelId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportsAndWhiteLabels();
  };

  const handleDownload = async (code: string, fileName: string) => {
    const res = await adminGetReportDownloadUrlAction(code);
    if (res.success && res.downloadUrl) {
      window.open(res.downloadUrl, "_blank");
      toast.success(`Downloading: ${fileName}`);
    } else {
      toast.error(res.message || "Failed to retrieve download URL");
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete report ${code}?`)) return;

    const res = await adminDeleteDistributionReportAction(code);
    if (res.success) {
      toast.success("Statement deleted successfully");
      fetchReportsAndWhiteLabels();
    } else {
      toast.error(res.message);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWlId) {
      toast.error("Please select a WhiteLabel company.");
      return;
    }
    if (!reportingPeriod.trim()) {
      toast.error("Please enter a reporting period (e.g. 2026-03).");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a statement title.");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a statement file (PDF, CSV, or XLSX).");
      return;
    }

    setUploading(true);
    try {
      // 1. Get presigned upload URL
      const urlRes = await adminGetReportUploadUrlAction({
        whiteLabelId: targetWlId,
        reportingPeriod: reportingPeriod.trim(),
        fileName: selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
      });

      if (!urlRes.success || !urlRes.uploadUrl || !urlRes.key) {
        throw new Error(urlRes.message || "Failed to generate upload URL");
      }

      // 2. Upload file directly to S3/R2
      await axios.put(urlRes.uploadUrl, selectedFile, {
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
      });

      // 3. Create report in DB
      const createRes = await adminCreateDistributionReportAction({
        whiteLabelId: targetWlId,
        reportingPeriod: reportingPeriod.trim(),
        title: title.trim(),
        totalStreams: totalStreams ? Number(totalStreams) : undefined,
        totalRevenueBdt: totalRevenueBdt ? Number(totalRevenueBdt) : undefined,
        totalRevenueUsd: totalRevenueUsd ? Number(totalRevenueUsd) : undefined,
        fileKey: urlRes.key,
        fileName: selectedFile.name,
        fileSizeBytes: selectedFile.size,
        mimeType: selectedFile.type,
      });

      if (!createRes.success) {
        throw new Error(createRes.message || "Failed to record report");
      }

      toast.success("Monthly distribution statement published successfully!");
      setShowUploadModal(false);
      // Reset form
      setTargetWlId("");
      setReportingPeriod("");
      setTitle("");
      setTotalStreams("");
      setTotalRevenueBdt("");
      setTotalRevenueUsd("");
      setSelectedFile(null);
      fetchReportsAndWhiteLabels();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload statement");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase mb-1">
            <FileText className="w-4 h-4" />
            <span>Accounting & Royalties</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Monthly Distribution Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mother Company staff manually uploads monthly streaming and royalty statements for WhiteLabel distribution companies.
          </p>
        </div>

        <Button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Monthly Statement</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedWhiteLabelId}
            onChange={(e) => setSelectedWhiteLabelId(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All WhiteLabel Tenants</option>
            {whiteLabels.map((wl) => (
              <option key={wl.id} value={wl.id}>
                {wl.name} ({wl.code})
              </option>
            ))}
          </select>
        </div>

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
      </div>

      {/* Reports Table */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold">No distribution reports found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Click &quot;Upload Monthly Statement&quot; to publish reports for a WhiteLabel company.
            </p>
            <Button
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Statement</span>
            </Button>
          </div>
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
                      {rep.totalStreams
                        ? Number(rep.totalStreams).toLocaleString()
                        : "0"}
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-emerald-500">
                      {rep.totalRevenueBdt
                        ? `৳${Number(rep.totalRevenueBdt).toLocaleString()}`
                        : "—"}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(rep.code, rep.fileName)}
                          className="h-7 text-xs gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </Button>

                        <button
                          onClick={() => handleDelete(rep.code)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-md transition-colors"
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
      </div>

      {/* Upload Monthly Statement Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <span>Upload Monthly Statement</span>
            </DialogTitle>
            <DialogDescription>
              Upload monthly royalty statement and streams summary for a WhiteLabel company.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
            {/* WhiteLabel Tenant Picker */}
            <div className="space-y-1.5">
              <Label htmlFor="wl">Target WhiteLabel Company *</Label>
              <select
                id="wl"
                value={targetWlId}
                onChange={(e) => setTargetWlId(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select WhiteLabel Company...</option>
                {whiteLabels.map((wl) => (
                  <option key={wl.id} value={wl.id}>
                    {wl.name} ({wl.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Reporting Period */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="period">Reporting Period *</Label>
                <Input
                  id="period"
                  value={reportingPeriod}
                  onChange={(e) => setReportingPeriod(e.target.value)}
                  placeholder="e.g. 2026-03"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Statement Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. March 2026 Statement"
                  required
                  className="text-xs"
                />
              </div>
            </div>

            {/* Financial & Streams Telemetry */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="streams" className="text-xs">
                  Streams Count
                </Label>
                <Input
                  id="streams"
                  type="number"
                  value={totalStreams}
                  onChange={(e) => setTotalStreams(e.target.value)}
                  placeholder="e.g. 150000"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="revBdt" className="text-xs">
                  Earnings (BDT ৳)
                </Label>
                <Input
                  id="revBdt"
                  type="number"
                  value={totalRevenueBdt}
                  onChange={(e) => setTotalRevenueBdt(e.target.value)}
                  placeholder="e.g. 45000"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="revUsd" className="text-xs">
                  Earnings (USD $)
                </Label>
                <Input
                  id="revUsd"
                  type="number"
                  value={totalRevenueUsd}
                  onChange={(e) => setTotalRevenueUsd(e.target.value)}
                  placeholder="e.g. 380.00"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Statement Document File Picker */}
            <div className="space-y-1.5 pt-1">
              <Label>Statement File (PDF / CSV / XLSX) *</Label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors p-4 text-center">
                {selectedFile ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground/60 mb-1" />
                    <span className="text-xs font-semibold">Choose Statement Document</span>
                    <span className="text-[10px] text-muted-foreground">PDF, Excel (.xlsx), or CSV</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setSelectedFile(f);
                  }}
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={uploading}
                className="gap-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? "Uploading to Cloud..." : "Publish Statement"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
