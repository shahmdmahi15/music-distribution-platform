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
import { Lock, Unlock, AlertTriangle, ShieldCheck } from "lucide-react";
import { adminLockPlatformUserAction } from "@/actions/admin/users/platform/admin-lock-platform-user.action";
import { PlatformUserItem } from "@/types/platform-user";

interface LockPlatformUserDialogProps {
  user: PlatformUserItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const durationLabels: Record<string, string> = {
  "60": "1 Hour",
  "360": "6 Hours",
  "1440": "24 Hours (1 Day)",
  "10080": "7 Days (1 Week)",
  "43200": "30 Days (1 Month)",
  permanent: "Indefinite / Permanent",
};

export function LockPlatformUserDialog({
  user,
  open,
  onOpenChange,
}: LockPlatformUserDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState("1440"); // default 24h (1440 minutes)

  if (!user) return null;

  const isCurrentlyLocked = user.isLocked;

  const handleToggleLock = async () => {
    setLoading(true);
    try {
      if (isCurrentlyLocked) {
        // Unlock
        const res = await adminLockPlatformUserAction(user.id, {
          locked: false,
        });

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        toast.success(res.message || "User account unlocked successfully!");
      } else {
        // Lock
        const lockMinutes = duration === "permanent" ? undefined : Number(duration);
        const res = await adminLockPlatformUserAction(user.id, {
          locked: true,
          lockMinutes,
        });

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        toast.success(res.message || "User account locked successfully!");
      }

      onOpenChange(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update lock status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div
            className={`flex items-center gap-2 mb-1 ${
              isCurrentlyLocked
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isCurrentlyLocked ? (
              <Unlock className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
            <DialogTitle className="text-xl">
              {isCurrentlyLocked ? "Unlock User Account" : "Lock User Account"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isCurrentlyLocked
              ? `Unlock access for ${user.firstName} ${user.lastName} (${user.email}). This will also clear all failed security attempt counters.`
              : `Temporarily or permanently suspend access for ${user.firstName} ${user.lastName} (${user.email}).`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isCurrentlyLocked ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 text-sm text-foreground">
              <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                Account Status: Currently Locked
              </div>
              <p className="text-xs text-muted-foreground">
                Locked until:{" "}
                <span className="font-medium text-foreground">
                  {user.lockedUntil
                    ? new Date(user.lockedUntil).toLocaleString()
                    : "Permanent / Indefinite"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Unlocking will restore standard login privileges immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>
                  Locking will immediately terminate all active sessions for this user and block them from logging in.
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
                      {(val) => durationLabels[val as string] || val || "Select duration"}
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
          )}
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
            onClick={handleToggleLock}
            disabled={loading}
            className={
              isCurrentlyLocked
                ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                : "bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            }
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : isCurrentlyLocked ? (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock Account
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Confirm Lock
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
