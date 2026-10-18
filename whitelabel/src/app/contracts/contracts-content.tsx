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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { NativeSelect } from "@/components/ui/native-select";
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
  CreditCard,
  Building2,
  Smartphone,
  Globe,
  Info,
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
      try {
        const [contractsRes, payeesRes] = await Promise.all([
          wlGetContractsAction(),
          wlGetPayeesAction(),
        ]);

        if (contractsRes.success && Array.isArray(contractsRes.data)) {
          setContracts(contractsRes.data);
        } else {
          setContracts([]);
          if (!contractsRes.success && contractsRes.message && contractsRes.message !== "Failed to retrieve contracts.") {
            toast.error(contractsRes.message);
          }
        }

        if (payeesRes.success && Array.isArray(payeesRes.data)) {
          setPayees(payeesRes.data);
        } else {
          setPayees([]);
        }
      } catch (err: any) {
        console.error("Failed to load contracts or payees:", err);
        setContracts([]);
        setPayees([]);
      } finally {
        setLoading(false);
      }
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
        `Payee splits must sum to exactly 100.00% (currently ${totalSplitPercentage.toFixed(2)}%).`,
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
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[11px] font-mono">
            Track Level (P1)
          </Badge>
        );
      case "RELEASE":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[11px] font-mono">
            Release Level (P2)
          </Badge>
        );
      case "ARTIST":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-mono">
            Artist Level (P3)
          </Badge>
        );
      case "LABEL":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] font-mono">
            Label Level (P4)
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 text-[11px] font-mono">
            Account Default (P5)
          </Badge>
        );
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    const m = (method || "").toUpperCase();
    if (m.includes("BKASH")) {
      return (
        <span className="inline-flex items-center gap-1 text-pink-600 dark:text-pink-400 font-semibold text-xs">
          <Smartphone className="w-3.5 h-3.5" />
          <span>bKash Remittance</span>
        </span>
      );
    }
    if (m.includes("WISE") || m.includes("PAYPAL")) {
      return (
        <span className="inline-flex items-center gap-1 text-blue-500 font-semibold text-xs">
          <Globe className="w-3.5 h-3.5" />
          <span>{method}</span>
        </span>
      );
    }
    if (m.includes("STRIPE")) {
      return (
        <span className="inline-flex items-center gap-1 text-indigo-500 font-semibold text-xs">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Stripe Connect</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground font-semibold text-xs">
        <Building2 className="w-3.5 h-3.5" />
        <span>Bank Wire / Transfer</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Scale className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Rights &amp; Split Contracts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure automated royalty share percentages with Revelator-grade 5-tier precedence resolution.
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
            className="gap-1.5 text-xs shadow-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Split Deal</span>
          </Button>
        </div>
      </div>

      {/* Split Precedence Hierarchy Accordion (Revelator-Compliant) */}
      <Accordion defaultValue={["hierarchy"]} className="w-full rounded-2xl border border-border/60 bg-card p-4 shadow-xs">
        <AccordionItem value="hierarchy" className="border-b-0">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2 text-foreground">
              <Layers className="w-4 h-4 text-primary" />
              <span>Split Precedence Hierarchy & Legal Terms (Revelator-Compliant)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-3 space-y-4">
            {/* Visual Tier Diagram */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
              <div className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 flex flex-col items-center text-center space-y-1">
                <Badge className="bg-purple-600 text-white font-mono text-[10px] py-0 px-1.5 font-bold">P1 (Highest)</Badge>
                <span className="text-xs font-bold text-foreground">Track Level</span>
                <span className="text-[10px] text-muted-foreground">ISRC direct override</span>
              </div>
              <div className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 flex flex-col items-center text-center space-y-1">
                <Badge className="bg-blue-600 text-white font-mono text-[10px] py-0 px-1.5 font-bold">P2</Badge>
                <span className="text-xs font-bold text-foreground">Release Level</span>
                <span className="text-[10px] text-muted-foreground">UPC album split</span>
              </div>
              <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col items-center text-center space-y-1">
                <Badge className="bg-emerald-600 text-white font-mono text-[10px] py-0 px-1.5 font-bold">P3</Badge>
                <span className="text-xs font-bold text-foreground">Artist Level</span>
                <span className="text-[10px] text-muted-foreground">Roster default</span>
              </div>
              <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col items-center text-center space-y-1">
                <Badge className="bg-amber-600 text-white font-mono text-[10px] py-0 px-1.5 font-bold">P4</Badge>
                <span className="text-xs font-bold text-foreground">Label Level</span>
                <span className="text-[10px] text-muted-foreground">Sub-label rate</span>
              </div>
              <div className="p-2.5 rounded-xl border border-zinc-500/30 bg-zinc-500/10 flex flex-col items-center text-center space-y-1">
                <Badge className="bg-zinc-600 text-white font-mono text-[10px] py-0 px-1.5 font-bold">P5 (Fallback)</Badge>
                <span className="text-xs font-bold text-foreground">Account Default</span>
                <span className="text-[10px] text-muted-foreground">Tenant baseline</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                <span className="font-semibold text-foreground block mb-1">Strict Balancing & Recoupment</span>
                Revenue allocations require exact 100.00% balance across registered payees. Recoupable studio advances and master delivery fees are deducted prior to net disbursement.
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                <span className="font-semibold text-foreground block mb-1">Tax Withholding & Auditability</span>
                Cross-border distributions enforce statutory IRS W-8BEN/W-9 tax withholding. Every royalty calculation execution generates an immutable audit record.
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Tab Switcher */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "contracts" | "payees")}
        className="w-full space-y-4"
      >
        <TabsList className="grid w-full sm:w-[440px] grid-cols-2">
          <TabsTrigger value="contracts" className="gap-2 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Split Agreements ({contracts?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="payees" className="gap-2 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Payee Directory ({payees?.length || 0})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Contracts Table */}
        <TabsContent value="contracts" className="mt-0">
          <Card className="rounded-xl border-border/60 shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-border/50">
              <CardTitle className="text-sm font-semibold text-foreground">Active Split Deals</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Automated percentage apportionments applied to incoming DSP royalties.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {!contracts || contracts.length === 0 ? (
                <Empty className="py-12 px-4">
                  <EmptyMedia>
                    <Scale className="w-10 h-10 text-muted-foreground/40" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No contracts configured yet</EmptyTitle>
                    <EmptyDescription>
                      Click &quot;New Split Deal&quot; to define your first automated revenue share.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60">
                      <TableHead className="text-xs">Contract Code</TableHead>
                      <TableHead className="text-xs">Deal Title</TableHead>
                      <TableHead className="text-xs">Precedence Tier</TableHead>
                      <TableHead className="text-xs">Target Asset</TableHead>
                      <TableHead className="text-xs">Payee Revenue Splits</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(contracts || []).map((c) => (
                      <TableRow key={c.id || c.code} className="border-border/50 text-xs">
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {c.code}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
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
                                className="text-[10px] gap-1 font-mono bg-muted/40"
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
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Payees Directory Table */}
        <TabsContent value="payees" className="mt-0">
          <Card className="rounded-xl border-border/60 shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-border/50">
              <CardTitle className="text-sm font-semibold text-foreground">Verified Payees &amp; Beneficiaries</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Roster artists, producers, and label partners with tax validation and payout routing.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {!payees || payees.length === 0 ? (
                <Empty className="py-12 px-4">
                  <EmptyMedia>
                    <Users className="w-10 h-10 text-muted-foreground/40" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No payees registered yet</EmptyTitle>
                    <EmptyDescription>
                      Click &quot;Register Payee&quot; to onboard your signed artists and collaborators.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60">
                      <TableHead className="text-xs">Payee Code</TableHead>
                      <TableHead className="text-xs">Beneficiary / Legal Name</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Tax ID / TIN</TableHead>
                      <TableHead className="text-xs">Disbursement Method</TableHead>
                      <TableHead className="text-xs">Linked Deals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(payees || []).map((p) => {
                      const linkedCount = (contracts || []).filter((c) =>
                        c.contractPayees?.some((cp) => cp.payeeId === p.id),
                      ).length;

                      return (
                        <TableRow key={p.id || p.code} className="border-border/50 text-xs">
                          <TableCell className="font-mono text-xs font-semibold text-foreground">
                            {p.code}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            <div className="font-semibold text-foreground">{p.name}</div>
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
                          <TableCell>
                            {p.taxId ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                <span>{p.taxId}</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                                Missing W-8BEN/W-9
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{getPaymentMethodIcon(p.paymentMethod)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-mono font-bold">
                              {linkedCount} {linkedCount === 1 ? "Deal" : "Deals"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: New Split Contract with Interactive Deal Presets & Balancing Bar */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <span>Create Rights &amp; Split Contract</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateContract} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contract Title / Deal Description *</Label>
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
                <Label className="text-xs font-semibold">Contract Precedence Tier *</Label>
                <NativeSelect
                  value={contractForm.level}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      level: e.target.value as ContractLevel,
                    }))
                  }
                  className="w-full h-9 text-xs"
                >
                  <option value="RELEASE">Release Level (P2)</option>
                  <option value="TRACK">Track Level (P1 - Highest)</option>
                  <option value="ARTIST">Artist Level (P3)</option>
                  <option value="LABEL">Label Level (P4)</option>
                  <option value="ACCOUNT">Account Wide Default (P5)</option>
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Asset ID (UPC / ISRC)</Label>
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

            {/* Interactive Deal Presets */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs text-muted-foreground font-semibold">
                Interactive Deal Presets:
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetDeal("SOLO_100")}
                  className="h-7 text-xs gap-1 font-medium hover:border-primary"
                >
                  [100% Artist]
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetDeal("SPLIT_70_30")}
                  className="h-7 text-xs gap-1 font-medium hover:border-primary"
                >
                  [70/30 Artist/Label]
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetDeal("SPLIT_80_20")}
                  className="h-7 text-xs gap-1 font-medium hover:border-primary"
                >
                  [80/20 Master Deal]
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetDeal("COLLAB_50_50")}
                  className="h-7 text-xs gap-1 font-medium hover:border-primary"
                >
                  [50/50 Equal Collaboration]
                </Button>
              </div>
            </div>

            {/* Dynamic Payee Split Rows */}
            <div className="space-y-2.5 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Beneficiary Share Allocation:</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSplitRow}
                  className="h-6 text-xs gap-1 text-primary font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Payee Line</span>
                </Button>
              </div>

              {contractForm.splits.map((split, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50"
                >
                  <div className="flex-1">
                    <NativeSelect
                      value={split.payeeId}
                      onChange={(e) => {
                        const newSplits = [...contractForm.splits];
                        newSplits[idx].payeeId = e.target.value;
                        setContractForm((prev) => ({ ...prev, splits: newSplits }));
                      }}
                      required
                      className="w-full h-8 text-xs"
                    >
                      <option value="">Select Payee...</option>
                      {(payees || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.role} - {p.email})
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="w-28">
                    <NativeSelect
                      value={split.role}
                      onChange={(e) => {
                        const newSplits = [...contractForm.splits];
                        newSplits[idx].role = e.target.value as PayeeRole;
                        setContractForm((prev) => ({ ...prev, splits: newSplits }));
                      }}
                      className="w-full h-8 text-xs"
                    >
                      <option value="ARTIST">Artist</option>
                      <option value="LABEL">Label</option>
                      <option value="PRODUCER">Producer</option>
                      <option value="COMPOSER">Composer</option>
                      <option value="PUBLISHER">Publisher</option>
                      <option value="DISTRIBUTOR">Distributor</option>
                    </NativeSelect>
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
                        setContractForm((prev) => ({ ...prev, splits: newSplits }));
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

            {/* Strict 100.00% Split Balancing Bar */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground font-sans font-semibold">
                  Split Balancing Guarantee:
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  {isSplitBalanced ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>100.00% (Balanced ✓)</span>
                    </span>
                  ) : totalSplitPercentage < 100 ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{totalSplitPercentage.toFixed(2)}% (Deficit: {(100 - totalSplitPercentage).toFixed(2)}%)</span>
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{totalSplitPercentage.toFixed(2)}% (Exceeds by {(totalSplitPercentage - 100).toFixed(2)}%)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Shadcn Progress Component with Dynamic State Colors */}
              <Progress
                value={Math.min(100, totalSplitPercentage)}
                className={`w-full [&_[data-slot=progress-track]]:h-2.5 ${
                  isSplitBalanced
                    ? "[&_[data-slot=progress-indicator]]:bg-emerald-500"
                    : totalSplitPercentage < 100
                    ? "[&_[data-slot=progress-indicator]]:bg-amber-500"
                    : "[&_[data-slot=progress-indicator]]:bg-red-500"
                }`}
              />

              {!isSplitBalanced && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3 text-amber-500" />
                  <span>Deals can only be saved when total allocations equal exactly 100.00%.</span>
                </p>
              )}
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
                className="gap-1.5 font-semibold"
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
              <Label className="text-xs font-semibold">Artist / Entity Name *</Label>
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
              <Label className="text-xs font-semibold">Email Address (for statements) *</Label>
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
                <Label className="text-xs">Tax ID / TIN / NID</Label>
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
                <Label className="text-xs font-semibold">Primary Role</Label>
                <NativeSelect
                  value={payeeForm.role}
                  onChange={(e) =>
                    setPayeeForm((prev) => ({
                      ...prev,
                      role: e.target.value as PayeeRole,
                    }))
                  }
                  className="w-full h-9 text-xs"
                >
                  <option value="ARTIST">Artist</option>
                  <option value="LABEL">Sub-Label</option>
                  <option value="PRODUCER">Producer</option>
                  <option value="COMPOSER">Composer</option>
                  <option value="PUBLISHER">Publisher</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Disbursement Method</Label>
                <NativeSelect
                  value={payeeForm.paymentMethod}
                  onChange={(e) =>
                    setPayeeForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs"
                >
                  <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                  <option value="BKASH">bKash Remittance</option>
                  <option value="WISE">Wise International</option>
                  <option value="STRIPE_CONNECT">Stripe Connect</option>
                </NativeSelect>
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
                className="gap-1.5 font-semibold"
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
