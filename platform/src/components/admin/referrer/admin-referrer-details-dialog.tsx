"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Download,
  Play,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Referrer, ReferrerStatus, ReferrerDeal, ReferrerDocument } from "@/types/referrer";
import { formatDate } from "@/lib/utils";
import { adminUpdateReferrerStatusAction } from "@/actions/admin/referrer/admin-update-referrer-status.action";
import { adminUpdateReferrerDossierAction } from "@/actions/admin/referrer/admin-update-referrer-dossier.action";
import { adminUploadReferrerContractAction } from "@/actions/admin/referrer/admin-upload-referrer-contract.action";
import { adminGetReferrerContractPreviewAction } from "@/actions/admin/referrer/admin-get-referrer-contract-preview.action";
import { adminUploadReferrerDocumentAction } from "@/actions/admin/referrer/admin-upload-referrer-document.action";
import { adminDeleteReferrerDocumentAction } from "@/actions/admin/referrer/admin-delete-referrer-document.action";
import {
  adminCreateReferrerDealAction,
  adminUpdateReferrerDealStatusAction,
  adminDeleteReferrerDealAction,
} from "@/actions/admin/referrer/admin-referrer-deal.action";

export interface AdminReferrerDetailsDialogProps {
  referrer: Referrer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

const LIFECYCLE_STEPS = [
  { status: ReferrerStatus.PENDING, label: "1. Application", short: "Pending" },
  {
    status: ReferrerStatus.UNDER_REVIEW,
    label: "2. Under Review",
    short: "Review",
  },
  {
    status: ReferrerStatus.PROCESSING,
    label: "3. Processing",
    short: "Processing",
  },
  {
    status: ReferrerStatus.CONTRACTED,
    label: "4. Contracted",
    short: "Contracted",
  },
  {
    status: ReferrerStatus.PAID,
    label: "5. Commercial Paid",
    short: "Paid",
  },
  {
    status: ReferrerStatus.ACTIVE,
    label: "6. Active Live",
    short: "Active",
  },
];

const STATUS_BADGES: Record<string, string> = {
  [ReferrerStatus.PENDING]:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  [ReferrerStatus.UNDER_REVIEW]:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  [ReferrerStatus.PROCESSING]:
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  [ReferrerStatus.CONTRACTED]:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  [ReferrerStatus.PAID]:
    "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
  [ReferrerStatus.ACTIVE]:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  [ReferrerStatus.REJECTED]:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  [ReferrerStatus.SUSPENDED]:
    "bg-destructive/10 text-destructive border-destructive/30",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  GOVERNMENT_ID: "Government ID / Passport / NID",
  TRADE_LICENSE: "Trade License / Corporate Reg",
  TAX_DOCUMENT: "Tax Identification (TIN / W-8 / W-9)",
  BANK_STATEMENT: "Bank Account Proof / Cheque Leaf",
  SIGNED_AGREEMENT: "Signed Commission Addendum",
  OTHER: "Other Supporting Document",
};

export function AdminReferrerDetailsDialog({
  referrer,
  open,
  onOpenChange,
  onRefresh,
}: AdminReferrerDetailsDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "edit_dossier" | "deals" | "documents"
  >("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Status Change & Reason State
  const [statusLoading, setStatusLoading] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Suspend Modal State
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Contract Upload Modal State
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractPreviewLoading, setContractPreviewLoading] = useState(false);

  // Document Upload Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("GOVERNMENT_ID");
  const [docName, setDocName] = useState("");

  // Deal Creation Modal State
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealLoading, setDealLoading] = useState(false);
  const [dealClientName, setDealClientName] = useState("");
  const [dealClientEmail, setDealClientEmail] = useState("");
  const [dealSellingPrice, setDealSellingPrice] = useState<number>(60000);
  const [dealStatus, setDealStatus] = useState<"PENDING" | "PAID">("PENDING");

  // Deals Filtering
  const [dealSearch, setDealSearch] = useState("");
  const [dealStatusFilter, setDealStatusFilter] = useState("ALL");

  // Inline Notes State
  const [inlineNotes, setInlineNotes] = useState(referrer?.adminNotes || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Full Dossier Editor Form State
  const [dossierSaving, setDossierSaving] = useState(false);
  const [dossierForm, setDossierForm] = useState({
    name: referrer?.name || "",
    referralCode: referrer?.referralCode || "",
    companyWebsite: referrer?.companyWebsite || "",
    country: referrer?.country || "Bangladesh",
    yearsInBusiness: referrer?.yearsInBusiness ?? 1,
    isIncorporated: Boolean(referrer?.isIncorporated),
    incorporationDocUrl: referrer?.incorporationDocUrl || "",
    contactFirstName: referrer?.contactFirstName || "",
    contactLastName: referrer?.contactLastName || "",
    contactEmail: referrer?.contactEmail || "",
    contactPhone: referrer?.contactPhone || "",
    contactWhatsApp: referrer?.contactWhatsApp || "",
    contactLinkedIn: referrer?.contactLinkedIn || "",
    commissionRate: referrer?.commissionRate ?? 15,
    dealBenchmarkBdt: referrer?.dealBenchmarkBdt ?? 60000,
    minGuaranteedBountyBdt: referrer?.minGuaranteedBountyBdt ?? 9000,
    operatingHub: referrer?.operatingHub || "platform.royalmotionit.com/referrer",
    payoutMethod: referrer?.payoutMethod || "BANK_TRANSFER",
    bankName: referrer?.bankName || "",
    accountName: referrer?.accountName || "",
    accountNumber: referrer?.accountNumber || "",
    branchDistrict: referrer?.branchDistrict || "",
    branchName: referrer?.branchName || "",
    routingNumber: referrer?.routingNumber || "",
    swiftCode: referrer?.swiftCode || "",
    walletNumber: referrer?.walletNumber || "",
    adminNotes: referrer?.adminNotes || "",
  });

  // Sync state whenever referrer prop changes
  const [prevSyncKey, setPrevSyncKey] = useState<string>("");
  const currentSyncKey = referrer
    ? `${referrer.id}-${referrer.updatedAt}-${referrer.status}`
    : "";
  if (referrer && currentSyncKey !== prevSyncKey) {
    setPrevSyncKey(currentSyncKey);
    setInlineNotes(referrer.adminNotes || "");
    setDossierForm({
      name: referrer.name || "",
      referralCode: referrer.referralCode || "",
      companyWebsite: referrer.companyWebsite || "",
      country: referrer.country || "Bangladesh",
      yearsInBusiness: referrer.yearsInBusiness ?? 1,
      isIncorporated: Boolean(referrer.isIncorporated),
      incorporationDocUrl: referrer.incorporationDocUrl || "",
      contactFirstName: referrer.contactFirstName || "",
      contactLastName: referrer.contactLastName || "",
      contactEmail: referrer.contactEmail || "",
      contactPhone: referrer.contactPhone || "",
      contactWhatsApp: referrer.contactWhatsApp || "",
      contactLinkedIn: referrer.contactLinkedIn || "",
      commissionRate: referrer.commissionRate ?? 15,
      dealBenchmarkBdt: referrer.dealBenchmarkBdt ?? 60000,
      minGuaranteedBountyBdt: referrer.minGuaranteedBountyBdt ?? 9000,
      operatingHub: referrer.operatingHub || "platform.royalmotionit.com/referrer",
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
  }

  if (!referrer) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Readiness scorecard
  const hasRemittanceSet = Boolean(
    referrer.payoutMethod === "BANK_TRANSFER"
      ? referrer.bankName && referrer.accountNumber
      : referrer.walletNumber,
  );
  const totalDeals = referrer.deals?.length || 0;
  const totalBounties =
    referrer.deals?.reduce((sum, d) => sum + (d.referrerBountyBdt || 0), 0) || 0;

  const readinessChecks = [
    {
      label: "Identity & KYB Profile",
      passed: Boolean(referrer.name && referrer.country && referrer.contactEmail),
      detail: referrer.isIncorporated ? "Incorporated Agency" : "Individual / Scout",
    },
    {
      label: "Remittance Banking Setup",
      passed: hasRemittanceSet,
      detail:
        referrer.payoutMethod === "BANK_TRANSFER"
          ? `${referrer.bankName || "Pending Bank"}`
          : `${referrer.payoutMethod || "MFS"} Wallet`,
    },
    {
      label: "Referral Attribution Code",
      passed: Boolean(referrer.referralCode),
      detail: referrer.referralCode || "Missing Code",
    },
    {
      label: "Executed Legal Contract PDF",
      passed: Boolean(referrer.contractKey),
      detail: referrer.contractFileName || "Pending PDF Upload",
    },
    {
      label: "Commercial Agreement Terms",
      passed: Boolean(referrer.commissionRate > 0 && referrer.dealBenchmarkBdt > 0),
      detail: `${referrer.commissionRate || 15}% Flat Cut • ৳${(referrer.minGuaranteedBountyBdt || 9000).toLocaleString()} Min`,
    },
    {
      label: "Attribution Engine Live",
      passed: referrer.status === ReferrerStatus.ACTIVE,
      detail:
        referrer.status === ReferrerStatus.ACTIVE
          ? "Live & Attribution Active"
          : `Current: ${referrer.status}`,
    },
  ];

  const readinessScore = Math.round(
    (readinessChecks.filter((c) => c.passed).length / readinessChecks.length) * 100,
  );

  const activeLifecycleIndex = LIFECYCLE_STEPS.findIndex(
    (s) => s.status === referrer.status,
  );

  const handleUpdateStatus = async (
    newStatus: ReferrerStatus,
    reasonOverride?: string,
  ) => {
    setStatusLoading(true);
    try {
      const res = await adminUpdateReferrerStatusAction(referrer.id, {
        status: newStatus,
        statusReason: reasonOverride,
      });

      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineReason.trim()) {
      toast.error("A reason note is required when declining an application.");
      return;
    }
    await handleUpdateStatus(ReferrerStatus.REJECTED, declineReason.trim());
    setShowDeclineModal(false);
    setDeclineReason("");
  };

  const handleConfirmSuspend = async () => {
    setSuspendLoading(true);
    try {
      const res = await adminUpdateReferrerStatusAction(referrer.id, {
        status: ReferrerStatus.SUSPENDED,
        statusReason: suspendReason.trim() || "Account suspended by platform administration.",
      });

      if (res.success) {
        toast.success("Referrer account suspended.");
        setShowSuspendModal(false);
        setSuspendReason("");
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to suspend referrer.");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    setSuspendLoading(true);
    try {
      const res = await adminUpdateReferrerStatusAction(referrer.id, {
        status: ReferrerStatus.ACTIVE,
      });

      if (res.success) {
        toast.success("Referrer account reactivated successfully.");
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to unsuspend referrer.");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleUploadContract = async () => {
    if (!contractFile) {
      toast.error("Please select a signed contract PDF file.");
      return;
    }
    setContractLoading(true);
    try {
      const formData = new FormData();
      formData.append("contract", contractFile);

      const res = await adminUploadReferrerContractAction(referrer.id, formData);
      if (res.success) {
        toast.success("Signed contract uploaded. Status advanced to Contracted.");
        setShowContractModal(false);
        setContractFile(null);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to upload contract.");
    } finally {
      setContractLoading(false);
    }
  };

  const handlePreviewContract = async () => {
    setContractPreviewLoading(true);
    try {
      const res = await adminGetReferrerContractPreviewAction(referrer.id);
      if (res.success && res.previewUrl) {
        window.open(res.previewUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error(res.message || "Failed to load contract preview.");
      }
    } catch {
      toast.error("Failed to preview contract.");
    } finally {
      setContractPreviewLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!docFile) {
      toast.error("Please select a document file.");
      return;
    }
    setDocLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("docType", docType);
      formData.append("name", docName.trim() || docFile.name);

      const res = await adminUploadReferrerDocumentAction(referrer.id, formData);
      if (res.success) {
        toast.success("Document uploaded successfully.");
        setShowDocModal(false);
        setDocFile(null);
        setDocName("");
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to upload document.");
    } finally {
      setDocLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to permanently delete this document?")) return;
    try {
      const res = await adminDeleteReferrerDocumentAction(docId);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete document.");
    }
  };

  const handleCreateDeal = async () => {
    if (!dealClientName.trim()) {
      toast.error("Client name is required.");
      return;
    }
    if (!dealSellingPrice || dealSellingPrice <= 0) {
      toast.error("Valid selling price is required.");
      return;
    }
    setDealLoading(true);
    try {
      const res = await adminCreateReferrerDealAction(referrer.id, {
        clientName: dealClientName.trim(),
        clientEmail: dealClientEmail.trim() || undefined,
        sellingPriceBdt: dealSellingPrice,
        status: dealStatus,
      });

      if (res.success) {
        toast.success("Client deal logged successfully.");
        setShowDealModal(false);
        setDealClientName("");
        setDealClientEmail("");
        setDealSellingPrice(60000);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to log deal.");
    } finally {
      setDealLoading(false);
    }
  };

  const handleUpdateDealStatus = async (dealId: string, newStatus: string) => {
    try {
      const res = await adminUpdateReferrerDealStatusAction(dealId, newStatus);
      if (res.success) {
        toast.success("Deal status updated.");
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update deal status.");
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Delete this closed deal entry?")) return;
    try {
      const res = await adminDeleteReferrerDealAction(dealId);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete deal.");
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await adminUpdateReferrerDossierAction(referrer.id, {
        adminNotes: inlineNotes,
      });
      if (res.success) {
        toast.success("Admin notes saved.");
        setIsEditingNotes(false);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to save notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSaveDossier = async () => {
    setDossierSaving(true);
    try {
      const res = await adminUpdateReferrerDossierAction(referrer.id, {
        name: dossierForm.name,
        referralCode: dossierForm.referralCode,
        companyWebsite: dossierForm.companyWebsite,
        country: dossierForm.country,
        yearsInBusiness: Number(dossierForm.yearsInBusiness) || 1,
        isIncorporated: Boolean(dossierForm.isIncorporated),
        incorporationDocUrl: dossierForm.incorporationDocUrl,
        contactFirstName: dossierForm.contactFirstName,
        contactLastName: dossierForm.contactLastName,
        contactEmail: dossierForm.contactEmail,
        contactPhone: dossierForm.contactPhone,
        contactWhatsApp: dossierForm.contactWhatsApp,
        contactLinkedIn: dossierForm.contactLinkedIn,
        commissionRate: Number(dossierForm.commissionRate) || 15,
        dealBenchmarkBdt: Number(dossierForm.dealBenchmarkBdt) || 60000,
        minGuaranteedBountyBdt: Number(dossierForm.minGuaranteedBountyBdt) || 9000,
        operatingHub: dossierForm.operatingHub,
        payoutMethod: dossierForm.payoutMethod,
        bankName: dossierForm.bankName,
        accountName: dossierForm.accountName,
        accountNumber: dossierForm.accountNumber,
        branchDistrict: dossierForm.branchDistrict,
        branchName: dossierForm.branchName,
        routingNumber: dossierForm.routingNumber,
        swiftCode: dossierForm.swiftCode,
        walletNumber: dossierForm.walletNumber,
        adminNotes: dossierForm.adminNotes,
      });

      if (res.success) {
        toast.success("Referrer dossier updated successfully.");
        router.refresh();
        if (onRefresh) onRefresh();
        setActiveTab("overview");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update dossier.");
    } finally {
      setDossierSaving(false);
    }
  };

  // Filtered Deals
  const filteredDeals = (referrer.deals || []).filter((d) => {
    if (dealStatusFilter !== "ALL" && d.status !== dealStatusFilter) return false;
    if (dealSearch.trim()) {
      const q = dealSearch.toLowerCase();
      return (
        d.clientName.toLowerCase().includes(q) ||
        (d.clientEmail && d.clientEmail.toLowerCase().includes(q)) ||
        d.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl glass-panel border border-border/80 shadow-2xl">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 pb-3 border-b border-border/60 bg-muted/20 space-y-3.5 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-xl shrink-0 flex items-center justify-center text-white font-extrabold text-base shadow-sm bg-gradient-to-br from-amber-500 to-indigo-600">
                  {referrer.name.charAt(0).toUpperCase()}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl font-extrabold truncate">
                      {referrer.name}
                    </DialogTitle>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs px-2 py-0.5 font-bold border-primary/40 bg-primary/10 text-primary"
                    >
                      {referrer.code}
                    </Badge>
                    <button
                      onClick={() => copyToClipboard(referrer.code, "Code")}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy Code"
                    >
                      {copiedField === "Code" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      Readiness: {readinessScore}%
                    </Badge>
                  </div>

                  <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground/80">
                      {referrer.payoutMethod === "BANK_TRANSFER"
                        ? "Direct Bank Wire"
                        : `${referrer.payoutMethod || "MFS"} Remittance`}
                    </span>
                    <span>• {referrer.country || "Bangladesh"}</span>
                    <span className="font-mono text-primary font-bold">
                      • Code: {referrer.referralCode}
                    </span>
                    <span>• Applied {formatDate(referrer.createdAt)}</span>
                  </DialogDescription>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-xs px-3 py-1 font-bold capitalize shrink-0 ${
                  STATUS_BADGES[referrer.status] || "border-border"
                }`}
              >
                {String(referrer.status).replace(/_/g, " ").toLowerCase()}
              </Badge>
            </div>

            {/* Interactive 6-Stage Sequential Lifecycle Pipeline Stepper */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-0.5">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isStepDone =
                  referrer.status === ReferrerStatus.ACTIVE ||
                  (idx === 0 && activeLifecycleIndex >= 0) ||
                  (idx === 1 && activeLifecycleIndex >= 2) ||
                  (idx === 2 && activeLifecycleIndex >= 3) ||
                  (idx === 3 &&
                    (activeLifecycleIndex >= 3 || Boolean(referrer.contractKey))) ||
                  (idx === 4 &&
                    (activeLifecycleIndex >= 4 || referrer.status === ReferrerStatus.PAID));

                const isNextAction =
                  !isStepDone &&
                  ((idx === 1 &&
                    (referrer.status === ReferrerStatus.PENDING ||
                      referrer.status === ReferrerStatus.UNDER_REVIEW)) ||
                    (idx === 2 && referrer.status === ReferrerStatus.PROCESSING) ||
                    (idx === 3 && referrer.status === ReferrerStatus.CONTRACTED) ||
                    (idx === 4 && referrer.status === ReferrerStatus.PAID));

                return (
                  <div
                    key={step.status}
                    className={`px-2.5 py-1.5 rounded-lg border text-[10px] flex items-center justify-between gap-1 ${
                      isStepDone
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                        : isNextAction
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs ring-1 ring-primary/30"
                          : "border-border/50 bg-background/50 text-muted-foreground"
                    }`}
                  >
                    <span className="truncate">{step.label}</span>
                    {isStepDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : isNextAction ? (
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Rejection Alert Banner if status is REJECTED */}
            {referrer.status === ReferrerStatus.REJECTED && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Application Declined</span>
                </div>
                <div className="p-2 rounded-lg bg-background/80 border border-border/50 text-foreground font-mono text-[11px] leading-relaxed">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-0.5">
                    Decline Reason Note (Visible to Partner):
                  </span>
                  {referrer.statusReason || "No specific decline reason was provided."}
                </div>
              </div>
            )}

            {/* Strict Sequential Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Step 1: PENDING -> UNDER_REVIEW or REJECTED */}
                {referrer.status === ReferrerStatus.PENDING && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(ReferrerStatus.UNDER_REVIEW)}
                      disabled={statusLoading}
                      className="h-8 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Begin KYB Review
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeclineReason("");
                        setShowDeclineModal(true);
                      }}
                      disabled={statusLoading}
                      className="h-8 text-xs font-semibold gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      Decline Application
                    </Button>
                  </>
                )}

                {/* Step 2: UNDER_REVIEW -> PROCESSING or REJECTED */}
                {referrer.status === ReferrerStatus.UNDER_REVIEW && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(ReferrerStatus.PROCESSING)}
                      disabled={statusLoading}
                      className="h-8 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve Review & Mark Processing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeclineReason("");
                        setShowDeclineModal(true);
                      }}
                      disabled={statusLoading}
                      className="h-8 text-xs font-semibold gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      Decline Application
                    </Button>
                  </>
                )}

                {/* Step 3: PROCESSING -> CONTRACTED */}
                {referrer.status === ReferrerStatus.PROCESSING && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setShowContractModal(true)}
                      className="h-8 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
                    >
                      <FileSignature className="h-3.5 w-3.5" />
                      Upload Signed Contract PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeclineReason("");
                        setShowDeclineModal(true);
                      }}
                      disabled={statusLoading}
                      className="h-8 text-xs font-semibold gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      Decline Application
                    </Button>
                  </>
                )}

                {/* Step 4: CONTRACTED -> PAID */}
                {referrer.status === ReferrerStatus.CONTRACTED && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(ReferrerStatus.PAID)}
                      disabled={statusLoading}
                      className="h-8 text-xs font-bold gap-1.5 bg-teal-600 hover:bg-teal-500 text-white shadow-sm"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Confirm Commercial Terms (Mark Paid)
                    </Button>
                    {referrer.contractKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewContract}
                        disabled={contractPreviewLoading}
                        className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Preview Contract
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowContractModal(true)}
                      className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Replace Contract
                    </Button>
                  </>
                )}

                {/* Step 5: PAID -> ACTIVE */}
                {referrer.status === ReferrerStatus.PAID && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(ReferrerStatus.ACTIVE)}
                      disabled={statusLoading}
                      className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Activate Partner (Enable Attribution)
                    </Button>
                    {referrer.contractKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewContract}
                        disabled={contractPreviewLoading}
                        className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Preview Contract
                      </Button>
                    )}
                  </>
                )}

                {/* Step 6: ACTIVE -> SUSPENDED */}
                {referrer.status === ReferrerStatus.ACTIVE && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSuspendModal(true)}
                      className="h-8 text-xs font-semibold gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Suspend Account
                    </Button>
                    {referrer.contractKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewContract}
                        disabled={contractPreviewLoading}
                        className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Preview Contract
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDealModal(true)}
                      className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Log Closed Deal
                    </Button>
                  </>
                )}

                {/* SUSPENDED -> ACTIVE */}
                {referrer.status === ReferrerStatus.SUSPENDED && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleUnsuspend}
                      disabled={suspendLoading}
                      className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Unsuspend Account
                    </Button>
                    {referrer.contractKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewContract}
                        disabled={contractPreviewLoading}
                        className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Preview Contract
                      </Button>
                    )}
                  </>
                )}

                {/* REJECTED -> PENDING */}
                {referrer.status === ReferrerStatus.REJECTED && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(ReferrerStatus.PENDING)}
                    disabled={statusLoading}
                    className="h-8 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reopen Application
                  </Button>
                )}
              </div>

              {/* Live Referral Link Direct Copy */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `https://platform.royalmotionit.com/auth/register?ref=${referrer.referralCode}`,
                      "Referral Link",
                    )
                  }
                  className="h-8 text-xs font-mono gap-1.5 border-border/80"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Copy Partner Referral Link</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Header */}
          <div className="px-6 border-b border-border/60 bg-muted/10 shrink-0">
            <div className="flex items-center gap-6 text-xs font-semibold overflow-x-auto no-scrollbar">
              {[
                { key: "overview", label: "Overview & Scorecard", icon: Sparkles },
                { key: "edit_dossier", label: "Edit Dossier", icon: FileText },
                {
                  key: "deals",
                  label: `Deals & Bounties (${totalDeals})`,
                  icon: Coins,
                },
                {
                  key: "documents",
                  label: `KYB Legal Docs (${(referrer.documents || []).length})`,
                  icon: FileCheck2,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "border-primary text-primary font-bold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background">
            {/* TAB 1: OVERVIEW & SCORECARD */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* 1. Readiness Scorecard */}
                <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Network Onboarding Readiness Scorecard
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    >
                      {readinessScore}% Verified
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {readinessChecks.map((chk, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          chk.passed
                            ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                            : "border-border/60 bg-background/50 text-muted-foreground"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-[11px] truncate">
                            {chk.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {chk.detail}
                          </p>
                        </div>
                        {chk.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Key Commercial Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Commission Rate
                    </span>
                    <p className="text-xl font-black text-amber-500">
                      {referrer.commissionRate || 15}%
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      Flat cut per closed WhiteLabel
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Min Guaranteed Bounty
                    </span>
                    <p className="text-xl font-black text-foreground">
                      ৳{(referrer.minGuaranteedBountyBdt || 9000).toLocaleString()}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      BDT floor per deal
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Attributed Closed Deals
                    </span>
                    <p className="text-xl font-black text-primary">
                      {totalDeals}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      Confirmed client acquisitions
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Total Bounty Logged
                    </span>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ৳{totalBounties.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      BDT cumulative earnings
                    </span>
                  </div>
                </div>

                {/* 3. Decision Maker & Remittance Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Decision Maker Card */}
                  <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <span className="font-bold text-xs uppercase text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        Representative & Decision Maker
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        Primary Contact
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">
                          Full Name
                        </span>
                        <p className="font-bold text-foreground">
                          {referrer.contactFirstName} {referrer.contactLastName}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground text-[10px] block">
                            Email
                          </span>
                          <a
                            href={`mailto:${referrer.contactEmail}`}
                            className="font-mono text-primary hover:underline truncate block"
                          >
                            {referrer.contactEmail}
                          </a>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] block">
                            WhatsApp / Phone
                          </span>
                          {referrer.contactWhatsApp ? (
                            <a
                              href={`https://wa.me/${referrer.contactWhatsApp.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <MessageSquare className="h-3 w-3" />
                              {referrer.contactWhatsApp}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Not provided</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                        <div>
                          <span className="text-muted-foreground text-[10px] block">
                            Operating Country
                          </span>
                          <span className="font-semibold text-foreground">
                            {referrer.country || "Bangladesh"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] block">
                            Years in Business
                          </span>
                          <span className="font-semibold text-foreground">
                            {referrer.yearsInBusiness} Year(s)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remittance Ledger Card */}
                  <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <span className="font-bold text-xs uppercase text-foreground flex items-center gap-1.5">
                        <Landmark className="h-3.5 w-3.5 text-primary" />
                        Remittance & Banking Ledger
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono border-primary/30">
                        {referrer.payoutMethod === "BANK_TRANSFER"
                          ? "Bank Transfer"
                          : `${referrer.payoutMethod || "MFS"} Wallet`}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      {referrer.payoutMethod === "BANK_TRANSFER" ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Bank Name
                              </span>
                              <span className="font-bold text-foreground">
                                {referrer.bankName || "Not configured"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Account Name
                              </span>
                              <span className="font-semibold text-foreground">
                                {referrer.accountName || "Not configured"}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              Account Number
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-foreground">
                                {referrer.accountNumber || "Not configured"}
                              </span>
                              {referrer.accountNumber && (
                                <button
                                  onClick={() =>
                                    copyToClipboard(referrer.accountNumber || "", "Account Number")
                                  }
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 text-[11px]">
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Branch & District
                              </span>
                              <span>
                                {referrer.branchName || "—"},{" "}
                                {referrer.branchDistrict || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Routing / Swift
                              </span>
                              <span className="font-mono">
                                {referrer.routingNumber || referrer.swiftCode || "—"}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              MFS Provider
                            </span>
                            <span className="font-bold text-foreground">
                              {referrer.payoutMethod || "bKash / Nagad / Rocket"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              Wallet Mobile Number
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-lg text-primary">
                                {referrer.walletNumber || "Not configured"}
                              </span>
                              {referrer.walletNumber && (
                                <button
                                  onClick={() =>
                                    copyToClipboard(referrer.walletNumber || "", "Wallet Number")
                                  }
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Admin Internal Notes */}
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <span className="font-bold text-xs uppercase text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Administrator Internal Notes & Dossier History
                    </span>
                    {!isEditingNotes ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingNotes(true)}
                        className="h-7 text-xs text-primary"
                      >
                        Edit Notes
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsEditingNotes(false);
                            setInlineNotes(referrer.adminNotes || "");
                          }}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={isSavingNotes}
                          className="h-7 text-xs bg-primary text-primary-foreground"
                        >
                          Save Notes
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <Textarea
                      value={inlineNotes}
                      onChange={(e) => setInlineNotes(e.target.value)}
                      placeholder="Add compliance notes, partner meetings, custom negotiated bounties, or audit logs..."
                      rows={3}
                      className="text-xs"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {referrer.adminNotes ||
                        "No internal administrative notes logged for this partner."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: EDIT DOSSIER */}
            {activeTab === "edit_dossier" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-4">
                  <span className="font-bold text-xs uppercase text-foreground block pb-2 border-b border-border/50">
                    Agency & Organization Dossier
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Partner / Agency Name</Label>
                      <Input
                        value={dossierForm.name}
                        onChange={(e) =>
                          setDossierForm({ ...dossierForm, name: e.target.value })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Attribution Referral Code</Label>
                      <Input
                        value={dossierForm.referralCode}
                        onChange={(e) =>
                          setDossierForm({
                            ...dossierForm,
                            referralCode: e.target.value.toUpperCase(),
                          })
                        }
                        className="h-9 text-xs font-mono uppercase"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Country</Label>
                      <Input
                        value={dossierForm.country}
                        onChange={(e) =>
                          setDossierForm({ ...dossierForm, country: e.target.value })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Company Website</Label>
                      <Input
                        value={dossierForm.companyWebsite}
                        onChange={(e) =>
                          setDossierForm({
                            ...dossierForm,
                            companyWebsite: e.target.value,
                          })
                        }
                        className="h-9 text-xs"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Switch
                      checked={dossierForm.isIncorporated}
                      onCheckedChange={(checked) =>
                        setDossierForm({ ...dossierForm, isIncorporated: checked })
                      }
                      id="incorp-switch"
                    />
                    <Label htmlFor="incorp-switch" className="text-xs font-medium cursor-pointer">
                      Officially Incorporated Legal Entity (LLC / Ltd / Corp)
                    </Label>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-4">
                  <span className="font-bold text-xs uppercase text-foreground block pb-2 border-b border-border/50">
                    Primary Representative & Contact Info
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">First Name</Label>
                      <Input
                        value={dossierForm.contactFirstName}
                        onChange={(e) =>
                          setDossierForm({
                            ...dossierForm,
                            contactFirstName: e.target.value,
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Last Name</Label>
                      <Input
                        value={dossierForm.contactLastName}
                        onChange={(e) =>
                          setDossierForm({
                            ...dossierForm,
                            contactLastName: e.target.value,
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Contact Email</Label>
                      <Input
                        value={dossierForm.contactEmail}
                        onChange={(e) =>
                          setDossierForm({
                            ...dossierForm,
                            contactEmail: e.target.value,
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">WhatsApp / Mobile Number</Label>
                      <Input
                        value={dossierForm.contactWhatsApp}
                        onChange={(e) =>
                          setDossierForm({
                            ...dossierForm,
                            contactWhatsApp: e.target.value,
                          })
                        }
                        className="h-9 text-xs"
                        placeholder="+8801700000000"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-4">
                  <span className="font-bold text-xs uppercase text-foreground block pb-2 border-b border-border/50">
                    Commercial Terms & Remittance Setup
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Commission Rate (%)</Label>
                      <Input
                        type="number"
                        value={dossierForm.commissionRate}
                        onChange={(e) =>
                          setDossierForm({
                            ...dossierForm,
                            commissionRate: Number(e.target.value),
                          })
                        }
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Benchmark Price (BDT)</Label>
                      <Input
                        type="number"
                        value={dossierForm.dealBenchmarkBdt}
                        onChange={(e) =>
                          setDossierForm({
                            ...dossierForm,
                            dealBenchmarkBdt: Number(e.target.value),
                          })
                        }
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Min Bounty Floor (BDT)</Label>
                      <Input
                        type="number"
                        value={dossierForm.minGuaranteedBountyBdt}
                        onChange={(e) =>
                          setDossierForm({
                            ...dossierForm,
                            minGuaranteedBountyBdt: Number(e.target.value),
                          })
                        }
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs">Remittance Method</Label>
                    <Select
                      items={{
                        BANK_TRANSFER: "Bank Transfer / Wire",
                        BKASH: "bKash (MFS)",
                        NAGAD: "Nagad (MFS)",
                        ROCKET: "Rocket (MFS)",
                      }}
                      value={dossierForm.payoutMethod}
                      onValueChange={(val) =>
                        setDossierForm({
                          ...dossierForm,
                          payoutMethod: val || "BANK_TRANSFER",
                        })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer / Wire</SelectItem>
                        <SelectItem value="BKASH">bKash (MFS)</SelectItem>
                        <SelectItem value="NAGAD">Nagad (MFS)</SelectItem>
                        <SelectItem value="ROCKET">Rocket (MFS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dossierForm.payoutMethod === "BANK_TRANSFER" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Bank Name</Label>
                        <Input
                          value={dossierForm.bankName}
                          onChange={(e) =>
                            setDossierForm({ ...dossierForm, bankName: e.target.value })
                          }
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Account Name</Label>
                        <Input
                          value={dossierForm.accountName}
                          onChange={(e) =>
                            setDossierForm({
                              ...dossierForm,
                              accountName: e.target.value,
                            })
                          }
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Account Number</Label>
                        <Input
                          value={dossierForm.accountNumber}
                          onChange={(e) =>
                            setDossierForm({
                              ...dossierForm,
                              accountNumber: e.target.value,
                            })
                          }
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Branch Name & District</Label>
                        <Input
                          value={dossierForm.branchName}
                          onChange={(e) =>
                            setDossierForm({
                              ...dossierForm,
                              branchName: e.target.value,
                            })
                          }
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Routing Number</Label>
                        <Input
                          value={dossierForm.routingNumber}
                          onChange={(e) =>
                            setDossierForm({
                              ...dossierForm,
                              routingNumber: e.target.value,
                            })
                          }
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">SWIFT Code</Label>
                        <Input
                          value={dossierForm.swiftCode}
                          onChange={(e) =>
                            setDossierForm({
                              ...dossierForm,
                              swiftCode: e.target.value,
                            })
                          }
                          className="h-9 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs">Mobile Wallet Number</Label>
                      <Input
                        value={dossierForm.walletNumber}
                        onChange={(e) =>
                          setDossierForm({
                            ...dossierForm,
                            walletNumber: e.target.value,
                          })
                        }
                        className="h-9 text-xs font-mono"
                        placeholder="01700000000"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs">Internal Admin Notes</Label>
                    <Textarea
                      value={dossierForm.adminNotes}
                      onChange={(e) =>
                        setDossierForm({ ...dossierForm, adminNotes: e.target.value })
                      }
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    onClick={handleSaveDossier}
                    disabled={dossierSaving}
                    className="h-9 text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
                  >
                    {dossierSaving ? "Saving..." : "Save Dossier Changes"}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 3: DEALS & BOUNTIES */}
            {activeTab === "deals" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search client deals..."
                      value={dealSearch}
                      onChange={(e) => setDealSearch(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      items={{
                        ALL: "All Deals",
                        PENDING: "Pending Payout",
                        PAID: "Paid Bounty",
                      }}
                      value={dealStatusFilter}
                      onValueChange={(val) => setDealStatusFilter(val || "ALL")}
                    >
                      <SelectTrigger className="h-8 text-xs w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Deals</SelectItem>
                        <SelectItem value="PENDING">Pending Payout</SelectItem>
                        <SelectItem value="PAID">Paid Bounty</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      onClick={() => setShowDealModal(true)}
                      className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Log Client Deal
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="text-[10px] uppercase font-bold">
                        <TableHead>Deal Code</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Contract Price (BDT)</TableHead>
                        <TableHead>Referrer Bounty (15%)</TableHead>
                        <TableHead>Payout Status</TableHead>
                        <TableHead>Date Logged</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                            No closed client deals recorded for this partner yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDeals.map((deal) => (
                          <TableRow key={deal.id} className="text-xs">
                            <TableCell className="font-mono font-bold text-primary">
                              {deal.code}
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-bold text-foreground block">
                                  {deal.clientName}
                                </span>
                                {deal.clientEmail && (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {deal.clientEmail}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono font-semibold">
                              ৳{deal.sellingPriceBdt.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              ৳{deal.referrerBountyBdt.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-mono ${
                                  deal.status === "PAID"
                                    ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                                    : "border-amber-500/30 text-amber-600 bg-amber-500/10"
                                }`}
                              >
                                {deal.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-[11px]">
                              {formatDate(deal.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {deal.status !== "PAID" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUpdateDealStatus(deal.id, "PAID")}
                                    className="h-7 text-[11px] text-emerald-600 hover:text-emerald-500"
                                  >
                                    Mark Paid
                                  </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteDeal(deal.id)}
                                    className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* TAB 4: LEGAL & DOCUMENTS */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                {/* 1. Partnership Contract PDF Banner */}
                <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-purple-500" />
                      <span className="font-bold text-xs uppercase text-foreground">
                        Executed Referrer Agreement Contract
                      </span>
                    </div>
                    {referrer.contractKey ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 bg-emerald-500/10 gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Signed Contract Uploaded
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-amber-500/30 text-amber-600 bg-amber-500/10 gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        Contract Pending Upload
                      </Badge>
                    )}
                  </div>

                  {referrer.contractKey ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card text-xs">
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-foreground truncate">
                          {referrer.contractFileName || "Referrer_Partnership_Agreement.pdf"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Uploaded {formatDate(referrer.contractUploadedAt || referrer.updatedAt)} • By{" "}
                          {referrer.contractUploadedBy || "Administrator"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handlePreviewContract}
                          disabled={contractPreviewLoading}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {contractPreviewLoading ? "Opening..." : "Download / Preview"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowContractModal(true)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Replace
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-lg border border-dashed border-border/70 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">
                        No signed partnership contract has been attached to this referrer profile.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setShowContractModal(true)}
                        className="h-8 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-500 text-white"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload Executed Contract PDF
                      </Button>
                    </div>
                  )}
                </div>

                {/* 2. Additional KYB Supporting Documents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase text-foreground flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                      KYB Verification Documents & Proofs
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setShowDocModal(true)}
                      className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Upload Document
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border/70 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="text-[10px] uppercase font-bold">
                          <TableHead>Document Type</TableHead>
                          <TableHead>File Name</TableHead>
                          <TableHead>Uploaded At</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(referrer.documents || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                              No supporting KYB verification documents uploaded yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          referrer.documents?.map((doc) => (
                            <TableRow key={doc.id} className="text-xs">
                              <TableCell className="font-semibold text-foreground">
                                {DOC_TYPE_LABELS[doc.docType] || doc.docType}
                              </TableCell>
                              <TableCell className="font-mono text-muted-foreground text-[11px]">
                                {doc.fileName}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-[11px]">
                                {formatDate(doc.createdAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {doc.fileUrl && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(doc.fileUrl || "", "_blank")}
                                      className="h-7 text-xs gap-1"
                                    >
                                      <Download className="h-3 w-3" />
                                      View
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 1: Decline Modal */}
      <Dialog open={showDeclineModal} onOpenChange={setShowDeclineModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Decline Referrer Application
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide a clear reason note for declining this partner application. This will be visible to the partner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs">Decline Reason Note (Required)</Label>
            <Textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Identity verification failed, unverified banking details, duplicate account..."
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeclineModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={statusLoading || !declineReason.trim()}
              onClick={handleConfirmDecline}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Suspend Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Suspend Referrer Partner
            </DialogTitle>
            <DialogDescription className="text-xs">
              Suspending this partner will immediately invalidate their referral code and halt referral attribution across platform registrations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs">Suspension Reason</Label>
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Policy violation, fraudulent activity, mutual partner agreement termination..."
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuspendModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={suspendLoading}
              onClick={handleConfirmSuspend}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              Suspend Partner Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Contract Upload Modal */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-purple-600" />
              Upload Signed Partnership Contract PDF
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload the fully signed and executed PDF agreement. Uploading will advance this partner to Contracted stage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Select PDF File</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
            </div>
            {contractFile && (
              <p className="text-[11px] text-muted-foreground font-mono">
                Selected: {contractFile.name} ({(contractFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContractModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={contractLoading || !contractFile}
              onClick={handleUploadContract}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              {contractLoading ? "Uploading to S3..." : "Upload Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: Log Closed Deal Modal */}
      <Dialog open={showDealModal} onOpenChange={setShowDealModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Log Closed Client Acquisition Deal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record a closed WhiteLabel client deal attributed to this partner. The 15% bounty is calculated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Client Organization / Label Name</Label>
              <Input
                value={dealClientName}
                onChange={(e) => setDealClientName(e.target.value)}
                placeholder="e.g. Apex Music Group"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Client Email (Optional)</Label>
              <Input
                value={dealClientEmail}
                onChange={(e) => setDealClientEmail(e.target.value)}
                placeholder="contact@apexmusic.com"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Contract Price (BDT)</Label>
                <Input
                  type="number"
                  value={dealSellingPrice}
                  onChange={(e) => setDealSellingPrice(Number(e.target.value))}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Partner Bounty (15%)</Label>
                <div className="h-9 px-3 rounded-lg border border-border/70 bg-muted/30 flex items-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ৳{Math.round(dealSellingPrice * ((referrer.commissionRate || 15) / 100)).toLocaleString()} BDT
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Payout Status</Label>
              <Select
                items={{
                  PENDING: "Pending Remittance",
                  PAID: "Disbursed / Paid",
                }}
                value={dealStatus}
                onValueChange={(val: any) => setDealStatus(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending Remittance</SelectItem>
                  <SelectItem value="PAID">Disbursed / Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDealModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={dealLoading || !dealClientName.trim()}
              onClick={handleCreateDeal}
              className="bg-primary text-primary-foreground font-bold"
            >
              {dealLoading ? "Logging..." : "Confirm & Log Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: KYB Document Upload Modal */}
      <Dialog open={showDocModal} onOpenChange={setShowDocModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" />
              Upload KYB Legal Document
            </DialogTitle>
            <DialogDescription className="text-xs">
              Attach supporting verification files (Government ID, Trade License, Bank Verification).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Document Type</Label>
              <Select
                items={DOC_TYPE_LABELS}
                value={docType}
                onValueChange={(val) => setDocType(val || "GOVERNMENT_ID")}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Document Name / Label (Optional)</Label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Founder NID Front & Back"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Select File</Label>
              <Input
                type="file"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={docLoading || !docFile}
              onClick={handleUploadDocument}
              className="bg-primary text-primary-foreground font-bold"
            >
              {docLoading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
