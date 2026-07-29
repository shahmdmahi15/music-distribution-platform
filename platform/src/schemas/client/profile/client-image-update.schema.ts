import { z } from "zod";

export const clientImageUpdateSchema = z.object({
  image: z
    .string("Image is required.")
    .trim()
    .max(1500000, { message: "Image must be under 1MB" })
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, {
      message: "Invalid image data",
    }),
});

export type ClientImageUpdateInput = z.infer<typeof clientImageUpdateSchema>;
export type ClientImageUpdateError = z.inferFlattenedErrors<
  typeof clientImageUpdateSchema
>;
