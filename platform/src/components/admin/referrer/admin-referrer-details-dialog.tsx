"use client";

import { useState } from "react";
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
  DialogFooter,
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
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);

  // Dossier Edit State
  const [isEditingDossier, setIsEditingDossier] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Referrer>>({
    name: referrer.name,
    referralCode: referrer.referralCode,
    contactFirstName: referrer.contactFirstName,
    contactLastName: referrer.contactLastName,
    contactEmail: referrer.contactEmail,
    contactPhone: referrer.contactPhone || "",
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
        status: "PENDING",
      });

      if (res.success) {
        toast.success(res.message);
        setIsNewDealOpen(false);
        setNewDealClientName("");
        setNewDealClientEmail("");
        setNewDealSellingPrice(60000);
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        {/* WIDE DIALOG: sm:max-w-4xl for superior, balanced, multi-column desktop layout */}
        <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border-border/80 shadow-2xl">
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
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                    referrer.status === ReferrerStatus.ACTIVE
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
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

                {referrer.status === ReferrerStatus.PENDING && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-blue-500/40 text-blue-600 hover:bg-blue-500/10 gap-1"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.UNDER_REVIEW)}
                  >
                    <Clock className="h-3 w-3" />
                    Review
                  </Button>
                )}

                {referrer.status !== ReferrerStatus.ACTIVE && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.ACTIVE)}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Approve
                  </Button>
                )}

                {referrer.status === ReferrerStatus.ACTIVE && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-orange-500/40 text-orange-600 hover:bg-orange-500/10 gap-1"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.SUSPENDED)}
                  >
                    <ShieldAlert className="h-3 w-3" />
                    Suspend
                  </Button>
                )}

                {referrer.status !== ReferrerStatus.REJECTED && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                    onClick={() => handleStatusChangeClick(ReferrerStatus.REJECTED)}
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-5 border-b border-border/60 bg-muted/20 shrink-0">
              <TabsList className="bg-transparent h-12 p-0 gap-6">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-1 text-xs font-semibold gap-1.5"
                >
                  <Percent className="h-3.5 w-3.5" />
                  Overview & 15% Terms
                </TabsTrigger>
                <TabsTrigger
                  value="remittance"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-1 text-xs font-semibold gap-1.5"
                >
                  <Landmark className="h-3.5 w-3.5" />
                  Bank Remittance Dossier
                </TabsTrigger>
                <TabsTrigger
                  value="deals"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-1 text-xs font-semibold gap-1.5"
                >
                  <Coins className="h-3.5 w-3.5" />
                  Deals & Bounties ({totalDeals})
                </TabsTrigger>
                <TabsTrigger
                  value="contract"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-1 text-xs font-semibold gap-1.5"
                >
                  <FileSignature className="h-3.5 w-3.5" />
                  Contract & Legal Docs
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scrollable Tab Panels */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
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
                          <span>{referrer.contactEmail}</span>
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
                        <span className="text-muted-foreground">Phone / WhatsApp:</span>
                        <span className="font-mono text-foreground">
                          {referrer.contactPhone || "Not provided"}
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

                {/* Internal Admin Notes */}
                <Card className="border-border/70">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold">
                      Internal Vetting & Relationship Notes
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Visible exclusively to platform super administrators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/50">
                      {referrer.adminNotes || "No internal administrative notes recorded yet."}
                    </p>
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

                {/* Bounty Summary KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg border border-border/70 bg-card">
                    <span className="text-[11px] text-muted-foreground block">
                      Total Referred Deals
                    </span>
                    <span className="text-xl font-black text-foreground">
                      {totalDeals} Deals ({completedDeals} Paid)
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg border border-border/70 bg-card">
                    <span className="text-[11px] text-muted-foreground block">
                      Total Bounty Generated
                    </span>
                    <span className="text-xl font-black text-primary">
                      ৳{totalBountyBdt.toLocaleString()} BDT
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg border border-border/70 bg-card">
                    <span className="text-[11px] text-muted-foreground block">
                      Paid Out Bounty
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ৳{paidBountyBdt.toLocaleString()} BDT
                    </span>
                  </div>
                </div>

                {/* Deals List */}
                {!referrer.deals || referrer.deals.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border/70 rounded-xl">
                    <Coins className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-foreground">
                      No referred deals logged yet
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1">
                      When this partner refers a music distributor and a sale is made, log it here to allocate their 15% bounty.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {referrer.deals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3.5 rounded-xl border border-border/70 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {deal.clientName}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono ${
                                deal.status === "PAID"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              }`}
                            >
                              {deal.status}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {deal.code}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                            <span>Selling Price: ৳{deal.sellingPriceBdt.toLocaleString()} BDT</span>
                            <span>•</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Referrer Bounty (15%): ৳{deal.referrerBountyBdt.toLocaleString()} BDT
                            </span>
                            <span>•</span>
                            <span>{formatDate(deal.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => handleToggleDealStatus(deal)}
                          >
                            Mark as {deal.status === "PAID" ? "Pending" : "Paid"}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteDeal(deal.id)}
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
          <DialogFooter className="p-4 px-6 bg-muted/20 border-t border-border/60 shrink-0 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-mono">
              Created {formatDate(referrer.createdAt)}
            </span>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Dialog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record New Deal Modal (Wide: sm:max-w-xl) */}
      <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Record Closed Referrer Deal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Allocate a 15% bounty for {referrer.name} from a music distribution white label sale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Referred Client / Entity Name *</Label>
              <Input
                className="h-9 text-xs mt-1"
                placeholder="e.g. Sonic Pulse Records Ltd."
                value={newDealClientName}
                onChange={(e) => setNewDealClientName(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs">Client Contact Email</Label>
              <Input
                type="email"
                className="h-9 text-xs mt-1"
                placeholder="client@sonicpulse.com"
                value={newDealClientEmail}
                onChange={(e) => setNewDealClientEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Selling Price (BDT) *</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-xs mt-1 font-mono font-semibold"
                  value={newDealSellingPrice}
                  onChange={(e) => setNewDealSellingPrice(Number(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label className="text-xs">15% Calculated Bounty (BDT)</Label>
                <div className="h-9 mt-1 px-3 flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                  ৳{Math.round(newDealSellingPrice * ((referrer.commissionRate || 15) / 100)).toLocaleString()} BDT
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewDealOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isCreatingDeal}
              onClick={handleCreateDeal}
            >
              {isCreatingDeal ? "Creating..." : "Confirm & Record Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Reason Confirmation Modal */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Update Referrer Status to {targetStatus}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {targetStatus === ReferrerStatus.ACTIVE
                ? "This will activate the partner's account and entitle them to 15% commissions."
                : targetStatus === ReferrerStatus.REJECTED
                ? "Please specify the reason why this partner application is being declined."
                : `Are you sure you want to transition this partner to ${targetStatus}?`}
            </DialogDescription>
          </DialogHeader>

          {targetStatus === ReferrerStatus.REJECTED && (
            <div className="space-y-1.5 py-2">
              <Label className="text-xs">Rejection Reason Note *</Label>
              <Textarea
                rows={3}
                className="text-xs"
                placeholder="State clearly why the partner application cannot be approved at this time..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
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
              disabled={isUpdatingStatus}
              onClick={handleConfirmStatusChange}
            >
              {isUpdatingStatus ? "Updating..." : "Confirm Status Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
