import { meAction } from "@/actions/auth/me.action";
import { adminGetLinkedAccountsAction } from "@/actions/admin/profile/admin-get-linked-accounts.action";
import { AdminProfileView } from "@/components/admin/profile/admin-profile-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, UserCheck } from "lucide-react";

export default async function AdminProfilePage() {
  const res = await meAction();
  const linkedAccountsRes = await adminGetLinkedAccountsAction();

  if (!res.success || !res.user) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {res.message || "Failed to load user profile. Please log in again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary">
          <UserCheck className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Admin Profile & Settings
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your personal details, profile picture, security credentials, and linked accounts.
        </p>
      </div>

      {/* Interactive Profile View */}
      <AdminProfileView
        user={res.user}
        linkedAccounts={linkedAccountsRes.linkedAccounts}
      />
    </div>
  );
}
