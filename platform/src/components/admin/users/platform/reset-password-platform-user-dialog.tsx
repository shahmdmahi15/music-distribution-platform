"use client";

import { useForm } from "@tanstack/react-form";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import {
  AdminResetPasswordPlatformUserInput,
  adminResetPasswordPlatformUserSchema,
} from "@/schemas/admin/users/platform/admin-reset-password-platform-user.schema";
import { adminResetPasswordPlatformUserAction } from "@/actions/admin/users/platform/admin-reset-password-platform-user.action";
import { PlatformUserItem } from "@/types/platform-user";

interface ResetPasswordPlatformUserDialogProps {
  user: PlatformUserItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordPlatformUserDialog({
  user,
  open,
  onOpenChange,
}: ResetPasswordPlatformUserDialogProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const generateStrongPassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const form = useForm({
    defaultValues: {
      newPassword: "",
    },
    validators: {
      onSubmit: adminResetPasswordPlatformUserSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      if (!user) return;
      try {
        const result = await adminResetPasswordPlatformUserAction(
          user.id,
          value,
        );

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;
                if (errorMessages && errorMessages.length > 0) {
                  const fieldName =
                    field as keyof AdminResetPasswordPlatformUserInput;
                  formApi.setFieldMeta(fieldName, (prev) => ({
                    ...prev,
                    errorMap: {
                      ...prev.errorMap,
                      onSubmit: errorMessages.join(", "),
                    },
                  }));
                }
              },
            );
          }
          return;
        }

        toast.success(result.message || "Password reset successfully!");
        form.reset();
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred while resetting password.");
      }
    },
  });

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <KeyRound className="h-5 w-5" />
            <DialogTitle className="text-xl">Reset User Password</DialogTitle>
          </div>
          <DialogDescription>
            Set a new secure password for {user.firstName} {user.lastName} ({user.email}).
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-700 dark:text-amber-300 my-1">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <span>
            Resetting the password will immediately invalidate all active login sessions across devices for security.
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 pt-2"
        >
          <form.Field name="newPassword">
            {(field) => {
              const hasError =
                field.state.meta.errors && field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasError ? "true" : undefined}>
                  <div className="flex items-center justify-between">
                    <FieldLabel className="text-xs font-semibold">
                      New Password <span className="text-destructive">*</span>
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={() => {
                        const newPass = generateStrongPassword();
                        field.handleChange(newPass);
                        setShowPassword(true);
                        toast.info("Generated a secure random password.");
                      }}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate Strong
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters..."
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="bg-background/80 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {hasError && (
                    <FieldError className="text-xs">
                      {field.state.meta.errors.join(", ")}
                    </FieldError>
                  )}
                </Field>
              );
            }}
          </form.Field>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Set New Password
                    </>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
