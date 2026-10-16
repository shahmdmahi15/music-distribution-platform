"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Check,
  Copy,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  Crown,
  Shield,
  Briefcase,
  Music,
} from "lucide-react";
import { WhiteLabelUserItem } from "@/actions/admin/users/whitelabel/admin-get-whitelabel-users.action";
import { formatDate } from "@/lib/utils";

interface WhiteLabelUsersTableProps {
  initialUsers: WhiteLabelUserItem[];
  total: number;
}

export function WhiteLabelUsersTable({
  initialUsers,
  total,
}: WhiteLabelUsersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("WhiteLabel user directory updated.");
    }, 600);
  };

  // Client-side search & filtering
  const filteredUsers = initialUsers.filter((user) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      user.firstName.toLowerCase().includes(q) ||
      user.lastName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.code.toLowerCase().includes(q) ||
      user.whiteLabel.name.toLowerCase().includes(q) ||
      (user.whiteLabel.subdomain &&
        user.whiteLabel.subdomain.toLowerCase().includes(q));

    const matchesRole =
      roleFilter === "ALL" ||
      user.role.toUpperCase() === roleFilter.toUpperCase();

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case "OWNER":
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 gap-1 font-semibold text-[11px]">
            <Crown className="h-3 w-3" />
            OWNER
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 gap-1 font-semibold text-[11px]">
            <Shield className="h-3 w-3" />
            ADMIN
          </Badge>
        );
      case "MANAGER":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 gap-1 font-semibold text-[11px]">
            <Briefcase className="h-3 w-3" />
            MANAGER
          </Badge>
        );
      case "CLIENT":
      case "ARTIST":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 font-semibold text-[11px]">
            <Music className="h-3 w-3" />
            ARTIST / CLIENT
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px]">
            {role}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by user name, email, tenant name, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 min-w-[140px]">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || 'ALL')}>
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="CLIENT">Artist / Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 text-xs gap-1.5 shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Interactive Table Container */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs font-bold text-foreground">
                User
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Email
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                WhiteLabel Tenant Instance
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Role
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                2FA Status
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Created Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const fullName = `${u.firstName} ${u.lastName}`.trim();
                const initials = `${u.firstName[0] || ""}${
                  u.lastName[0] || ""
                }`.toUpperCase();

                return (
                  <TableRow
                    key={u.id}
                    className="hover:bg-muted/20 transition-colors text-xs"
                  >
                    {/* User Profile */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                          {initials}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-foreground truncate">
                            {fullName}
                          </p>
                          <span className="font-mono text-[10px] text-muted-foreground block">
                            {u.code}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-muted-foreground truncate max-w-[200px]">
                          {u.email}
                        </span>
                        <button
                          onClick={() => copyToClipboard(u.email, `email-${u.id}`)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="Copy email"
                        >
                          {copiedId === `email-${u.id}` ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* WhiteLabel Tenant Instance */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-bold text-foreground truncate">
                            {u.whiteLabel.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono px-1.5 py-0"
                          >
                            {u.whiteLabel.code}
                          </Badge>
                        </div>
                        {u.whiteLabel.subdomain && (
                          <a
                            href={`https://${u.whiteLabel.subdomain}.platform.royalmotionit.com`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10.5px] font-mono text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {u.whiteLabel.subdomain}.platform.royalmotionit.com
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell>{getRoleBadge(u.role)}</TableCell>

                    {/* 2FA Status */}
                    <TableCell>
                      {u.twoFactorEnabled ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[10.5px] font-semibold"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[10.5px] font-semibold"
                        >
                          <ShieldAlert className="h-3 w-3" />
                          Disabled
                        </Badge>
                      )}
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-36 text-center">
                  <div className="space-y-2 max-w-sm mx-auto text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto opacity-40 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">
                      No WhiteLabel Users Found
                    </p>
                    <p className="text-xs">
                      {search || roleFilter !== "ALL"
                        ? "No users matched your current search filters. Try resetting the filter."
                        : "No accounts have registered yet under active WhiteLabel tenants."}
                    </p>
                    {(search || roleFilter !== "ALL") && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setRoleFilter("ALL");
                        }}
                        className="text-xs h-7 mt-1"
                      >
                        Reset Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <strong>{filteredUsers.length}</strong> of{" "}
            <strong>{total}</strong> WhiteLabel users
          </span>
          <span className="font-mono text-[11px]">
            Partitioned via Isolated Tenant Schema
          </span>
        </div>
      </div>
    </div>
  );
}
