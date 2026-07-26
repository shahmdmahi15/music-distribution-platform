"use client";

import { useRef } from "react";
import { useForm } from "@tanstack/react-form";
import {
  AdminImageUpdateInput,
  adminImageUpdateSchema,
} from "@/schemas/admin/profile/admin-image-update.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Camera, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { adminImageUpdateAction } from "@/actions/admin/profile/admin-image-update-action";
import { useRouter } from "next/navigation";

interface AdminImageUpdateCardProps {
  initialImage?: string;
  userName?: string;
}

export function AdminImageUpdateCard({
  initialImage = "",
  userName = "Admin User",
}: AdminImageUpdateCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fallback = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const form = useForm({
    defaultValues: {
      image: initialImage,
    },
    validators: {
      onSubmit: adminImageUpdateSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await adminImageUpdateAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;

                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof AdminImageUpdateInput;

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
        console.log("[Component.Admin.Profile.ImageUpdate] Error: ", error);
        toast.error("Internal Form Error");
      }
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onFieldChange: (val: string) => void,
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 1 * 1024 * 1024) {
      toast.error("File size exceeds 1MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width !== 500 || img.height !== 500) {
          toast.error(
            `Image resolution must be exactly 500x500px. (Selected: ${img.width}x${img.height}px)`,
          );
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }
        onFieldChange(base64String);
        toast.info("Image selected (500x500px)");
      };
      img.onerror = () => {
        toast.error("Invalid image format");
      };
      img.src = base64String;
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(selectedFile);
  };

  // Standalone remove image handler (unrelated to upload form)
  const handleRemoveImage = () => {
    toast.info("Remove image action clicked (Backend integration pending)");
  };

  return (
    <Card className="shadow-sm border-border/60 flex flex-col justify-between">
      <div>
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary">
            <Camera className="h-5 w-5" />
            <CardTitle className="text-xl font-bold tracking-tight">
              Profile Image
            </CardTitle>
          </div>
          <CardDescription>
            Update your profile picture or avatar icon.
          </CardDescription>
        </CardHeader>

        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values]}
        >
          {([isSubmitting, values]) => {
            const currentImage = (values as { image: string }).image;
            const isUnchanged = !currentImage;

            return (
              <>
                <CardContent className="space-y-6">
                  <form
                    id="admin-image-update-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.handleSubmit();
                    }}
                  >
                    <FieldGroup>
                      <form.Field name="image">
                        {(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                          const currentPreview =
                            field.state.value || initialImage;

                          return (
                            <Field
                              data-invalid={isInvalid}
                              className="space-y-4"
                            >
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) =>
                                  handleFileChange(e, field.handleChange)
                                }
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={Boolean(isSubmitting)}
                              />

                              <div className="flex flex-col sm:flex-row items-center gap-6">
                                {/* Avatar Preview */}
                                <div className="relative group">
                                  <Avatar className="h-24 w-24 rounded-2xl border-2 border-dashed border-border group-hover:border-primary transition-colors">
                                    <AvatarImage
                                      src={currentPreview || undefined}
                                      alt={userName}
                                      className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-xl text-xl font-bold bg-muted text-muted-foreground">
                                      {fallback || (
                                        <ImageIcon className="h-8 w-8 opacity-50" />
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium cursor-pointer"
                                    disabled={Boolean(isSubmitting)}
                                  >
                                    <Camera className="h-5 w-5" />
                                  </button>
                                </div>

                                {/* Upload controls & description */}
                                <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                    disabled={Boolean(isSubmitting)}
                                    className="cursor-pointer"
                                  >
                                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                                    Choose Picture
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    JPEG, PNG, or WebP (1MB max, 500x500px).
                                  </p>
                                </div>
                              </div>

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

                <CardFooter className="pt-2 border-t border-border/40 mt-4 flex flex-wrap items-center justify-between gap-2">
                  {/* Separate Standalone Remove Image Button (No relation to upload form) */}
                  {initialImage ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={Boolean(isSubmitting)}
                      className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer h-10"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Remove Image
                    </Button>
                  ) : (
                    <div />
                  )}

                  {/* Upload Form Submit Button */}
                  <Button
                    type="submit"
                    form="admin-image-update-form"
                    className="w-full sm:w-auto cursor-pointer h-10 ml-auto active:scale-[0.98]"
                    disabled={Boolean(isSubmitting) || isUnchanged}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
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
