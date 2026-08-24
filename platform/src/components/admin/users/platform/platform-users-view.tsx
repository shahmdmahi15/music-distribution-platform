"use client";

import { useState } from "react";
import {
  PlatformUserItem,
  PlatformUsersPagination,
  PlatformUsersStats as StatsType,
} from "@/types/platform-user";
import { Role } from "@/types/user";
import { PlatformUsersStats, PlatformUsersRoleBadges } from "./platform-users-stats";
import { PlatformUsersFilterBar } from "./platform-users-filter-bar";
import { PlatformUsersTable } from "./platform-users-table";
import { CreatePlatformUserDialog } from "./create-platform-user-dialog";

interface PlatformUsersViewProps {
  users: PlatformUserItem[];
  pagination: PlatformUsersPagination;
  stats: StatsType;
  currentUserId?: string;
  currentUserRole?: Role;
}

export function PlatformUsersView({
  users,
  pagination,
  stats,
  currentUserId,
  currentUserRole,
}: PlatformUsersViewProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="w-full max-w-full min-w-0 space-y-6">
      {/* Metrics Cards */}
      <div className="space-y-3">
        <PlatformUsersStats stats={stats} />
        <PlatformUsersRoleBadges roleCounts={stats.roleCounts} />
      </div>

      {/* Filter and Search Bar */}
      <PlatformUsersFilterBar
        users={users}
        onOpenCreateDialog={() => setCreateDialogOpen(true)}
      />

      {/* Main Interactive Data Table */}
      <PlatformUsersTable
        users={users}
        pagination={pagination}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onOpenCreateDialog={() => setCreateDialogOpen(true)}
      />

      {/* Create Platform User Dialog */}
      <CreatePlatformUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
