"use client";

import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  WhiteLabelMonthlyReport,
  ReportsSummaryMetrics,
} from "@/types/reports";
import {
  wlGetReportsAction,
  wlGetReportsSummaryAction,
  wlGetReportDownloadUrlAction,
} from "@/actions/reports/whitelabel-reports.action";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  DollarSign,
  TrendingUp,
  FileCheck,
  Disc,
  Calendar,
  Sparkles,
} from "lucide-react";

export function ReportsContent() {
  const [reports, setReports] = useState<WhiteLabelMonthlyReport[]>([]);
  const [summary, setSummary] = useState<ReportsSummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchReportsAndSummary = () => {
    startTransition(async () => {
      setLoading(true);
      const [reportsRes, summaryRes] = await Promise.all([
        wlGetReportsAction({ limit: 50 }),
        wlGetReportsSummaryAction(),
      ]);

      if (reportsRes.success) {
        setReports(reportsRes.data);
      }
      if (summaryRes.success && summaryRes.summary) {
        setSummary(summaryRes.summary);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchReportsAndSummary();
  }, []);

  const handleDownload = async (code: string, fileName: string) => {
    setDownloadingCode(code);
    try {
      const res = await wlGetReportDownloadUrlAction(code);
      if (res.success && res.downloadUrl) {
        window.open(res.downloadUrl, "_blank");
        toast.success(`Downloading statement: ${fileName}`);
      } else {
        toast.error(res.message || "Could not retrieve download link");
      }
    } catch (err: any) {
      toast.error("Download failed: " + err.message);
    } finally {
      setDownloadingCode(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase mb-1">
          <FileText className="w-4 h-4" />
          <span>Accounting & Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Monthly Distribution Statements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monthly distribution reports published by Mother Company staff detailing streams and royalties.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total BDT Revenue */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">
              Total Earnings (BDT)
            </span>
            <div className="text-2xl font-bold tracking-tight">
              ৳{(summary?.totalRevenueBdt || 0).toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            ৳
          </div>
        </div>

        {/* Total Streams */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">
              Total Catalog Streams
            </span>
            <div className="text-2xl font-bold tracking-tight">
              {Number(summary?.totalStreams || 0).toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total USD Revenue */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">
              Total Earnings (USD)
            </span>
            <div className="text-2xl font-bold tracking-tight">
              ${(summary?.totalRevenueUsd || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Statements */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">
              Published Statements
            </span>
            <div className="text-2xl font-bold tracking-tight">
              {summary?.reportCount || reports.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Statements Table */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Statements History</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            {reports.length} statements available
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold">No monthly reports yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Monthly royalty statements uploaded by Mother Company staff will appear here with downloadable PDFs and spreadsheets.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Statement Title</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Streams</TableHead>
                  <TableHead>Earnings (BDT)</TableHead>
                  <TableHead>Published Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
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
                    <TableCell className="font-medium text-foreground">
                      {rep.title}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {rep.fileName}
                    </TableCell>
                    <TableCell className="text-xs">
                      {rep.totalStreams
                        ? Number(rep.totalStreams).toLocaleString()
                        : "0"}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-emerald-500">
                      {rep.totalRevenueBdt
                        ? `৳${Number(rep.totalRevenueBdt).toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(rep.publishedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloadingCode === rep.code}
                        onClick={() => handleDownload(rep.code, rep.fileName)}
                        className="flex items-center gap-1.5 text-xs h-8"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {downloadingCode === rep.code
                            ? "Fetching..."
                            : "Download"}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
