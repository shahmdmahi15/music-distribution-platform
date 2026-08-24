import { z } from "zod";
import { Role } from "@/types/user";

export const adminUpdatePlatformUserSchema = z.object({
  firstName: z
    .string("First name must be a string")
    .trim()
    .min(2, "First name must be at least 2 characters long")
    .max(64, "First name must be at most 64 characters long"),

  lastName: z
    .string("Last name must be a string")
    .trim()
    .min(2, "Last name must be at least 2 characters long")
    .max(64, "Last name must be at most 64 characters long"),

  email: z.email("Email must be a valid email address"),

  role: z.enum(Role, {
    message: "Please select a valid role for this user",
  }),

  emailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
});

export const adminPartialUpdatePlatformUserSchema =
  adminUpdatePlatformUserSchema.partial();

export type AdminUpdatePlatformUserInput = z.infer<
  typeof adminUpdatePlatformUserSchema
>;
export type AdminPartialUpdatePlatformUserInput = z.infer<
  typeof adminPartialUpdatePlatformUserSchema
>;
export type AdminUpdatePlatformUserError = z.inferFlattenedErrors<
  typeof adminUpdatePlatformUserSchema
>;
