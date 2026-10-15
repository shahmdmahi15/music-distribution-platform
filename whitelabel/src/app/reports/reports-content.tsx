"use client";

import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  RoyaltyStatement,
  RoyaltyStatementsSummary,
  StatementPaymentStatus,
} from "@/types/reports";
import {
  getStatementsAction,
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
  Disc,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  ArrowDownToLine,
} from "lucide-react";

export function ReportsContent() {
  const [statements, setStatements] = useState<RoyaltyStatement[]>([]);
  const [summary, setSummary] = useState<RoyaltyStatementsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchStatements = () => {
    startTransition(async () => {
      setLoading(true);
      const res = await getStatementsAction();
      if (res.success) {
        setStatements(res.statements);
        setSummary(res.summary);
      } else {
        toast.error(res.message);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  const handleDownloadCsv = (statement: RoyaltyStatement) => {
    setDownloadingCode(statement.code);
    try {
      // Build RFC-4180 compliant Statement CSV
      const rows = [
        ["Reporting Period", statement.period],
        ["Statement Code", statement.code],
        ["Status", statement.paidStatus],
        ["Exchange Rate (BDT/USD)", statement.exchangeRateBdtUsd.toFixed(2)],
        [],
        [
          "Metric",
          "Units",
          "Gross Revenue (USD)",
          "Net Revenue (USD)",
          "Net Revenue (BDT)",
        ],
        [
          "Streams",
          statement.totalStreams.toString(),
          `$${statement.grossRevenueUsd.toFixed(2)}`,
          `$${statement.netRevenueUsd.toFixed(2)}`,
          `৳${statement.netRevenueBdt.toLocaleString()}`,
        ],
        [
          "Downloads",
          statement.totalDownloads.toString(),
          "Included",
          "Included",
          "Included",
        ],
        [],
        [
          "Total Net Payout",
          "",
          "",
          `$${statement.netRevenueUsd.toFixed(2)}`,
          `৳${statement.netRevenueBdt.toLocaleString()}`,
        ],
      ];

      const csvContent =
        "data:text/csv;charset=utf-8," +
        rows.map((row) => row.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `royalty-statement-${statement.period}-${statement.code}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Downloaded statement CSV for ${statement.period}`);
    } catch (err: any) {
      toast.error("Failed to generate CSV: " + err.message);
    } finally {
      setDownloadingCode(null);
    }
  };

  const getStatusBadge = (status: StatementPaymentStatus) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>PAID</span>
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            <span>PROCESSING</span>
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 gap-1">
            <Clock className="w-3 h-3" />
            <span>PENDING</span>
          </Badge>
        );
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
          Artist Royalty Statements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monthly royalty accounting statements detailing DSP streaming volumes, gross revenue, and net artist earnings.
        </p>
      </div>

      {/* Monthly Earnings Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net USD */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">
              Net Earnings (USD)
            </span>
            <div className="text-2xl font-bold tracking-tight">
              ${(summary?.netUsd || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <span className="text-[10px] text-muted-foreground">Post-DSP deductions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Net BDT */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">
              Net Earnings (BDT)
            </span>
            <div className="text-2xl font-bold tracking-tight text-emerald-500">
              ৳{(summary?.netBdt || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground">@ 120.0 BDT / USD</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
            ৳
          </div>
        </div>

        {/* Total Streams */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">
              Total Streams
            </span>
            <div className="text-2xl font-bold tracking-tight">
              {Number(summary?.totalStreams || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground">Spotify, Apple, YouTube</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Downloads */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">
              Total Downloads
            </span>
            <div className="text-2xl font-bold tracking-tight">
              {Number(summary?.totalDownloads || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground">iTunes, Amazon Digital</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Disc className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Statements Table */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Monthly Statements History</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            {statements.length} statements generated
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : statements.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold">No royalty statements yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Monthly royalty runs and statements will appear here with downloadable CSV line-item breakdowns.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Total Streams</TableHead>
                  <TableHead>Gross USD</TableHead>
                  <TableHead>Net USD</TableHead>
                  <TableHead>Net BDT</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.map((stm) => (
                  <TableRow key={stm.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {stm.period}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs font-medium">
                      {Number(stm.totalStreams).toLocaleString()}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      ${stm.grossRevenueUsd.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-foreground">
                      ${stm.netRevenueUsd.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-emerald-500">
                      ৳{stm.netRevenueBdt.toLocaleString()}
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(stm.paidStatus)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloadingCode === stm.code}
                        onClick={() => handleDownloadCsv(stm)}
                        className="flex items-center gap-1.5 text-xs h-8 ml-auto"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        <span>Download Statement CSV</span>
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
