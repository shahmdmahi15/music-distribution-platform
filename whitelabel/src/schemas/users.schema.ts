import { z } from "zod";
import { WhiteLabelUserRole } from "@/types/user";

export const createUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.nativeEnum(WhiteLabelUserRole, {
    message: "Invalid role selected",
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateRoleSchema = z.object({
  role: z.nativeEnum(WhiteLabelUserRole, {
    message: "Invalid role selected",
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
