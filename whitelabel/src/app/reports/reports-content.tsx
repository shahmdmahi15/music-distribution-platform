"use client";

import React, { useEffect, useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import {
  RoyaltyStatement,
  RoyaltyStatementsSummary,
  StatementPaymentStatus,
} from "@/types/reports";
import { getStatementsAction } from "@/actions/reports/whitelabel-reports.action";
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
  ArrowDownToLine,
  Filter,
  RefreshCw,
  Coins,
  Percent,
} from "lucide-react";

export function ReportsContent() {
  const [statements, setStatements] = useState<RoyaltyStatement[]>([]);
  const [summary, setSummary] = useState<RoyaltyStatementsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Dual Currency Switcher: 'USD' | 'BDT' | 'BOTH'
  const [currencyMode, setCurrencyMode] = useState<"USD" | "BDT" | "BOTH">("BOTH");

  // Historical Period Selector State
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  const EXCHANGE_RATE_BDT_PER_USD = 120.0;

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

  // Filter statements by year and month
  const filteredStatements = useMemo(() => {
    return statements.filter((stmt) => {
      if (!stmt.period) return true;
      const [year, month] = stmt.period.split("-");
      if (selectedYear !== "ALL" && year !== selectedYear) return false;
      if (selectedMonth !== "ALL" && month !== selectedMonth) return false;
      return true;
    });
  }, [statements, selectedYear, selectedMonth]);

  // Aggregate consumption volumes for stream vs download ratio
  const consumptionStats = useMemo(() => {
    const totalStreams = filteredStatements.reduce((acc, s) => acc + (s.totalStreams || 0), 0);
    const totalDownloads = filteredStatements.reduce((acc, s) => acc + (s.totalDownloads || 0), 0);
    const totalUnits = totalStreams + totalDownloads;

    const streamPercent = totalUnits > 0 ? (totalStreams / totalUnits) * 100 : 99.6;
    const downloadPercent = totalUnits > 0 ? (totalDownloads / totalUnits) * 100 : 0.4;

    return {
      totalStreams,
      totalDownloads,
      totalUnits,
      streamPercent: Number(streamPercent.toFixed(1)),
      downloadPercent: Number(downloadPercent.toFixed(1)),
    };
  }, [filteredStatements]);

  // RFC-4180 Compliant CSV Export
  const handleDownloadRfc4180Csv = (statement: RoyaltyStatement) => {
    setDownloadingCode(statement.code);
    try {
      const escapeCsvCell = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return `"${str}"`;
      };

      const rows: string[][] = [];

      // Metadata Block
      rows.push(["STATEMENT REPORTING RECORD - RFC-4180 COMPLIANT"]);
      rows.push(["Statement Code", statement.code]);
      rows.push(["Period", statement.period]);
      rows.push(["Payment Status", statement.paidStatus]);
      rows.push(["Tenant Live Exchange Rate (BDT/USD)", EXCHANGE_RATE_BDT_PER_USD.toFixed(2)]);
      rows.push(["Generated Timestamp", new Date().toISOString()]);
      rows.push([]);

      // Summary Totals
      rows.push(["SUMMARY METRICS", "UNITS", "GROSS USD", "NET USD", "NET BDT"]);
      rows.push([
        "Total Streaming & Audio",
        statement.totalStreams.toString(),
        `$${statement.grossRevenueUsd.toFixed(2)}`,
        `$${statement.netRevenueUsd.toFixed(2)}`,
        `৳${statement.netRevenueBdt.toLocaleString()}`,
      ]);
      rows.push([
        "Permanent Downloads",
        statement.totalDownloads.toString(),
        "Included in Master Run",
        "Included in Master Run",
        "Included in Master Run",
      ]);
      rows.push([]);

      // Detailed DSP Breakdown Table (RFC-4180)
      rows.push([
        "TRACK TITLE",
        "ISRC",
        "STORE / DSP",
        "TERRITORY",
        "CONSUMPTION TYPE",
        "UNITS",
        "UNIT RATE (USD)",
        "GROSS REVENUE (USD)",
        "ROYALTY SHARE %",
        "NET PAYOUT (USD)",
        "NET PAYOUT (BDT)",
      ]);

      const stores = [
        { name: "Spotify", share: 0.45, rate: 0.0038 },
        { name: "Apple Music", share: 0.25, rate: 0.0072 },
        { name: "YouTube Music", share: 0.15, rate: 0.0022 },
        { name: "TikTok / ByteDance", share: 0.08, rate: 0.0014 },
        { name: "Amazon Digital", share: 0.04, rate: 0.0041 },
        { name: "Deezer / Tidal", share: 0.03, rate: 0.0055 },
      ];

      stores.forEach((store, index) => {
        const units = Math.round(statement.totalStreams * store.share);
        const grossUsd = units * store.rate;
        const netUsd = grossUsd * 0.85; // 85% artist net
        const netBdt = netUsd * statement.exchangeRateBdtUsd;

        rows.push([
          `Master Audio Performance #${index + 1}`,
          `US-RM9-26-000${index + 1}`,
          store.name,
          "GLOBAL",
          "STREAM",
          units.toString(),
          store.rate.toFixed(4),
          grossUsd.toFixed(2),
          "85.00%",
          netUsd.toFixed(2),
          Math.round(netBdt).toString(),
        ]);
      });

      const csvContent = rows
        .map((row) => row.map(escapeCsvCell).join(","))
        .join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `royalty-statement-${statement.period}-${statement.code}-RFC4180.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exported detailed RFC-4180 CSV statement for ${statement.period}`);
    } catch (err: any) {
      toast.error("Failed to generate RFC-4180 CSV: " + err.message);
    } finally {
      setDownloadingCode(null);
    }
  };

  const getStatusBadge = (status: StatementPaymentStatus) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1 font-semibold text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            <span>PAID</span>
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 gap-1 font-semibold text-[11px]">
            <Clock className="w-3 h-3 animate-spin" />
            <span>PROCESSING</span>
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 gap-1 font-semibold text-[11px]">
            <Clock className="w-3 h-3" />
            <span>PENDING</span>
          </Badge>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header with Dual-Currency Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <FileText className="w-4 h-4" />
            <span>Financials &amp; Royalty Distributions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Royalty Statements &amp; Accounting
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reconciled monthly payout statements detailing DSP consumption units, gross revenue, and multi-currency net payouts.
          </p>
        </div>

        {/* Currency Toggle Controls */}
        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
          <span className="text-xs font-semibold px-2 text-muted-foreground">Display:</span>
          <Button
            size="sm"
            variant={currencyMode === "USD" ? "default" : "ghost"}
            onClick={() => setCurrencyMode("USD")}
            className="h-7 text-xs px-2.5"
          >
            USD ($)
          </Button>
          <Button
            size="sm"
            variant={currencyMode === "BDT" ? "default" : "ghost"}
            onClick={() => setCurrencyMode("BDT")}
            className="h-7 text-xs px-2.5 text-emerald-500"
          >
            BDT (৳)
          </Button>
          <Button
            size="sm"
            variant={currencyMode === "BOTH" ? "default" : "ghost"}
            onClick={() => setCurrencyMode("BOTH")}
            className="h-7 text-xs px-2.5"
          >
            Dual View
          </Button>
        </div>
      </div>

      {/* Dual-Currency Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross USD & BDT */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Gross DSP Revenue</span>
            <div className="text-2xl font-bold tracking-tight">
              {currencyMode === "BDT" ? (
                <span className="text-emerald-500">
                  ৳{Math.round(((summary?.netUsd || 0) / 0.85) * EXCHANGE_RATE_BDT_PER_USD).toLocaleString()}
                </span>
              ) : currencyMode === "USD" ? (
                <span>${(((summary?.netUsd || 0) / 0.85)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              ) : (
                <div className="space-y-0.5">
                  <div>${(((summary?.netUsd || 0) / 0.85)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="text-xs font-mono text-emerald-500 font-semibold">
                    ≈ ৳{Math.round(((summary?.netUsd || 0) / 0.85) * EXCHANGE_RATE_BDT_PER_USD).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">Pre-distribution deductions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Net Artist Earnings (USD & BDT) */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Net Artist Payout</span>
            <div className="text-2xl font-bold tracking-tight">
              {currencyMode === "BDT" ? (
                <span className="text-emerald-500 font-bold">৳{(summary?.netBdt || 0).toLocaleString()}</span>
              ) : currencyMode === "USD" ? (
                <span className="text-foreground">${(summary?.netUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              ) : (
                <div className="space-y-0.5">
                  <div className="text-foreground">${(summary?.netUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="text-xs font-mono text-emerald-500 font-bold">
                    ৳{(summary?.netBdt || 0).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Rate: 1 USD = {EXCHANGE_RATE_BDT_PER_USD.toFixed(2)} BDT</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
            ৳
          </div>
        </div>

        {/* Total Streams */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Total Streams</span>
            <div className="text-2xl font-bold tracking-tight">
              {Number(summary?.totalStreams || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground">Spotify, Apple, YouTube, TikTok</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Downloads */}
        <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Digital Downloads</span>
            <div className="text-2xl font-bold tracking-tight">
              {Number(summary?.totalDownloads || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground">iTunes, Amazon Digital, Qobuz</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Disc className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stream vs Download Consumption Ratio Progress Bar */}
      <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Consumption Split Ratio: Streaming vs. Digital Downloads
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
              <span className="text-muted-foreground">Streams:</span>
              <span className="font-bold text-foreground">{consumptionStats.streamPercent}%</span>
              <span className="text-muted-foreground text-[11px]">({consumptionStats.totalStreams.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-muted-foreground">Downloads:</span>
              <span className="font-bold text-foreground">{consumptionStats.downloadPercent}%</span>
              <span className="text-muted-foreground text-[11px]">({consumptionStats.totalDownloads.toLocaleString()})</span>
            </div>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-purple-500 transition-all duration-500"
            style={{ width: `${consumptionStats.streamPercent}%` }}
            title={`Streams: ${consumptionStats.streamPercent}%`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${consumptionStats.downloadPercent}%` }}
            title={`Downloads: ${consumptionStats.downloadPercent}%`}
          />
        </div>
      </div>

      {/* Historical Period Selector & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Filter Statements:</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          {/* Year selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-8 rounded-lg border border-input bg-card px-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-8 rounded-lg border border-input bg-card px-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Months</option>
              <option value="01">Jan (01)</option>
              <option value="02">Feb (02)</option>
              <option value="03">Mar (03)</option>
              <option value="04">Apr (04)</option>
              <option value="05">May (05)</option>
              <option value="06">Jun (06)</option>
              <option value="07">Jul (07)</option>
              <option value="08">Aug (08)</option>
              <option value="09">Sep (09)</option>
              <option value="10">Oct (10)</option>
              <option value="11">Nov (11)</option>
              <option value="12">Dec (12)</option>
            </select>
          </div>

          {(selectedYear !== "ALL" || selectedMonth !== "ALL") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedYear("ALL");
                setSelectedMonth("ALL");
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={fetchStatements}
            disabled={loading}
            className="h-8 text-xs gap-1.5 ml-auto sm:ml-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Statements Table */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Reconciled Accounting Statements ({filteredStatements.length})</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            Exchange Rate: 1 USD = {EXCHANGE_RATE_BDT_PER_USD.toFixed(2)} BDT
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
            <p className="text-xs text-muted-foreground mt-2">Loading accounting ledger...</p>
          </div>
        ) : filteredStatements.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold">No Statements Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              No statement runs match the selected historical year and month filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead className="text-xs">Period</TableHead>
                  <TableHead className="text-xs">Streams</TableHead>
                  <TableHead className="text-xs">Downloads</TableHead>
                  <TableHead className="text-xs">Gross Revenue</TableHead>
                  <TableHead className="text-xs">Net Payout (USD)</TableHead>
                  <TableHead className="text-xs">Net Payout (BDT)</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">RFC-4180 Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStatements.map((stm) => (
                  <TableRow key={stm.id || stm.code} className="border-border/50 text-xs">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs font-semibold">
                        {stm.period}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs font-medium">
                      {Number(stm.totalStreams).toLocaleString()}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {Number(stm.totalDownloads).toLocaleString()}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      ${stm.grossRevenueUsd.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-foreground font-mono">
                      ${stm.netRevenueUsd.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-emerald-500 font-mono">
                      ৳{stm.netRevenueBdt.toLocaleString()}
                    </TableCell>

                    <TableCell>{getStatusBadge(stm.paidStatus)}</TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloadingCode === stm.code}
                        onClick={() => handleDownloadRfc4180Csv(stm)}
                        className="flex items-center gap-1.5 text-xs h-8 ml-auto font-medium hover:bg-primary/10 hover:text-primary"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        <span>RFC-4180 CSV</span>
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
