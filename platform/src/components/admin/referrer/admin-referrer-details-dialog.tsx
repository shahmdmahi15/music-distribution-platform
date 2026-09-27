"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileSignature,
  FileText,
  Globe,
  HeartHandshake,
  Layers,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Wallet,
  XCircle,
  Copy,
  Check,
  Landmark,
  Percent,
  Coins,
  FileSpreadsheet,
  ArrowRight,
  Link2,
  MessageSquare,
  Search,
  Sparkles,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Referrer, ReferrerStatus, ReferrerDeal, ReferrerDocument } from "@/types/referrer";
import { formatDate } from "@/lib/utils";
import { adminUpdateReferrerStatusAction } from "@/actions/admin/referrer/admin-update-referrer-status.action";
import { adminUpdateReferrerDossierAction } from "@/actions/admin/referrer/admin-update-referrer-dossier.action";
import { adminUploadReferrerContractAction } from "@/actions/admin/referrer/admin-upload-referrer-contract.action";
import { adminUploadReferrerDocumentAction } from "@/actions/admin/referrer/admin-upload-referrer-document.action";
import { adminDeleteReferrerDocumentAction } from "@/actions/admin/referrer/admin-delete-referrer-document.action";
import {
  adminCreateReferrerDealAction,
  adminUpdateReferrerDealStatusAction,
  adminDeleteReferrerDealAction,
} from "@/actions/admin/referrer/admin-referrer-deal.action";

interface AdminReferrerDetailsDialogProps {
  referrer: Referrer | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function AdminReferrerDetailsDialog({
  referrer,
  isOpen,
  onClose,
  onRefresh,
}: AdminReferrerDetailsDialogProps) {
  if (!referrer) return null;

  const REFERRER_STAGES = [
    { key: ReferrerStatus.PENDING, label: "Application", step: 1 },
    { key: ReferrerStatus.UNDER_REVIEW, label: "Review", step: 2 },
    { key: ReferrerStatus.PROCESSING, label: "Processing", step: 3 },
    { key: ReferrerStatus.CONTRACTED, label: "Contracted", step: 4 },
    { key: ReferrerStatus.PAID, label: "Commercial Paid", step: 5 },
    { key: ReferrerStatus.ACTIVE, label: "Active", step: 6 },
  ];

  const getReferrerStageNum = (status: ReferrerStatus): number => {
    switch (status) {
      case ReferrerStatus.PENDING:
        return 1;
      case ReferrerStatus.UNDER_REVIEW:
        return 2;
      case ReferrerStatus.PROCESSING:
        return 3;
      case ReferrerStatus.CONTRACTED:
        return 4;
      case ReferrerStatus.PAID:
        return 5;
      case ReferrerStatus.ACTIVE:
      case ReferrerStatus.SUSPENDED:
        return 6;
      default:
        return 1;
    }
  };

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Status Modal State
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ReferrerStatus | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Contract Upload State
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [isUploadingContract, setIsUploadingContract] = useState(false);

  // Document Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("GOVERNMENT_ID");
  const [docName, setDocName] = useState<string>("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Deal Creation State
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [newDealClientName, setNewDealClientName] = useState("");
  const [newDealClientEmail, setNewDealClientEmail] = useState("");
  const [newDealSellingPrice, setNewDealSellingPrice] = useState<number>(60000);
  const [newDealStatus, setNewDealStatus] = useState<"PENDING" | "PAID">("PENDING");
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);

  // Deals Filtering & Search State
  const [dealSearch, setDealSearch] = useState("");
  const [dealStatusFilter, setDealStatusFilter] = useState<string>("ALL");

  // Inline Admin Notes State
  const [inlineNotes, setInlineNotes] = useState(referrer.adminNotes || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Dossier Edit State
  const [isEditingDossier, setIsEditingDossier] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Referrer>>({
    name: referrer.name,
    referralCode: referrer.referralCode,
    contactFirstName: referrer.contactFirstName,
    contactLastName: referrer.contactLastName,
    contactEmail: referrer.contactEmail,
    contactPhone: referrer.contactPhone || "",
    contactWhatsApp: referrer.contactWhatsApp || "",
    payoutMethod: referrer.payoutMethod || "BANK_TRANSFER",
    bankName: referrer.bankName || "",
    accountName: referrer.accountName || "",
    accountNumber: referrer.accountNumber || "",
    branchDistrict: referrer.branchDistrict || "",
    branchName: referrer.branchName || "",
    routingNumber: referrer.routingNumber || "",
    swiftCode: referrer.swiftCode || "",
    walletNumber: referrer.walletNumber || "",
    adminNotes: referrer.adminNotes || "",
  });
  const [isSavingDossier, setIsSavingDossier] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStatusChangeClick = (status: ReferrerStatus) => {
    setTargetStatus(status);
    setStatusReason("");
    setIsStatusDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!targetStatus) return;
    if (targetStatus === ReferrerStatus.REJECTED && !statusReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await adminUpdateReferrerStatusAction(referrer.id, {
        status: targetStatus,
        statusReason: statusReason.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message);
        setIsStatusDialogOpen(false);
        onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update referrer status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleContractUpload = async () => {
    if (!contractFile) {
      toast.error("Please select a signed contract PDF file.");
      return;
    }

    setIsUploadingContract(true);
    try {
      const formData = new FormData();
      formData.append("file", contractFile);

      const res = await adminUploadReferrerContractAction(referrer.id, formData);
      if (res.success) {
        toast.success(res.message);
        setContractFile(null);
        onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to upload contract.");
    } finally {
      setIsUploadingContract(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!docFile) {
      toast.error("Please select a document file.");
      return;
    }

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("docType", docType);
      if (docName) formData.append("name", docName);

      const res = await adminUploadReferrerDocumentAction(referrer.id, formData);
      if (res.success) {
        toast.success(res.message);
        setDocFile(null);
        setDocName("");
        onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to upload document.");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await adminDeleteReferrerDocumentAction(docId);
      if (res.success) {
        toast.success(res.message);
        onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete document.");
    }
  };

  const handleCreateDeal = async () => {
    if (!newDealClientName.trim()) {
      toast.error("Client name is required.");
      return;
    }

    setIsCreatingDeal(true);
    try {
      const calculatedBounty = Math.round(
        newDealSellingPrice * ((referrer.commissionRate || 15) / 100),
      );

      const res = await adminCreateReferrerDealAction(referrer.id, {
        clientName: newDealClientName.trim(),
        clientEmail: newDealClientEmail.trim() || undefined,
        sellingPriceBdt: newDealSellingPrice,
        referrerBountyBdt: calculatedBounty,
        status: newDealStatus,
      });

      if (res.success) {
        toast.success(res.message);
        setIsNewDealOpen(false);
        setNewDealClientName("");
        setNewDealClientEmail("");
        setNewDealSellingPrice(60000);
        setNewDealStatus("PENDING");
        onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to record referred deal.");
    } finally {
      setIsCreatingDeal(false);
    }
  };

  const handleSaveInlineNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await adminUpdateReferrerDossierAction(referrer.id, {
        adminNotes: inlineNotes,
      });
      if (res.success) {
        toast.success("Internal notes updated successfully.");
        setIsEditingNotes(false);
        onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleDealStatus = async (deal: ReferrerDeal) => {
    const nextStatus = deal.status === "PAID" ? "PENDING" : "PAID";
    try {
      const res = await adminUpdateReferrerDealStatusAction(deal.id, nextStatus);
      if (res.success) {
        toast.success(`Deal marked as ${nextStatus}.`);
        onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update deal status.");
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;
    try {
      const res = await adminDeleteReferrerDealAction(dealId);
      if (res.success) {
        toast.success(res.message);
        onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete deal.");
    }
  };

  const handleSaveDossier = async () => {
    setIsSavingDossier(true);
    try {
      const res = await adminUpdateReferrerDossierAction(referrer.id, editForm);
      if (res.success) {
        toast.success(res.message);
        setIsEditingDossier(false);
        onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update referrer dossier.");
    } finally {
      setIsSavingDossier(false);
    }
  };

  // Aggregated bounty stats
  const totalDeals = referrer.deals?.length || 0;
  const completedDeals = referrer.deals?.filter((d) => d.status === "PAID").length || 0;
  const totalBountyBdt =
    referrer.deals?.reduce((sum, d) => sum + d.referrerBountyBdt, 0) || 0;
  const paidBountyBdt =
    referrer.deals
      ?.filter((d) => d.status === "PAID")
      .reduce((sum, d) => sum + d.referrerBountyBdt, 0) || 0;
  const pendingBountyBdt = totalBountyBdt - paidBountyBdt;

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    if (!referrer.deals) return [];
    return referrer.deals.filter((deal) => {
      if (dealStatusFilter !== "ALL" && deal.status !== dealStatusFilter) return false;
      if (dealSearch.trim()) {
        const q = dealSearch.toLowerCase();
        const matchesClient = deal.clientName.toLowerCase().includes(q);
        const matchesEmail = deal.clientEmail ? deal.clientEmail.toLowerCase().includes(q) : false;
        const matchesCode = deal.code ? deal.code.toLowerCase().includes(q) : false;
        return matchesClient || matchesEmail || matchesCode;
      }
      return true;
    });
  }, [referrer.deals, dealSearch, dealStatusFilter]);

  // Representative contact helpers
  const rawPhone = referrer.contactWhatsApp || referrer.contactPhone || "";
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${referrer.contactFirstName}, this is from RoyalMotionIT platform administration regarding your Referrer Partner account (${referrer.code}).`)}`
    : null;
  const mailtoLink = `mailto:${referrer.contactEmail}?subject=${encodeURIComponent(`RoyalMotionIT Referrer Partner Program — ${referrer.name}`)}`;
  const referralRegisterUrl = `https://platform.royalmotionit.com/auth/register?ref=${referrer.referralCode}`;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        {/* SUPER ROBUST WIDE DIALOG: w-full max-w-[96vw] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl */}
        <DialogContent className="w-full max-w-[96vw] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card text-card-foreground border-border/80 shadow-2xl rounded-2xl">
          {/* Header */}
          <DialogHeader className="p-5 sm:p-6 bg-gradient-to-r from-card via-card/95 to-amber-500/5 border-b border-border/70 shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
                  >
                    <HeartHandshake className="h-3 w-3" />
                    Referrer Affiliate Partner
                  </Badge>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] border-border/60 text-muted-foreground"
                  >
                    {referrer.code}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20"
                  >
                    Ref Code: {referrer.referralCode}
                  </Badge>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  {referrer.name}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <span>Operating at:</span>
                  <code className="text-[11px] font-mono bg-muted/60 px-1.5 py-0.5 rounded text-foreground">
                    {referrer.operatingHub}
                  </code>
                </DialogDescription>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                    referrer.status === ReferrerStatus.ACTIVE
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : referrer.status === ReferrerStatus.PAID
                      ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30"
                      : referrer.status === ReferrerStatus.CONTRACTED
                      ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                      : referrer.status === ReferrerStatus.PROCESSING
                      ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                      : referrer.status === ReferrerStatus.UNDER_REVIEW
                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                      : referrer.status === ReferrerStatus.PENDING
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : referrer.status === ReferrerStatus.SUSPENDED
                      ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30"
                      : "bg-destructive/15 text-destructive border-destructive/30"
                  }`}
                >
                  {referrer.status}
                </Badge>

                {/* Step 1: PENDING -> UNDER_REVIEW */}
                {referrer.status === ReferrerStatus.PENDING && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-xs font-semibold"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.UNDER_REVIEW)}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Mark Under Review</span>
                  </Button>
                )}

                {/* Step 2: UNDER_REVIEW -> PROCESSING */}
                {referrer.status === ReferrerStatus.UNDER_REVIEW && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1 shadow-xs font-semibold"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.PROCESSING)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve KYB &amp; Mark Processing</span>
                  </Button>
                )}

                {/* Step 3: PROCESSING -> CONTRACTED */}
                {referrer.status === ReferrerStatus.PROCESSING && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1 shadow-xs font-semibold"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.CONTRACTED)}
                  >
                    <FileSignature className="h-3.5 w-3.5" />
                    <span>Issue Agreement &amp; Mark Contracted</span>
                  </Button>
                )}

                {/* Step 4: CONTRACTED -> PAID */}
                {referrer.status === ReferrerStatus.CONTRACTED && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1 shadow-xs font-semibold"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.PAID)}
                  >
                    <Coins className="h-3.5 w-3.5" />
                    <span>Confirm Terms &amp; Mark Paid</span>
                  </Button>
                )}

                {/* Step 5: PAID -> ACTIVE */}
                {referrer.status === ReferrerStatus.PAID && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs font-semibold"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.ACTIVE)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Activate Partner Console</span>
                  </Button>
                )}

                {/* Step 6: ACTIVE -> SUSPENDED */}
                {referrer.status === ReferrerStatus.ACTIVE && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-orange-500/40 text-orange-600 hover:bg-orange-500/10 gap-1"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.SUSPENDED)}
                  >
                    <ShieldAlert className="h-3 w-3" />
                    <span>Suspend Partner</span>
                  </Button>
                )}

                {/* SUSPENDED -> REACTIVATE */}
                {referrer.status === ReferrerStatus.SUSPENDED && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs font-semibold"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.ACTIVE)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Reactivate Partner</span>
                  </Button>
                )}

                {/* REJECTED -> REOPEN */}
                {referrer.status === ReferrerStatus.REJECTED && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-blue-500/40 text-blue-600 hover:bg-blue-500/10 gap-1"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.UNDER_REVIEW)}
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Reopen Application</span>
                  </Button>
                )}

                {/* Generic Decline Option for unapproved accounts */}
                {referrer.status !== ReferrerStatus.ACTIVE &&
                  referrer.status !== ReferrerStatus.SUSPENDED &&
                  referrer.status !== ReferrerStatus.REJECTED && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                      onClick={() => handleStatusChangeClick(ReferrerStatus.REJECTED)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Decline</span>
                    </Button>
                  )}
              </div>
            </div>
          </DialogHeader>

          {/* 6-Stage Visual Stepper Bar */}
          <div className="px-5 sm:px-6 py-2.5 bg-muted/40 border-b border-border/60 shrink-0">
            <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
              {REFERRER_STAGES.map((s, idx) => {
                const currentNum = getReferrerStageNum(referrer.status);
                const isCompleted = currentNum > s.step;
                const isCurrent = currentNum === s.step && referrer.status !== ReferrerStatus.REJECTED;
                const isDeclined = currentNum === s.step && referrer.status === ReferrerStatus.REJECTED;

                return (
                  <div key={s.key} className="flex items-center gap-1.5 shrink-0">
                    <div
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                        isCompleted
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                          : isCurrent
                          ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                          : isDeclined
                          ? "bg-rose-500/15 text-rose-600 font-bold"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      <span className="font-mono text-[10px]">{s.step}.</span>
                      <span>{s.label}</span>
                      {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    {idx < REFERRER_STAGES.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-5 border-b border-border/70 bg-muted/30 shrink-0">
              <TabsList variant="line" className="bg-transparent h-11 p-0 gap-6 border-none">
                <TabsTrigger
                  value="overview"
                  className="data-active:bg-transparent data-active:text-primary data-active:border-b-2 data-active:border-primary border-b-2 border-transparent rounded-none h-11 px-1 text-xs font-semibold gap-1.5 shadow-none focus-visible:ring-0 after:hidden"
                >
                  <Percent className="h-3.5 w-3.5" />
                  Overview & 15% Terms
                </TabsTrigger>
                <TabsTrigger
                  value="remittance"
                  className="data-active:bg-transparent data-active:text-primary data-active:border-b-2 data-active:border-primary border-b-2 border-transparent rounded-none h-11 px-1 text-xs font-semibold gap-1.5 shadow-none focus-visible:ring-0 after:hidden"
                >
                  <Landmark className="h-3.5 w-3.5" />
                  Bank Remittance Dossier
                </TabsTrigger>
                <TabsTrigger
                  value="deals"
                  className="data-active:bg-transparent data-active:text-primary data-active:border-b-2 data-active:border-primary border-b-2 border-transparent rounded-none h-11 px-1 text-xs font-semibold gap-1.5 shadow-none focus-visible:ring-0 after:hidden"
                >
                  <Coins className="h-3.5 w-3.5" />
                  Deals & Bounties ({totalDeals})
                </TabsTrigger>
                <TabsTrigger
                  value="contract"
                  className="data-active:bg-transparent data-active:text-primary data-active:border-b-2 data-active:border-primary border-b-2 border-transparent rounded-none h-11 px-1 text-xs font-semibold gap-1.5 shadow-none focus-visible:ring-0 after:hidden"
                >
                  <FileSignature className="h-3.5 w-3.5" />
                  Contract & Legal Docs
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scrollable Tab Panels */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-20 space-y-6">
              {/* TAB 1: OVERVIEW & 15% TERMS */}
              <TabsContent value="overview" className="m-0 space-y-6">
                {/* 15% Commercial Framework Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        Commission Structure
                      </CardDescription>
                      <CardTitle className="text-2xl font-black text-foreground">
                        {referrer.commissionRate}% Gross Cut
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                      Guaranteed flat cut of gross distributor selling price
                    </CardContent>
                  </Card>

                  <Card className="border-border/70">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium text-muted-foreground">
                        Benchmark Deal Size
                      </CardDescription>
                      <CardTitle className="text-2xl font-black text-foreground">
                        ৳{referrer.dealBenchmarkBdt.toLocaleString()} BDT
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                      Minimum white label platform acquisition ticket
                    </CardContent>
                  </Card>

                  <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Minimum Guaranteed Bounty
                      </CardDescription>
                      <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        ৳{referrer.minGuaranteedBountyBdt.toLocaleString()} BDT
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                      15% calculated bounty per baseline closed deal
                    </CardContent>
                  </Card>
                </div>

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Primary Contact */}
                  <Card className="border-border/70">
                    <CardHeader className="p-4 pb-3 border-b border-border/50">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Primary Representative
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Full Name:</span>
                        <span className="font-semibold text-foreground">
                          {referrer.contactFirstName} {referrer.contactLastName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Direct Email:</span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <a href={mailtoLink} className="text-primary hover:underline" title="Send email">
                            {referrer.contactEmail}
                          </a>
                          <button
                            onClick={() => handleCopy(referrer.contactEmail, "contactEmail")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {copiedKey === "contactEmail" ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">WhatsApp Number:</span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-foreground font-semibold">
                            {referrer.contactWhatsApp || referrer.contactPhone || "Not provided"}
                          </span>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-500 hover:text-emerald-400 p-0.5"
                              title="Open WhatsApp Direct Chat"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {(referrer.contactWhatsApp || referrer.contactPhone) && (
                            <button
                              onClick={() => handleCopy(referrer.contactWhatsApp || referrer.contactPhone || "", "whatsapp")}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {copiedKey === "whatsapp" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {referrer.contactPhone && referrer.contactPhone !== referrer.contactWhatsApp && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Contact Phone:</span>
                          <div className="flex items-center gap-1.5 font-mono text-foreground">
                            <a href={`tel:${referrer.contactPhone}`} className="hover:underline">
                              {referrer.contactPhone}
                            </a>
                            <button
                              onClick={() => handleCopy(referrer.contactPhone || "", "contactPhone")}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {copiedKey === "contactPhone" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Country:</span>
                        <span className="font-semibold text-foreground">
                          {referrer.country || "Not specified"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">LinkedIn Profile:</span>
                        {referrer.contactLinkedIn ? (
                          <a
                            href={referrer.contactLinkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>Profile Link</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Not provided</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Right Column: Entity Profile */}
                  <Card className="border-border/70">
                    <CardHeader className="p-4 pb-3 border-b border-border/50">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Agency / Partner Entity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Agency Name:</span>
                        <span className="font-semibold text-foreground">{referrer.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Country:</span>
                        <span className="text-foreground">{referrer.country || "Bangladesh"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Years in Business:</span>
                        <span className="text-foreground">{referrer.yearsInBusiness} years</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Legal Status:</span>
                        <Badge
                          variant="outline"
                          className={
                            referrer.isIncorporated
                              ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[10px]"
                              : "border-border text-muted-foreground text-[10px]"
                          }
                        >
                          {referrer.isIncorporated ? "Incorporated Entity" : "Individual / Scout"}
                        </Badge>
                      </div>
                      {referrer.companyWebsite && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Website:</span>
                          <a
                            href={referrer.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>{referrer.companyWebsite}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Referral Attribution Link & Tracking Preview Card */}
                <Card className="border-border/70 bg-gradient-to-r from-card via-card to-amber-500/5">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-primary" />
                        Partner Referral Attribution URL
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                        Attribution Code: {referrer.referralCode}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Distributor clients onboarding through this referral link will be permanently attributed to {referrer.name} with automatic 15% revenue share.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={referralRegisterUrl}
                        className="h-8 font-mono text-xs bg-muted/50"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs shrink-0 gap-1.5"
                        onClick={() => handleCopy(referralRegisterUrl, "refUrl")}
                      >
                        {copiedKey === "refUrl" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs shrink-0 gap-1"
                        render={<a href={referralRegisterUrl} target="_blank" rel="noopener noreferrer" />}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Test Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Internal Admin Notes with Inline Editor */}
                <Card className="border-border/70">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          Internal Vetting & Relationship Notes
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Confidential administrative notes visible exclusively to platform administrators
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant={isEditingNotes ? "secondary" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => {
                          if (isEditingNotes) {
                            handleSaveInlineNotes();
                          } else {
                            setIsEditingNotes(true);
                          }
                        }}
                        disabled={isSavingNotes}
                      >
                        {isSavingNotes ? "Saving..." : isEditingNotes ? "Save Notes" : "Edit Notes"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    {isEditingNotes ? (
                      <div className="space-y-2">
                        <Textarea
                          rows={3}
                          value={inlineNotes}
                          onChange={(e) => setInlineNotes(e.target.value)}
                          placeholder="Add confidential partner notes, meeting summaries, or special commercial agreements..."
                          className="text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setInlineNotes(referrer.adminNotes || "");
                              setIsEditingNotes(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isSavingNotes}
                            onClick={handleSaveInlineNotes}
                          >
                            {isSavingNotes ? "Saving..." : "Save Notes"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/50">
                        {referrer.adminNotes || "No internal administrative notes recorded yet. Click 'Edit Notes' to add notes."}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: REMITTANCE DOSSIER (BANK TRANSFER + MFS) */}
              <TabsContent value="remittance" className="m-0 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Remittance & Payout Dossier
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Official payout configuration for transferring 15% closed-deal bounty shares.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isEditingDossier ? "secondary" : "outline"}
                    className="h-8 text-xs gap-1"
                    onClick={() => setIsEditingDossier(!isEditingDossier)}
                  >
                    {isEditingDossier ? "Cancel Editing" : "Edit Remittance Details"}
                  </Button>
                </div>

                {isEditingDossier ? (
                  /* Edit Form */
                  <Card className="border-primary/40 bg-card shadow-sm p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Payout Method</Label>
                        <Select
                          value={editForm.payoutMethod || "BANK_TRANSFER"}
                          onValueChange={(val) =>
                            setEditForm((prev) => ({ ...prev, payoutMethod: val || "BANK_TRANSFER" }))
                          }
                        >
                          <SelectTrigger className="h-9 text-xs mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                            <SelectItem value="BKASH">bKash (MFS)</SelectItem>
                            <SelectItem value="NAGAD">Nagad (MFS)</SelectItem>
                            <SelectItem value="ROCKET">Rocket (MFS)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {editForm.payoutMethod !== "BANK_TRANSFER" ? (
                        <div>
                          <Label className="text-xs">Mobile Wallet Number</Label>
                          <Input
                            className="h-9 text-xs mt-1"
                            placeholder="01XXXXXXXXX"
                            value={editForm.walletNumber || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, walletNumber: e.target.value }))
                            }
                          />
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs">Bank Name</Label>
                          <Input
                            className="h-9 text-xs mt-1"
                            placeholder="e.g. Dutch-Bangla Bank PLC"
                            value={editForm.bankName || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, bankName: e.target.value }))
                            }
                          />
                        </div>
                      )}
                    </div>

                    {editForm.payoutMethod === "BANK_TRANSFER" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                        <div>
                          <Label className="text-xs">Account Name (Account Holder)</Label>
                          <Input
                            className="h-9 text-xs mt-1"
                            placeholder="Account Holder Full Legal Name"
                            value={editForm.accountName || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, accountName: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Account Number</Label>
                          <Input
                            className="h-9 text-xs mt-1"
                            placeholder="Bank Account Number"
                            value={editForm.accountNumber || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, accountNumber: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Branch District</Label>
                          <Input
                            className="h-9 text-xs mt-1"
                            placeholder="e.g. Dhaka"
                            value={editForm.branchDistrict || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                branchDistrict: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Branch Name</Label>
                          <Input
                            className="h-9 text-xs mt-1"
                            placeholder="e.g. Gulshan Branch"
                            value={editForm.branchName || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, branchName: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Routing Number</Label>
                          <Input
                            className="h-9 text-xs mt-1"
                            placeholder="9-digit Routing Number"
                            value={editForm.routingNumber || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                routingNumber: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Swift Code</Label>
                          <Input
                            className="h-9 text-xs mt-1"
                            placeholder="SWIFT / BIC Code"
                            value={editForm.swiftCode || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, swiftCode: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs">Internal Admin Notes</Label>
                      <Textarea
                        rows={2}
                        className="text-xs mt-1"
                        placeholder="Internal relationship notes..."
                        value={editForm.adminNotes || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, adminNotes: e.target.value }))
                        }
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => setIsEditingDossier(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        disabled={isSavingDossier}
                        onClick={handleSaveDossier}
                      >
                        {isSavingDossier ? "Saving..." : "Save Remittance Details"}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  /* Display Remittance Dossier */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Method Overview Card */}
                    <Card className="border-border/70">
                      <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-xs">Active Payout Method</CardDescription>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          {referrer.payoutMethod === "BANK_TRANSFER"
                            ? "Direct Bank Electronic Transfer"
                            : `${referrer.payoutMethod} Mobile Financial Service`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 text-xs space-y-2">
                        {referrer.payoutMethod !== "BANK_TRANSFER" ? (
                          <div className="p-3 bg-muted/40 rounded-lg border border-border/60">
                            <span className="text-muted-foreground block text-[11px]">
                              MFS Wallet Number:
                            </span>
                            <span className="text-sm font-mono font-bold text-foreground">
                              {referrer.walletNumber || "Not configured"}
                            </span>
                          </div>
                        ) : (
                          <div className="p-3 bg-muted/40 rounded-lg border border-border/60">
                            <span className="text-muted-foreground block text-[11px]">
                              Bank Institution:
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {referrer.bankName || "Not configured"}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Bank Transfer 7-Field Grid (if BANK_TRANSFER) */}
                    <Card className="border-border/70">
                      <CardHeader className="p-4 pb-2 border-b border-border/50">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-emerald-500" />
                          Bank Account Credentials
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Account Name:</span>
                          <span className="font-semibold text-foreground">
                            {referrer.accountName || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Account Number:</span>
                          <span className="font-mono font-bold text-foreground">
                            {referrer.accountNumber || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Branch District:</span>
                          <span className="text-foreground">{referrer.branchDistrict || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Branch Name:</span>
                          <span className="text-foreground">{referrer.branchName || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Routing Number:</span>
                          <span className="font-mono text-foreground">
                            {referrer.routingNumber || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">SWIFT Code:</span>
                          <span className="font-mono text-foreground">
                            {referrer.swiftCode || "—"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: DEALS & 15% BOUNTIES */}
              <TabsContent value="deals" className="m-0 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Closed Deals & Bounty Ledger
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Each closed deal grants 15% commission bounty to this referrer.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => setIsNewDealOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Record New Deal
                  </Button>
                </div>

                {/* Bounty Summary 4-KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-border/70 bg-card shadow-xs">
                    <span className="text-[11px] text-muted-foreground block font-medium">
                      Total Referred Deals
                    </span>
                    <span className="text-xl font-black text-foreground">
                      {totalDeals} Deals
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 font-mono">
                      {completedDeals} Settled / Paid
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/70 bg-card shadow-xs">
                    <span className="text-[11px] text-muted-foreground block font-medium">
                      Total Bounty Generated
                    </span>
                    <span className="text-xl font-black text-primary">
                      ৳{totalBountyBdt.toLocaleString()} BDT
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      15% gross revenue share
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-xs">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">
                      Paid Out Bounty
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ৳{paidBountyBdt.toLocaleString()} BDT
                    </span>
                    <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5 font-mono">
                      Settled to partner bank/wallet
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-xs">
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-medium">
                      Pending Payout Due
                    </span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                      ৳{pendingBountyBdt.toLocaleString()} BDT
                    </span>
                    <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block mt-0.5 font-mono">
                      Awaiting remittance transfer
                    </span>
                  </div>
                </div>

                {/* Deal Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-muted/20">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search deals by client name or code..."
                      value={dealSearch}
                      onChange={(e) => setDealSearch(e.target.value)}
                      className="h-8 pl-8 text-xs bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={dealStatusFilter} onValueChange={(val) => setDealStatusFilter(val || "ALL")}>
                      <SelectTrigger className="w-36 h-8 text-xs bg-background">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PAID">Paid Only</SelectItem>
                        <SelectItem value="PENDING">Pending Only</SelectItem>
                      </SelectContent>
                    </Select>
                    {(dealSearch || dealStatusFilter !== "ALL") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => {
                          setDealSearch("");
                          setDealStatusFilter("ALL");
                        }}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                {/* Deals List */}
                {filteredDeals.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border/70 rounded-xl">
                    <Coins className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-foreground">
                      No referred deals match your criteria
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1">
                      {referrer.deals && referrer.deals.length > 0
                        ? "Try clearing your search query or status filter."
                        : "When this partner refers a music distributor and a sale is made, log it here to allocate their 15% bounty."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {deal.clientName}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono gap-1 ${
                                deal.status === "PAID"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              }`}
                            >
                              {deal.status === "PAID" ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-amber-500" />
                              )}
                              {deal.status}
                            </Badge>
                            {deal.code && (
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                                {deal.code}
                              </span>
                            )}
                            {deal.clientEmail && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                • {deal.clientEmail}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                            <span>Selling Price: <strong className="text-foreground">৳{deal.sellingPriceBdt.toLocaleString()} BDT</strong></span>
                            <span>•</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Referrer Bounty (15%): ৳{deal.referrerBountyBdt.toLocaleString()} BDT
                            </span>
                            <span>•</span>
                            <span>Created {formatDate(deal.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-7 text-[11px] font-medium ${
                              deal.status === "PAID"
                                ? "border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                                : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                            }`}
                            onClick={() => handleToggleDealStatus(deal)}
                          >
                            Mark as {deal.status === "PAID" ? "Pending" : "Paid"}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteDeal(deal.id)}
                            title="Delete Deal"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: CONTRACT & SUPPORTING DOCUMENTS */}
              <TabsContent value="contract" className="m-0 space-y-6">
                {/* Official S3 Contract Vault */}
                <Card className="border-border/70">
                  <CardHeader className="p-4 pb-3 border-b border-border/50">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4 text-primary" />
                        Signed Referrer Partnership Contract
                      </div>
                      {referrer.contractUrl && (
                        <a
                          href={referrer.contractUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 font-normal"
                        >
                          <span>Open in S3 Vault</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {referrer.contractKey ? (
                      <div className="p-3.5 rounded-lg border border-border/70 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <FileCheck2 className="h-4 w-4 text-emerald-500" />
                            {referrer.contractFileName || "Referrer_Contract.pdf"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Uploaded by {referrer.contractUploadedBy || "Admin"} on{" "}
                            {formatDate(referrer.contractUploadedAt)}
                          </p>
                        </div>
                        {referrer.contractUrl && (
                          <Button
                            render={
                              <a
                                href={referrer.contractUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            }
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Contract PDF
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-border/70 rounded-xl">
                        <FileSignature className="h-8 w-8 text-muted-foreground/50 mx-auto mb-1.5" />
                        <p className="text-xs font-medium text-foreground">
                          No signed agreement uploaded yet
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Upload the countersigned 15% Referrer Partnership Agreement (PDF only)
                        </p>
                      </div>
                    )}

                    {/* Upload / Replace Contract PDF */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                      <Input
                        type="file"
                        accept="application/pdf"
                        className="h-9 text-xs"
                        onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        size="sm"
                        className="h-9 text-xs shrink-0 gap-1.5"
                        disabled={!contractFile || isUploadingContract}
                        onClick={handleContractUpload}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {isUploadingContract ? "Uploading..." : "Upload Contract PDF"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Supporting Documents (KYB, Trade License, NID) */}
                <Card className="border-border/70">
                  <CardHeader className="p-4 pb-3 border-b border-border/50">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Supporting KYB & Identity Documents
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Documents List */}
                    {!referrer.documents || referrer.documents.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No supplementary verification documents uploaded yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {referrer.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3 rounded-lg border border-border/70 bg-card flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5">
                              <span className="font-semibold text-foreground block">
                                {doc.name || doc.fileName}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <Badge variant="outline" className="text-[9px]">
                                  {doc.docType}
                                </Badge>
                                <span>{formatDate(doc.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {doc.fileUrl && (
                                <Button
                                  render={
                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    />
                                  }
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Supporting Document Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/50">
                      <div>
                        <Label className="text-xs">Document Type</Label>
                        <Select
                          value={docType}
                          onValueChange={(val) => setDocType(val || "GOVERNMENT_ID")}
                        >
                          <SelectTrigger className="h-8 text-xs mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GOVERNMENT_ID">National ID / Passport</SelectItem>
                            <SelectItem value="TRADE_LICENSE">Trade License</SelectItem>
                            <SelectItem value="TAX_TIN">TIN / BIN Certificate</SelectItem>
                            <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                            <SelectItem value="OTHER">Other Supplementary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Document Title (Optional)</Label>
                        <Input
                          className="h-8 text-xs mt-1"
                          placeholder="e.g. Agency Trade License 2026"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            className="h-8 text-xs"
                            onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                          />
                          <Button
                            size="sm"
                            className="h-8 text-xs shrink-0"
                            disabled={!docFile || isUploadingDoc}
                            onClick={handleDocumentUpload}
                          >
                            {isUploadingDoc ? "Uploading..." : "Upload"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="p-4 px-6 bg-card border-t border-border/70 shrink-0 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-mono">
              Created {formatDate(referrer.createdAt)}
            </span>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Dialog
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record New Deal Modal (Super Robust: sm:max-w-xl, z-[70]) */}
      <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
        <DialogContent className="sm:max-w-xl z-[70] border-border/80 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-5 bg-gradient-to-r from-card via-card to-amber-500/10 border-b border-border/70">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Record Closed Referrer Deal
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Allocate a 15% revenue share bounty for {referrer.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-4">
            <div>
              <Label className="text-xs font-semibold">Referred Client / Distributor Entity Name *</Label>
              <Input
                className="h-9 text-xs mt-1"
                placeholder="e.g. Sonic Pulse Records Ltd."
                value={newDealClientName}
                onChange={(e) => setNewDealClientName(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Client Representative Email (Optional)</Label>
              <Input
                type="email"
                className="h-9 text-xs mt-1"
                placeholder="representative@sonicpulse.com"
                value={newDealClientEmail}
                onChange={(e) => setNewDealClientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Deal Selling Price (BDT) *</Label>
                <span className="text-[11px] text-muted-foreground">
                  Min benchmark: ৳{referrer.dealBenchmarkBdt.toLocaleString()} BDT
                </span>
              </div>
              <Input
                type="number"
                min={0}
                className="h-9 text-xs font-mono font-semibold"
                value={newDealSellingPrice}
                onChange={(e) => setNewDealSellingPrice(Number(e.target.value) || 0)}
              />

              {/* Price Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-muted-foreground mr-1">Presets:</span>
                {[60000, 80000, 100000, 150000, 200000].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={newDealSellingPrice === preset ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] font-mono px-2"
                    onClick={() => setNewDealSellingPrice(preset)}
                  >
                    ৳{(preset / 1000).toFixed(0)}k
                  </Button>
                ))}
              </div>
            </div>

            {/* Live Real-Time Financial Split Breakdown */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Deal Gross Value:</span>
                <span className="font-mono font-bold text-foreground">
                  ৳{newDealSellingPrice.toLocaleString()} BDT
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Referrer 15% Bounty:
                </span>
                <span className="font-mono font-bold">
                  + ৳{Math.round(newDealSellingPrice * ((referrer.commissionRate || 15) / 100)).toLocaleString()} BDT
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/50">
                <span>RMIT Aggregator Net (85%):</span>
                <span className="font-mono">
                  ৳{Math.round(newDealSellingPrice * (1 - (referrer.commissionRate || 15) / 100)).toLocaleString()} BDT
                </span>
              </div>
            </div>

            {/* Initial Settlement Status Selector */}
            <div>
              <Label className="text-xs font-semibold">Initial Bounty Status</Label>
              <Select
                value={newDealStatus}
                onValueChange={(val) => {
                  if (val === "PENDING" || val === "PAID") {
                    setNewDealStatus(val);
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[80]">
                  <SelectItem value="PENDING">Pending Payout (To be settled later)</SelectItem>
                  <SelectItem value="PAID">Paid Out / Completed (Already transferred)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 px-5 bg-card border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewDealOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isCreatingDeal || !newDealClientName.trim()}
              onClick={handleCreateDeal}
              className="gap-1.5"
            >
              <Coins className="h-3.5 w-3.5" />
              {isCreatingDeal ? "Recording Deal..." : "Confirm & Record Deal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Reason Confirmation Modal (Super Robust: sm:max-w-md, z-[70]) */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md z-[70] border-border/80 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-5 bg-gradient-to-r from-card via-card to-primary/5 border-b border-border/70">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span>Update Referrer Partner Status</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm status transition for {referrer.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Visual Status Transition Flow */}
            <div className="flex items-center justify-center gap-3 p-3 rounded-xl border border-border/70 bg-muted/30">
              <Badge variant="outline" className="font-mono text-xs font-bold uppercase">
                {referrer.status}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge
                className={`font-mono text-xs font-bold uppercase ${
                  targetStatus === ReferrerStatus.ACTIVE
                    ? "bg-emerald-600 text-white"
                    : targetStatus === ReferrerStatus.UNDER_REVIEW
                    ? "bg-blue-600 text-white"
                    : targetStatus === ReferrerStatus.PROCESSING
                    ? "bg-purple-600 text-white"
                    : targetStatus === ReferrerStatus.CONTRACTED
                    ? "bg-indigo-600 text-white"
                    : targetStatus === ReferrerStatus.PAID
                    ? "bg-teal-600 text-white"
                    : targetStatus === ReferrerStatus.SUSPENDED
                    ? "bg-orange-600 text-white"
                    : targetStatus === ReferrerStatus.REJECTED
                    ? "bg-destructive text-white"
                    : "bg-amber-600 text-white"
                }`}
              >
                {targetStatus}
              </Badge>
            </div>

            {/* Contextual Guidance */}
            <div className="p-3 rounded-lg border border-border/60 bg-card text-xs space-y-1">
              <p className="font-semibold text-foreground">
                {targetStatus === ReferrerStatus.ACTIVE && "Account Activation Impact:"}
                {targetStatus === ReferrerStatus.UNDER_REVIEW && "Review Queue Impact:"}
                {targetStatus === ReferrerStatus.PROCESSING && "Processing & Legal Setup:"}
                {targetStatus === ReferrerStatus.CONTRACTED && "Contract Executed:"}
                {targetStatus === ReferrerStatus.PAID && "Commercial Verification:"}
                {targetStatus === ReferrerStatus.SUSPENDED && "Suspension Impact:"}
                {targetStatus === ReferrerStatus.REJECTED && "Rejection Notice:"}
              </p>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                {targetStatus === ReferrerStatus.ACTIVE &&
                  "The partner will be authorized to access their Referrer Console, track attribution via their custom referral code, and earn 15% revenue share bounties on closed deals."}
                {targetStatus === ReferrerStatus.UNDER_REVIEW &&
                  "Transitions this partner into active compliance vetting. The applicant will see their status updated to Under Review in their client dashboard."}
                {targetStatus === ReferrerStatus.PROCESSING &&
                  "Marks the partner application as under commercial processing and agreement preparation."}
                {targetStatus === ReferrerStatus.CONTRACTED &&
                  "Confirms the partner referral agreement has been formally issued and executed by both parties."}
                {targetStatus === ReferrerStatus.PAID &&
                  "Confirms partner commercial account verification, onboarding fees or deposit cleared."}
                {targetStatus === ReferrerStatus.SUSPENDED &&
                  "Temporarily suspends attribution tracking and commission disbursements for this partner until further administrative review."}
                {targetStatus === ReferrerStatus.REJECTED &&
                  "The partner application will be declined. The reason entered below will be communicated to the partner."}
              </p>
            </div>

            {/* Rejection / Suspension Mandatory Reason Note */}
            {(targetStatus === ReferrerStatus.REJECTED || targetStatus === ReferrerStatus.SUSPENDED) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    {targetStatus === ReferrerStatus.REJECTED ? "Decline Justification *" : "Suspension Reason *"}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Required</span>
                </div>
                <Textarea
                  rows={3}
                  className="text-xs"
                  placeholder={
                    targetStatus === ReferrerStatus.REJECTED
                      ? "Clearly specify why this application cannot be approved (e.g. invalid remittance credentials, unable to verify identity)..."
                      : "State the reason for pausing this partner's tracking capabilities..."
                  }
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="p-4 px-5 bg-card border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={targetStatus === ReferrerStatus.REJECTED ? "destructive" : "default"}
              disabled={
                isUpdatingStatus ||
                ((targetStatus === ReferrerStatus.REJECTED || targetStatus === ReferrerStatus.SUSPENDED) &&
                  !statusReason.trim())
              }
              onClick={handleConfirmStatusChange}
              className="gap-1.5"
            >
              {isUpdatingStatus ? (
                <>Updating...</>
              ) : targetStatus === ReferrerStatus.ACTIVE ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirm Activation
                </>
              ) : targetStatus === ReferrerStatus.PROCESSING ? (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  Confirm Processing
                </>
              ) : targetStatus === ReferrerStatus.CONTRACTED ? (
                <>
                  <FileSignature className="h-3.5 w-3.5" />
                  Confirm Contracted
                </>
              ) : targetStatus === ReferrerStatus.PAID ? (
                <>
                  <CreditCard className="h-3.5 w-3.5" />
                  Confirm Paid & Verified
                </>
              ) : targetStatus === ReferrerStatus.REJECTED ? (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Confirm Rejection
                </>
              ) : (
                <>Confirm Transition</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
