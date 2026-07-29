"use client";

import { useForm } from "@tanstack/react-form";
import {
  ClientNameUpdateInput,
  clientNameUpdateSchema,
} from "@/schemas/client/profile/client-name-update.schema";
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
import { Spinner } from "@/components/ui/spinner";
import { UserPen, Save } from "lucide-react";
import { toast } from "sonner";
import { clientNameUpdateAction } from "@/actions/client/profile/client-name-update.action";
import { useRouter } from "next/navigation";

interface ClientNameUpdateCardProps {
  initialFirstName?: string | null;
  initialLastName?: string | null;
}

export function ClientNameUpdateCard({
  initialFirstName = "",
  initialLastName = "",
}: ClientNameUpdateCardProps) {
  const safeFirstName = initialFirstName || "";
  const safeLastName = initialLastName || "";
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      firstName: safeFirstName,
      lastName: safeLastName,
    },
    validators: {
      onSubmit: clientNameUpdateSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await clientNameUpdateAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;

                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof ClientNameUpdateInput;

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
        router.refresh();
      } catch (error) {
        console.log("[Component.Client.Profile.NameUpdate] Error: ", error);
        toast.error("Internal Form Error");
      }
    },
  });

  return (
    <Card className="shadow-sm border-border/60 flex flex-col justify-between">
      <div>
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary">
            <UserPen className="h-5 w-5" />
            <CardTitle className="text-xl font-bold tracking-tight">
              Update Name
            </CardTitle>
          </div>
          <CardDescription>
            Change your client profile display name details.
          </CardDescription>
        </CardHeader>

        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values]}
        >
          {([isSubmitting, values]) => {
            const currentValues = values as {
              firstName?: string;
              lastName?: string;
            };
            const isUnchanged =
              (currentValues.firstName || "").trim() === safeFirstName.trim() &&
              (currentValues.lastName || "").trim() === safeLastName.trim();

            return (
              <>
                <CardContent>
                  <form
                    id="client-name-update-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.handleSubmit();
                    }}
                  >
                    <FieldGroup className="gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* First Name Field */}
                        <form.Field name="firstName">
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
                                  First Name
                                </FieldLabel>
                                <Input
                                  id={field.name}
                                  name={field.name}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                  aria-invalid={isInvalid}
                                  placeholder="First Name"
                                  disabled={Boolean(isSubmitting)}
                                  className="h-10"
                                />
                                {isInvalid && (
                                  <FieldError
                                    errors={field.state.meta.errors}
                                  />
                                )}
                              </Field>
                            );
                          }}
                        </form.Field>

                        {/* Last Name Field */}
                        <form.Field name="lastName">
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
                                  Last Name
                                </FieldLabel>
                                <Input
                                  id={field.name}
                                  name={field.name}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                  aria-invalid={isInvalid}
                                  placeholder="Last Name"
                                  disabled={Boolean(isSubmitting)}
                                  className="h-10"
                                />
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

                <CardFooter className="pt-2 border-t border-border/40 mt-4">
                  <Button
                    type="submit"
                    form="client-name-update-form"
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
                        Save Name
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
  );
}
