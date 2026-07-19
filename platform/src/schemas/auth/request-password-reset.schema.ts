import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.email("Email must be valid"),
});

export type RequestPasswordResetType = z.infer<
  typeof requestPasswordResetSchema
>;
