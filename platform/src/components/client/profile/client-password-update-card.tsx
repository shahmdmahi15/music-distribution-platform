"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  ClientPasswordUpdateInput,
  clientPasswordUpdateSchema,
} from "@/schemas/client/profile/client-password-update.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { KeyRound, Eye, EyeOff, Save, Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { clientPasswordUpdateAction } from "@/actions/client/profile/client-password-update.action";

interface ClientPasswordUpdateCardProps {
  isPasswordLinked: boolean;
}

export function ClientPasswordUpdateCard({
  isPasswordLinked,
}: ClientPasswordUpdateCardProps) {
  const router = useRouter();
  const [showcurrentPassword, setShowcurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    } as ClientPasswordUpdateInput,
    validators: {
      onSubmit: clientPasswordUpdateSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await clientPasswordUpdateAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;

                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof ClientPasswordUpdateInput;

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

        toast.success(result.message);
        formApi.reset();
        router.refresh();
      } catch (error) {
        console.log("[Component.Client.Profile.PasswordUpdate] Error: ", error);
        toast.error("Internal Form Error");
      }
    },
  });

  return isPasswordLinked ? (
    <Card className="shadow-sm border-border/60 flex flex-col justify-between">
      <div>
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary">
            <KeyRound className="h-5 w-5" />
            <CardTitle className="text-xl font-bold tracking-tight">
              Update Password
            </CardTitle>
          </div>
          <CardDescription>
            Ensure your account is using a strong password to stay secure.
          </CardDescription>
        </CardHeader>

        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values]}
        >
          {([isSubmitting, values]) => {
            const currentValues = values as ClientPasswordUpdateInput;
            const isUnchanged =
              !currentValues.currentPassword ||
              !currentValues.newPassword ||
              !currentValues.confirmNewPassword;

            return (
              <>
                <CardContent>
                  <form
                    id="client-password-update-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.handleSubmit();
                    }}
                  >
                    <FieldGroup className="gap-4">
                      {/* Current Password Field */}
                      <form.Field name="currentPassword">
                        {(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel
                                htmlFor={field.name}
                                className="font-medium text-xs"
                              >
                                Current Password
                              </FieldLabel>
                              <div className="relative">
                                <Input
                                  id={field.name}
                                  name={field.name}
                                  type={
                                    showcurrentPassword ? "text" : "password"
                                  }
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                  aria-invalid={isInvalid}
                                  placeholder="••••••••"
                                  autoComplete="off"
                                  disabled={Boolean(isSubmitting)}
                                  className="h-10 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowcurrentPassword(!showcurrentPassword)
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  disabled={Boolean(isSubmitting)}
                                  aria-label={
                                    showcurrentPassword
                                      ? "Hide password"
                                      : "Show password"
                                  }
                                >
                                  {showcurrentPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* New Password Field */}
                        <form.Field name="newPassword">
                          {(field) => {
                            const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                            return (
                              <Field data-invalid={isInvalid}>
                                <FieldLabel
                                  htmlFor={field.name}
                                  className="font-medium text-xs"
                                >
                                  New Password
                                </FieldLabel>
                                <div className="relative">
                                  <Input
                                    id={field.name}
                                    name={field.name}
                                    type={showNewPassword ? "text" : "password"}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                      field.handleChange(e.target.value)
                                    }
                                    aria-invalid={isInvalid}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    disabled={Boolean(isSubmitting)}
                                    className="h-10 pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowNewPassword(!showNewPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    disabled={Boolean(isSubmitting)}
                                    aria-label={
                                      showNewPassword
                                        ? "Hide password"
                                        : "Show password"
                                    }
                                  >
                                    {showNewPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                                {isInvalid && (
                                  <FieldError
                                    errors={field.state.meta.errors}
                                  />
                                )}
                              </Field>
                            );
                          }}
                        </form.Field>

                        {/* Confirm New Password Field */}
                        <form.Field name="confirmNewPassword">
                          {(field) => {
                            const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                            return (
                              <Field data-invalid={isInvalid}>
                                <FieldLabel
                                  htmlFor={field.name}
                                  className="font-medium text-xs"
                                >
                                  Confirm New Password
                                </FieldLabel>
                                <div className="relative">
                                  <Input
                                    id={field.name}
                                    name={field.name}
                                    type={
                                      showConfirmPassword ? "text" : "password"
                                    }
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                      field.handleChange(e.target.value)
                                    }
                                    aria-invalid={isInvalid}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    disabled={Boolean(isSubmitting)}
                                    className="h-10 pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowConfirmPassword(
                                        !showConfirmPassword,
                                      )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    disabled={Boolean(isSubmitting)}
                                    aria-label={
                                      showConfirmPassword
                                        ? "Hide password"
                                        : "Show password"
                                    }
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                                {isInvalid && (
                                  <FieldError
                                    errors={field.state.meta.errors}
                                  />
                                )}
                              </Field>
                            );
                          }}
                        </form.Field>
                      </div>
                    </FieldGroup>
                  </form>
                </CardContent>

                <CardFooter className="pt-2 border-t border-border/40 mt-4 flex justify-end">
                  <Button
                    type="submit"
                    form="client-password-update-form"
                    className="w-full sm:w-auto cursor-pointer h-10 ml-auto active:scale-[0.98]"
                    disabled={Boolean(isSubmitting) || isUnchanged}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </CardFooter>
              </>
            );
          }}
        </form.Subscribe>
      </div>
    </Card>
  ) : (
    <Card className="shadow-sm border-border/60 flex flex-col justify-between relative overflow-hidden">
      <div>
        <CardHeader className="space-y-1.5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-xl font-bold tracking-tight">
                Update Password
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 py-1 px-2.5 font-semibold text-xs"
            >
              <Lock className="h-3 w-3" />
              Not Linked
            </Badge>
          </div>
          <CardDescription>
            Ensure your account is using a strong password to stay secure.
          </CardDescription>
        </CardHeader>

        <CardContent className="py-8 px-6">
          <div className="flex flex-col items-center justify-center text-center p-6 bg-muted/30 rounded-xl border border-dashed border-border/60 space-y-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center ring-8 ring-amber-500/5">
              <Lock className="h-6 w-6" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-semibold text-foreground">
                Password Authentication Locked
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your account currently relies on a third-party provider (e.g.
                Google or GitHub) and does not have password authentication
                linked.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3.5 py-2 rounded-lg border border-amber-500/20">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                Link password authentication in Linked Accounts to update your
                password.
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 border-t border-border/40 mt-4 flex justify-end">
          <Button
            type="button"
            disabled
            className="w-full sm:w-auto h-10 ml-auto opacity-60 cursor-not-allowed"
          >
            <Lock className="mr-2 h-4 w-4" />
            Password Locked
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
