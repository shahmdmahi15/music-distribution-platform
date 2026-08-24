import { adminGetPlatformUsersAction } from "@/actions/admin/users/platform/admin-get-platform-users.action";
import { meAction } from "@/actions/auth/me.action";
import { PlatformUsersView } from "@/components/admin/users/platform/platform-users-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Users } from "lucide-react";
import { Role } from "@/types/user";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    role?: Role;
    status?: "ALL" | "ACTIVE" | "LOCKED" | "VERIFIED" | "UNVERIFIED" | "TWO_FACTOR_ENABLED" | "TWO_FACTOR_DISABLED";
    sortBy?: "createdAt" | "updatedAt" | "lastLoginAt" | "email" | "firstName" | "role";
    sortOrder?: "asc" | "desc";
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminPlatformUsersPage({
  searchParams,
}: PageProps) {
  const resolvedParams = await searchParams;

  const [usersRes, meRes] = await Promise.all([
    adminGetPlatformUsersAction({
      search: resolvedParams.search,
      role: resolvedParams.role,
      status: resolvedParams.status,
      sortBy: resolvedParams.sortBy,
      sortOrder: resolvedParams.sortOrder,
      page: resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1,
      limit: resolvedParams.limit ? parseInt(resolvedParams.limit, 10) : 10,
    }),
    meAction(),
  ]);

  if (!usersRes.success) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Platform User Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage administrative operators, system staff, and direct client accounts.
          </p>
        </div>

        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Platform Users</AlertTitle>
          <AlertDescription>
            {usersRes.message || "Failed to load platform users. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const users = usersRes.users || [];
  const pagination = usersRes.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };
  const stats = usersRes.stats || {
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    verifiedUsers: 0,
    twoFactorUsers: 0,
    roleCounts: {
      OWNER: 0,
      ADMIN: 0,
      MANAGER: 0,
      STAFF: 0,
      CLIENT: 0,
    },
  };

  const currentUserId = meRes.user?.id;
  const currentUserRole = meRes.user?.role;

  return (
    <div className="w-full min-w-0 p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Platform User Management
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          View, create, search, and manage platform administrator and client accounts. Enforce security policies, manage credentials, and control access permissions.
        </p>
      </div>

      {/* Main Interactive Management View */}
      <PlatformUsersView
        users={users}
        pagination={pagination}
        stats={stats}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
