"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Lock,
  UserCheck,
  Globe,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Trash2,
  Sparkles,
  AlertTriangle,
  UserPlus,
  Search,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  Mail,
  Sliders,
  Settings,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WhiteLabelBranding, WhiteLabelSignupModel, WhiteLabelUserRole } from "@/types/whitelabel";
import { WhiteLabelSubNav } from "./whitelabel-subnav";
import {
  RegistrationPolicyData,
  InviteCodeItem,
  RegistrationPolicySettings,
  clientUpdateRegistrationPolicyAction,
} from "@/actions/client/whitelabel/client-registration-policy.action";
import {
  PortalUserItem,
  clientApprovePortalUserAction,
  clientDeletePortalUserAction,
} from "@/actions/client/whitelabel/client-portal-users.action";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientRegistrationPolicyViewProps {
  branding: WhiteLabelBranding;
  initialPolicy: RegistrationPolicyData;
  initialUsers: PortalUserItem[];
}

export function ClientRegistrationPolicyView({
  branding,
  initialPolicy,
  initialUsers,
}: ClientRegistrationPolicyViewProps) {
  const [isPending, startTransition] = useTransition();

  // Active Policy Selection State
  const [selectedModel, setSelectedModel] = useState<WhiteLabelSignupModel>(
    initialPolicy.userSignupModel || WhiteLabelSignupModel.INVITE_ONLY,
  );
  const [activeModel, setActiveModel] = useState<WhiteLabelSignupModel>(
    initialPolicy.userSignupModel || WhiteLabelSignupModel.INVITE_ONLY,
  );

  // Policy Settings State
  const [policySettings, setPolicySettings] = useState<RegistrationPolicySettings>(
    initialPolicy.policySettings || {
      inviteCodes: [],
      requireEmailVerification: true,
      defaultRole: "CLIENT",
      customWelcomeMessage: "",
      allowDirectApplication: true,
    },
  );

  // Invite Codes list
  const [inviteCodes, setInviteCodes] = useState<InviteCodeItem[]>(
    initialPolicy.policySettings?.inviteCodes || [],
  );

  // Users list for Pending Approvals
  const [users, setUsers] = useState<PortalUserItem[]>(initialUsers);

  // Filter pending approvals
  const pendingUsers = useMemo(
    () => users.filter((u) => u.isApproved === false),
    [users],
  );

  // Search filter for invite codes
  const [inviteSearch, setInviteSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Invite Code Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newMaxUses, setNewMaxUses] = useState<string>("1");
  const [newExpiryDays, setNewExpiryDays] = useState<string>("30");
  const [newNote, setNewNote] = useState("");

  const portalDomain = branding.customDomain
    ? `https://${branding.customDomain}`
    : branding.subdomain
      ? `https://${branding.subdomain}.platform.royalmotionit.com`
      : "https://platform.royalmotionit.com";

  // Generate random invite code
  const generateRandomCode = () => {
    const prefix = branding.code
      ? branding.code.slice(0, 4).toUpperCase()
      : "VIP";
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${randomHex}`;
  };

  const handleOpenCreateModal = () => {
    setNewCode(generateRandomCode());
    setNewMaxUses("1");
    setNewExpiryDays("30");
    setNewNote("");
    setIsCreateOpen(true);
  };

  // Save Policy Change
  const handleSavePolicyChange = () => {
    startTransition(async () => {
      const res = await clientUpdateRegistrationPolicyAction({
        userSignupModel: selectedModel,
        policySettings: {
          ...policySettings,
          inviteCodes,
        },
      });

      if (res.success) {
        setActiveModel(selectedModel);
        toast.success(res.message || "Registration policy updated successfully.");
      } else {
        toast.error(res.message || "Failed to update registration policy.");
      }
    });
  };

  // Create new invite code
  const handleCreateInviteCode = () => {
    if (!newCode.trim()) {
      toast.error("Invite code cannot be empty.");
      return;
    }

    const maxUses =
      newMaxUses === "unlimited"
        ? null
        : parseInt(newMaxUses, 10) || 1;

    let expiresAt: string | null = null;
    if (newExpiryDays !== "never") {
      const days = parseInt(newExpiryDays, 10) || 30;
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiresAt = d.toISOString();
    }

    const newItem: InviteCodeItem = {
      code: newCode.trim().toUpperCase(),
      maxUses,
      usedCount: 0,
      expiresAt,
      note: newNote.trim() || undefined,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const updatedCodes = [newItem, ...inviteCodes];
    setInviteCodes(updatedCodes);
    setIsCreateOpen(false);

    // Save to backend
    startTransition(async () => {
      const res = await clientUpdateRegistrationPolicyAction({
        userSignupModel: activeModel,
        policySettings: {
          ...policySettings,
          inviteCodes: updatedCodes,
        },
      });

      if (res.success) {
        toast.success(`Invite code "${newItem.code}" created and active.`);
      } else {
        toast.error("Failed to save new invite code.");
      }
    });
  };

  // Revoke/Delete Invite Code
  const handleRevokeInviteCode = (codeStr: string) => {
    const updatedCodes = inviteCodes.filter((c) => c.code !== codeStr);
    setInviteCodes(updatedCodes);

    startTransition(async () => {
      const res = await clientUpdateRegistrationPolicyAction({
        userSignupModel: activeModel,
        policySettings: {
          ...policySettings,
          inviteCodes: updatedCodes,
        },
      });

      if (res.success) {
        toast.info(`Invite code "${codeStr}" has been revoked.`);
      } else {
        toast.error("Failed to revoke invite code.");
      }
    });
  };

  // Copy code or link to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Approve a pending user
  const handleApproveUser = async (userId: string, email: string) => {
    try {
      const res = await clientApprovePortalUserAction(userId);
      if (res.success) {
        toast.success(`User ${email} has been approved and activated.`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isApproved: true } : u)),
        );
      } else {
        toast.error(res.message || "Failed to approve user.");
      }
    } catch {
      toast.error("An error occurred while approving user.");
    }
  };

  // Reject / delete a pending user
  const handleRejectUser = async (userId: string, email: string) => {
    if (
      !confirm(
        `Are you sure you want to decline registration for ${email}? This account will be removed.`,
      )
    ) {
      return;
    }

    try {
      const res = await clientDeletePortalUserAction(userId);
      if (res.success) {
        toast.info(`Registration application for ${email} declined.`);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        toast.error(res.message || "Failed to decline user.");
      }
    } catch {
      toast.error("An error occurred while declining user.");
    }
  };

  // Save Safety Rules
  const handleSaveSafetyRules = () => {
    startTransition(async () => {
      const res = await clientUpdateRegistrationPolicyAction({
        userSignupModel: activeModel,
        policySettings: {
          ...policySettings,
          inviteCodes,
        },
      });

      if (res.success) {
        toast.success("Registration security rules saved successfully.");
      } else {
        toast.error("Failed to save rules.");
      }
    });
  };

  // Filtered invite codes
  const filteredInviteCodes = useMemo(() => {
    if (!inviteSearch.trim()) return inviteCodes;
    const q = inviteSearch.toLowerCase();
    return inviteCodes.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        (c.note && c.note.toLowerCase().includes(q)),
    );
  }, [inviteCodes, inviteSearch]);

  const hasUnsavedPolicyChange = selectedModel !== activeModel;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Status Nav */}
      <WhiteLabelSubNav
        tenantName={branding.name}
        tenantCode={branding.code}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      {/* Main Header & Overview Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border/70 bg-card shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UserCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Registration &amp; Onboarding Policy
            </h1>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manage how independent artists, recording creators, and catalog
            partners gain access to your portal domain (Step 3 of 8).
          </p>
        </div>

        {/* Live Metrics Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-xs py-1 px-3 bg-muted/50 border-border/80 text-foreground font-mono flex items-center gap-1.5"
          >
            <span className="text-muted-foreground">Active Policy:</span>
            <span className="font-semibold text-primary">
              {activeModel.replace(/_/g, " ")}
            </span>
          </Badge>
          {pendingUsers.length > 0 && (
            <Badge
              variant="outline"
              className="text-xs py-1 px-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold animate-pulse flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pendingUsers.length} Pending Approval</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Interactive Policy Selector Strip (Step 3 Options) */}
      <Card className="border-border/80 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Select Sign-Up &amp; Onboarding Mode</span>
                {hasUnsavedPolicyChange && (
                  <Badge className="bg-amber-500 text-white text-[10px]">
                    Unsaved Selection
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Switch policies dynamically whenever needed. Changes take effect
                instantly across your custom portal registration page.
              </CardDescription>
            </div>

            <Button
              onClick={handleSavePolicyChange}
              disabled={!hasUnsavedPolicyChange || isPending}
              size="sm"
              className={cn(
                "text-xs font-semibold h-9 px-4 gap-1.5 transition-all shadow-xs",
                hasUnsavedPolicyChange
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md animate-pulse"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>
                {hasUnsavedPolicyChange
                  ? "Save & Activate Policy"
                  : "Policy Active"}
              </span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Invite Only */}
            <div
              onClick={() => setSelectedModel(WhiteLabelSignupModel.INVITE_ONLY)}
              className={cn(
                "p-5 rounded-xl border cursor-pointer transition-all space-y-3 relative group",
                selectedModel === WhiteLabelSignupModel.INVITE_ONLY
                  ? "border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/40"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/20",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                {selectedModel === WhiteLabelSignupModel.INVITE_ONLY && (
                  <CheckCircle2 className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-foreground">
                    Invite Only
                  </h3>
                  {activeModel === WhiteLabelSignupModel.INVITE_ONLY && (
                    <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Only creators who hold a valid, unexpired invite code or
                  invitation link can register. Public self-signup is locked.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <Badge className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                  Recommended for Record Labels
                </Badge>
              </div>
            </div>

            {/* 2. Admin Approval */}
            <div
              onClick={() =>
                setSelectedModel(WhiteLabelSignupModel.ADMIN_APPROVAL)
              }
              className={cn(
                "p-5 rounded-xl border cursor-pointer transition-all space-y-3 relative group",
                selectedModel === WhiteLabelSignupModel.ADMIN_APPROVAL
                  ? "border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/40"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/20",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                {selectedModel === WhiteLabelSignupModel.ADMIN_APPROVAL && (
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-foreground">
                    Admin Approval
                  </h3>
                  {activeModel === WhiteLabelSignupModel.ADMIN_APPROVAL && (
                    <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-600 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Creators can apply freely on the portal, but accounts remain
                  locked in pending state until reviewed and approved by staff.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <Badge className="text-[10px] bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">
                  Best for Vetted Distribution
                </Badge>
              </div>
            </div>

            {/* 3. Open Registration */}
            <div
              onClick={() =>
                setSelectedModel(WhiteLabelSignupModel.OPEN_REGISTRATION)
              }
              className={cn(
                "p-5 rounded-xl border cursor-pointer transition-all space-y-3 relative group",
                selectedModel === WhiteLabelSignupModel.OPEN_REGISTRATION
                  ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/40"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/20",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Globe className="w-4.5 h-4.5" />
                </div>
                {selectedModel ===
                  WhiteLabelSignupModel.OPEN_REGISTRATION && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-foreground">
                    Open Registration
                  </h3>
                  {activeModel ===
                    WhiteLabelSignupModel.OPEN_REGISTRATION && (
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Any creator can register, confirm their email, and immediately
                  upload tracks, view royalties, and release music self-serve.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <Badge className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                  Self-Serve Aggregators
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Operations & Workspace Tabs */}
      <Tabs defaultValue="invites" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border/60">
          <TabsTrigger
            value="invites"
            className="text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-primary" />
            <span>Invite Codes &amp; Links</span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 min-w-4 text-center font-mono"
            >
              {inviteCodes.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger
            value="approvals"
            className="text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-primary" />
            <span>Pending Approvals Queue</span>
            {pendingUsers.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500 text-white font-mono">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="rules"
            className="text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Security Rules &amp; Custom Messages</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: INVITE CODES & DIRECT LINKS */}
        <TabsContent value="invites" className="space-y-4">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">
                    Authorized Invitation Codes
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Generate unique or campaign invite codes to distribute to
                    artists. Codes can have max redemption caps and expiration
                    dates.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleOpenCreateModal}
                    size="sm"
                    className="text-xs font-semibold h-8.5 gap-1.5 bg-primary text-primary-foreground shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Generate Invite Code</span>
                  </Button>
                </div>
              </div>

              {/* Search bar */}
              <div className="pt-3">
                <div className="relative max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={inviteSearch}
                    onChange={(e) => setInviteSearch(e.target.value)}
                    placeholder="Search codes or notes..."
                    className="pl-8 text-xs h-8"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold w-48">
                      Invite Code &amp; Link
                    </TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    <TableHead className="text-xs font-bold">Usage</TableHead>
                    <TableHead className="text-xs font-bold">Expires</TableHead>
                    <TableHead className="text-xs font-bold">
                      Reference / Note
                    </TableHead>
                    <TableHead className="text-xs font-bold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInviteCodes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-10 text-muted-foreground text-xs"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <KeyRound className="w-8 h-8 text-muted-foreground/50" />
                          <p className="font-semibold text-foreground">
                            No invitation codes generated yet
                          </p>
                          <p className="max-w-sm text-xs leading-relaxed">
                            Click &ldquo;Generate Invite Code&rdquo; above to
                            create an exclusive registration key or link for
                            your artists.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInviteCodes.map((codeItem) => {
                      const isExpired =
                        codeItem.expiresAt &&
                        new Date(codeItem.expiresAt) < new Date();
                      const isExhausted =
                        codeItem.maxUses &&
                        codeItem.usedCount >= codeItem.maxUses;
                      const isLive =
                        codeItem.isActive !== false &&
                        !isExpired &&
                        !isExhausted;

                      const inviteUrl = `${portalDomain}/auth/register?code=${codeItem.code}`;

                      return (
                        <TableRow key={codeItem.code} className="text-xs">
                          <TableCell className="font-mono font-bold">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border/80">
                                {codeItem.code}
                              </span>
                              <Button
                                onClick={() =>
                                  handleCopy(codeItem.code, `code-${codeItem.code}`)
                                }
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Copy code"
                              >
                                {copiedCode === `code-${codeItem.code}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                onClick={() =>
                                  handleCopy(inviteUrl, `url-${codeItem.code}`)
                                }
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Copy direct registration link with code"
                              >
                                {copiedCode === `url-${codeItem.code}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <ExternalLink className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell>
                            {isLive ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                                Active
                              </Badge>
                            ) : isExhausted ? (
                              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                                Exhausted
                              </Badge>
                            ) : isExpired ? (
                              <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px]">
                                Expired
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Revoked
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            <span className="font-mono">
                              {codeItem.usedCount}{" "}
                              <span className="text-muted-foreground">
                                /{" "}
                                {codeItem.maxUses !== null &&
                                codeItem.maxUses !== undefined
                                  ? codeItem.maxUses
                                  : "∞"}
                              </span>
                            </span>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {codeItem.expiresAt ? (
                              new Date(codeItem.expiresAt).toLocaleDateString()
                            ) : (
                              <span className="italic">Never</span>
                            )}
                          </TableCell>

                          <TableCell className="text-muted-foreground max-w-xs truncate">
                            {codeItem.note || "—"}
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              onClick={() => handleRevokeInviteCode(codeItem.code)}
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              <span>Revoke</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PENDING APPROVALS QUEUE */}
        <TabsContent value="approvals" className="space-y-4">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>Pending Creator Registrations</span>
                {pendingUsers.length > 0 && (
                  <Badge className="bg-amber-500 text-white text-[11px]">
                    {pendingUsers.length} awaiting review
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                When &ldquo;Admin Approval&rdquo; is active, newly registered
                creators appear here. Review and approve their accounts to grant
                portal access.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold">User</TableHead>
                    <TableHead className="text-xs font-bold">Email</TableHead>
                    <TableHead className="text-xs font-bold">Role</TableHead>
                    <TableHead className="text-xs font-bold">Applied On</TableHead>
                    <TableHead className="text-xs font-bold text-right">
                      Decision
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10 text-muted-foreground text-xs"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <ShieldCheck className="w-9 h-9 text-emerald-500" />
                          <p className="font-semibold text-foreground">
                            No Pending Registrations
                          </p>
                          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                            All creator signups have been approved. New
                            applicants will appear here for review.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingUsers.map((pUser) => (
                      <TableRow key={pUser.id} className="text-xs">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7 text-[10px]">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {pUser.firstName?.[0]}
                                {pUser.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-semibold text-foreground block">
                                {pUser.firstName} {pUser.lastName}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {pUser.code}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="font-mono text-foreground">
                          {pUser.email}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {pUser.role}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {new Date(pUser.createdAt).toLocaleDateString()} at{" "}
                          {new Date(pUser.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              onClick={() =>
                                handleApproveUser(pUser.id, pUser.email)
                              }
                              size="sm"
                              className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              <span>Approve</span>
                            </Button>
                            <Button
                              onClick={() =>
                                handleRejectUser(pUser.id, pUser.email)
                              }
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-border/80"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: REGISTRATION RULES & CUSTOM MESSAGES */}
        <TabsContent value="rules" className="space-y-4">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">
                Registration Safety &amp; Onboarding Rules
              </CardTitle>
              <CardDescription className="text-xs">
                Fine-tune verification policies, default role assignments, and
                portal messaging.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Require Email Verification */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">
                      Require Email Verification
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Enforce 6-digit email confirmation code before granting
                      dashboard access.
                    </p>
                  </div>
                  <Switch
                    checked={policySettings.requireEmailVerification ?? true}
                    onCheckedChange={(checked) =>
                      setPolicySettings((prev) => ({
                        ...prev,
                        requireEmailVerification: checked,
                      }))
                    }
                  />
                </div>

                {/* Default Assigned Role */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <Label className="text-xs font-bold text-foreground">
                    Default User Role upon Registration
                  </Label>
                  <Select
                    value={policySettings.defaultRole || "CLIENT"}
                    onValueChange={(val) =>
                      setPolicySettings((prev) => ({
                        ...prev,
                        defaultRole: val || "CLIENT",
                      }))
                    }
                  >
                    <SelectTrigger className="text-xs h-8.5 bg-background">
                      <SelectValue placeholder="Select default role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENT">
                        Artist / Client (Standard Roster)
                      </SelectItem>
                      <SelectItem value="STAFF">
                        Staff Member (Internal Label Ops)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    All newly registered accounts will be created under this
                    permission tier.
                  </p>
                </div>
              </div>

              {/* Custom Welcome Message / Guidelines */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  Custom Welcome &amp; Onboarding Guidelines Notice
                </Label>
                <textarea
                  rows={4}
                  value={policySettings.customWelcomeMessage || ""}
                  onChange={(e) =>
                    setPolicySettings((prev) => ({
                      ...prev,
                      customWelcomeMessage: e.target.value,
                    }))
                  }
                  placeholder="e.g. Welcome to Royal Music Records! Please ensure your ISRC and WAV audio assets match our 24-bit studio delivery standards."
                  className="w-full rounded-lg border border-border/80 bg-background p-3 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-[11px] text-muted-foreground">
                  This guidance notice is presented to users on your registration
                  page when applying for account access.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSaveSafetyRules}
                  disabled={isPending}
                  size="sm"
                  className="text-xs font-semibold h-8.5 px-4 bg-primary text-primary-foreground"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save Registration Rules</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE INVITE CODE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Generate Invitation Code</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create an exclusive invite code for an artist or distributor to
              register on your portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Invite Code</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. VIP-ARTIST-2026"
                  className="text-xs font-mono font-bold uppercase h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewCode(generateRandomCode())}
                  className="text-xs h-9"
                  title="Generate new random code"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Max Uses</Label>
                <Select
                  value={newMaxUses}
                  onValueChange={(val) => setNewMaxUses(val || "1")}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Max uses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Single use only)</SelectItem>
                    <SelectItem value="5">5 registrations</SelectItem>
                    <SelectItem value="25">25 registrations</SelectItem>
                    <SelectItem value="100">100 registrations</SelectItem>
                    <SelectItem value="unlimited">Unlimited uses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Expiration</Label>
                <Select
                  value={newExpiryDays}
                  onValueChange={(val) => setNewExpiryDays(val || "30")}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Expires in" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="365">1 Year</SelectItem>
                    <SelectItem value="never">Never Expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Reference / Note (Optional)
              </Label>
              <Input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Signed Band: Sunset Waves (Single Release)"
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateInviteCode}
              className="text-xs font-semibold h-9 bg-primary text-primary-foreground"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1.5" />
              <span>Create &amp; Activate Code</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
