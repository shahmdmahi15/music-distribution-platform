"use client";

import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  UserPen,
  Save,
  Shield,
  Crown,
  Briefcase,
  UserCheck2,
  User,
} from "lucide-react";
import {
  AdminUpdatePlatformUserInput,
  adminUpdatePlatformUserSchema,
} from "@/schemas/admin/users/platform/admin-update-platform-user.schema";
import { adminUpdatePlatformUserAction } from "@/actions/admin/users/platform/admin-update-platform-user.action";
import { PlatformUserItem } from "@/types/platform-user";
import { Role } from "@/types/user";

const roleLabels: Record<string, string> = {
  [Role.OWNER]: "Owner (Full System Access)",
  [Role.ADMIN]: "Admin (Administrative Control)",
  [Role.MANAGER]: "Manager (Operations & Releases)",
  [Role.STAFF]: "Staff (Support & Review)",
  [Role.CLIENT]: "Client (Standard User)",
};

interface EditPlatformUserDialogProps {
  user: PlatformUserItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole?: Role;
}

export function EditPlatformUserDialog({
  user,
  open,
  onOpenChange,
  currentUserRole,
}: EditPlatformUserDialogProps) {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      role: user?.role || Role.CLIENT,
      emailVerified: user?.emailVerified ?? false,
      twoFactorEnabled: user?.twoFactorEnabled ?? false,
    },
    validators: {
      onSubmit: adminUpdatePlatformUserSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      if (!user) return;
      try {
        const result = await adminUpdatePlatformUserAction(user.id, value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;
                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof AdminUpdatePlatformUserInput;
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

        toast.success(result.message || "Platform user updated successfully!");
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred while updating user.");
      }
    },
  });

  // Re-sync form when user prop changes
  useEffect(() => {
    if (user) {
      form.setFieldValue("firstName", user.firstName);
      form.setFieldValue("lastName", user.lastName);
      form.setFieldValue("email", user.email);
      form.setFieldValue("role", user.role);
      form.setFieldValue("emailVerified", user.emailVerified);
      form.setFieldValue("twoFactorEnabled", user.twoFactorEnabled);
    }
  }, [user, form]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <UserPen className="h-5 w-5" />
            <DialogTitle className="text-xl">Edit Platform User</DialogTitle>
          </div>
          <DialogDescription>
            Update user information, assigned role hierarchy, or verification status.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 pt-2"
        >
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="firstName">
              {(field) => {
                const hasError =
                  field.state.meta.errors && field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasError ? "true" : undefined}>
                    <FieldLabel className="text-xs font-semibold">
                      First Name
                    </FieldLabel>
                    <Input
                      placeholder="e.g. John"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="bg-background/80"
                    />
                    {hasError && (
                      <FieldError className="text-xs">
                        {field.state.meta.errors.join(", ")}
                      </FieldError>
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="lastName">
              {(field) => {
                const hasError =
                  field.state.meta.errors && field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasError ? "true" : undefined}>
                    <FieldLabel className="text-xs font-semibold">
                      Last Name
                    </FieldLabel>
                    <Input
                      placeholder="e.g. Doe"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="bg-background/80"
                    />
                    {hasError && (
                      <FieldError className="text-xs">
                        {field.state.meta.errors.join(", ")}
                      </FieldError>
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          {/* Email Address */}
          <form.Field name="email">
            {(field) => {
              const hasError =
                field.state.meta.errors && field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasError ? "true" : undefined}>
                  <FieldLabel className="text-xs font-semibold">
                    Email Address
                  </FieldLabel>
                  <Input
                    type="email"
                    placeholder="user@musicplatform.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="bg-background/80"
                  />
                  {hasError && (
                    <FieldError className="text-xs">
                      {field.state.meta.errors.join(", ")}
                    </FieldError>
                  )}
                </Field>
              );
            }}
          </form.Field>

          {/* Role Selection */}
          <form.Field name="role">
            {(field) => {
              const hasError =
                field.state.meta.errors && field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasError ? "true" : undefined}>
                  <FieldLabel className="text-xs font-semibold">
                    Platform Role
                  </FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as Role)}
                  >
                    <SelectTrigger className="w-full bg-background/80">
                      <SelectValue placeholder="Select platform role">
                        {(val) => roleLabels[val as string] || val || "Select platform role"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {currentUserRole === Role.OWNER && (
                        <SelectItem value={Role.OWNER}>
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            <span>Owner (Full System Access)</span>
                          </div>
                        </SelectItem>
                      )}
                      <SelectItem value={Role.ADMIN}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <span>Admin (Administrative Control)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={Role.MANAGER}>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-purple-500" />
                          <span>Manager (Operations & Releases)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={Role.STAFF}>
                        <div className="flex items-center gap-2">
                          <UserCheck2 className="h-4 w-4 text-teal-500" />
                          <span>Staff (Support & Review)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={Role.CLIENT}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-500" />
                          <span>Client (Standard User)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {hasError && (
                    <FieldError className="text-xs">
                      {field.state.meta.errors.join(", ")}
                    </FieldError>
                  )}
                </Field>
              );
            }}
          </form.Field>

          {/* Account Options Switches */}
          <div className="rounded-xl border border-border/60 p-3.5 space-y-3 bg-muted/20">
            <form.Field name="emailVerified">
              {(field) => (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer" htmlFor="edit-verified-switch">
                      Email Verified
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Enable or disable email verification flag.
                    </p>
                  </div>
                  <Switch
                    id="edit-verified-switch"
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="twoFactorEnabled">
              {(field) => (
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer" htmlFor="edit-2fa-switch">
                      Two-Factor Authentication (2FA)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Toggle 2FA requirement for this account.
                    </p>
                  </div>
                  <Switch
                    id="edit-2fa-switch"
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </div>
              )}
            </form.Field>
          </div>

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
                  className="bg-primary text-primary-foreground font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
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
