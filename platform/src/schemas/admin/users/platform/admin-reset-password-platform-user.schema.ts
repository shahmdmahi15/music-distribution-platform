import { z } from "zod";

export const adminResetPasswordPlatformUserSchema = z.object({
  newPassword: z
    .string("New password must be a string")
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long"),
});

export type AdminResetPasswordPlatformUserInput = z.infer<
  typeof adminResetPasswordPlatformUserSchema
>;
export type AdminResetPasswordPlatformUserError = z.inferFlattenedErrors<
  typeof adminResetPasswordPlatformUserSchema
>;
