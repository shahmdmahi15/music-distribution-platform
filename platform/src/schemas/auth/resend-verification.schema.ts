import { z } from "zod";

export const resendVerificationSchema = z.object({
  email: z.email("Email must be valid"),
});

export type ResendVerificationType = z.infer<typeof resendVerificationSchema>;
