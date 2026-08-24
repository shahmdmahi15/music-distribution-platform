import { z } from "zod";
import { Role } from "@/types/user";

export const adminGetPlatformUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(Role).optional(),
  status: z
    .enum([
      "ALL",
      "ACTIVE",
      "LOCKED",
      "VERIFIED",
      "UNVERIFIED",
      "TWO_FACTOR_ENABLED",
      "TWO_FACTOR_DISABLED",
    ])
    .optional(),
  sortBy: z
    .enum([
      "createdAt",
      "updatedAt",
      "lastLoginAt",
      "email",
      "firstName",
      "role",
    ])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type AdminGetPlatformUsersInput = z.infer<
  typeof adminGetPlatformUsersSchema
>;
