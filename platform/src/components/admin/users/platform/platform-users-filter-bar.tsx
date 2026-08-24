"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  X,
  ArrowUpDown,
  RotateCcw,
  UserPlus,
  Filter,
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  UserX,
  Users,
  MailWarning,
} from "lucide-react";
import { Role } from "@/types/user";
import { PlatformUserItem } from "@/types/platform-user";
import { toast } from "sonner";

interface PlatformUsersFilterBarProps {
  users?: PlatformUserItem[];
  onOpenCreateDialog: () => void;
}

const roleLabels: Record<string, string> = {
  ALL: "All Roles",
  [Role.OWNER]: "Owner",
  [Role.ADMIN]: "Admin",
  [Role.MANAGER]: "Manager",
  [Role.STAFF]: "Staff",
  [Role.CLIENT]: "Client",
};

const statusLabels: Record<string, string> = {
  ALL: "All Statuses",
  ACTIVE: "Active Accounts",
  LOCKED: "Locked Accounts",
  VERIFIED: "Email Verified",
  UNVERIFIED: "Unverified",
  TWO_FACTOR_ENABLED: "2FA Protected",
  TWO_FACTOR_DISABLED: "2FA Disabled",
};

const sortLabels: Record<string, string> = {
  "createdAt:desc": "Newest First",
  "createdAt:asc": "Oldest First",
  "lastLoginAt:desc": "Recently Active",
  "firstName:asc": "Name (A-Z)",
  "email:asc": "Email (A-Z)",
  "role:asc": "Role Hierarchy",
};

export function PlatformUsersFilterBar({
  users = [],
  onOpenCreateDialog,
}: PlatformUsersFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentSearch = searchParams.get("search") || "";
  const currentRole = searchParams.get("role") || "ALL";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  // Global '/' keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!updates.page) {
      params.set("page", "1");
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm.trim() || null });
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    updateFilters({ search: null });
  };

  const handleResetAll = () => {
    setSearchTerm("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (users.length === 0) {
      toast.error("No users available to export.");
      return;
    }

    const headers = [
      "User ID",
      "First Name",
      "Last Name",
      "Email",
      "Role",
      "Status",
      "Email Verified",
      "2FA Enabled",
      "Failed Login Attempts",
      "Active Sessions",
      "Created At",
      "Last Login At",
    ];

    const csvRows = [
      headers.join(","),
      ...users.map((u) =>
        [
          `"${u.id}"`,
          `"${u.firstName.replace(/"/g, '""')}"`,
          `"${u.lastName.replace(/"/g, '""')}"`,
          `"${u.email}"`,
          `"${u.role}"`,
          `"${u.isLocked ? "Locked" : "Active"}"`,
          `"${u.emailVerified ? "Yes" : "No"}"`,
          `"${u.twoFactorEnabled ? "Yes" : "No"}"`,
          u.failedLoginAttempts,
          u.activeSessionCount,
          `"${new Date(u.createdAt).toISOString()}"`,
          `"${u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : "Never"}"`,
        ].join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `platform_users_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${users.length} users to CSV.`);
  };

  // Export JSON handler
  const handleExportJSON = () => {
    if (users.length === 0) {
      toast.error("No users available to export.");
      return;
    }

    const blob = new Blob([JSON.stringify(users, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `platform_users_export_${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${users.length} users to JSON.`);
  };

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentRole !== "ALL" ||
    currentStatus !== "ALL" ||
    currentSortBy !== "createdAt" ||
    currentSortOrder !== "desc";

  return (
    <div className="w-full space-y-3">
      {/* Row 1: Search Form + Main Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 min-w-0"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name or email... (Press /)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 bg-background/80 w-full"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  <span>Export</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-semibold">
                  Export Data
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleExportCSV}
                  className="text-xs cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportJSON}
                  className="text-xs cursor-pointer"
                >
                  <FileCode className="h-3.5 w-3.5 mr-2 text-blue-600 dark:text-blue-400" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground h-8 text-xs gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}

          <Button
            onClick={onOpenCreateDialog}
            size="sm"
            className="shadow-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Platform User
          </Button>
        </div>
      </div>

      {/* Row 2: Quick Filter Pills + Dropdown Selectors */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-0.5">
        {/* Quick Filter Segmented Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar flex-wrap">
          <Button
            variant={!hasActiveFilters ? "default" : "outline"}
            size="sm"
            onClick={handleResetAll}
            className="h-7 text-xs rounded-full px-3"
          >
            <Users className="h-3 w-3 mr-1" />
            All Users
          </Button>

          <Button
            variant={currentRole === Role.CLIENT ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ role: Role.CLIENT })}
            className="h-7 text-xs rounded-full px-3"
          >
            Clients
          </Button>

          <Button
            variant={currentStatus === "LOCKED" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ status: "LOCKED" })}
            className={`h-7 text-xs rounded-full px-3 ${
              currentStatus === "LOCKED"
                ? "bg-rose-600 text-white"
                : "text-rose-600 dark:text-rose-400 border-rose-500/30"
            }`}
          >
            <UserX className="h-3 w-3 mr-1" />
            Locked
          </Button>

          <Button
            variant={
              currentStatus === "TWO_FACTOR_ENABLED" ? "default" : "outline"
            }
            size="sm"
            onClick={() => updateFilters({ status: "TWO_FACTOR_ENABLED" })}
            className={`h-7 text-xs rounded-full px-3 ${
              currentStatus === "TWO_FACTOR_ENABLED"
                ? "bg-indigo-600 text-white"
                : "text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
            }`}
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            2FA
          </Button>

          <Button
            variant={currentStatus === "UNVERIFIED" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ status: "UNVERIFIED" })}
            className={`h-7 text-xs rounded-full px-3 ${
              currentStatus === "UNVERIFIED"
                ? "bg-amber-600 text-white"
                : "text-amber-600 dark:text-amber-400 border-amber-500/30"
            }`}
          >
            <MailWarning className="h-3 w-3 mr-1" />
            Unverified
          </Button>
        </div>

        {/* Dropdown Filters (Role, Status, Sort) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Role Filter */}
          <div className="w-[130px] shrink-0">
            <Select
              value={currentRole}
              onValueChange={(val) => updateFilters({ role: val || null })}
            >
              <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                <SelectValue placeholder="All Roles">
                  {(val) => roleLabels[val as string] || val || "All Roles"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value={Role.OWNER}>Owner</SelectItem>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                <SelectItem value={Role.MANAGER}>Manager</SelectItem>
                <SelectItem value={Role.STAFF}>Staff</SelectItem>
                <SelectItem value={Role.CLIENT}>Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-[145px] shrink-0">
            <Select
              value={currentStatus}
              onValueChange={(val) => updateFilters({ status: val || null })}
            >
              <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                <SelectValue placeholder="All Statuses">
                  {(val) => statusLabels[val as string] || val || "All Statuses"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active Accounts</SelectItem>
                <SelectItem value="LOCKED">Locked Accounts</SelectItem>
                <SelectItem value="VERIFIED">Email Verified</SelectItem>
                <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                <SelectItem value="TWO_FACTOR_ENABLED">2FA Protected</SelectItem>
                <SelectItem value="TWO_FACTOR_DISABLED">2FA Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By Dropdown */}
          <div className="w-[145px] shrink-0">
            <Select
              value={`${currentSortBy}:${currentSortOrder}`}
              onValueChange={(val) => {
                const [sortBy, sortOrder] = (val || "createdAt:desc").split(":");
                updateFilters({ sortBy, sortOrder });
              }}
            >
              <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Sort by">
                    {(val) => sortLabels[val as string] || val || "Sort by"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Newest First</SelectItem>
                <SelectItem value="createdAt:asc">Oldest First</SelectItem>
                <SelectItem value="lastLoginAt:desc">Recently Active</SelectItem>
                <SelectItem value="firstName:asc">Name (A-Z)</SelectItem>
                <SelectItem value="email:asc">Email (A-Z)</SelectItem>
                <SelectItem value="role:asc">Role Hierarchy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Row 3: Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <Filter className="h-3 w-3" />
            Active filters:
          </span>

          {currentSearch && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal"
            >
              Search: &quot;{currentSearch}&quot;
              <button
                onClick={handleClearSearch}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {currentRole !== "ALL" && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal"
            >
              Role: {roleLabels[currentRole] || currentRole}
              <button
                onClick={() => updateFilters({ role: null })}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {currentStatus !== "ALL" && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal"
            >
              Status: {statusLabels[currentStatus] || currentStatus}
              <button
                onClick={() => updateFilters({ status: null })}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
