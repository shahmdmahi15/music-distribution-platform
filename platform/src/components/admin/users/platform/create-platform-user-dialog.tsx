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
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Crown,
  Briefcase,
  UserCheck2,
  User,
} from "lucide-react";
import {
  AdminCreatePlatformUserInput,
  adminCreatePlatformUserSchema,
} from "@/schemas/admin/users/platform/admin-create-platform-user.schema";
import { adminCreatePlatformUserAction } from "@/actions/admin/users/platform/admin-create-platform-user.action";
import { Role } from "@/types/user";

const roleLabels: Record<string, string> = {
  [Role.OWNER]: "Owner (Full System Access)",
  [Role.ADMIN]: "Admin (Administrative Control)",
  [Role.MANAGER]: "Manager (Operations & Releases)",
  [Role.STAFF]: "Staff (Support & Review)",
  [Role.CLIENT]: "Client (Standard User)",
};

interface CreatePlatformUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole?: Role;
}

export function CreatePlatformUserDialog({
  open,
  onOpenChange,
  currentUserRole,
}: CreatePlatformUserDialogProps) {
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
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: Role.CLIENT,
      emailVerified: true,
      twoFactorEnabled: false,
    },
    validators: {
      onSubmit: adminCreatePlatformUserSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await adminCreatePlatformUserAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;
                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof AdminCreatePlatformUserInput;
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

        toast.success(result.message || "Platform user created successfully!");
        form.reset();
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred while creating user.");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <UserPlus className="h-5 w-5" />
            <DialogTitle className="text-xl">Create Platform User</DialogTitle>
          </div>
          <DialogDescription>
            Add a new administrative staff, manager, or client account with role permissions.
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
                      First Name <span className="text-destructive">*</span>
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
                      Last Name <span className="text-destructive">*</span>
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
                    Email Address <span className="text-destructive">*</span>
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

          {/* Password with Generator */}
          <form.Field name="password">
            {(field) => {
              const hasError =
                field.state.meta.errors && field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasError ? "true" : undefined}>
                  <div className="flex items-center justify-between">
                    <FieldLabel className="text-xs font-semibold">
                      Initial Password <span className="text-destructive">*</span>
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

          {/* Role Selection */}
          <form.Field name="role">
            {(field) => {
              const hasError =
                field.state.meta.errors && field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasError ? "true" : undefined}>
                  <FieldLabel className="text-xs font-semibold">
                    Platform Role <span className="text-destructive">*</span>
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
                    <Label className="text-xs font-semibold cursor-pointer" htmlFor="verified-switch">
                      Auto-verify Email Address
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Mark the email as already verified so user can sign in immediately.
                    </p>
                  </div>
                  <Switch
                    id="verified-switch"
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
                    <Label className="text-xs font-semibold cursor-pointer" htmlFor="2fa-switch">
                      Require Two-Factor (2FA)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Enforce 2FA setup on first login for enhanced security.
                    </p>
                  </div>
                  <Switch
                    id="2fa-switch"
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Platform User
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
