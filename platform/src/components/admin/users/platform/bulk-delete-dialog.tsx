"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, AlertTriangle } from "lucide-react";
import { adminBulkDeletePlatformUsersAction } from "@/actions/admin/users/platform/admin-bulk-delete-platform-users.action";

interface BulkDeleteDialogProps {
  userIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkDeleteDialog({
  userIds,
  open,
  onOpenChange,
  onSuccess,
}: BulkDeleteDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      const res = await adminBulkDeletePlatformUsersAction(userIds);

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message || "Users deleted successfully.");
      onOpenChange(false);
      setConfirmText("");
      onSuccess();
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during bulk deletion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <Trash2 className="h-5 w-5" />
            <AlertDialogTitle className="text-xl">
              Bulk Delete ({userIds.length}) Users
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This action is permanent and cannot be undone. All active sessions, linked OAuth accounts, and profile data for these {userIds.length} user(s) will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-3 text-xs text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                You are about to delete {userIds.length} platform account(s).
              </p>
              <p className="text-muted-foreground mt-0.5">
                Self-deletion and sole owner accounts are protected and skipped automatically.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Type <span className="font-mono text-destructive">DELETE</span> to confirm:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE in capital letters..."
              className="bg-background/80"
            />
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setConfirmText("");
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={confirmText !== "DELETE" || loading}
            className="font-semibold"
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {userIds.length} User(s)
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
