import { z } from "zod";

export const resendVerificationSchema = z.object({
  email: z.email("Email must be valid"),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ResendVerificationError = z.inferFlattenedErrors<
  typeof resendVerificationSchema
>;
