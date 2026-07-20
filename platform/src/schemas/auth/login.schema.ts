import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email must be valid"),

  password: z
    .string("Password must be a string")
    .trim()
    .min(8, "Password must be at least 8 characters long")
    .max(64, "Password must be at most 64 characters long"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginError = z.inferFlattenedErrors<typeof loginSchema>;
