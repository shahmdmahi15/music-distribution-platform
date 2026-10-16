"use client";

import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Contract,
  Payee,
  ContractLevel,
  ContractStatus,
  PayeeRole,
} from "@/types/contracts";
import {
  wlGetContractsAction,
  wlCreateContractAction,
  wlGetPayeesAction,
  wlCreatePayeeAction,
} from "@/actions/contracts/whitelabel-contracts.action";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Scale,
  Users,
  Plus,
  Percent,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
  ShieldCheck,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export function ContractsContent() {
  const [activeTab, setActiveTab] = useState<"contracts" | "payees">("contracts");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Create Contract Modal State
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractSubmitting, setContractSubmitting] = useState(false);
  const [contractForm, setContractForm] = useState<{
    name: string;
    level: ContractLevel;
    targetId: string;
    splits: Array<{ payeeId: string; percentage: number; role: PayeeRole }>;
  }>({
    name: "",
    level: "RELEASE",
    targetId: "",
    splits: [{ payeeId: "", percentage: 100, role: "ARTIST" }],
  });

  // Create Payee Modal State
  const [showPayeeModal, setShowPayeeModal] = useState(false);
  const [payeeSubmitting, setPayeeSubmitting] = useState(false);
  const [payeeForm, setPayeeForm] = useState({
    name: "",
    email: "",
    legalName: "",
    taxId: "",
    role: "ARTIST" as PayeeRole,
    paymentMethod: "BANK_TRANSFER",
  });

  const fetchData = () => {
    startTransition(async () => {
      setLoading(true);
      const [contractsRes, payeesRes] = await Promise.all([
        wlGetContractsAction(),
        wlGetPayeesAction(),
      ]);

      if (contractsRes.success) {
        setContracts(contractsRes.data);
      }
      if (payeesRes.success) {
        setPayees(payeesRes.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Split calculation helper
  const totalSplitPercentage = contractForm.splits.reduce(
    (acc, s) => acc + (Number(s.percentage) || 0),
    0,
  );
  const isSplitBalanced = Math.abs(totalSplitPercentage - 100) < 0.01;

  // Preset deals helper
  const applyPresetDeal = (
    preset: "SOLO_100" | "SPLIT_70_30" | "SPLIT_80_20" | "COLLAB_50_50",
  ) => {
    const firstPayeeId = payees[0]?.id || "";
    const secondPayeeId = payees[1]?.id || firstPayeeId;

    if (preset === "SOLO_100") {
      setContractForm((prev) => ({
        ...prev,
        splits: [{ payeeId: firstPayeeId, percentage: 100, role: "ARTIST" }],
      }));
    } else if (preset === "SPLIT_70_30") {
      setContractForm((prev) => ({
        ...prev,
        splits: [
          { payeeId: firstPayeeId, percentage: 70, role: "ARTIST" },
          { payeeId: secondPayeeId, percentage: 30, role: "LABEL" },
        ],
      }));
    } else if (preset === "SPLIT_80_20") {
      setContractForm((prev) => ({
        ...prev,
        splits: [
          { payeeId: firstPayeeId, percentage: 80, role: "ARTIST" },
          { payeeId: secondPayeeId, percentage: 20, role: "LABEL" },
        ],
      }));
    } else if (preset === "COLLAB_50_50") {
      setContractForm((prev) => ({
        ...prev,
        splits: [
          { payeeId: firstPayeeId, percentage: 50, role: "ARTIST" },
          { payeeId: secondPayeeId, percentage: 50, role: "ARTIST" },
        ],
      }));
    }
  };

  const handleAddSplitRow = () => {
    const remaining = Math.max(0, 100 - totalSplitPercentage);
    setContractForm((prev) => ({
      ...prev,
      splits: [
        ...prev.splits,
        { payeeId: payees[0]?.id || "", percentage: remaining, role: "ARTIST" },
      ],
    }));
  };

  const handleRemoveSplitRow = (index: number) => {
    if (contractForm.splits.length <= 1) {
      toast.error("A contract must have at least one payee split.");
      return;
    }
    setContractForm((prev) => ({
      ...prev,
      splits: prev.splits.filter((_, i) => i !== index),
    }));
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm.name.trim()) {
      toast.error("Please enter a descriptive contract title.");
      return;
    }

    if (!isSplitBalanced) {
      toast.error(
        `Payee splits must sum to exactly 100.00% (currently ${totalSplitPercentage}%).`,
      );
      return;
    }

    const hasMissingPayee = contractForm.splits.some((s) => !s.payeeId);
    if (hasMissingPayee) {
      toast.error("Please assign a registered payee to every split line.");
      return;
    }

    setContractSubmitting(true);
    try {
      const res = await wlCreateContractAction({
        name: contractForm.name.trim(),
        level: contractForm.level,
        targetId: contractForm.targetId.trim() || undefined,
        splits: contractForm.splits.map((s) => ({
          payeeId: s.payeeId,
          percentage: Number(s.percentage),
          role: s.role,
        })),
      });

      if (res.success && res.contract) {
        toast.success("Split contract created successfully!");
        setContracts((prev) => [res.contract!, ...prev]);
        setShowContractModal(false);
        setContractForm({
          name: "",
          level: "RELEASE",
          targetId: "",
          splits: [{ payeeId: payees[0]?.id || "", percentage: 100, role: "ARTIST" }],
        });
      } else {
        toast.error(res.message || "Failed to create contract.");
      }
    } catch (err: any) {
      toast.error("Contract creation error: " + err.message);
    } finally {
      setContractSubmitting(false);
    }
  };

  const handleCreatePayee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payeeForm.name.trim() || !payeeForm.email.trim()) {
      toast.error("Name and Email are required for payee profile.");
      return;
    }

    setPayeeSubmitting(true);
    try {
      const res = await wlCreatePayeeAction({
        name: payeeForm.name.trim(),
        email: payeeForm.email.trim(),
        legalName: payeeForm.legalName.trim() || undefined,
        taxId: payeeForm.taxId.trim() || undefined,
        role: payeeForm.role,
        paymentMethod: payeeForm.paymentMethod,
      });

      if (res.success && res.payee) {
        toast.success(`Payee "${res.payee.name}" registered successfully!`);
        setPayees((prev) => [res.payee!, ...prev]);
        setShowPayeeModal(false);
        setPayeeForm({
          name: "",
          email: "",
          legalName: "",
          taxId: "",
          role: "ARTIST",
          paymentMethod: "BANK_TRANSFER",
        });
      } else {
        toast.error(res.message || "Failed to register payee.");
      }
    } catch (err: any) {
      toast.error("Payee registration error: " + err.message);
    } finally {
      setPayeeSubmitting(false);
    }
  };

  const getLevelBadge = (level: ContractLevel) => {
    switch (level) {
      case "TRACK":
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[11px]">
            Track Level (P1)
          </Badge>
        );
      case "RELEASE":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[11px]">
            Release Level (P2)
          </Badge>
        );
      case "ARTIST":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
            Artist Level (P3)
          </Badge>
        );
      case "LABEL":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px]">
            Label Level (P4)
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 text-[11px]">
            Account Default (P5)
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Scale className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Rights & Split Contracts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure custom revenue share percentages for your artists, sub-labels, and producers with Revelator precedence logic.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPayeeModal(true)}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Register Payee</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (payees.length === 0) {
                toast.info("Please register at least one payee first.");
                setShowPayeeModal(true);
                return;
              }
              setShowContractModal(true);
            }}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Split Deal</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Active Contracts</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {contracts.length}
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Enforced in automated royalty runs
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Registered Payees</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {payees.length}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Artists, producers & label entities
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Precedence Engine</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xs font-semibold text-foreground font-mono">
            Track &gt; Release &gt; Artist &gt; Account
          </div>
          <p className="text-[11px] text-muted-foreground">
            Revelator-compliant resolution
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Split Balancing</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            Strict 100.00% Net Guarantee
          </div>
          <p className="text-[11px] text-muted-foreground">
            Zero financial rounding drift
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <button
          onClick={() => setActiveTab("contracts")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "contracts"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Split Contracts ({contracts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("payees")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "payees"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Payees Directory ({payees.length})</span>
        </button>
      </div>

      {/* Tab Content: Split Contracts */}
      {activeTab === "contracts" && (
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs overflow-hidden">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Active Royalty Split Agreements
              </h3>
              <p className="text-xs text-muted-foreground">
                Net revenues apportioned to each payee when DSP sales are processed.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Contract Code</TableHead>
                  <TableHead className="text-xs">Title / Description</TableHead>
                  <TableHead className="text-xs">Level</TableHead>
                  <TableHead className="text-xs">Target Asset</TableHead>
                  <TableHead className="text-xs">Payee Revenue Splits</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-xs text-muted-foreground"
                    >
                      No contracts configured yet. Click &quot;New Split Deal&quot; to define your first artist revenue split.
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {c.code}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {c.title}
                      </TableCell>
                      <TableCell>{getLevelBadge(c.level)}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {c.contractAssets?.[0]?.releaseId ||
                          c.contractAssets?.[0]?.trackId ||
                          c.contractAssets?.[0]?.artistName ||
                          "Catalog Wide"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {c.contractPayees?.map((cp) => (
                            <Badge
                              key={cp.id}
                              variant="outline"
                              className="text-[10px] gap-1 font-mono bg-muted/30"
                            >
                              <span className="font-semibold text-foreground">
                                {cp.payee?.name || cp.role}:
                              </span>
                              <span className="text-emerald-500 font-bold">
                                {Number(cp.sharePercentage)}%
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            c.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]"
                          }
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab Content: Payees Directory */}
      {activeTab === "payees" && (
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs overflow-hidden">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Registered Payees & Beneficiaries
              </h3>
              <p className="text-xs text-muted-foreground">
                Beneficiaries eligible to receive automated royalty disbursements and statements.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Payee Code</TableHead>
                  <TableHead className="text-xs">Artist / Entity Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Payment Method</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-xs text-muted-foreground"
                    >
                      No payees registered yet. Click &quot;Register Payee&quot; to add your signed artists or producers.
                    </TableCell>
                  </TableRow>
                ) : (
                  payees.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {p.code}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <div>{p.name}</div>
                        {p.legalName && (
                          <div className="text-[10px] text-muted-foreground">
                            Legal: {p.legalName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {p.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {p.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.paymentMethod}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Modal: New Split Contract */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <span>Create Rights & Split Contract</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateContract} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Contract Title / Deal Description</Label>
              <Input
                value={contractForm.name}
                onChange={(e) =>
                  setContractForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Standard Artist 70/30 Master Deal"
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Contract Level (Precedence)</Label>
                <select
                  value={contractForm.level}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      level: e.target.value as ContractLevel,
                    }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="RELEASE">Release Level (P2)</option>
                  <option value="TRACK">Track Level (P1 - Highest)</option>
                  <option value="ARTIST">Artist Level (P3)</option>
                  <option value="LABEL">Label Level (P4)</option>
                  <option value="ACCOUNT">Account Wide Default (P5)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Target Asset (Release UPC / Track ISRC)
                </Label>
                <Input
                  value={contractForm.targetId}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      targetId: e.target.value,
                    }))
                  }
                  placeholder="Optional: leave blank for all assets"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* Quick Deal Presets */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs text-muted-foreground">
                Quick Deal Presets:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetDeal("SOLO_100")}
                  className="h-7 text-[11px] gap-1"
                >
                  100% Artist
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetDeal("SPLIT_70_30")}
                  className="h-7 text-[11px] gap-1"
                >
                  70% Artist / 30% Label
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetDeal("SPLIT_80_20")}
                  className="h-7 text-[11px] gap-1"
                >
                  80% Artist / 20% Label
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetDeal("COLLAB_50_50")}
                  className="h-7 text-[11px] gap-1"
                >
                  50% / 50% Collab
                </Button>
              </div>
            </div>

            {/* Dynamic Payee Split Rows */}
            <div className="space-y-2.5 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Beneficiary Splits:
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSplitRow}
                  className="h-6 text-[11px] gap-1 text-primary"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Payee</span>
                </Button>
              </div>

              {contractForm.splits.map((split, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50"
                >
                  <div className="flex-1">
                    <select
                      value={split.payeeId}
                      onChange={(e) => {
                        const newSplits = [...contractForm.splits];
                        newSplits[idx].payeeId = e.target.value;
                        setContractForm((prev) => ({
                          ...prev,
                          splits: newSplits,
                        }));
                      }}
                      required
                      className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select Payee...</option>
                      {payees.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.role} - {p.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <select
                      value={split.role}
                      onChange={(e) => {
                        const newSplits = [...contractForm.splits];
                        newSplits[idx].role = e.target.value as PayeeRole;
                        setContractForm((prev) => ({
                          ...prev,
                          splits: newSplits,
                        }));
                      }}
                      className="w-full h-8 rounded-md border border-input bg-transparent px-1.5 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="ARTIST">Artist</option>
                      <option value="LABEL">Label</option>
                      <option value="PRODUCER">Producer</option>
                      <option value="COMPOSER">Composer</option>
                      <option value="PUBLISHER">Publisher</option>
                      <option value="DISTRIBUTOR">Distributor</option>
                    </select>
                  </div>

                  <div className="w-24 relative flex items-center">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      value={split.percentage}
                      onChange={(e) => {
                        const newSplits = [...contractForm.splits];
                        newSplits[idx].percentage = parseFloat(e.target.value) || 0;
                        setContractForm((prev) => ({
                          ...prev,
                          splits: newSplits,
                        }));
                      }}
                      required
                      className="h-8 text-xs font-mono pr-6"
                    />
                    <Percent className="w-3 h-3 absolute right-2 text-muted-foreground pointer-events-none" />
                  </div>

                  {contractForm.splits.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSplitRow(idx)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Split Total Indicator */}
            <div className="p-3 rounded-xl border flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground font-sans">
                Total Allocated Share:
              </span>
              <div className="flex items-center gap-1.5">
                {isSplitBalanced ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{totalSplitPercentage.toFixed(2)}% (Balanced ✓)</span>
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-xs gap-1 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      {totalSplitPercentage.toFixed(2)}% (Must equal 100%)
                    </span>
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowContractModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={contractSubmitting || !isSplitBalanced}
                className="gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {contractSubmitting ? "Creating Contract..." : "Save Split Deal"}
                </span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Register Payee */}
      <Dialog open={showPayeeModal} onOpenChange={setShowPayeeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Register Royalty Payee</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreatePayee} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Artist / Entity Name</Label>
              <Input
                value={payeeForm.name}
                onChange={(e) =>
                  setPayeeForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Royal Artist or Sub-Label LLC"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email Address (for statements)</Label>
              <Input
                type="email"
                value={payeeForm.email}
                onChange={(e) =>
                  setPayeeForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="artist@example.com"
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Legal / Tax Name</Label>
                <Input
                  value={payeeForm.legalName}
                  onChange={(e) =>
                    setPayeeForm((prev) => ({
                      ...prev,
                      legalName: e.target.value,
                    }))
                  }
                  placeholder="Official legal name"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tax ID / National ID</Label>
                <Input
                  value={payeeForm.taxId}
                  onChange={(e) =>
                    setPayeeForm((prev) => ({
                      ...prev,
                      taxId: e.target.value,
                    }))
                  }
                  placeholder="Tax/TIN identifier"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Primary Role</Label>
                <select
                  value={payeeForm.role}
                  onChange={(e) =>
                    setPayeeForm((prev) => ({
                      ...prev,
                      role: e.target.value as PayeeRole,
                    }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ARTIST">Artist</option>
                  <option value="LABEL">Sub-Label</option>
                  <option value="PRODUCER">Producer</option>
                  <option value="COMPOSER">Composer</option>
                  <option value="PUBLISHER">Publisher</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Disbursement Method</Label>
                <select
                  value={payeeForm.paymentMethod}
                  onChange={(e) =>
                    setPayeeForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                  <option value="BKASH">bKash Remittance</option>
                  <option value="WISE">Wise International</option>
                  <option value="STRIPE_CONNECT">Stripe Connect</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPayeeModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={payeeSubmitting}
                className="gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {payeeSubmitting ? "Registering..." : "Register Payee"}
                </span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
