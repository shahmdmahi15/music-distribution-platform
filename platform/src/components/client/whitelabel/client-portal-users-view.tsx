"use client";

import { useState } from "react";
import {
  Users,
  Shield,
  Search,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhiteLabelBranding } from "@/types/whitelabel";
import { PortalUserItem } from "@/actions/client/whitelabel/client-portal-users.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";

interface ClientPortalUsersViewProps {
  initialUsers: PortalUserItem[];
  branding: WhiteLabelBranding;
}

export function ClientPortalUsersView({
  initialUsers,
  branding,
}: ClientPortalUsersViewProps) {
  const [users] = useState<PortalUserItem[]>(initialUsers);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.code.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <WhiteLabelSubNav
        tenantName={branding.name}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      <div className="space-y-6">
        {/* Header and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              WhiteLabel Portal Users
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Artists, managers, and collaborators registered on your branded WhiteLabel portal.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users or roles..."
              className="text-xs pl-8 h-9"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">User Directory</CardTitle>
                <CardDescription className="text-xs">
                  {users.length} {users.length === 1 ? "User" : "Users"} registered across your portal.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {branding.code}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border/70 rounded-xl">
                <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <div className="text-xs font-bold text-foreground">No Users Found</div>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1">
                  {search
                    ? "No users matched your search criteria."
                    : "No artists or team members have registered on your WhiteLabel portal yet."}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/60">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {u.firstName} {u.lastName}
                        </span>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {u.role}
                        </Badge>
                        {u.twoFactorEnabled && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"
                          >
                            2FA
                          </Badge>
                        )}
                        {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                          <Badge
                            variant="outline"
                            className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]"
                          >
                            Locked
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                        <span className="flex items-center gap-1 font-mono">
                          <Mail className="h-3 w-3" />
                          {u.email}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{u.code}</span>
                      </div>
                    </div>

                    <div
                      className="text-[11px] text-muted-foreground flex items-center gap-1 self-end sm:self-center"
                      suppressHydrationWarning
                    >
                      <Calendar className="h-3 w-3" />
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
