import { z } from "zod";

export const adminLockPlatformUserSchema = z.object({
  locked: z.boolean("Lock state must be a boolean"),
  lockMinutes: z.coerce
    .number("Lock duration must be a number")
    .int("Lock duration must be an integer")
    .min(1, "Lock duration must be at least 1 minute")
    .optional(),
});

export type AdminLockPlatformUserInput = z.infer<
  typeof adminLockPlatformUserSchema
>;
export type AdminLockPlatformUserError = z.inferFlattenedErrors<
  typeof adminLockPlatformUserSchema
>;
