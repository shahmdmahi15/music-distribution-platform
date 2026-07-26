import { z } from "zod";

export const adminNameUpdateSchema = z.object({
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
});

export type AdminNameUpdateInput = z.infer<typeof adminNameUpdateSchema>;
export type AdminNameUpdateError = z.inferFlattenedErrors<
  typeof adminNameUpdateSchema
>;
