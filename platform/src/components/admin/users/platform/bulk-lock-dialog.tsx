"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Lock, AlertTriangle } from "lucide-react";
import { adminBulkLockPlatformUsersAction } from "@/actions/admin/users/platform/admin-bulk-lock-platform-users.action";

interface BulkLockDialogProps {
  userIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const durationLabels: Record<string, string> = {
  "60": "1 Hour",
  "360": "6 Hours",
  "1440": "24 Hours (1 Day)",
  "10080": "7 Days (1 Week)",
  "43200": "30 Days (1 Month)",
  permanent: "Indefinite / Permanent",
};

export function BulkLockDialog({
  userIds,
  open,
  onOpenChange,
  onSuccess,
}: BulkLockDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState("1440");

  const handleBulkLock = async () => {
    setLoading(true);
    try {
      const lockMinutes =
        duration === "permanent" ? undefined : Number(duration);
      const res = await adminBulkLockPlatformUsersAction({
        userIds,
        locked: true,
        lockMinutes,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message || "Accounts locked successfully!");
      onOpenChange(false);
      onSuccess();
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to perform bulk lock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
            <Lock className="h-5 w-5" />
            <DialogTitle className="text-xl">
              Bulk Lock ({userIds.length}) Accounts
            </DialogTitle>
          </div>
          <DialogDescription>
            Locking will instantly terminate active sessions for all {userIds.length} selected user(s) and prevent them from signing in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>
              Your own account and other owner accounts (if you are not an owner) are automatically protected from bulk locking.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Lock Duration
            </label>
            <Select
              value={duration}
              onValueChange={(val) => setDuration(val || "1440")}
            >
              <SelectTrigger className="w-full bg-background/80">
                <SelectValue placeholder="Select duration">
                  {(val) =>
                    durationLabels[val as string] || val || "Select duration"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 Hour</SelectItem>
                <SelectItem value="360">6 Hours</SelectItem>
                <SelectItem value="1440">24 Hours (1 Day)</SelectItem>
                <SelectItem value="10080">7 Days (1 Week)</SelectItem>
                <SelectItem value="43200">30 Days (1 Month)</SelectItem>
                <SelectItem value="permanent">Indefinite / Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleBulkLock}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Locking Accounts...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Lock {userIds.length} User(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
