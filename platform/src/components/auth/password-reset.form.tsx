"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import {
  PasswordResetInput,
  passwordResetSchema,
} from "@/schemas/auth/password-reset.schema";
import { passwordResetAction } from "@/actions/auth/password-reset.action";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PasswordResetForm({ token }: { token: string }) {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      token: token,
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: passwordResetSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await passwordResetAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;

                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof PasswordResetInput;

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
        router.replace("/auth/login");
      } catch (error) {
        console.log("[Component.Auth.ResetPassword] Error: ", error);
        toast.error("Internal Form Error");
      }
    },
  });

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Create new password
        </CardTitle>
        <CardDescription>
          Enter your new password below to reset your password and secure your
          account
        </CardDescription>
      </CardHeader>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <>
            <CardContent>
              <form
                id="password-reset-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <FieldGroup className="gap-4">
                  {/* Token Field (Hidden) */}
                  <form.Field name="token">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid} className="hidden">
                          <FieldLabel htmlFor={field.name} hidden>
                            Token
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Token"
                            autoComplete="off"
                            type="text"
                            hidden
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>

                  {/* Password Field */}
                  <form.Field name="password">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel
                            htmlFor={field.name}
                            className="font-medium"
                          >
                            New Password
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            type="password"
                            disabled={isSubmitting}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>

                  {/* Confirm Password Field */}
                  <form.Field name="confirmPassword">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel
                            htmlFor={field.name}
                            className="font-medium"
                          >
                            Confirm New Password
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            type="password"
                            disabled={isSubmitting}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                </FieldGroup>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                form="password-reset-form"
                className="w-full cursor-pointer h-10 active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground mt-2">
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
                  Back to Sign In
                </Link>
              </div>
            </CardFooter>
          </>
        )}
      </form.Subscribe>
    </Card>
  );
}
