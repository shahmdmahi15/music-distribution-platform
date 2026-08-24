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
import { adminDeletePlatformUserAction } from "@/actions/admin/users/platform/admin-delete-platform-user.action";
import { PlatformUserItem } from "@/types/platform-user";

interface DeletePlatformUserDialogProps {
  user: PlatformUserItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

export function DeletePlatformUserDialog({
  user,
  open,
  onOpenChange,
  currentUserId,
}: DeletePlatformUserDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (!user) return null;

  const isSelf = user.id === currentUserId;

  const handleDelete = async () => {
    if (isSelf) {
      toast.error("You cannot delete your own account from the user management panel.");
      return;
    }

    setLoading(true);
    try {
      const res = await adminDeletePlatformUserAction(user.id);

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message || "Platform user deleted successfully.");
      onOpenChange(false);
      setConfirmText("");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred while deleting user.");
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
            <AlertDialogTitle className="text-xl">Delete Platform User</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This action is permanent and cannot be undone. All active sessions, linked OAuth accounts, and associations for this user will be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-3 text-xs text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                You are about to delete: {user.firstName} {user.lastName}
              </p>
              <p className="text-muted-foreground mt-0.5">Email: {user.email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Type <span className="font-mono text-destructive">{user.email}</span> to confirm:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Confirm email address..."
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
            onClick={handleDelete}
            disabled={confirmText !== user.email || loading || isSelf}
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
                Permanently Delete
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
