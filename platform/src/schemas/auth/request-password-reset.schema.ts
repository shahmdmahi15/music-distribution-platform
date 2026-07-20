import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.email("Email must be valid"),
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;
export type RequestPasswordResetError = z.inferFlattenedErrors<
  typeof requestPasswordResetSchema
>;
