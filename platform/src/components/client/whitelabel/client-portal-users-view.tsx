"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Mail,
  Calendar,
  UserPlus,
  MoreHorizontal,
  UserPen,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Check,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Clock,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UserX,
  X,
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
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WhiteLabelBranding, WhiteLabelUserRole } from "@/types/whitelabel";
import {
  PortalUserItem,
  clientCreatePortalUserAction,
  clientUpdatePortalUserAction,
  clientResetPortalUserPasswordAction,
  clientToggleLockPortalUserAction,
  clientApprovePortalUserAction,
  clientDeletePortalUserAction,
} from "@/actions/client/whitelabel/client-portal-users.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientPortalUsersViewProps {
  initialUsers: PortalUserItem[];
  branding: WhiteLabelBranding;
}

const ROLE_OPTIONS = [
  {
    value: WhiteLabelUserRole.CLIENT,
    label: "Artist / Client",
    description: "Uploads tracks, manages releases, and views royalty reports.",
  },
  {
    value: WhiteLabelUserRole.MANAGER,
    label: "Catalog Manager",
    description: "Oversees multiple artist profiles and catalog deliverables.",
  },
  {
    value: WhiteLabelUserRole.STAFF,
    label: "Portal Staff",
    description: "Assists with artist onboarding and distribution metadata.",
  },
  {
    value: WhiteLabelUserRole.ADMIN,
    label: "Portal Admin",
    description: "Full administrative controls across the WhiteLabel portal.",
  },
];

function generateSecurePassword(): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const specials = "!@#$%^&*";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pass += specials.charAt(Math.floor(Math.random() * specials.length));
  pass += Math.floor(Math.random() * 90 + 10);
  return pass;
}

export function ClientPortalUsersView({
  initialUsers,
  branding,
}: ClientPortalUsersViewProps) {
  const router = useRouter();
  const [users, setUsers] = useState<PortalUserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: WhiteLabelUserRole.CLIENT,
    password: "",
    autoGeneratePassword: true,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Created User Credentials Success Modal State
  const [credentialsModal, setCredentialsModal] = useState<{
    userName: string;
    email: string;
    code: string;
    tempPassword?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCreatedPassword, setShowCreatedPassword] = useState(false);

  // Edit User Modal State (Email strictly non-changeable!)
  const [editingUser, setEditingUser] = useState<PortalUserItem | null>(null);
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    role: WhiteLabelUserRole;
  }>({
    firstName: "",
    lastName: "",
    role: WhiteLabelUserRole.CLIENT,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Password Reset Modal State
  const [passwordResetUser, setPasswordResetUser] =
    useState<PortalUserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Delete User Confirmation Modal State
  const [deletingUser, setDeletingUser] = useState<PortalUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Action Loading State (e.g., toggling lock or approving)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // --- Filtering & Tab Segregation ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

      const isLocked = Boolean(
        u.lockedUntil && new Date(u.lockedUntil) > new Date(),
      );
      const isPending = u.isApproved === false;

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = !isLocked && !isPending;
      if (statusFilter === "PENDING") matchesStatus = isPending;
      if (statusFilter === "LOCKED") matchesStatus = isLocked;
      if (statusFilter === "2FA") matchesStatus = u.twoFactorEnabled;

      let matchesTab = true;
      if (activeTab === "pending") matchesTab = isPending;
      if (activeTab === "artists")
        matchesTab = u.role === WhiteLabelUserRole.CLIENT;
      if (activeTab === "staff") {
        matchesTab = [
          WhiteLabelUserRole.MANAGER,
          WhiteLabelUserRole.STAFF,
          WhiteLabelUserRole.ADMIN,
          WhiteLabelUserRole.OWNER,
        ].includes(u.role);
      }

      return matchesSearch && matchesRole && matchesStatus && matchesTab;
    });
  }, [users, search, roleFilter, statusFilter, activeTab]);

  // Analytics counts
  const totalUsers = users.length;
  const pendingApprovalsCount = users.filter(
    (u) => u.isApproved === false,
  ).length;
  const clientCount = users.filter(
    (u) => u.role === WhiteLabelUserRole.CLIENT,
  ).length;
  const staffCount = users.filter((u) =>
    [
      WhiteLabelUserRole.MANAGER,
      WhiteLabelUserRole.STAFF,
      WhiteLabelUserRole.ADMIN,
      WhiteLabelUserRole.OWNER,
    ].includes(u.role),
  ).length;

  // --- Handlers ---
  const handleOpenCreate = () => {
    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      role: WhiteLabelUserRole.CLIENT,
      password: "",
      autoGeneratePassword: true,
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.firstName.trim() || !createForm.lastName.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    if (!createForm.email.trim() || !createForm.email.includes("@")) {
      toast.error("A valid email address is required.");
      return;
    }
    if (!createForm.autoGeneratePassword && createForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await clientCreatePortalUserAction({
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        role: createForm.role,
        password: createForm.autoGeneratePassword
          ? undefined
          : createForm.password,
      });

      if (res.success && res.user) {
        toast.success(res.message);
        setUsers((prev) => [res.user!, ...prev]);
        setIsCreateOpen(false);

        // Open credentials success modal
        setCredentialsModal({
          userName: `${res.user.firstName} ${res.user.lastName}`,
          email: res.user.email,
          code: res.user.code,
          tempPassword:
            res.temporaryPassword ||
            (createForm.autoGeneratePassword ? undefined : createForm.password),
        });
      } else {
        toast.error(res.message || "Failed to create portal user.");
      }
    } catch {
      toast.error("An unexpected error occurred while creating user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (user: PortalUserItem) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      toast.error("First and last name are required.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await clientUpdatePortalUserAction(editingUser.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        role: editForm.role,
      });

      if (res.success && res.user) {
        toast.success(res.message);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id ? { ...u, ...res.user! } : u,
          ),
        );
        setEditingUser(null);
      } else {
        toast.error(res.message || "Failed to update portal user.");
      }
    } catch {
      toast.error("An error occurred while updating portal user.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenPasswordReset = (user: PortalUserItem) => {
    setPasswordResetUser(user);
    setNewPassword(generateSecurePassword());
    setShowResetPassword(false);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await clientResetPortalUserPasswordAction(
        passwordResetUser.id,
        newPassword,
      );

      if (res.success) {
        toast.success(res.message);
        setCredentialsModal({
          userName: `${passwordResetUser.firstName} ${passwordResetUser.lastName}`,
          email: passwordResetUser.email,
          code: passwordResetUser.code,
          tempPassword: newPassword,
        });
        setPasswordResetUser(null);
      } else {
        toast.error(res.message || "Failed to reset password.");
      }
    } catch {
      toast.error("An error occurred while resetting password.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleToggleLock = async (user: PortalUserItem) => {
    setActionLoadingId(user.id);
    try {
      const res = await clientToggleLockPortalUserAction(user.id);
      if (res.success && res.user) {
        toast.success(res.message);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, ...res.user! } : u)),
        );
      } else {
        toast.error(res.message || "Failed to toggle user lock.");
      }
    } catch {
      toast.error("An error occurred while changing user lock state.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveUser = async (user: PortalUserItem) => {
    setActionLoadingId(user.id);
    try {
      const res = await clientApprovePortalUserAction(user.id);
      if (res.success && res.user) {
        toast.success(res.message);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isApproved: true } : u)),
        );
      } else {
        toast.error(res.message || "Failed to approve user.");
      }
    } catch {
      toast.error("An error occurred while approving user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await clientDeletePortalUserAction(deletingUser.id);
      if (res.success) {
        toast.success(res.message);
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        setDeletingUser(null);
      } else {
        toast.error(res.message || "Failed to delete user.");
      }
    } catch {
      toast.error("An error occurred while deleting user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeVariant = (role: WhiteLabelUserRole) => {
    switch (role) {
      case WhiteLabelUserRole.OWNER:
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25";
      case WhiteLabelUserRole.ADMIN:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25";
      case WhiteLabelUserRole.MANAGER:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
      case WhiteLabelUserRole.STAFF:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25";
      default:
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <WhiteLabelSubNav
        tenantName={branding.name}
        tenantCode={branding.code}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      {/* Top Banner & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/70 bg-card shadow-xs">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>WhiteLabel User Management</span>
            {pendingApprovalsCount > 0 && (
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] animate-pulse">
                {pendingApprovalsCount} Pending Approval
              </Badge>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage creator profiles, approve registered artists, configure role
            permissions, and maintain account security for {branding.name}.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          size="sm"
          className="text-xs font-semibold gap-1.5 h-9 shrink-0 cursor-pointer shadow-sm"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Add Portal User</span>
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Users
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {totalUsers}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Pending Approvals
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${pendingApprovalsCount > 0 ? "text-amber-500" : "text-foreground"}`}
              >
                {pendingApprovalsCount}
              </p>
            </div>
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${pendingApprovalsCount > 0 ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"}`}
            >
              <Clock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Artists &amp; Clients
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {clientCount}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Staff &amp; Managers
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {staffCount}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card with Tabs & Filters */}
      <Card className="border-border/70 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60 bg-muted/15 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs for quick views */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full sm:w-auto"
            >
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs">
                  All Users ({totalUsers})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs relative">
                  Pending Approvals
                  {pendingApprovalsCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="artists" className="text-xs">
                  Artists ({clientCount})
                </TabsTrigger>
                <TabsTrigger value="staff" className="text-xs">
                  Staff &amp; Admins ({staffCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Clear Filters Button if any active */}
            {(search ||
              roleFilter !== "ALL" ||
              statusFilter !== "ALL" ||
              activeTab !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                  setActiveTab("all");
                }}
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground self-end"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>

          {/* Search & Shadcn Select Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, code, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-8 text-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter (Shadcn Select) */}
            <div className="w-full sm:w-44">
              <Select
                value={roleFilter}
                onValueChange={(val) => setRoleFilter(val ?? "ALL")}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value={WhiteLabelUserRole.CLIENT}>
                    Artist / Client
                  </SelectItem>
                  <SelectItem value={WhiteLabelUserRole.MANAGER}>
                    Catalog Manager
                  </SelectItem>
                  <SelectItem value={WhiteLabelUserRole.STAFF}>
                    Portal Staff
                  </SelectItem>
                  <SelectItem value={WhiteLabelUserRole.ADMIN}>
                    Portal Admin
                  </SelectItem>
                  <SelectItem value={WhiteLabelUserRole.OWNER}>
                    Owner
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter (Shadcn Select) */}
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val ?? "ALL")}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending Approval</SelectItem>
                  <SelectItem value="LOCKED">Locked</SelectItem>
                  <SelectItem value="2FA">2FA Enabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* User Table (Shadcn Table) */}
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-foreground">
                No Users Found
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                {search ||
                roleFilter !== "ALL" ||
                statusFilter !== "ALL" ||
                activeTab !== "all"
                  ? "No users match your criteria. Try adjusting or resetting filters."
                  : "No artists or team members registered yet. Click 'Add Portal User' to create the first account."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold pl-4">
                    User &amp; Email
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    User Code
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Role</TableHead>
                  <TableHead className="text-xs font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">
                    Joined Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => {
                  const isLocked = Boolean(
                    u.lockedUntil && new Date(u.lockedUntil) > new Date(),
                  );
                  const isPending = u.isApproved === false;
                  const isLoading = actionLoadingId === u.id;

                  return (
                    <TableRow key={u.id} className="text-xs">
                      {/* User & Email */}
                      <TableCell className="pl-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" className="border border-border">
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {u.firstName.charAt(0)}
                              {u.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                              <span>
                                {u.firstName} {u.lastName}
                              </span>
                              {u.twoFactorEnabled && (
                                <span
                                  title="2FA Enabled"
                                  className="inline-flex items-center"
                                >
                                  <Shield className="h-3 w-3 text-blue-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono">
                              <span className="truncate">{u.email}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(u.email, `email-${u.id}`, "Email")
                                }
                                className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                                title="Copy Email"
                              >
                                {copiedKey === `email-${u.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3 opacity-60" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* User Code */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(u.code, `code-${u.id}`, "User Code")
                          }
                          className="font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                          title="Click to copy user code"
                        >
                          <span>{u.code}</span>
                          {copiedKey === `code-${u.id}` ? (
                            <Check className="h-2.5 w-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-2.5 w-2.5 opacity-40" />
                          )}
                        </button>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                            getRoleBadgeVariant(u.role),
                          )}
                        >
                          {u.role}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isPending ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1"
                          >
                            <Clock className="h-2.5 w-2.5" /> Pending Approval
                          </Badge>
                        ) : isLocked ? (
                          <Badge
                            variant="outline"
                            className="bg-rose-500/10 text-rose-500 border-rose-500/30 text-[10px] gap-1"
                          >
                            <Lock className="h-2.5 w-2.5" /> Locked
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] gap-1"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="hidden md:table-cell text-muted-foreground text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Approve Action for Pending Users */}
                          {isPending && (
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              disabled={isLoading}
                              onClick={() => handleApproveUser(u)}
                              className="h-7 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2.5"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>
                                {isLoading ? "Approving..." : "Approve"}
                              </span>
                            </Button>
                          )}

                          {/* Full Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs">
                                User Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              {isPending && (
                                <DropdownMenuItem
                                  onClick={() => handleApproveUser(u)}
                                  className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                  Approve &amp; Activate
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(u)}
                                className="text-xs cursor-pointer"
                              >
                                <UserPen className="h-3.5 w-3.5 mr-2" />
                                Edit Profile
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleOpenPasswordReset(u)}
                                className="text-xs cursor-pointer"
                              >
                                <KeyRound className="h-3.5 w-3.5 mr-2" />
                                Reset Password
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleToggleLock(u)}
                                className="text-xs cursor-pointer"
                              >
                                {isLocked ? (
                                  <>
                                    <Unlock className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                    Unlock User Access
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                    Lock User Access
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingUser(u)}
                                className="text-xs text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 1. Add / Invite Portal User Modal                                         */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <span>Add Portal User</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Onboard a new creator, label manager, or staff member to{" "}
              {branding.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">First Name</Label>
                <Input
                  value={createForm.firstName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="John"
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Last Name</Label>
                <Input
                  value={createForm.lastName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  placeholder="Doe"
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="creator@recordlabel.com"
                className="text-xs font-mono"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Email will serve as permanent portal identity and cannot be
                altered later.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assigned Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(val) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    role: val as WhiteLabelUserRole,
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="font-semibold">{r.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password Strategy */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Generate Secure Password
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCreateForm((prev) => ({
                      ...prev,
                      autoGeneratePassword: !prev.autoGeneratePassword,
                    }))
                  }
                  className="h-7 text-[11px]"
                >
                  {createForm.autoGeneratePassword
                    ? "Use Custom Password"
                    : "Auto-Generate"}
                </Button>
              </div>

              {!createForm.autoGeneratePassword && (
                <div className="space-y-1">
                  <Input
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter minimum 8-character password..."
                    className="text-xs font-mono"
                    minLength={8}
                    required
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="text-xs font-semibold"
              >
                {isCreating ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. Credentials Generated Modal                                            */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(credentialsModal)}
        onOpenChange={(open) => !open && setCredentialsModal(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>User Credentials Ready</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide these login details to {credentialsModal?.userName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl border border-border/70 bg-muted/40 space-y-2.5 text-xs font-mono">
              <div>
                <span className="text-[11px] text-muted-foreground block font-sans">
                  Email
                </span>
                <div className="flex items-center justify-between text-foreground">
                  <span>{credentialsModal?.email}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        credentialsModal?.email || "",
                        "cred-email",
                        "Email",
                      )
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedKey === "cred-email" ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              {credentialsModal?.tempPassword && (
                <div>
                  <span className="text-[11px] text-muted-foreground block font-sans">
                    Temporary Password
                  </span>
                  <div className="flex items-center justify-between text-foreground">
                    <span>
                      {showCreatedPassword
                        ? credentialsModal.tempPassword
                        : "••••••••••••"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setShowCreatedPassword(!showCreatedPassword)
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showCreatedPassword ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            credentialsModal.tempPassword || "",
                            "cred-pass",
                            "Password",
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedKey === "cred-pass" ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[11px] text-muted-foreground block font-sans">
                  User Code
                </span>
                <div className="flex items-center justify-between text-foreground">
                  <span>{credentialsModal?.code}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        credentialsModal?.code || "",
                        "cred-code",
                        "User Code",
                      )
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedKey === "cred-code" ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setCredentialsModal(null)}
              className="text-xs font-semibold w-full"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3. Edit User Profile Modal (Email strictly immutable)                     */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <UserPen className="h-4 w-4 text-primary" />
              <span>Edit User Profile</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update name and role permissions. Email address is permanent and
              immutable.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            {/* Non-changeable Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Email Address (Immutable)
                </Label>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Lock className="h-2.5 w-2.5" /> Immutable
                </Badge>
              </div>
              <Input
                value={editingUser?.email || ""}
                disabled
                className="text-xs font-mono bg-muted/50 cursor-not-allowed opacity-80"
              />
              <p className="text-[11px] text-muted-foreground">
                Email address cannot be changed once registered to safeguard
                artist catalog ownership and copyright records.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">First Name</Label>
                <Input
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Last Name</Label>
                <Input
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assigned Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(val) =>
                  setEditForm((prev) => ({
                    ...prev,
                    role: val as WhiteLabelUserRole,
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="font-semibold">{r.label}</span>
                    </SelectItem>
                  ))}
                  {editingUser?.role === WhiteLabelUserRole.OWNER && (
                    <SelectItem value={WhiteLabelUserRole.OWNER}>
                      <span className="font-semibold">Owner</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdating}
                className="text-xs font-semibold"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 4. Reset Password Modal                                                   */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(passwordResetUser)}
        onOpenChange={(open) => !open && setPasswordResetUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <span>Reset User Password</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign a new password for {passwordResetUser?.firstName}{" "}
              {passwordResetUser?.lastName}. All active sessions will be
              revoked.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordResetSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">New Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewPassword(generateSecurePassword())}
                  className="h-6 text-[11px] px-2"
                >
                  Generate Random
                </Button>
              </div>
              <div className="relative">
                <Input
                  type={showResetPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs font-mono pr-10"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showResetPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPasswordResetUser(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isResettingPassword}
                className="text-xs font-semibold"
              >
                {isResettingPassword ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 5. Delete User Confirmation Modal                                         */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Confirm Delete Account</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete the portal user{" "}
              <span className="font-semibold text-foreground">
                {deletingUser?.firstName} {deletingUser?.lastName} (
                {deletingUser?.email})
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingUser(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteSubmit}
              className="text-xs font-semibold"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
