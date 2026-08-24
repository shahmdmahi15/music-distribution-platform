"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Crown,
  Shield,
  Briefcase,
  UserCheck2,
  User,
  MoreHorizontal,
  Eye,
  UserPen,
  KeyRound,
  Lock,
  Unlock,
  RotateCcw,
  LogOut,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  MailCheck,
  MailWarning,
  Laptop,
  Check,
  Copy,
  Users,
  X,
  UserCheck,
} from "lucide-react";
import {
  PlatformUserItem,
  PlatformUsersPagination as PaginationType,
} from "@/types/platform-user";
import { Role } from "@/types/user";
import { PlatformUserDetailsSheet } from "./platform-user-details-sheet";
import { EditPlatformUserDialog } from "./edit-platform-user-dialog";
import { LockPlatformUserDialog } from "./lock-platform-user-dialog";
import { ResetPasswordPlatformUserDialog } from "./reset-password-platform-user-dialog";
import { DeletePlatformUserDialog } from "./delete-platform-user-dialog";
import { BulkLockDialog } from "./bulk-lock-dialog";
import { BulkDeleteDialog } from "./bulk-delete-dialog";
import { adminResetAttemptsPlatformUserAction } from "@/actions/admin/users/platform/admin-reset-attempts-platform-user.action";
import { adminRevokeSessionsPlatformUserAction } from "@/actions/admin/users/platform/admin-revoke-sessions-platform-user.action";
import { adminBulkLockPlatformUsersAction } from "@/actions/admin/users/platform/admin-bulk-lock-platform-users.action";
import { adminBulkRolePlatformUsersAction } from "@/actions/admin/users/platform/admin-bulk-role-platform-users.action";
import { adminBulkRevokeSessionsPlatformUsersAction } from "@/actions/admin/users/platform/admin-bulk-revoke-sessions-platform-users.action";
import { PlatformUsersPagination } from "./platform-users-pagination";

interface PlatformUsersTableProps {
  users: PlatformUserItem[];
  pagination: PaginationType;
  currentUserId?: string;
  currentUserRole?: Role;
  onOpenCreateDialog: () => void;
}

export function PlatformUsersTable({
  users,
  pagination,
  currentUserId,
  currentUserRole,
  onOpenCreateDialog,
}: PlatformUsersTableProps) {
  const router = useRouter();

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<string | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);

  const [selectedUserForEdit, setSelectedUserForEdit] = useState<PlatformUserItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [selectedUserForLock, setSelectedUserForLock] = useState<PlatformUserItem | null>(null);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);

  const [selectedUserForResetPass, setSelectedUserForResetPass] = useState<PlatformUserItem | null>(null);
  const [resetPassDialogOpen, setResetPassDialogOpen] = useState(false);

  const [selectedUserForDelete, setSelectedUserForDelete] = useState<PlatformUserItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Bulk dialogs
  const [bulkLockDialogOpen, setBulkLockDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const allPageSelected =
    users.length > 0 && users.every((u) => selectedIds.includes(u.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${text}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenDetails = (user: PlatformUserItem) => {
    setSelectedUserForDetails(user.id);
    setDetailsSheetOpen(true);
  };

  const handleOpenEdit = (user: PlatformUserItem) => {
    setSelectedUserForEdit(user);
    setEditDialogOpen(true);
  };

  const handleOpenLock = (user: PlatformUserItem) => {
    setSelectedUserForLock(user);
    setLockDialogOpen(true);
  };

  const handleOpenResetPassword = (user: PlatformUserItem) => {
    setSelectedUserForResetPass(user);
    setResetPassDialogOpen(true);
  };

  const handleOpenDelete = (user: PlatformUserItem) => {
    setSelectedUserForDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleQuickResetAttempts = async (user: PlatformUserItem) => {
    try {
      const res = await adminResetAttemptsPlatformUserAction(user.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to reset attempts.");
    }
  };

  const handleQuickRevokeSessions = async (user: PlatformUserItem) => {
    try {
      const res = await adminRevokeSessionsPlatformUserAction(user.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to revoke sessions.");
    }
  };

  // Bulk actions handlers
  const handleBulkUnlock = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await adminBulkLockPlatformUsersAction({
        userIds: selectedIds,
        locked: false,
      });
      if (res.success) {
        toast.success(res.message);
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkChangeRole = async (role: Role) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await adminBulkRolePlatformUsersAction({
        userIds: selectedIds,
        role,
      });
      if (res.success) {
        toast.success(res.message);
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkRevokeSessions = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await adminBulkRevokeSessionsPlatformUsersAction(selectedIds);
      if (res.success) {
        toast.success(res.message);
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.OWNER:
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 font-semibold text-xs py-0.5"
          >
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        );
      case Role.ADMIN:
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 font-semibold text-xs py-0.5"
          >
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case Role.MANAGER:
        return (
          <Badge
            variant="outline"
            className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1 font-semibold text-xs py-0.5"
          >
            <Briefcase className="h-3 w-3" />
            Manager
          </Badge>
        );
      case Role.STAFF:
        return (
          <Badge
            variant="outline"
            className="border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 gap-1 font-semibold text-xs py-0.5"
          >
            <UserCheck2 className="h-3 w-3" />
            Staff
          </Badge>
        );
      case Role.CLIENT:
      default:
        return (
          <Badge
            variant="outline"
            className="border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400 gap-1 font-semibold text-xs py-0.5"
          >
            <User className="h-3 w-3" />
            Client
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-3 relative">
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                {/* Selection Checkbox */}
                <TableHead className="w-[40px] px-3">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all on this page"
                  />
                </TableHead>
                <TableHead className="w-[280px] font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  User Details
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Account Status
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Security & 2FA
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Last Active
                </TableHead>
                <TableHead className="w-[70px] text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-44 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
                        <User className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-sm text-foreground">
                        No platform users found
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Try adjusting your search criteria, clearing active filters, or add a new platform user.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenCreateDialog}
                        className="mt-2 text-xs"
                      >
                        Create Platform User
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const fullName = `${user.firstName} ${user.lastName}`;
                  const avatarFallback =
                    `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();
                  const isSelf = user.id === currentUserId;
                  const isSelected = selectedIds.includes(user.id);
                  const totalFailures =
                    user.failedLoginAttempts +
                    user.failedVerificationAttempts +
                    user.failedPasswordResetAttempts +
                    user.failedTwoFactorAttempts;

                  return (
                    <TableRow
                      key={user.id}
                      data-state={isSelected ? "selected" : undefined}
                      className={`group hover:bg-muted/30 transition-colors cursor-pointer ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                      onClick={() => handleOpenDetails(user)}
                    >
                      {/* Row Checkbox */}
                      <TableCell
                        className="px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(user.id);
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRow(user.id)}
                          aria-label={`Select ${fullName}`}
                        />
                      </TableCell>

                      {/* User Info */}
                      <TableCell
                        className="py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => handleOpenDetails(user)}
                        >
                          <Avatar className="h-10 w-10 rounded-xl border border-border/80 shadow-xs">
                            <AvatarImage
                              src={user.image || undefined}
                              alt={fullName}
                            />
                            <AvatarFallback className="rounded-xl text-xs font-bold bg-primary/10 text-primary">
                              {avatarFallback}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground hover:text-primary transition-colors flex-wrap">
                              <span className="truncate">{fullName}</span>
                              {user.code && (
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[10px] px-1.5 py-0 font-semibold border-border/80 bg-muted/40 text-foreground shrink-0"
                                >
                                  {user.code}
                                </Badge>
                              )}
                              {isSelf && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] py-0 px-1 font-normal"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                              <span>{user.email}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(user.email, user.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                                title="Copy Email"
                              >
                                {copiedId === user.id ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {getRoleBadge(user.role)}
                      </TableCell>

                      {/* Account Status */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {user.isLocked ? (
                            <Badge
                              variant="destructive"
                              className="text-xs py-0.5 px-2 font-medium flex items-center gap-1"
                              title={
                                user.lockedUntil
                                  ? `Locked until ${new Date(user.lockedUntil).toLocaleString()}`
                                  : "Indefinitely locked"
                              }
                            >
                              <Lock className="h-3 w-3" />
                              Locked
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs py-0.5 px-2 font-medium flex items-center gap-1"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </Badge>
                          )}

                          {user.emailVerified ? (
                            <span
                              className="text-emerald-600 dark:text-emerald-400 inline-flex items-center"
                              title="Email verified"
                            >
                              <MailCheck className="h-4 w-4" />
                            </span>
                          ) : (
                            <span
                              className="text-amber-500 inline-flex items-center"
                              title="Email unverified"
                            >
                              <MailWarning className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Security & 2FA */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {user.twoFactorEnabled ? (
                            <Badge
                              variant="outline"
                              className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs py-0.5 px-2 font-medium flex items-center gap-1"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              2FA Enabled
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              2FA Disabled
                            </span>
                          )}

                          {totalFailures > 0 && (
                            <Badge
                              variant="outline"
                              className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] py-0 px-1.5 font-medium"
                              title={`${totalFailures} failed security attempts recorded`}
                            >
                              {totalFailures} fails
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Last Active */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-0.5 text-xs">
                          <span className="font-medium text-foreground block">
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "Never"}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Laptop className="h-3 w-3" />
                            {user.activeSessionCount} active session(s)
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions Dropdown */}
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-xs font-semibold">
                                Platform Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleOpenDetails(user)}
                                className="text-xs cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                                View Full Details
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(user)}
                                className="text-xs cursor-pointer"
                              >
                                <UserPen className="h-3.5 w-3.5 mr-2" />
                                Edit Profile & Role
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleOpenResetPassword(user)}
                                className="text-xs cursor-pointer text-amber-600 dark:text-amber-400"
                              >
                                <KeyRound className="h-3.5 w-3.5 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                onClick={() => handleOpenLock(user)}
                                className={`text-xs cursor-pointer ${
                                  user.isLocked
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {user.isLocked ? (
                                  <>
                                    <Unlock className="h-3.5 w-3.5 mr-2" />
                                    Unlock Account
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3.5 w-3.5 mr-2" />
                                    Lock Account
                                  </>
                                )}
                              </DropdownMenuItem>

                              {totalFailures > 0 && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickResetAttempts(user)}
                                  className="text-xs cursor-pointer"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                                  Reset Failed Attempts
                                </DropdownMenuItem>
                              )}

                              {user.activeSessionCount > 0 && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickRevokeSessions(user)}
                                  className="text-xs cursor-pointer text-rose-600 dark:text-rose-400"
                                >
                                  <LogOut className="h-3.5 w-3.5 mr-2" />
                                  Revoke All Sessions ({user.activeSessionCount})
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuGroup>

                            {!isSelf && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuItem
                                    onClick={() => handleOpenDelete(user)}
                                    className="text-xs cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete Account
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Integrated Pagination Controls */}
        <PlatformUsersPagination pagination={pagination} />
      </div>

      {/* Floating Sticky Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl px-4 py-2.5 max-w-[90vw] animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 pr-2 border-r border-border/60">
            <Badge
              variant="default"
              className="bg-primary text-primary-foreground font-bold px-2 py-0.5 text-xs"
            >
              {selectedIds.length}
            </Badge>
            <span className="text-xs font-semibold text-foreground hidden sm:inline">
              Selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Bulk Lock Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkLockDialogOpen(true)}
              disabled={bulkLoading}
              className="h-8 text-xs font-medium text-rose-600 dark:text-rose-400 border-rose-500/30"
            >
              <Lock className="h-3.5 w-3.5 mr-1" />
              Lock
            </Button>

            {/* Bulk Unlock Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkUnlock}
              disabled={bulkLoading}
              className="h-8 text-xs font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            >
              <Unlock className="h-3.5 w-3.5 mr-1" />
              Unlock
            </Button>

            {/* Bulk Role Change */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bulkLoading}
                    className="h-8 text-xs font-medium"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                    Role
                  </Button>
                }
              />
              <DropdownMenuContent align="center" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-semibold">
                    Set Role To:
                  </DropdownMenuLabel>
                  {currentUserRole === Role.OWNER && (
                    <DropdownMenuItem
                      onClick={() => handleBulkChangeRole(Role.OWNER)}
                      className="text-xs cursor-pointer"
                    >
                      <Crown className="h-3.5 w-3.5 mr-2 text-amber-500" />
                      Owner
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => handleBulkChangeRole(Role.ADMIN)}
                    className="text-xs cursor-pointer"
                  >
                    <Shield className="h-3.5 w-3.5 mr-2 text-blue-500" />
                    Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkChangeRole(Role.MANAGER)}
                    className="text-xs cursor-pointer"
                  >
                    <Briefcase className="h-3.5 w-3.5 mr-2 text-purple-500" />
                    Manager
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkChangeRole(Role.STAFF)}
                    className="text-xs cursor-pointer"
                  >
                    <UserCheck2 className="h-3.5 w-3.5 mr-2 text-teal-500" />
                    Staff
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkChangeRole(Role.CLIENT)}
                    className="text-xs cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5 mr-2 text-slate-500" />
                    Client
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk Revoke Sessions */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRevokeSessions}
              disabled={bulkLoading}
              className="h-8 text-xs font-medium text-rose-600 dark:text-rose-400 border-rose-500/30 hidden md:inline-flex"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Revoke Sessions
            </Button>

            {/* Bulk Delete Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
              disabled={bulkLoading}
              className="h-8 text-xs font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIds([])}
              className="h-8 w-8 text-muted-foreground hover:text-foreground ml-1"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals and Slide-over Sheet */}
      <PlatformUserDetailsSheet
        userId={selectedUserForDetails}
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        onOpenEdit={handleOpenEdit}
        onOpenLock={handleOpenLock}
        onOpenResetPassword={handleOpenResetPassword}
        onOpenDelete={handleOpenDelete}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />

      <EditPlatformUserDialog
        user={selectedUserForEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentUserRole={currentUserRole}
      />

      <LockPlatformUserDialog
        user={selectedUserForLock}
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
      />

      <ResetPasswordPlatformUserDialog
        user={selectedUserForResetPass}
        open={resetPassDialogOpen}
        onOpenChange={setResetPassDialogOpen}
      />

      <DeletePlatformUserDialog
        user={selectedUserForDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        currentUserId={currentUserId}
      />

      <BulkLockDialog
        userIds={selectedIds}
        open={bulkLockDialogOpen}
        onOpenChange={setBulkLockDialogOpen}
        onSuccess={() => setSelectedIds([])}
      />

      <BulkDeleteDialog
        userIds={selectedIds}
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onSuccess={() => setSelectedIds([])}
      />
    </div>
  );
}
